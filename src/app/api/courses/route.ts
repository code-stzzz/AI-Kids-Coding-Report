import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取课程单元列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');

    let query = supabase
      .from('course_units')
      .select('*')
      .eq('is_active', true)
      .order('language_id')
      .order('period_number');

    if (languageId) {
      query = query.eq('language_id', languageId);
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
