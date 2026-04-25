import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientAsync } from '@/storage/database/supabase-client';
import { getUserIdFromRequest, extractToken } from '@/lib/auth';

// 课程单元模板
const COURSE_TEMPLATES = {
  'lang-python': {
    name: 'Python',
    units: [
      { name: 'U1', description: 'Python基础入门（变量、函数、分支结构、循环、turtle绘图）' },
      { name: 'U2', description: '列表与循环进阶（列表操作、random模块、datetime模块）' },
      { name: 'U3', description: '字符串与循环结构（字符串函数、for循环、二维列表）' },
      { name: 'U4', description: '字典与文件操作（字典、元组、文件读写）' },
      { name: 'U5', description: '函数与事件编程（自定义函数、变量作用域、异常处理）' },
      { name: 'U6', description: '模块与面向对象（第三方模块、类与对象、jieba/wordcloud）' },
      { name: 'U7', description: '面向对象进阶（继承、多态、GUI编程）' },
      { name: 'U8', description: '算法与数据结构（数组、排序、二分查找、递归）' },
      { name: 'U9', description: '数据结构深入（链表、栈、队列）' },
      { name: 'U10', description: '高级算法（动态规划、贪心算法）' },
      { name: 'U11', description: '项目实战一（综合应用）' },
      { name: 'U12', description: '项目实战二（创新项目）' },
    ],
  },
  'lang-scratch': {
    name: 'Scratch',
    units: [
      { name: 'U1', description: 'Scratch入门（界面、角色、运动）' },
      { name: 'U2', description: '外观与声音（造型、音效）' },
      { name: 'U3', description: '事件与控制（条件判断、循环）' },
      { name: 'U4', description: '变量与运算（变量、数学运算）' },
      { name: 'U5', description: '消息与广播（角色通信）' },
      { name: 'U6', description: '克隆与自定义积木（函数）' },
      { name: 'U7', description: '列表与数据处理' },
      { name: 'U8', description: '游戏设计一（互动游戏）' },
      { name: 'U9', description: '游戏设计二（计分系统）' },
      { name: 'U10', description: '动画创作（故事动画）' },
      { name: 'U11', description: '项目实战一' },
      { name: 'U12', description: '项目实战二' },
    ],
  },
  'lang-cpp': {
    name: 'C++',
    units: [
      { name: 'U1', description: 'C++基础入门（环境、变量、输入输出）' },
      { name: 'U2', description: '数据类型与运算符' },
      { name: 'U3', description: '分支结构（if、switch）' },
      { name: 'U4', description: '循环结构（for、while）' },
      { name: 'U5', description: '数组与字符串' },
      { name: 'U6', description: '函数与递归' },
      { name: 'U7', description: '结构体与类基础' },
      { name: 'U8', description: '算法入门（排序、查找）' },
      { name: 'U9', description: '算法进阶（递推、递归）' },
      { name: 'U10', description: '数据结构（栈、队列）' },
      { name: 'U11', description: '竞赛入门一' },
      { name: 'U12', description: '竞赛入门二' },
    ],
  },
  'lang-ai': {
    name: 'AI',
    units: [
      { name: 'U1', description: 'AI入门与机器学习概念' },
      { name: 'U2', description: '数据处理与可视化' },
      { name: 'U3', description: '监督学习基础（分类）' },
      { name: 'U4', description: '监督学习进阶（回归）' },
      { name: 'U5', description: '无监督学习（聚类）' },
      { name: 'U6', description: '神经网络基础' },
      { name: 'U7', description: '深度学习入门' },
      { name: 'U8', description: '图像识别' },
      { name: 'U9', description: '自然语言处理' },
      { name: 'U10', description: 'AI项目实战一' },
      { name: 'U11', description: 'AI项目实战二' },
      { name: 'U12', description: 'AI创新应用' },
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    // 获取 token 和用户 ID
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);
    const userId = getUserIdFromRequest(request);
    if (!userId || !token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { languageId } = body;

    if (!languageId) {
      return NextResponse.json({ error: '缺少 languageId 参数' }, { status: 400 });
    }

    const template = COURSE_TEMPLATES[languageId as keyof typeof COURSE_TEMPLATES];
    if (!template) {
      return NextResponse.json({ error: '不支持的编程语言' }, { status: 400 });
    }

    // 使用 token 创建 Supabase 客户端，确保 RLS 能识别用户
    const supabase = await getSupabaseClientAsync(token);

    // 检查是否已有版本
    const { data: existingVersions } = await supabase
      .from('curriculum_versions')
      .select('id')
      .eq('language_id', languageId)
      .eq('user_id', userId);

    if (existingVersions && existingVersions.length > 0) {
      return NextResponse.json({ 
        error: '已存在课程版本，请刷新页面查看',
        existing: true 
      }, { status: 400 });
    }

    // 创建默认版本 4.0
    const { data: version, error: versionError } = await supabase
      .from('curriculum_versions')
      .insert({
        language_id: languageId,
        name: '4.0',
        description: `${template.name} 4.0 课程体系`,
        is_default: true,
        user_id: userId,
      })
      .select()
      .single();

    if (versionError) {
      console.error('[Init Courses] 创建版本失败:', versionError);
      return NextResponse.json({ error: '创建版本失败' }, { status: 500 });
    }

    // 创建课程单元
    const units = template.units.map((unit, index) => ({
      version_id: version.id,
      language_id: languageId,
      name: unit.name,
      period_number: index + 1,
      current_stage_content: unit.description,
      description: unit.description,
    }));

    const { error: unitsError } = await supabase
      .from('course_units')
      .insert(units);

    if (unitsError) {
      console.error('[Init Courses] 创建课程单元失败:', unitsError);
      return NextResponse.json({ error: '创建课程单元失败' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      version: version,
      unitsCount: units.length 
    });
  } catch (error) {
    console.error('[Init Courses] 初始化失败:', error);
    return NextResponse.json({ error: '初始化失败' }, { status: 500 });
  }
}
