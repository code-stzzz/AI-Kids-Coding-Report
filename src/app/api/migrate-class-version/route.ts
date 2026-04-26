import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientAsync } from '@/storage/database/supabase-client';
import { extractToken } from '@/lib/auth';

// 班级版本管理迁移 SQL
const CLASS_VERSION_MIGRATION_SQL = `-- ============================================================
-- 班级版本管理迁移 SQL
-- 执行位置：Supabase Dashboard → SQL Editor
-- 说明：请按顺序执行以下步骤
-- ============================================================

-- ============================================================
-- 第一步：添加 classes 表的 default_version_id 字段
-- ============================================================

-- 1.1 添加字段
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS default_version_id UUID REFERENCES public.curriculum_versions(id);

-- 1.2 设置字段可为空
ALTER TABLE public.classes
ALTER COLUMN default_version_id DROP NOT NULL;

-- ============================================================
-- 第二步：创建 Python 4.2 版本
-- ============================================================

-- 2.1 创建 Python 4.2 版本（使用现有用户的 user_id）
INSERT INTO public.curriculum_versions (id, name, language_id, user_id, is_default, created_at)
SELECT
    gen_random_uuid(),
    '4.2',
    'lang-python',
    user_id,
    false,
    NOW()
FROM public.curriculum_versions
WHERE language_id = 'lang-python'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================
-- 第三步：为 Python 4.2 创建课程单元（复制 4.0 的课程单元）
-- ============================================================

-- 3.1 复制 Python 4.0 的课程单元到 4.2 版本
INSERT INTO public.course_units (
    id, name, language_id, period_number, current_stage_content,
    next_stage_content, description, version_id, is_active, created_at
)
SELECT
    gen_random_uuid(),
    name,
    language_id,
    period_number,
    current_stage_content,
    next_stage_content,
    description,
    (SELECT id FROM public.curriculum_versions WHERE language_id = 'lang-python' AND name = '4.2' LIMIT 1),
    true,
    NOW()
FROM public.course_units
WHERE language_id = 'lang-python'
  AND version_id = (SELECT id FROM public.curriculum_versions WHERE language_id = 'lang-python' AND name = '4.0' LIMIT 1);

-- ============================================================
-- 第四步：更新 Python 学习报告关联到 4.2 版本的课程单元
-- ============================================================

-- 4.1 更新学习报告的 course_unit_id
UPDATE public.study_reports sr
SET course_unit_id = new_unit.id
FROM public.course_units old_unit
JOIN public.course_units new_unit ON
    old_unit.name = new_unit.name
    AND old_unit.language_id = new_unit.language_id
    AND old_unit.period_number = new_unit.period_number
JOIN public.curriculum_versions old_ver ON old_unit.version_id = old_ver.id
JOIN public.curriculum_versions new_ver ON new_unit.version_id = new_ver.id
WHERE sr.course_unit_id = old_unit.id
  AND old_ver.language_id = 'lang-python'
  AND old_ver.name = '4.0'
  AND new_ver.language_id = 'lang-python'
  AND new_ver.name = '4.2';

-- ============================================================
-- 第五步：更新班级的默认版本
-- ============================================================

-- 5.1 更新所有 Python 班级的默认版本为 4.2
UPDATE public.classes
SET default_version_id = (
    SELECT id FROM public.curriculum_versions
    WHERE language_id = 'lang-python' AND name = '4.2' LIMIT 1
)
WHERE language_id = 'lang-python';

-- 5.2 更新其他语言班级的默认版本为 4.0
UPDATE public.classes c
SET default_version_id = (
    SELECT id FROM public.curriculum_versions cv
    WHERE cv.language_id = c.language_id AND cv.name = '4.0' LIMIT 1
)
WHERE language_id != 'lang-python';

-- ============================================================
-- 第六步：设置 Python 4.2 为默认版本
-- ============================================================

UPDATE public.curriculum_versions SET is_default = false WHERE language_id = 'lang-python';
UPDATE public.curriculum_versions SET is_default = true WHERE language_id = 'lang-python' AND name = '4.2';

-- ============================================================
-- 完成！验证最终结果
-- ============================================================

-- 查看所有版本
SELECT id, name, language_id, is_default FROM public.curriculum_versions ORDER BY language_id, name;

-- 查看班级版本设置
SELECT name, language_id, default_version_id FROM public.classes;

-- 查看学习报告版本分布
SELECT
    cv.language_id,
    cv.name as version_name,
    COUNT(*) as report_count
FROM public.study_reports sr
JOIN public.course_units cu ON sr.course_unit_id = cu.id
JOIN public.curriculum_versions cv ON cu.version_id = cv.id
GROUP BY cv.language_id, cv.name
ORDER BY cv.language_id, cv.name;
`;

