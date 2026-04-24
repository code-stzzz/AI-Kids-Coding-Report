import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserIdFromToken } from '@/lib/auth';

// 获取课程单元列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');
    const versionId = searchParams.get('version_id');

    let query = supabase
      .from('course_units')
      .select('*')
      .eq('is_active', true)
      .order('period_number');

    if (versionId) {
      // 按版本查询
      query = query.eq('version_id', versionId);
    } else if (languageId) {
      // 按语言查询（兼容旧逻辑，查询没有版本关联的课程单元）
      query = query.eq('language_id', languageId).is('version_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取课程单元失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取课程单元异常:', error);
    return NextResponse.json(
      { error: '获取课程单元失败' },
      { status: 500 }
    );
  }
}

// 创建课程单元
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { language_id, version_id, name, period_number, current_stage_content, description } = body;

    if (!language_id || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_units')
      .insert({
        language_id,
        version_id,
        name,
        period_number: period_number || 1,
        current_stage_content: current_stage_content || '',
        description: description || '',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建课程单元失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('创建课程单元异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建课程单元失败' },
      { status: 500 }
    );
  }
}

// 更新课程单元
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { id, name, period_number, current_stage_content, description } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少课程单元 ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('course_units')
      .update({
        name,
        period_number,
        current_stage_content,
        description
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新课程单元失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新课程单元异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新课程单元失败' },
      { status: 500 }
    );
  }
}

// 删除课程单元
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少课程单元 ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('course_units')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除课程单元失败: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除课程单元异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除课程单元失败' },
      { status: 500 }
    );
  }
}
