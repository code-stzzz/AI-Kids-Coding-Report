import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';

export async function PATCH(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.cookies.get('sb-access-token')?.value;
  if (!token) return NextResponse.json({ error: '请先登录。' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || !body.id || !['active', 'completed'].includes(body.status)) {
    return NextResponse.json({ error: '学生或状态无效。' }, { status: 400 });
  }
  try {
    const { url, anonKey } = getSupabaseCredentials();
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: '登录已失效，请重新登录。' }, { status: 401 });
    const key = getSupabaseServiceRoleKey();
    if (!key) throw new Error('Missing service configuration');
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.from('students').update({
      enrollment_status: body.status,
      completed_at: body.status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', body.id).eq('user_id', auth.user.id).select('*').maybeSingle();
    if (error && ['42703', 'PGRST204'].includes(error.code)) {
      return NextResponse.json({ error: '学生状态功能尚未初始化，请管理员执行学生状态数据库更新脚本。' }, { status: 503 });
    }
    if (error) throw error;
    if (!data) return NextResponse.json({ error: '学生不存在或无权修改。' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新学生状态失败:', error);
    return NextResponse.json({ error: '保存学生状态失败，请稍后重试。' }, { status: 500 });
  }
}
