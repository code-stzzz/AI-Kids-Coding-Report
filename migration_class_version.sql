-- ============================================================
-- 班级版本管理迁移 SQL
-- 执行位置：Supabase Dashboard → SQL Editor
-- 执行顺序：按顺序执行以下步骤
-- ============================================================

-- ============================================================
-- 第一步：添加 classes 表的 default_version_id 字段
-- ============================================================

-- 1.1 添加字段
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS default_version_id UUID REFERENCES public.curriculum_versions(id);

-- 1.2 设置字段可为空（已有班级暂时不需要版本）
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

-- 2.2 查看新创建的 Python 4.2 版本 ID（记录下来备用）
SELECT id, name, language_id FROM public.curriculum_versions
WHERE language_id = 'lang-python' ORDER BY name;

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

-- 3.2 验证新创建的课程单元
SELECT COUNT(*) as python_42_units_count
FROM public.course_units cu
JOIN public.curriculum_versions cv ON cu.version_id = cv.id
WHERE cv.language_id = 'lang-python' AND cv.name = '4.2';

-- ============================================================
-- 第四步：更新 Python 学习报告关联到 4.2 版本的课程单元
-- ============================================================

-- 4.1 更新学习报告的 course_unit_id
-- 将 4.0 版本的课程单元 ID 替换为 4.2 版本对应的课程单元 ID
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

-- 4.2 验证更新结果
SELECT
    cv.name as version_name,
    COUNT(*) as report_count
FROM public.study_reports sr
JOIN public.course_units cu ON sr.course_unit_id = cu.id
JOIN public.curriculum_versions cv ON cu.version_id = cv.id
WHERE cv.language_id = 'lang-python'
GROUP BY cv.name;

-- ============================================================
-- 第五步：更新 Python 班级的默认版本为 4.2
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

-- 5.3 验证班级版本设置
SELECT
    c.name as class_name,
    c.language_id,
    cv.name as default_version
FROM public.classes c
LEFT JOIN public.curriculum_versions cv ON c.default_version_id = cv.id
ORDER BY c.language_id, c.name;

-- ============================================================
-- 第六步：设置 Python 4.2 为该语言的默认版本（可选）
-- ============================================================

-- 6.1 如果想让 Python 4.2 成为新建班级时的默认选择
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
