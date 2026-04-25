import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientAsync } from '@/storage/database/supabase-client';
import { extractToken } from '@/lib/auth';

// 完整的迁移 SQL
const MIGRATION_SQL = `-- ============================================
-- 课程版本管理迁移脚本
-- 执行位置：Supabase Dashboard → SQL Editor
-- ============================================

-- 1. 创建课程版本表
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id VARCHAR NOT NULL REFERENCES programming_languages(id) ON DELETE CASCADE,
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

-- 4. 启用 RLS
ALTER TABLE curriculum_versions ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略（用户只能操作自己的版本）
CREATE POLICY "Users can view own versions" ON curriculum_versions
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own versions" ON curriculum_versions
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own versions" ON curriculum_versions
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own versions" ON curriculum_versions
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- 6. 添加 AI 编程语言
INSERT INTO programming_languages (id, name, display_name, icon, color, description)
VALUES ('lang-ai', 'AI', '人工智能', '🤖', '#8B5CF6', 'AI编程与机器学习')
ON CONFLICT (id) DO NOTHING;

-- 7. 确保 course_units 表有正确的 RLS 策略（允许公开读写课程单元）
-- 先删除可能存在的旧策略（避免冲突）
DROP POLICY IF EXISTS "course_units_允许公开读取" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开写入" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开更新" ON course_units;
DROP POLICY IF EXISTS "course_units_允许公开删除" ON course_units;

-- 重新创建策略
CREATE POLICY "course_units_允许公开读取" ON course_units
  FOR SELECT USING (true);

CREATE POLICY "course_units_允许公开写入" ON course_units
  FOR INSERT WITH CHECK (true);

CREATE POLICY "course_units_允许公开更新" ON course_units
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "course_units_允许公开删除" ON course_units
  FOR DELETE USING (true);

-- 8. 确保 RLS 已启用
ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;`;

// GET: 检查迁移状态
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = await getSupabaseClientAsync(token);

    // 检查 curriculum_versions 表是否存在
    const { error: versionTableError } = await supabase
      .from('curriculum_versions')
      .select('id')
      .limit(1);

    const hasVersionsTable = !versionTableError ||
      !versionTableError.message.includes('Could not find') &&
      !versionTableError.message.includes('does not exist');

    // 检查 course_units 是否有 version_id 列
    let hasVersionIdColumn = false;
    if (hasVersionsTable) {
      const { error: columnError } = await supabase
        .from('course_units')
        .select('id,version_id')
        .limit(1);
      hasVersionIdColumn = !columnError;
    }

    // 检查 AI 编程语言是否存在
    const { data: aiLang } = await supabase
      .from('programming_languages')
      .select('id')
      .eq('id', 'lang-ai')
      .maybeSingle();

    const needsMigration = !hasVersionsTable || !hasVersionIdColumn;

    return NextResponse.json({
      needsMigration,
      checks: {
        versionsTable: hasVersionsTable,
        versionIdColumn: hasVersionIdColumn,
        aiLanguage: !!aiLang,
      },
      sql: MIGRATION_SQL,
    });
  } catch (error) {
    console.error('迁移检查失败:', error);
    return NextResponse.json({
      needsMigration: true,
      checks: { versionsTable: false, versionIdColumn: false, aiLanguage: false },
      sql: MIGRATION_SQL,
    });
  }
}

// POST: 验证迁移是否已完成
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = await getSupabaseClientAsync(token);

    // 检查 curriculum_versions 表是否存在
    const { error: versionTableError } = await supabase
      .from('curriculum_versions')
      .select('id')
      .limit(1);

    if (versionTableError) {
      return NextResponse.json({
        success: false,
        message: 'curriculum_versions 表仍未创建，请确认已在 Supabase SQL Editor 中执行了迁移 SQL',
      });
    }

    // 检查 course_units 是否有 version_id 列
    const { error: columnError } = await supabase
      .from('course_units')
      .select('id,version_id')
      .limit(1);

    if (columnError) {
      return NextResponse.json({
        success: false,
        message: 'course_units.version_id 列仍未添加，请确认迁移 SQL 完整执行',
      });
    }

    // 检查 AI 语言
    const { data: aiLang } = await supabase
      .from('programming_languages')
      .select('id')
      .eq('id', 'lang-ai')
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: '数据库迁移成功！',
      checks: {
        versionsTable: true,
        versionIdColumn: true,
        aiLanguage: !!aiLang,
      },
    });
  } catch (error) {
    console.error('迁移验证失败:', error);
    return NextResponse.json({
      success: false,
      message: '验证失败，请重试',
    });
  }
}
