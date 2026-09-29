-- 在扣子对应数据库的 SQL 编辑器执行；开发和生产数据库需要分别执行。
-- 只增加字段，保留学生、班级归属与所有报告。可重复执行。
BEGIN;
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (enrollment_status IN ('active', 'completed')),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
COMMIT;
NOTIFY pgrst, 'reload schema';
