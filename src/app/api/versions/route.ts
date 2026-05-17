import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseServiceRoleKey, getSupabaseCredentials } from '@/storage/database/supabase-client';
import { getUserIdFromToken, extractToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// 获取课程版本列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');

    // 使用 service role key 查询所有版本（版本是公共数据）
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const { url, anonKey } = getSupabaseCredentials();
    
    if (!serviceRoleKey) {
      // 如果没有 service role key，使用普通客户端
      const supabase = getSupabaseClient();
      let query = supabase
        .from('curriculum_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (languageId) {
        query = query.eq('language_id', languageId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.message.includes('Could not find') || error.message.includes('does not exist')) {
          return NextResponse.json({ data: [], needMigration: true });
        }
        throw new Error(`获取课程版本失败: ${error.message}`);
      }

      return NextResponse.json({ data: data || [], needMigration: false });
    }

    // 使用 service role key 绕过 RLS
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let query = adminClient
      .from('curriculum_versions')
      .select('*')
      .order('created_at', { ascending: false });

    if (languageId) {
      query = query.eq('language_id', languageId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes('Could not find') || error.message.includes('does not exist')) {
        return NextResponse.json({ data: [], needMigration: true });
      }
      throw new Error(`获取课程版本失败: ${error.message}`);
    }

    return NextResponse.json({ data: data || [], needMigration: false });
  } catch (error) {
    console.error('获取课程版本异常:', error);
    return NextResponse.json(
      { error: '获取课程版本失败' },
      { status: 500 }
    );
  }
}

// 创建课程版本
export async function POST(request: NextRequest) {
  try {
    // 获取用户 ID 和 token
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    const userId = getUserIdFromToken(token);

    if (!userId || !token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用 service role key 创建版本
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const { url } = getSupabaseCredentials();
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: '服务配置错误' }, { status: 500 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await request.json();
    const { language_id, name, description, copy_from_version_id } = body;

    if (!language_id || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 创建新版本
    const { data: newVersion, error: versionError } = await adminClient
      .from('curriculum_versions')
      .insert({
        language_id,
        name,
        description,
        user_id: userId,
        is_active: true,
        is_default: false
      })
      .select()
      .single();

    if (versionError) {
      // 表不存在
      if (versionError.message.includes('Could not find') || versionError.message.includes('does not exist')) {
        return NextResponse.json({ error: '数据库需要迁移', needMigration: true }, { status: 400 });
      }
      throw new Error(`创建版本失败: ${versionError.message}`);
    }

    // 如果是从现有版本复制，复制课程单元
    if (copy_from_version_id) {
      const { data: sourceUnits, error: sourceError } = await adminClient
        .from('course_units')
        .select('*')
        .eq('version_id', copy_from_version_id);

      if (!sourceError && sourceUnits && sourceUnits.length > 0) {
        const newUnits = sourceUnits.map((unit: Record<string, unknown>) => ({
          language_id: unit.language_id,
          version_id: newVersion.id,
          name: unit.name,
          period_number: unit.period_number,
          current_stage_content: unit.current_stage_content,
          description: unit.description,
          is_active: true
        }));

        await adminClient.from('course_units').insert(newUnits);
      }
    }

    return NextResponse.json({ data: newVersion });
  } catch (error) {
    console.error('创建课程版本异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建课程版本失败' },
      { status: 500 }
    );
  }
}

// 更新课程版本
export async function PUT(request: NextRequest) {
  try {
    // 获取用户 ID 和 token
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    const userId = getUserIdFromToken(token);

    if (!userId || !token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用 service role key 更新版本
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const { url } = getSupabaseCredentials();
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: '服务配置错误' }, { status: 500 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await request.json();
    const { id, name, description, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少版本 ID' }, { status: 400 });
    }

    // 如果设置为默认，先取消该用户该语言的其他默认版本
    if (is_default) {
      const { data: version } = await adminClient
        .from('curriculum_versions')
        .select('language_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (version) {
        await adminClient
          .from('curriculum_versions')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('language_id', version.language_id);
      }
    }

    // 更新版本
    const { data, error } = await adminClient
      .from('curriculum_versions')
      .update({
        name,
        description,
        is_default,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新版本失败: ${error.message}`);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('更新课程版本异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新课程版本失败' },
      { status: 500 }
    );
  }
}

// 删除课程版本
export async function DELETE(request: NextRequest) {
  try {
    // 获取用户 ID 和 token
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    const userId = getUserIdFromToken(token);

    if (!userId || !token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用 service role key 删除版本
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const { url } = getSupabaseCredentials();
    
    if (!serviceRoleKey) {
      return NextResponse.json({ error: '服务配置错误' }, { status: 500 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少版本 ID' }, { status: 400 });
    }

    // 先检查版本是否存在，以及是否属于当前用户
    const { data: existingVersion, error: checkError } = await adminClient
      .from('curriculum_versions')
      .select('id, user_id, name')
      .eq('id', id)
      .single();

    if (checkError || !existingVersion) {
      return NextResponse.json({ error: '版本不存在' }, { status: 404 });
    }

    // 权限检查：允许删除自己创建的版本或系统创建的版本（user_id 为空或全零）
    const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
    const versionOwner = existingVersion.user_id;
    const isOwner = versionOwner === userId;
    const isSystemVersion = !versionOwner || versionOwner === ZERO_UUID;

    if (!isOwner && !isSystemVersion) {
      return NextResponse.json(
        { error: '无法删除该版本，您不是该版本的创建者' },
        { status: 403 }
      );
    }

    // 检查该版本下的课程单元是否被学习报告引用
    const { data: courseUnits } = await adminClient
      .from('course_units')
      .select('id')
      .eq('version_id', id);

    if (courseUnits && courseUnits.length > 0) {
      const unitIds = courseUnits.map(u => u.id);
      const { count: reportCount } = await adminClient
        .from('study_reports')
        .select('*', { count: 'exact', head: true })
        .in('course_unit_id', unitIds);

      if (reportCount && reportCount > 0) {
        return NextResponse.json(
          { error: `该版本下有 ${reportCount} 份学习报告，无法删除。请先删除相关报告后再试。` },
          { status: 400 }
        );
      }
    }

    // 删除该版本下的课程单元
    const { error: unitsDeleteError } = await adminClient
      .from('course_units')
      .delete()
      .eq('version_id', id);

    if (unitsDeleteError) {
      console.error('删除课程单元失败:', unitsDeleteError);
      throw new Error(`删除课程单元失败: ${unitsDeleteError.message}`);
    }

    // 删除版本（不再过滤 user_id，因为上面已经做了权限检查）
    const { data, error } = await adminClient
      .from('curriculum_versions')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`删除版本失败: ${error.message}`);
    }

    // 检查是否真的删除了记录
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '删除版本失败，请重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除课程版本异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除课程版本失败' },
      { status: 500 }
    );
  }
}
