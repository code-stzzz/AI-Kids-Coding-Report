import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 从请求中获取认证 token（支持 cookie 和 Authorization header）
function getAuthToken(request: NextRequest): string | null {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('[Auth] 从 header 获取 token，前50字符:', token?.substring(0, 50));
    return token;
  }
  
  // 其次从 cookie 获取
  const cookieToken = request.cookies.get('sb-access-token')?.value;
  if (cookieToken) {
    console.log('[Auth] 从 cookie 获取 token，前50字符:', cookieToken?.substring(0, 50));
  }
  return cookieToken || null;
}

// 从 JWT token 中解析用户 ID
function getUserIdFromToken(token: string): string | null {
  try {
    console.log('[JWT] 开始解析 token');
    console.log('[JWT] Token 原始值 (前100字符):', token?.substring(0, 100));
    
    const parts = token.split('.');
    console.log('[JWT] Token 分段数:', parts.length);
    
    if (parts.length !== 3) {
      console.log('[JWT] Token 格式错误，不是三段式 JWT');
      // 可能是其他格式的 token，尝试直接使用
      return null;
    }
    
    // JWT 使用 URL-safe base64 编码，需要转换
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    while (base64.length % 4) {
      base64 += '=';
    }
    
    console.log('[JWT] Base64 payload (前50字符):', base64.substring(0, 50));
    
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    console.log('[JWT] 解码后的 payload:', decoded);
    
    const payload = JSON.parse(decoded);
    console.log('[JWT] 解析成功，用户 ID:', payload.sub);
    return payload.sub || null;
  } catch (error) {
    console.error('[JWT] 解析失败:', error);
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

// 获取班级列表
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    console.log('[API /classes] Token 存在:', !!token);
    
    if (!token) {
      console.log('[API /classes] 无 token，返回空数组');
      return NextResponse.json({ data: [] });
    }

    // 从 token 中解析用户 ID
    const userId = getUserIdFromToken(token);
    console.log('[API /classes] 用户 ID:', userId);
    
    if (!userId) {
      console.log('[API /classes] 无法解析用户 ID，返回空数组');
      return NextResponse.json({ data: [] });
    }

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');

    let query = supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (languageId) {
      query = query.eq('language_id', languageId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取班级失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取班级异常:', error);
    return NextResponse.json(
      { error: '获取班级失败' },
      { status: 500 }
    );
  }
}

// 创建班级
export async function POST(request: NextRequest) {
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

    // 使用 service role key 绕过 RLS
    const supabase = getSupabaseAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('classes')
      .insert({
        name: body.name,
        language_id: body.language_id,
        description: body.description || null,
        default_version_id: body.default_version_id || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('创建班级 - Supabase 错误:', error);
      throw new Error(`创建班级失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('创建班级异常:', error);
    return NextResponse.json(
      { error: '创建班级失败' },
      { status: 500 }
    );
  }
}

// 更新班级
export async function PUT(request: NextRequest) {
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

    const supabase = getSupabaseAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('classes')
      .update({
        name: body.name,
        language_id: body.language_id,
        description: body.description,
        default_version_id: body.default_version_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新班级失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新班级异常:', error);
    return NextResponse.json(
      { error: '更新班级失败' },
      { status: 500 }
    );
  }
}

// 删除班级
export async function DELETE(request: NextRequest) {
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

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少班级ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`删除班级失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除班级异常:', error);
    return NextResponse.json(
      { error: '删除班级失败' },
      { status: 500 }
    );
  }
}
