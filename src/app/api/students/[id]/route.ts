import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 从请求中获取认证 token（支持 cookie 和 Authorization header）
function getAuthToken(request: NextRequest): string | null {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 其次从 cookie 获取
  return request.cookies.get('sb-access-token')?.value || null;
}

// 从 JWT token 中解析用户 ID
function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

// 获取使用 service role key 的 Supabase 客户端（绕过 RLS）
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 配置缺失');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 获取单个学生信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 从 token 中解析用户 ID
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的认证信息' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取学生异常:', error);
    return NextResponse.json(
      { error: '获取学生失败' },
      { status: 500 }
    );
  }
}
