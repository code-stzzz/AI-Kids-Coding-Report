import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let configLoaded = false;

// 初始化客户端（需要先调用 initSupabase）
export async function initSupabase() {
  if (client || configLoaded) return client;
  
  configLoaded = true;
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return null;
    
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseKey) return null;
    
    client = createBrowserClient(config.supabaseUrl, config.supabaseKey);
    return client;
  } catch {
    return null;
  }
}

// 获取客户端（可能为 null）
export function getSupabaseBrowser() {
  return client;
}

// 检查是否已配置
export function isSupabaseConfigured() {
  return client !== null;
}
