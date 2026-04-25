import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientAsync } from '@/storage/database/supabase-client';
import { getUserIdFromRequest, extractToken } from '@/lib/auth';

// 课程单元模板
const COURSE_TEMPLATES = {
  'lang-python': {
    name: 'Python',
    units: [
      { name: 'U1', description: 'Python基础入门（变量、函数、分支结构、循环、turtle绘图）' },
      { name: 'U2', description: '列表与循环进阶（列表操作、random模块、datetime模块）' },
      { name: 'U3', description: '字符串与循环结构（字符串函数、for循环、二维列表）' },
      { name: 'U4', description: '字典与文件操作（字典、元组、文件读写）' },
      { name: 'U5', description: '函数与事件编程（自定义函数、变量作用域、异常处理）' },
      { name: 'U6', description: '模块与面向对象（第三方模块、类与对象、jieba/wordcloud）' },
      { name: 'U7', description: '面向对象进阶（继承、多态、GUI编程）' },
      { name: 'U8', description: '算法与数据结构（数组、排序、二分查找、递归）' },
      { name: 'U9', description: '数据结构深入（链表、栈、队列）' },
      { name: 'U10', description: '高级算法（动态规划、贪心算法）' },
      { name: 'U11', description: '项目实战一（综合应用）' },
      { name: 'U12', description: '项目实战二（创新项目）' },
    ],
  },
  'lang-scratch': {
    name: 'Scratch',
    units: [
      { name: 'U1', description: 'Scratch入门（界面、角色、运动）' },
      { name: 'U2', description: '外观与声音（造型、音效）' },
      { name: 'U3', description: '事件与控制（条件判断、循环）' },
      { name: 'U4', description: '变量与运算（变量、数学运算）' },
      { name: 'U5', description: '消息与广播（角色通信）' },
      { name: 'U6', description: '克隆与自定义积木（函数）' },
      { name: 'U7', description: '列表与数据处理' },
      { name: 'U8', description: '游戏设计一（互动游戏）' },
      { name: 'U9', description: '游戏设计二（计分系统）' },
      { name: 'U10', description: '动画创作（故事动画）' },
      { name: 'U11', description: '项目实战一' },
      { name: 'U12', description: '项目实战二' },
    ],
  },
  'lang-cpp': {
    name: 'C++',
    units: [
      { name: 'U1', description: 'C++基础入门（环境、变量、输入输出）' },
      { name: 'U2', description: '数据类型与运算符' },
      { name: 'U3', description: '分支结构（if、switch）' },
      { name: 'U4', description: '循环结构（for、while）' },
      { name: 'U5', description: '数组与字符串' },
      { name: 'U6', description: '函数与递归' },
      { name: 'U7', description: '结构体与类基础' },
      { name: 'U8', description: '算法入门（排序、查找）' },
      { name: 'U9', description: '算法进阶（递推、递归）' },
      { name: 'U10', description: '数据结构（栈、队列）' },
      { name: 'U11', description: '竞赛入门一' },
      { name: 'U12', description: '竞赛入门二' },
    ],
  },
  'lang-ai': {
    name: 'AI',
    units: [
      { name: 'U1', description: 'AI入门与机器学习概念' },
      { name: 'U2', description: '数据处理与可视化' },
      { name: 'U3', description: '监督学习基础（分类）' },
      { name: 'U4', description: '监督学习进阶（回归）' },
      { name: 'U5', description: '无监督学习（聚类）' },
      { name: 'U6', description: '神经网络基础' },
      { name: 'U7', description: '深度学习入门' },
      { name: 'U8', description: '图像识别' },
      { name: 'U9', description: '自然语言处理' },
      { name: 'U10', description: 'AI项目实战一' },
      { name: 'U11', description: 'AI项目实战二' },
      { name: 'U12', description: 'AI创新应用' },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    // 获取 token 和用户 ID
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    const userId = getUserIdFromRequest(request);
    if (!userId || !token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { languageId } = body;

    if (!languageId) {
      return NextResponse.json({ error: '缺少 languageId 参数' }, { status: 400 });
    }

    const template = COURSE_TEMPLATES[languageId as keyof typeof COURSE_TEMPLATES];
    if (!template) {
      return NextResponse.json({ error: '不支持的编程语言' }, { status: 400 });
    }

    // 使用 token 创建 Supabase 客户端，确保 RLS 能识别用户
    const supabase = await getSupabaseClientAsync(token);

    // 检查是否已有版本
    const { data: existingVersions, error: checkError } = await supabase
      .from('curriculum_versions')
      .select('id')
      .eq('language_id', languageId)
      .eq('user_id', userId);

    // 表不存在时返回迁移提示
    if (checkError && (checkError.message.includes('Could not find') || checkError.message.includes('does not exist'))) {
      return NextResponse.json({
        error: '数据库需要迁移，请先完成数据库升级',
        needMigration: true,
      }, { status: 400 });
    }

    if (checkError) {
      console.error('[Init Courses] 查询版本失败:', checkError);
      return NextResponse.json({ error: '查询版本失败' }, { status: 500 });
    }

    if (existingVersions && existingVersions.length > 0) {
      // 版本已存在，检查是否有未关联版本的课程单元需要迁移
      const existingVersion = existingVersions[0];
      const { data: unlinkedUnits, error: checkUnitsError } = await supabase
        .from('course_units')
        .select('id')
        .eq('language_id', languageId)
        .is('version_id', null);

      if (checkUnitsError) {
        console.error('[Init Courses] 查询未关联课程失败:', checkUnitsError);
      }

      if (unlinkedUnits && unlinkedUnits.length > 0) {
        // 有未关联的课程，执行迁移
        const { error: updateError } = await supabase
          .from('course_units')
          .update({ version_id: existingVersion.id })
          .eq('language_id', languageId)
          .is('version_id', null);

        if (updateError) {
          console.error('[Init Courses] 迁移课程数据失败:', updateError);
          return NextResponse.json({ error: '迁移课程数据失败' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          migratedCount: unlinkedUnits.length,
          message: `已将 ${unlinkedUnits.length} 条课程数据关联到版本 4.0`
        });
      }

      return NextResponse.json({
        success: true,
        message: '该语言的课程版本已存在且数据完整',
        existing: true
      });
    }

    // 创建默认版本 4.0
    const { data: version, error: versionError } = await supabase
      .from('curriculum_versions')
      .insert({
        language_id: languageId,
        name: '4.0',
        description: `${template.name} 4.0 课程体系`,
        is_default: true,
        user_id: userId,
      })
      .select()
      .single();

    if (versionError) {
      console.error('[Init Courses] 创建版本失败:', versionError);
      return NextResponse.json({ error: '创建版本失败' }, { status: 500 });
    }

    // 检查是否存在旧的课程单元数据（version_id 为 null）
    const { data: existingUnits, error: checkUnitsError } = await supabase
      .from('course_units')
      .select('id')
      .eq('language_id', languageId)
      .is('version_id', null);

    if (checkUnitsError) {
      console.error('[Init Courses] 查询现有课程单元失败:', checkUnitsError);
      // 继续执行，不影响主流程
    }

    let migratedCount = 0;
    let createdCount = 0;

    // 如果存在旧数据，将它们关联到新版本
    if (existingUnits && existingUnits.length > 0) {
      const { error: updateError, count } = await supabase
        .from('course_units')
        .update({ version_id: version.id })
        .eq('language_id', languageId)
        .is('version_id', null);

      if (updateError) {
        console.error('[Init Courses] 迁移旧课程数据失败:', updateError);
        // 继续执行，尝试创建新课程
      } else {
        migratedCount = existingUnits.length;
        console.log(`[Init Courses] 已将 ${migratedCount} 条课程单元关联到版本 ${version.name}`);
      }
    } else {
      // 没有旧数据，创建新的课程单元
      const units = template.units.map((unit, index) => ({
        version_id: version.id,
        language_id: languageId,
        name: unit.name,
        period_number: index + 1,
        current_stage_content: unit.description,
        description: unit.description,
      }));

      const { error: unitsError } = await supabase
        .from('course_units')
        .insert(units);

      if (unitsError) {
        console.error('[Init Courses] 创建课程单元失败:', unitsError);
        
        // 检查是否是 RLS 策略问题
        if (unitsError.code === '42501' || unitsError.message.includes('row-level security')) {
          return NextResponse.json({ 
            error: 'course_units 表的 RLS 策略需要修复，请在 Supabase SQL Editor 中执行以下 SQL：',
            errorType: 'RLS_POLICY_ERROR',
            rlsFixSql: `-- 修复 course_units 表的 RLS 策略
DROP POLICY IF EXISTS "course_units_允许公开读取" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开写入" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开更新" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开删除" ON course_units;

CREATE POLICY "course_units_允许公开读取" ON course_units FOR SELECT USING (true);
CREATE POLICY "course_units_允许公开写入" ON course_units FOR INSERT WITH CHECK (true);
CREATE POLICY "course_units_允许公开更新" ON course_units FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "course_units_允许公开删除" ON course_units FOR DELETE USING (true);
ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;`
          }, { status: 500 });
        }
        
        return NextResponse.json({ error: '创建课程单元失败' }, { status: 500 });
      }

      createdCount = units.length;
    }

    return NextResponse.json({
      success: true,
      version: version,
      migratedCount,
      createdCount,
      message: migratedCount > 0 
        ? `已将 ${migratedCount} 条课程数据关联到版本 4.0` 
        : `已创建 ${createdCount} 条课程单元`
    });
  } catch (error) {
    console.error('[Init Courses] 初始化失败:', error);
    return NextResponse.json({ error: '初始化失败' }, { status: 500 });
  }
}
