import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserIdFromToken } from '@/lib/auth';

// 获取课程版本列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const languageId = searchParams.get('language_id');

    // 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    // 检查表是否存在
    const { error: tableCheckError } = await supabase
      .from('curriculum_versions')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      // 表不存在，返回空的版本列表，并提示需要创建表
      return NextResponse.json({
        data: [],
        needMigration: true,
        message: 'curriculum_versions 表不存在，请在 Supabase Dashboard 执行 SQL 创建表'
      });
    }

    // 查询用户自己的版本
    let query = supabase
      .from('curriculum_versions')
      .select(`
        *,
        programming_languages(name, icon)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (languageId) {
      query = query.eq('language_id', languageId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取课程版本失败: ${error.message}`);
    }

    return NextResponse.json({ data, needMigration: false });
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
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { language_id, name, description, copy_from_version_id } = body;

    if (!language_id || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 创建新版本
    const { data: newVersion, error: versionError } = await supabase
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
      // 检查是否是表不存在的错误
      if (versionError.message.includes('does not exist') || versionError.message.includes('relation')) {
        return NextResponse.json({
          error: '数据库表未创建',
          needMigration: true,
          sql: getMigrationSQL()
        }, { status: 500 });
      }
      throw new Error(`创建版本失败: ${versionError.message}`);
    }

    // 如果是从现有版本复制，复制课程单元
    if (copy_from_version_id) {
      const { data: sourceUnits, error: sourceError } = await supabase
        .from('course_units')
        .select('*')
        .eq('version_id', copy_from_version_id);

      if (!sourceError && sourceUnits && sourceUnits.length > 0) {
        const newUnits = sourceUnits.map(unit => ({
          language_id: unit.language_id,
          version_id: newVersion.id,
          name: unit.name,
          period_number: unit.period_number,
          current_stage_content: unit.current_stage_content,
          description: unit.description,
          is_active: true
        }));

        await supabase.from('course_units').insert(newUnits);
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
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id, name, description, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少版本 ID' }, { status: 400 });
    }

    // 如果设置为默认，先取消该用户该语言的其他默认版本
    if (is_default) {
      const { data: version } = await supabase
        .from('curriculum_versions')
        .select('language_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (version) {
        await supabase
          .from('curriculum_versions')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('language_id', version.language_id);
      }
    }

    // 更新版本
    const { data, error } = await supabase
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
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: '缺少版本 ID' }, { status: 400 });
    }

    // 先删除该版本下的课程单元
    await supabase
      .from('course_units')
      .delete()
      .eq('version_id', id);

    // 删除版本
    const { error } = await supabase
      .from('curriculum_versions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`删除版本失败: ${error.message}`);
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

// 返回需要执行的迁移 SQL
function getMigrationSQL(): string {
  return `
-- 1. 创建课程版本表
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES programming_languages(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 为 course_units 添加 version_id 字段
ALTER TABLE course_units ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES curriculum_versions(id) ON DELETE SET NULL;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_curriculum_versions_language_id ON curriculum_versions(language_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_versions_user_id ON curriculum_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_units_version_id ON course_units(version_id);
`;
}
