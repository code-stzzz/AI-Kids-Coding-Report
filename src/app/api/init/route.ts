import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// 课程单元模板 - 完整 U1-U12（三种语言各12个单元）
const COURSE_UNITS = {
  Python: [
    { name: 'U1', period_number: 1, description: 'Python基础入门', is_active: true, current_stage_content: '【第1课】嘿！小艾同学1（感知课）\n概念、print()、input()内置函数、变量创建与使用\n【第2课】嘿！小艾同学2（理解课）\n知识点：Python模块、os操作系统模块、while True循环、break语句\n【第3课】口算大师1：比较运算符和if单分支语句、if...else双分支语句\n【第4课】口算大师2：浮点数类型、datetime模块、randint()函数、choice()随机选择\n【第5课】老虎机1：while条件循环语句、random模块choice()随机选择\n【第6课】千词斩2：列表操作、pop()、del、remove()删除元素、列表综合应用；字典操作、字典删除\n【第7课】小心心1：自定义Draw模块heart()函数，绘制心形\n【第8课】画家小海龟1：turtle绘图模块、移动绘制函数\n【第9课】画家小海龟2：turtle模块circle()、绘图状态函数\n【第10课】行星轨迹-1：turtle的Screen()、setup()方法\n【第11课】行星轨迹-2：turtle的goto()、speed()方法\n【第12课】测评课：U1全部知识点综合考核' },
    { name: 'U2', period_number: 2, description: '列表与循环进阶', is_active: true, current_stage_content: '列表基础操作、random模块、datetime模块应用、循环嵌套' },
    { name: 'U3', period_number: 3, description: '字符串与循环结构', is_active: true, current_stage_content: '字符串函数、for循环、二维列表、字符串格式化' },
    { name: 'U4', period_number: 4, description: '字典与文件操作', is_active: true, current_stage_content: '字典创建与操作、元组、文件读写、JSON处理' },
    { name: 'U5', period_number: 5, description: '函数与事件编程', is_active: true, current_stage_content: '自定义函数、变量作用域、异常处理、事件驱动编程' },
    { name: 'U6', period_number: 6, description: '模块与面向对象', is_active: true, current_stage_content: '第三方模块、类与对象、jieba分词、wordcloud词云' },
    { name: 'U7', period_number: 7, description: '面向对象进阶', is_active: true, current_stage_content: '继承、多态、GUI编程基础、tkinter模块' },
    { name: 'U8', period_number: 8, description: '算法与数据结构', is_active: true, current_stage_content: '数组、排序算法、二分查找、递归思想' },
    { name: 'U9', period_number: 9, description: '数据结构深入', is_active: true, current_stage_content: '链表、栈、队列、树形结构基础' },
    { name: 'U10', period_number: 10, description: '高级算法', is_active: true, current_stage_content: '动态规划基础、图论入门、最短路径算法' },
    { name: 'U11', period_number: 11, description: '项目实战一', is_active: true, current_stage_content: '综合项目开发、需求分析、模块设计、团队协作' },
    { name: 'U12', period_number: 12, description: '项目实战二', is_active: true, current_stage_content: '项目迭代、性能优化、代码重构、成果展示' }
  ],
  Scratch: [
    { name: 'U1', period_number: 1, description: 'Scratch基础入门', is_active: true, current_stage_content: '认识Scratch界面、角色与舞台、运动指令、外观指令' },
    { name: 'U2', period_number: 2, description: '事件与控制', is_active: true, current_stage_content: '事件触发、条件判断、循环结构、广播消息' },
    { name: 'U3', period_number: 3, description: '变量与运算', is_active: true, current_stage_content: '变量创建、数学运算、字符串处理、列表基础' },
    { name: 'U4', period_number: 4, description: '侦测与互动', is_active: true, current_stage_content: '键盘鼠标侦测、碰撞检测、问答互动、计时器' },
    { name: 'U5', period_number: 5, description: '自定义积木', is_active: true, current_stage_content: '自定义积木、参数传递、递归思想、模块化编程' },
    { name: 'U6', period_number: 6, description: '克隆与物理', is_active: true, current_stage_content: '克隆体、物理运动、重力模拟、弹跳效果' },
    { name: 'U7', period_number: 7, description: '游戏设计一', is_active: true, current_stage_content: '游戏策划、角色设计、关卡设计、计分系统' },
    { name: 'U8', period_number: 8, description: '游戏设计二', is_active: true, current_stage_content: '碰撞检测优化、音效设计、粒子效果、游戏平衡' },
    { name: 'U9', period_number: 9, description: '动画创作', is_active: true, current_stage_content: '动画原理、帧动画、逐帧动画、交互动画' },
    { name: 'U10', period_number: 10, description: '故事创作', is_active: true, current_stage_content: '剧本编写、场景切换、角色对话、情节设计' },
    { name: 'U11', period_number: 11, description: '项目实战一', is_active: true, current_stage_content: '创意项目开发、团队分工、版本迭代、用户测试' },
    { name: 'U12', period_number: 12, description: '项目实战二', is_active: true, current_stage_content: '项目发布、作品展示、反馈收集、持续改进' }
  ],
  'C++': [
    { name: 'U1', period_number: 1, description: 'C++基础入门', is_active: true, current_stage_content: '开发环境搭建、基本语法、变量与数据类型、输入输出流' },
    { name: 'U2', period_number: 2, description: '运算与分支', is_active: true, current_stage_content: '算术运算符、关系运算符、逻辑运算符、if-else语句' },
    { name: 'U3', period_number: 3, description: '循环结构', is_active: true, current_stage_content: 'for循环、while循环、do-while循环、循环嵌套' },
    { name: 'U4', period_number: 4, description: '数组基础', is_active: true, current_stage_content: '一维数组、数组遍历、数组排序、数组查找' },
    { name: 'U5', period_number: 5, description: '函数编程', is_active: true, current_stage_content: '函数定义、参数传递、返回值、函数重载' },
    { name: 'U6', period_number: 6, description: '字符串处理', is_active: true, current_stage_content: 'string类、字符串函数、字符串匹配、正则表达式入门' },
    { name: 'U7', period_number: 7, description: '二维数组', is_active: true, current_stage_content: '二维数组定义、矩阵运算、图像处理基础、地图存储' },
    { name: 'U8', period_number: 8, description: '结构体与枚举', is_active: true, current_stage_content: '结构体定义、结构体数组、枚举类型、类型定义' },
    { name: 'U9', period_number: 9, description: '指针基础', is_active: true, current_stage_content: '指针概念、指针运算、指针与数组、动态内存' },
    { name: 'U10', period_number: 10, description: '算法入门', is_active: true, current_stage_content: '排序算法、二分查找、递归基础、复杂度分析' },
    { name: 'U11', period_number: 11, description: 'STL基础', is_active: true, current_stage_content: 'vector容器、map容器、set容器、algorithm库' },
    { name: 'U12', period_number: 12, description: '算法竞赛入门', is_active: true, current_stage_content: '竞赛题型、时间优化、空间优化、模拟赛训练' }
  ]
};

