import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';
import { DEFAULT_REPORT_PROMPT } from './prompt';
import { AIError } from './errors';

export const promptAction = z.object({
  revision: z.number().int().min(0),
  prompt: z.string().trim().min(1).max(12000).nullable(),
}).strict();
export interface PromptSettings {
  prompt: string;
  isDefault: boolean;
  revision: number;
  storageReady: boolean;
}
function database() {
  const { url } = getSupabaseCredentials();
  const key = getSupabaseServiceRoleKey();
  if (!key) throw new AIError('提示词管理尚未完成服务端配置。', 503);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function readPrompt(userId: string): Promise<PromptSettings> {
  const { data, error } = await database().from('ai_report_prompts')
    .select('prompt, revision').eq('user_id', userId).maybeSingle();
  if (error && !['42P01', 'PGRST205'].includes(error.code)) throw new AIError('读取提示词失败，请稍后重试。', 503);
  if (data && !z.object({ prompt: z.string().min(1).max(12000).nullable(), revision: z.number().int().positive() }).safeParse(data).success) {
    throw new AIError('已保存的提示词格式异常，请联系管理员。', 503);
  }
  return { prompt: data?.prompt ?? DEFAULT_REPORT_PROMPT, isDefault: !data?.prompt, revision: data?.revision ?? 0, storageReady: !error };
}
export async function savePrompt(userId: string, action: z.infer<typeof promptAction>): Promise<PromptSettings> {
  const current = await readPrompt(userId);
  if (!current.storageReady) throw new AIError('请先执行提示词数据库初始化脚本。', 503);
  if (action.revision !== current.revision) throw new AIError('提示词已在其他页面修改，请重新加载后再保存。', 409);
  const row = { prompt: action.prompt, revision: current.revision + 1, updated_at: new Date().toISOString() };
  const db = database();
  const { data, error } = current.revision === 0
    ? await db.from('ai_report_prompts').insert({ user_id: userId, ...row }).select('user_id')
    : await db.from('ai_report_prompts').update(row).eq('user_id', userId).eq('revision', current.revision).select('user_id');
  if (error?.code === '23505' || (!error && data?.length !== 1)) throw new AIError('提示词已在其他页面修改，请重新加载后再保存。', 409);
  if (error) throw new AIError('保存提示词失败，请稍后重试。', 503);
  return { prompt: action.prompt ?? DEFAULT_REPORT_PROMPT, isDefault: action.prompt === null, revision: row.revision, storageReady: true };
}
