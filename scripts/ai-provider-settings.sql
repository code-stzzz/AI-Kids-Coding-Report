-- 在原扣子项目所用数据库中执行一次；只新增 AI 配置表，不改动业务表。
BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profiles jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(profiles) = 'array'),
  active_profile_id uuid,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;
-- 配置只能经服务端读取；浏览器不能直接取得加密后的密钥或修改归属。
REVOKE ALL ON public.ai_provider_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_provider_settings TO service_role;

COMMIT;
