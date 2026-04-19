import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 获取 token
    const token = request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const supabase = getSupabaseClient(token);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息异常:', error);
    return NextResponse.json({ user: null });
  }
}
