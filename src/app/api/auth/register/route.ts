import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

    // 如果有 service role key，使用 admin API 自动确认用户
    if (supabaseUrl && serviceRoleKey && serviceRoleKey !== 'your-service-role-key') {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // 使用 admin API 创建用户并自动确认邮箱
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          name: name || email.split('@')[0],
        },
      });

      if (error) {
        console.error('注册失败:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        user: data.user,
        message: '注册成功！请直接登录。',
      });
    }

    // 如果没有 service role key，使用普通注册（需要邮箱验证）
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      supabaseUrl || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('注册失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: '注册成功！请查收邮件验证后登录，或联系管理员确认账户。',
    });
  } catch (error) {
    console.error('注册异常:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
