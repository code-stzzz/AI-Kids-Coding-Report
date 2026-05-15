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

// 获取学习报告列表
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
    const studentId = searchParams.get('student_id');
    const courseUnitId = searchParams.get('course_unit_id');

    let query = supabase
      .from('study_reports')
      .select(`
        *,
        student:students(name, student_number),
        course_unit:course_units(name, period_number)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (courseUnitId) {
      query = query.eq('course_unit_id', courseUnitId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取学习报告失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取学习报告异常:', error);
    return NextResponse.json(
      { error: '获取学习报告失败' },
      { status: 500 }
    );
  }
}

// 创建学习报告
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

    // 从课程单元获取 language_id
    const { data: courseUnit, error: courseError } = await supabase
      .from('course_units')
      .select('language_id')
      .eq('id', body.course_unit_id)
      .single();

    if (!courseUnit?.language_id) {
      console.error('[Reports] 课程单元不存在或缺少 language_id:', courseError);
      return NextResponse.json({ error: '课程单元不存在' }, { status: 400 });
    }

    // 插入学习报告（只使用表中存在的字段）
    const { data, error } = await supabase
      .from('study_reports')
      .insert({
        student_id: body.student_id,
        course_unit_id: body.course_unit_id,
        language_id: courseUnit.language_id,
        radar_dimensions: body.radar_dimensions,
        core_strengths: body.core_strengths,
        areas_to_improve: body.areas_to_improve,
        progress_description: body.progress_description,
        improvement_description: body.improvement_description,
        encouragement_message: body.encouragement_message,
        improvement_plan_1: body.improvement_plan_1,
        improvement_plan_2: body.improvement_plan_2,
        improvement_plan_3: body.improvement_plan_3,
        competition_plans: body.competition_plans,
        is_completed: true,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[Reports] 创建学习报告失败:', error.message);
      throw new Error(`创建学习报告失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('创建学习报告异常:', error);
    return NextResponse.json(
      { error: '创建学习报告失败' },
      { status: 500 }
    );
  }
}

// 更新学习报告
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
      .from('study_reports')
      .update({
        radar_dimensions: body.radar_dimensions,
        core_strengths: body.core_strengths,
        areas_to_improve: body.areas_to_improve,
        progress_description: body.progress_description,
        improvement_description: body.improvement_description,
        encouragement_message: body.encouragement_message,
        improvement_plan_1: body.improvement_plan_1,
        improvement_plan_2: body.improvement_plan_2,
        improvement_plan_3: body.improvement_plan_3,
        competition_plans: body.competition_plans,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新学习报告失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新学习报告异常:', error);
    return NextResponse.json(
      { error: '更新学习报告失败' },
      { status: 500 }
    );
  }
}

// 删除学习报告
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
      return NextResponse.json({ error: '缺少报告ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('study_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`删除学习报告失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除学习报告异常:', error);
    return NextResponse.json(
      { error: '删除学习报告失败' },
      { status: 500 }
    );
  }
}
