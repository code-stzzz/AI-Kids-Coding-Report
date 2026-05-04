import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let configLoaded = false;
let loadingPromise: Promise<SupabaseClient | null> | null = null;

// 初始化客户端（需要先调用 initSupabase）
export async function initSupabase(): Promise<SupabaseClient | null> {
  // 如果已经有客户端，直接返回
  if (client) return client;
  
  // 如果正在加载中，返回同一个 Promise 避免重复请求
  if (loadingPromise) return loadingPromise;
  
  // 如果已经加载过但没有配置成功，不再重试
  if (configLoaded) return null;
  
  loadingPromise = (async () => {
    configLoaded = true;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/config', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return null;
      
      const config = await response.json();
      if (!config.supabaseUrl || !config.supabaseKey) return null;
      
      client = createBrowserClient(config.supabaseUrl, config.supabaseKey);
      return client;
    } catch (error) {
      // 忽略中止错误
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Supabase 配置请求超时');
      } else {
        console.error('初始化 Supabase 失败:', error);
      }
      return null;
    } finally {
      loadingPromise = null;
    }
  })();
  
  return loadingPromise;
}

// 获取客户端（可能为 null）
export function getSupabaseBrowser(): SupabaseClient | null {
  return client;
}

// 检查是否已配置
export function isSupabaseConfigured(): boolean {
  return client !== null;
}