export async function POST() {
  try {
    console.log('[Init] 开始数据库初始化...');
    const supabase = getServerSupabase();
    
    // 1. 初始化编程语言
    const languages = [
      { id: 'python', name: 'Python', description: 'Python编程语言' },
      { id: 'scratch', name: 'Scratch', description: 'Scratch图形化编程' },
      { id: 'cpp', name: 'C++', description: 'C++编程语言' }
    ];
    
    // 检查编程语言是否已存在
    const { data: existingLangs, error: langCheckError } = await supabase
      .from('programming_languages')
      .select('id, name');
    
    if (langCheckError) {
      console.error('[Init] 查询编程语言失败:', langCheckError.message);
      return NextResponse.json({ 
        success: false, 
        error: `查询编程语言失败: ${langCheckError.message}` 
      }, { status: 500 });
    }
    
    // 如果编程语言不存在，插入数据
    if (!existingLangs || existingLangs.length === 0) {
      console.log('[Init] 插入编程语言数据...');
      const { error: langInsertError } = await supabase
        .from('programming_languages')
        .insert(languages);
      
      if (langInsertError) {
        console.error('[Init] 插入编程语言失败:', langInsertError.message);
        return NextResponse.json({ 
          success: false, 
          error: `插入编程语言失败: ${langInsertError.message}` 
        }, { status: 500 });
      }
    }
    
    // 重新获取编程语言列表（获取正确的ID）
    const { data: allLangs, error: refetchError } = await supabase
      .from('programming_languages')
      .select('id, name');
    
    if (refetchError || !allLangs) {
      console.error('[Init] 重新获取编程语言失败:', refetchError?.message);
      return NextResponse.json({ 
        success: false, 
        error: `获取编程语言失败: ${refetchError?.message}` 
      }, { status: 500 });
    }
    
    // 创建语言名称到ID的映射
    const langIdMap: Record<string, string> = {};
    allLangs.forEach(lang => {
      langIdMap[lang.name] = lang.id;
    });
    
    console.log('[Init] 编程语言映射:', langIdMap);
    
    // 2. 初始化课程单元
    // 先查询已有的课程单元
    const { data: existingUnits, error: unitCheckError } = await supabase
      .from('course_units')
      .select('language_id, name');
    
    if (unitCheckError) {
      console.error('[Init] 查询课程单元失败:', unitCheckError.message);
      return NextResponse.json({ 
        success: false, 
        error: `查询课程单元失败: ${unitCheckError.message}` 
      }, { status: 500 });
    }
    
    // 构建已存在的课程单元集合（language_id + name）
    const existingUnitKeys = new Set<string>();
    if (existingUnits) {
      existingUnits.forEach(unit => {
        existingUnitKeys.add(`${unit.language_id}_${unit.name}`);
      });
    }
    
    console.log('[Init] 已有课程单元数量:', existingUnitKeys.size);
    
    // 准备要插入的课程单元
    const unitsToInsert: Array<{
      language_id: string;
      name: string;
      period_number: number;
      description: string;
      is_active: boolean;
      current_stage_content: string;
    }> = [];
    
    // 遍历每种语言的课程单元
    for (const [langName, units] of Object.entries(COURSE_UNITS)) {
      const langId = langIdMap[langName];
      if (!langId) {
        console.warn(`[Init] 未找到语言 ${langName} 的ID，跳过`);
        continue;
      }
      
      // 检查每个课程单元是否已存在
      for (const unit of units) {
        const key = `${langId}_${unit.name}`;
        if (!existingUnitKeys.has(key)) {
          unitsToInsert.push({
            language_id: langId,
            name: unit.name,
            period_number: unit.period_number,
            description: unit.description,
            is_active: unit.is_active,
            current_stage_content: unit.current_stage_content
          });
        }
      }
    }
    
    // 插入缺失的课程单元
    if (unitsToInsert.length > 0) {
      console.log(`[Init] 需要补充 ${unitsToInsert.length} 个课程单元`);
      
      const { error: unitInsertError } = await supabase
        .from('course_units')
        .insert(unitsToInsert);
      
      if (unitInsertError) {
        console.error('[Init] 插入课程单元失败:', unitInsertError.message);
        return NextResponse.json({ 
          success: false, 
          error: `插入课程单元失败: ${unitInsertError.message}` 
        }, { status: 500 });
      }
      
      console.log(`[Init] 成功补充 ${unitsToInsert.length} 个课程单元`);
    } else {
      console.log('[Init] 课程单元已完整，无需补充');
    }
    
    // 返回最终统计
    const { count: finalLangCount } = await supabase
      .from('programming_languages')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalUnitCount } = await supabase
      .from('course_units')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({ 
      success: true,
      languagesCount: finalLangCount || 0,
      courseUnitsCount: finalUnitCount || 0,
      insertedUnits: unitsToInsert.length,
      message: unitsToInsert.length > 0 
        ? `成功补充 ${unitsToInsert.length} 个课程单元` 
        : '课程单元已完整'
    });
    
  } catch (error) {
    console.error('[Init] 初始化异常:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
