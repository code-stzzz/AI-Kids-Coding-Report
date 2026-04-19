import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有编程语言（公开数据）
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('programming_languages')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`获取编程语言失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('获取编程语言异常:', error);
    return NextResponse.json(
      { error: '获取编程语言失败' },
      { status: 500 }
    );
  }
}
