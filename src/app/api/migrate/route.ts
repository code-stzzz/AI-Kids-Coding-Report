import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST() {
  try {
    const supabase = getSupabaseClient();
    const results: string[] = [];

    // 检查 curriculum_versions 表是否存在
    const { error: checkError } = await supabase
      .from('curriculum_versions')
      .select('id')
      .limit(1);

    if (checkError) {
      results.push('curriculum_versions 表不存在，需要在 Supabase Dashboard 手动创建');
    } else {
      results.push('curriculum_versions 表已存在');
    }

    // 添加 AI 编程语言
    const { error: aiError } = await supabase
      .from('programming_languages')
      .upsert({
        id: 'lang-ai',
        name: 'AI',
        description: '人工智能编程，学习机器学习和深度学习基础',
        icon: '🤖'
      });

    if (aiError) {
      results.push(`添加 AI 编程语言: ${aiError.message}`);
    } else {
      results.push('添加 AI 编程语言: 成功');
    }

    // 返回需要手动执行的 SQL
    const migrationSQL = `
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

-- 4. 为每个语言创建默认版本 4.0（可选，需要替换 user_id）
-- INSERT INTO curriculum_versions (language_id, name, description, is_default, user_id)
-- SELECT id, '4.0', '默认课程版本', true, '你的用户ID' FROM programming_languages;
`;

    return NextResponse.json({
      success: !checkError,
      results,
      needMigration: !!checkError,
      sql: migrationSQL,
      note: '如果 curriculum_versions 表不存在，请在 Supabase SQL Editor 中执行上述 SQL'
    });

  } catch (error) {
    console.error('迁移检查失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '迁移检查失败'
    }, { status: 500 });
  }
}
