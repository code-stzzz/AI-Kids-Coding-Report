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

// 获取学生列表
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ data: [] });
    }

    // 从 token 中解析用户 ID
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    if (!classId) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .order('student_number');

    if (error) {
      throw new Error(`获取学生失败: ${error.message}`);
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

// 创建学生
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

    const supabase = getSupabaseAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('students')
      .insert({
        class_id: body.class_id,
        name: body.name,
        student_number: body.student_number,
        learning_cycle: body.learning_cycle || 1,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建学生失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('创建学生异常:', error);
    return NextResponse.json(
      { error: '创建学生失败' },
      { status: 500 }
    );
  }
}

// 批量创建学生或更新学生
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

    if (body.action === 'batch_create') {
      // 批量创建时添加 user_id
      const studentsWithUserId = body.students.map((s: Record<string, unknown>) => ({
        ...s,
        user_id: userId,
      }));
      
      const { data, error } = await supabase
        .from('students')
        .insert(studentsWithUserId)
        .select();

      if (error) {
        throw new Error(`批量创建学生失败: ${error.message}`);
      }

      return NextResponse.json({ data });
    }

    // 更新单个学生
    const { data, error } = await supabase
      .from('students')
      .update({
        name: body.name,
        student_number: body.student_number,
        learning_cycle: body.learning_cycle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新学生失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('操作学生异常:', error);
    return NextResponse.json(
      { error: '操作学生失败' },
      { status: 500 }
    );
  }
}

// 删除学生
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
      return NextResponse.json({ error: '缺少学生ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`删除学生失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除学生异常:', error);
    return NextResponse.json(
      { error: '删除学生失败' },
      { status: 500 }
    );
  }
}
