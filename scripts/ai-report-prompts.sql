-- 在扣子项目对应的开发、生产数据库分别执行。可重复执行，只新增提示词配置表。
BEGIN;
CREATE TABLE IF NOT EXISTS public.ai_report_prompts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT CHECK (prompt IS NULL OR char_length(trim(prompt)) BETWEEN 1 AND 12000),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_report_prompts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_report_prompts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_report_prompts TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
