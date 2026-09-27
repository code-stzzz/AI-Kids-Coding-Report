import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { getSupabaseClient, getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';

// 语言是全站共享数据，仅允许已验证登录的用户添加。
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || request.cookies.get('sb-access-token')?.value;
  if (!token) return NextResponse.json({ error: '请先登录后添加编程语言。' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().normalize('NFKC') : '';
  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return NextResponse.json({ error: '请输入 1～100 个字符的编程语言名称。' }, { status: 400 });
  }
  try {
    const { url, anonKey } = getSupabaseCredentials();
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: '登录状态已失效，请重新登录。' }, { status: 401 });
    const key = getSupabaseServiceRoleKey();
    if (!key) throw new Error('Missing service role configuration');
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: languages, error: lookupError } = await db.from('programming_languages').select('name');
    if (lookupError) throw lookupError;
    if (languages?.some(language => language.name.trim().normalize('NFKC').toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: '该编程语言已存在，请直接选择。' }, { status: 409 });
    }
    // 仅写入已使用的基础字段，兼容旧版数据库。
    const { data, error } = await db.from('programming_languages')
      .insert({ id: randomUUID(), name }).select('*').single();
    if (error?.code === '23505') return NextResponse.json({ error: '该编程语言已存在，请直接选择。' }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('添加编程语言失败:', error);
    return NextResponse.json({ error: '添加编程语言失败，请稍后重试。' }, { status: 500 });
  }
}

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
