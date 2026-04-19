import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client initialization
function createServerSupabaseClient(): SupabaseClient {
  // 优先使用标准 NEXT_PUBLIC_ 变量，其次使用 COZE_ 变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Supabase] 环境变量缺失:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    throw new Error('Missing Supabase environment variables');
  }
  
  console.log('[Supabase] 创建客户端, URL:', supabaseUrl?.substring(0, 30) + '...');
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// For API routes
export function getServerSupabase() {
  return createServerSupabaseClient();
}

// For client components - lazy initialization
let clientInstance: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createServerSupabaseClient();
  }
  
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return clientInstance;
}