// 检测迁移状态
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = await getSupabaseClientAsync(token);
    
    // 尝试查询班级是否有 default_version_id 字段
    // 通过尝试选择该字段来检测
    const { error: testError } = await supabase
      .from('classes')
      .select('id, default_version_id')
      .limit(1);

    const hasDefaultVersionId = !testError || !testError.message?.includes('column');

    // 检查是否有 Python 4.2 版本
    const { data: pythonVersions } = await supabase
      .from('curriculum_versions')
      .select('id, name')
      .eq('language_id', 'lang-python');

    const hasPython42 = pythonVersions?.some(v => v.name === '4.2') || false;

    // 检查 Python 学习报告关联的版本
    const { data: pythonReports } = await supabase
      .from('study_reports')
      .select('id, course_unit_id')
      .limit(1);

    const migrationStatus = {
      hasDefaultVersionIdField: hasDefaultVersionId,
      hasPython42Version: hasPython42,
      needsMigration: !hasDefaultVersionId || !hasPython42
    };

    return NextResponse.json({
      status: migrationStatus,
      sql: CLASS_VERSION_MIGRATION_SQL,
      instructions: [
        '1. 打开 Supabase Dashboard → SQL Editor',
        '2. 复制下方 SQL 代码',
        '3. 在 SQL Editor 中粘贴并执行',
        '4. 执行完成后点击"验证迁移"按钮'
      ],
      supabaseUrl: 'https://dkxidckofamqwwocvpvw.supabase.co'
    });
  } catch (error) {
    console.error('检查迁移状态失败:', error);
    return NextResponse.json(
      { error: '检查迁移状态失败', sql: CLASS_VERSION_MIGRATION_SQL },
      { status: 500 }
    );
  }
}

// 验证迁移是否完成
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = await getSupabaseClientAsync(token);

    // 检查 classes 表是否有 default_version_id 字段
    const { error: classTestError } = await supabase
      .from('classes')
      .select('id, default_version_id')
      .limit(1);

    const hasDefaultVersionId = !classTestError || !classTestError.message?.includes('column');

    // 检查 Python 4.2 版本
    const { data: python42Version } = await supabase
      .from('curriculum_versions')
      .select('id')
      .eq('language_id', 'lang-python')
      .eq('name', '4.2')
      .single();

    // 检查 Python 4.2 的课程单元数量
    let python42UnitCount = 0;
    if (python42Version) {
      const { count } = await supabase
        .from('course_units')
        .select('id', { count: 'exact', head: true })
        .eq('version_id', python42Version.id);
      python42UnitCount = count || 0;
    }

    // 检查班级是否已设置默认版本
    const { data: classesWithVersion } = await supabase
      .from('classes')
      .select('id, name, default_version_id')
      .not('default_version_id', 'is', null);

    const allChecksPassed = hasDefaultVersionId && !!python42Version && python42UnitCount > 0;

    return NextResponse.json({
      success: allChecksPassed,
      checks: {
        hasDefaultVersionIdField: hasDefaultVersionId,
        hasPython42Version: !!python42Version,
        python42UnitCount,
        classesWithDefaultVersion: classesWithVersion?.length || 0
      },
      message: allChecksPassed 
        ? '迁移完成！班级版本管理功能已就绪。' 
        : '迁移未完成，请检查 SQL 是否全部执行成功。'
    });
  } catch (error) {
    console.error('验证迁移失败:', error);
    return NextResponse.json(
      { error: '验证迁移失败', details: String(error) },
      { status: 500 }
    );
  }
}
