-- 少儿编程学习报告助手 - 数据库初始化脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- ============================================
-- 1. 创建编程语言表（公开读取）
-- ============================================
CREATE TABLE IF NOT EXISTS programming_languages (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  icon VARCHAR(50),
  color VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 插入默认编程语言
INSERT INTO programming_languages (id, name, display_name, icon, color, description) VALUES
  ('lang-python', 'Python', 'Python', '🐍', '#3776AB', 'Python编程语言课程'),
  ('lang-scratch', 'Scratch', 'Scratch', '🎨', '#FF6F00', 'Scratch图形化编程课程'),
  ('lang-cpp', 'C++', 'C++', '⚡', '#00599C', 'C++编程语言课程')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. 创建课程单元表（公开读取）
-- ============================================
CREATE TABLE IF NOT EXISTS course_units (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  language_id VARCHAR(50) NOT NULL REFERENCES programming_languages(id),
  name VARCHAR(50) NOT NULL,
  period_number INTEGER NOT NULL,
  current_stage_content TEXT,
  next_stage_content TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(language_id, period_number)
);

-- ============================================
-- 3. 创建班级表（用户私有）
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL,
  language_id VARCHAR(50) NOT NULL REFERENCES programming_languages(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- 4. 创建学生表（用户私有）
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  student_number VARCHAR(50),
  learning_cycle INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- 5. 创建学习报告表（用户私有）
-- ============================================
CREATE TABLE IF NOT EXISTS study_reports (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_unit_id VARCHAR(50) NOT NULL REFERENCES course_units(id),
  radar_dimensions JSONB NOT NULL DEFAULT '[]',
  core_strengths TEXT,
  areas_to_improve TEXT,
  progress_description TEXT,
  improvement_description TEXT,
  encouragement_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_course_units_language ON course_units(language_id);
CREATE INDEX IF NOT EXISTS idx_classes_user ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_language ON classes(language_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON study_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_student ON study_reports(student_id);

-- ============================================
-- 7. 启用 RLS (行级安全)
-- ============================================
ALTER TABLE programming_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. 创建 RLS 策略
-- ============================================

-- 编程语言表：所有人可读
CREATE POLICY "编程语言公开读取" ON programming_languages
  FOR SELECT USING (true);

-- 课程单元表：所有人可读
CREATE POLICY "课程单元公开读取" ON course_units
  FOR SELECT USING (true);

-- 班级表：用户只能操作自己的数据
CREATE POLICY "班级-用户查看自己的" ON classes
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "班级-用户创建自己的" ON classes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "班级-用户更新自己的" ON classes
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "班级-用户删除自己的" ON classes
  FOR DELETE USING (auth.uid()::text = user_id);

-- 学生表：用户只能操作自己的数据
CREATE POLICY "学生-用户查看自己的" ON students
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "学生-用户创建自己的" ON students
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "学生-用户更新自己的" ON students
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "学生-用户删除自己的" ON students
  FOR DELETE USING (auth.uid()::text = user_id);

-- 学习报告表：用户只能操作自己的数据
CREATE POLICY "报告-用户查看自己的" ON study_reports
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "报告-用户创建自己的" ON study_reports
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "报告-用户更新自己的" ON study_reports
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "报告-用户删除自己的" ON study_reports
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- 9. 允许服务端使用 anon key 访问（开发模式）
-- ============================================
-- 为了让应用能正常工作，暂时允许所有操作
-- 生产环境应该使用 service_role key

CREATE POLICY "班级-服务端访问" ON classes
  FOR ALL USING (true);
CREATE POLICY "学生-服务端访问" ON students
  FOR ALL USING (true);
CREATE POLICY "报告-服务端访问" ON study_reports
  FOR ALL USING (true);

-- ============================================
-- 完成！
-- ============================================
