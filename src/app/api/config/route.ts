import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

// 编程语言默认数据
const DEFAULT_LANGUAGES = [
  { name: "Python", description: "Python是一门简单易学且功能强大的编程语言，适合少儿入门学习", icon: "🐍" },
  { name: "Scratch", description: "Scratch是一款由麻省理工学院设计的图形化编程工具，适合低龄儿童", icon: "🎨" },
  { name: "C++", description: "C++是一门高效、灵活的编程语言，是信息学竞赛的主要语言之一", icon: "⚡" }
];

// 课程单元模板 - 完整 U1-U12
const COURSE_UNITS = {
  Python: [
    { name: 'U1', period_number: 1, description: 'Python基础入门', is_active: true, current_stage_content: '【第1课】嘿！小艾同学1：函数概念、print()、input()内置函数、变量创建与使用\n【第2课】嘿！小艾同学2：Python模块、os操作系统模块、while True循环\n【第3课】口算大师1：比较运算符、if单分支语句、if...else双分支语句\n【第4课】口算大师2：float浮点数类型、random随机模块、randint()函数\n【第5课】口算大师3：类型转换函数综合应用\n【第6课】谁先到20-1：比较运算符、复合运算符、循环累加计算\n【第7课】谁先到20-2：逻辑运算符and、循环控制语句continue和break\n【第8课】画家小海龟1：turtle绘图模块、移动绘制函数\n【第9课】画家小海龟2：turtle模块circle()、绘图状态函数\n【第10课】行星轨迹-1：turtle的Screen()、setup()方法\n【第11课】行星轨迹-2：turtle的goto()、speed()方法\n【第12课】测评课：U1全部知识点综合考核' },
    { name: 'U2', period_number: 2, description: '列表与循环', is_active: true, current_stage_content: '【第1课】读心术1：print()默认参数、转义字符、算术运算符\n【第2课】读心术2：list列表数据类型、列表创建、索引访问\n【第3课】老虎机1：while条件循环语句、random模块choice()\n【第4课】老虎机2：while条件循环综合应用\n【第5课】千词斩1：列表操作、pop()、del、remove()删除元素\n【第6课】千词斩2：列表操作综合应用\n【第7课】小心心1：自定义Draw模块heart()函数\n【第8课】小心心2：自定义模块应用\n【第9课】IronMan1：turtle综合应用、random随机数\n【第10课】IronMan2：turtle动画效果\n【第11课】定时播报：列表进阶使用、datetime模块\n【第12课】测评课：U2全部知识点综合考核' },
    { name: 'U3', period_number: 3, description: '字符串与循环', is_active: true, current_stage_content: '【第1课】字符串急诊室1：字符串函数format()、split()\n【第2课】字符串急诊室2：字符串格式化与分割综合应用\n【第3课】歌王争霸赛1：for计步循环、字符串replace()\n【第4课】歌王争霸赛2：for循环综合应用\n【第5课】密码猜猜猜1：range()、list()内置函数\n【第6课】密码猜猜猜2：range函数生成序列\n【第7课】智能棋手1：列表综合应用\n【第8课】智能棋手2：列表更新与插入\n【第9课】智能棋手3：列表操作综合\n【第10课】益智24点1：二维列表定义、for循环嵌套\n【第11课】益智24点2：二维列表应用\n【第12课】测评课：U3全部知识点综合考核' },
    { name: 'U4', period_number: 4, description: '字典与文件', is_active: true, current_stage_content: '【第1课】汉字小状元1：二维列表操作\n【第2课】汉字小状元2：二维列表综合应用\n【第3课】歇后语1：字典数据类型、字典创建与操作\n【第4课】歇后语2：字典操作综合应用\n【第5课】今日运势：元组数据类型\n【第6课】飞花令1：文件基本操作\n【第7课】飞花令2：文件读取综合应用\n【第8课】公鸡变蛋：字符串与列表互相转换\n【第9课】Python与数学：约数、质数概念\n【第10课】李白沽酒：循环与判断解决实际问题\n【第11课】绚丽的烟花：turtle模块综合应用\n【第12课】测评课：U4全部知识点综合考核' },
    { name: 'U5', period_number: 5, description: '函数与事件', is_active: true, current_stage_content: '【第1课】夜空中最亮的星1：事件概念、turtle监听事件\n【第2课】夜空中最亮的星2：函数间相互调用\n【第3课】幸运大抽奖1：自定义函数基本结构\n【第4课】幸运大抽奖2：turtle与函数结合\n【第5课】我是大力士1：变量作用域\n【第6课】我是大力士2：作用域综合应用\n【第7课】海龟射击1：turtle高级函数\n【第8课】海龟射击2：事件综合应用\n【第9课】找不同1：元组创建取值\n【第10课】找不同2：二维列表综合\n【第11课】智能读书机器人：异常处理\n【第12课】测评课：U5全部知识点综合考核' },
    { name: 'U6', period_number: 6, description: '模块与面向对象', is_active: true, current_stage_content: '【第1课】令人惊奇的二维码：第三方模块、pip安装\n【第2课】百变词云：jieba、wordcloud模块\n【第3课】名侦探小码君1：Python类的使用\n【第4课】名侦探小码君2：类的创建与实例化\n【第5课】给你介绍一个对象：class类创建、__init__方法\n【第6课】卡牌对决1：类的属性与方法\n【第7课】卡牌对决2：面向对象编程应用\n【第8课】turtle贪吃蛇1：贪吃蛇控制逻辑\n【第9课】turtle贪吃蛇2：吃鸡蛋逻辑\n【第10课】turtle贪吃蛇3：游戏逻辑完善\n【第11课】拼图大师：pillow、numpy模块\n【第12课】测评课：U6全部知识点综合考核' },
    { name: 'U7', period_number: 7, description: '面向对象进阶', is_active: true, current_stage_content: '【第1-4课】面向对象进阶：类的继承、方法重写、多态\n【第5-8课】GUI编程入门：Tkinter窗口创建、常用组件\n【第9-11课】综合项目：面向对象综合应用\n【第12课】测评课：U7全部知识点综合考核' },
    { name: 'U8', period_number: 8, description: '算法与数据结构', is_active: true, current_stage_content: '【第1课】迷宫-1：二维数组创建\n【第2课】迷宫-2：最短路径算法\n【第3课】迷宫-3：csv模块应用\n【第4课】解析算法：算法原理\n【第5课】枚举算法：枚举原理\n【第6课】蒙特卡洛算法：随机模拟\n【第7课】请你来排序1：冒泡排序\n【第8课】请你来排序2：选择排序\n【第9课】神秘的二分法：二分查找\n【第10课】递归算法：递归思想\n【第11课】递推算法：递推思想\n【第12课】测评课：U8全部知识点综合考核' },
    { name: 'U9', period_number: 9, description: '数据结构深入', is_active: true, current_stage_content: '【第1-3课】链表数据结构：链表概念与实现\n【第4-6课】栈与队列：栈与队列的实现\n【第7-9课】树结构基础：二叉树与遍历\n【第10-11课】综合项目：数据结构应用\n【第12课】测评课：U9全部知识点综合考核' },
    { name: 'U10', period_number: 10, description: '图论基础', is_active: true, current_stage_content: '【第1-3课】图论基础：图的定义与存储\n【第4-6课】最短路径：Dijkstra算法\n【第7-9课】最小生成树：Prim算法\n【第10-11课】综合项目：图论应用\n【第12课】测评课：U10全部知识点综合考核' },
    { name: 'U11', period_number: 11, description: '动态规划', is_active: true, current_stage_content: '【第1-3课】动态规划入门：DP概念\n【第4-6课】经典动态规划：背包问题\n【第7-9课】高级动态规划：区间DP\n【第10-11课】综合项目：DP应用\n【第12课】测评课：U11全部知识点综合考核' },
    { name: 'U12', period_number: 12, description: '项目实战', is_active: true, current_stage_content: '【第1-4课】项目实战1：需求分析与设计\n【第5-8课】项目实战2：编码实现\n【第9-11课】项目实战3：优化与展示\n【第12课】测评课：U12全部知识点综合考核' }
  ],
  Scratch: [
    { name: 'U1', period_number: 1, description: 'Scratch基础入门', is_active: true, current_stage_content: '【第1课】Scratch初体验：界面介绍、角色与舞台\n【第2课】让角色动起来：运动积木、简单动画\n【第3课】事件与控制：事件积木、绿旗启动\n【第4课】外观变化：外观积木、造型切换\n【第5课】声音的世界：声音积木、播放声音\n【第6课】画笔功能：画笔积木、绘制图形\n【第7课】侦测模块：侦测积木、鼠标位置\n【第8课】运算入门：算术运算、比较运算\n【第9课】变量初识：变量的概念、创建和使用\n【第10课】广播消息：广播积木、消息传递\n【第11课】综合项目：综合运用所学知识\n【第12课】测评课：U1全部知识点综合考核' },
    { name: 'U2', period_number: 2, description: '角色控制', is_active: true, current_stage_content: '【第1-3课】角色控制：键盘控制角色、鼠标跟随\n【第4-6课】动画效果：造型切换动画、移动动画\n【第7-9课】外观与声音：外观效果、声音播放\n【第10-11课】综合项目：动画故事制作\n【第12课】测评课：U2全部知识点综合考核' },
    { name: 'U3', period_number: 3, description: '外观声音', is_active: true, current_stage_content: '【第1-4课】条件判断：if条件、比较运算\n【第5-8课】循环结构：重复执行、有限循环\n【第9-11课】综合项目：交互式故事设计\n【第12课】测评课：U3全部知识点综合考核' },
    { name: 'U4', period_number: 4, description: '事件控制', is_active: true, current_stage_content: '【第1-4课】消息广播：广播消息、接收消息\n【第5-8课】等待机制：等待积木、等待条件\n【第9-11课】综合项目：多人互动游戏\n【第12课】测评课：U4全部知识点综合考核' },
    { name: 'U5', period_number: 5, description: '克隆与自定义', is_active: true, current_stage_content: '【第1-3课】克隆技术：克隆积木、克隆体控制\n【第4-6课】自定义积木：自定义积木创建、参数传递\n【第7-9课】列表进阶：列表操作、列表遍历\n【第10-11课】综合项目：复杂游戏设计\n【第12课】测评课：U5全部知识点综合考核' },
    { name: 'U6', period_number: 6, description: '字符串与数学', is_active: true, current_stage_content: '【第1-3课】字符串处理：字符串连接、查找\n【第4-6课】数学运算：数学函数、随机数\n【第7-9课】物理模拟：运动模拟、碰撞检测\n【第10-11课】综合项目：物理游戏\n【第12课】测评课：U6全部知识点综合考核' },
    { name: 'U7', period_number: 7, description: '协作与AI', is_active: true, current_stage_content: '【第1-3课】多角色协作：角色通信、消息广播进阶\n【第4-6课】游戏AI：简单AI逻辑、状态机\n【第7-9课】数据持久化：云变量、数据存储\n【第10-11课】综合项目：多人在线游戏\n【第12课】测评课：U7全部知识点综合考核' },
    { name: 'U8', period_number: 8, description: '动画与音效', is_active: true, current_stage_content: '【第1-3课】复杂动画：帧动画、骨骼动画\n【第4-6课】音效处理：音效控制、音乐创作\n【第7-9课】图形特效：特效积木、视觉效果\n【第10-11课】综合项目：动画电影\n【第12课】测评课：U8全部知识点综合考核' },
    { name: 'U9', period_number: 9, description: '算法入门', is_active: true, current_stage_content: '【第1-3课】算法入门：排序概念、简单排序\n【第4-6课】搜索算法：线性搜索、二分搜索\n【第7-9课】递归思想：递归概念、递归应用\n【第10-11课】综合项目：算法可视化\n【第12课】测评课：U9全部知识点综合考核' },
    { name: 'U10', period_number: 10, description: '数据结构', is_active: true, current_stage_content: '【第1-3课】数据结构：数组、链表概念\n【第4-6课】图论基础：图的表示、图的遍历\n【第7-9课】复杂度分析：时间复杂度、空间复杂度\n【第10-11课】综合项目：数据结构应用\n【第12课】测评课：U10全部知识点综合考核' },
    { name: 'U11', period_number: 11, description: '项目开发', is_active: true, current_stage_content: '【第1-3课】项目规划：需求分析、架构设计\n【第4-6课】模块开发：功能模块、接口设计\n【第7-9课】测试优化：功能测试、性能优化\n【第10-11课】综合项目：大型项目开发\n【第12课】测评课：U11全部知识点综合考核' },
    { name: 'U12', period_number: 12, description: '毕业设计', is_active: true, current_stage_content: '【第1-4课】毕业设计1：选题与规划\n【第5-8课】毕业设计2：开发与实现\n【第9-11课】毕业设计3：答辩与展示\n【第12课】测评课：U12全部知识点综合考核' }
  ],
  'C++': [
    { name: 'U1', period_number: 1, description: 'C++基础入门', is_active: true, current_stage_content: '【第1课】C++初识：C++简介、开发环境搭建\n【第2课】第一个程序：程序结构、main函数\n【第3课】注释与规范：单行注释、多行注释\n【第4课】变量入门：变量的概念、变量定义\n【第5课】数据类型：整型、浮点型、字符型\n【第6课】常量：常量定义、const关键字\n【第7课】输入输出：cin输入、cout输出\n【第8课】格式控制：setw、setprecision\n【第9课】运算符：算术运算符、赋值运算符\n【第10课】表达式：表达式求值、运算优先级\n【第11课】综合练习：简单计算器程序\n【第12课】测评课：U1全部知识点综合考核' },
    { name: 'U2', period_number: 2, description: '数据类型', is_active: true, current_stage_content: '【第1-3课】数据类型深入：整型int、浮点型float/double\n【第4-6课】布尔类型：布尔型bool、真假值\n【第7-9课】类型转换：自动转换、强制转换\n【第10-11课】综合项目：类型应用综合练习\n【第12课】测评课：U2全部知识点综合考核' },
    { name: 'U3', period_number: 3, description: '输入输出', is_active: true, current_stage_content: '【第1-4课】标准输入输出：cin、cout详细用法\n【第5-8课】流操作符：>>、<<操作符、格式化输出\n【第9-11课】文件流基础：文件读写入门\n【第12课】测评课：U3全部知识点综合考核' },
    { name: 'U4', period_number: 4, description: '运算符', is_active: true, current_stage_content: '【第1-3课】算术运算：加减乘除、取余运算\n【第4-6课】关系运算：比较运算符、真值判断\n【第7-9课】逻辑运算：与或非运算、逻辑表达式\n【第10-11课】综合项目：运算符综合应用\n【第12课】测评课：U4全部知识点综合考核' },
    { name: 'U5', period_number: 5, description: '控制结构', is_active: true, current_stage_content: '【第1-3课】分支结构：if语句、if-else、switch\n【第4-6课】循环结构：for循环、while循环\n【第7-9课】循环控制：break、continue\n【第10-11课】综合项目：循环与分支综合应用\n【第12课】测评课：U5全部知识点综合考核' },
    { name: 'U6', period_number: 6, description: '数组', is_active: true, current_stage_content: '【第1-3课】数组入门：一维数组、数组初始化\n【第4-6课】数组操作：排序、查找\n【第7-9课】二维数组：矩阵操作\n【第10-11课】综合项目：数组综合应用\n【第12课】测评课：U6全部知识点综合考核' },
    { name: 'U7', period_number: 7, description: '函数', is_active: true, current_stage_content: '【第1-3课】函数基础：函数定义、函数调用\n【第4-6课】函数进阶：递归函数、函数重载\n【第7-9课】作用域：局部变量、全局变量\n【第10-11课】综合项目：函数封装与复用\n【第12课】测评课：U7全部知识点综合考核' },
    { name: 'U8', period_number: 8, description: '指针', is_active: true, current_stage_content: '【第1-3课】指针入门：指针概念、指针运算\n【第4-6课】指针进阶：指针与函数、指针与字符串\n【第7-9课】动态内存：new、delete\n【第10-11课】综合项目：指针应用\n【第12课】测评课：U8全部知识点综合考核' },
    { name: 'U9', period_number: 9, description: '结构体与类', is_active: true, current_stage_content: '【第1-3课】结构体：结构体定义、结构体操作\n【第4-6课】面向对象入门：类与对象\n【第7-9课】封装与继承：访问控制、继承概念\n【第10-11课】综合项目：简单类设计\n【第12课】测评课：U9全部知识点综合考核' },
    { name: 'U10', period_number: 10, description: 'STL入门', is_active: true, current_stage_content: '【第1-3课】STL容器：vector、string、stack\n【第4-6课】STL算法：sort、find、lower_bound\n【第7-9课】迭代器：迭代器概念与使用\n【第10-11课】综合项目：STL应用\n【第12课】测评课：U10全部知识点综合考核' },
    { name: 'U11', period_number: 11, description: '算法基础', is_active: true, current_stage_content: '【第1-3课】基础算法：枚举、模拟、贪心\n【第4-6课】搜索算法：DFS、BFS\n【第7-9课】动态规划：DP概念、简单DP问题\n【第10-11课】综合项目：算法应用\n【第12课】测评课：U11全部知识点综合考核' },
    { name: 'U12', period_number: 12, description: '竞赛入门', is_active: true, current_stage_content: '【第1-4课】竞赛专题1：NOIP基础题型训练\n【第5-8课】竞赛专题2：经典题目讲解\n【第9-11课】模拟考试：真题演练\n【第12课】测评课：U12全部知识点综合考核' }
  ]
};

// 自动初始化数据库 - 检查并补充缺失的课程单元
async function ensureInitialized(): Promise<void> {
  try {
    const supabase = getServerSupabase();
    
    // 检查是否已有编程语言
    const { data: existingLangs, error: checkError } = await supabase
      .from('programming_languages')
      .select('id, name');
    
    if (checkError) {
      console.error('[Config] 检查编程语言失败:', checkError.message);
      return;
    }
    
    // 如果编程语言不存在，先插入
    const languageMap: Record<string, string> = {};
    
    if (!existingLangs || existingLangs.length === 0) {
      const { data: languages, error: langError } = await supabase
        .from('programming_languages')
        .insert(DEFAULT_LANGUAGES)
        .select();
      
      if (langError) {
        console.error('[Config] 插入编程语言失败:', langError.message);
        return;
      }
      
      for (const lang of languages) {
        languageMap[lang.name] = lang.id;
      }
      console.log('[Config] 已插入', languages.length, '个编程语言');
    } else {
      for (const lang of existingLangs) {
        languageMap[lang.name] = lang.id;
      }
    }
    
    // 检查每种语言的课程单元数量
    const { data: existingUnits, error: unitCheckError } = await supabase
      .from('course_units')
      .select('language_id, name');
    
    if (unitCheckError) {
      console.error('[Config] 检查课程单元失败:', unitCheckError.message);
      return;
    }
    
    // 统计每种语言已有的课程单元名称
    const existingUnitsByLang: Record<string, Set<string>> = {};
    for (const unit of (existingUnits || [])) {
      if (!existingUnitsByLang[unit.language_id]) {
        existingUnitsByLang[unit.language_id] = new Set();
      }
      existingUnitsByLang[unit.language_id].add(unit.name);
    }
    
    // 检查是否需要补充课程单元（每种语言应该有 12 个单元）
    const unitsToInsert: Array<{
      language_id: string;
      name: string;
      period_number: number;
      current_stage_content: string;
      description: string;
      is_active: boolean;
    }> = [];
    
    for (const [langName, units] of Object.entries(COURSE_UNITS)) {
      const langId = languageMap[langName];
      if (!langId) continue;
      
      const existingUnitNames = existingUnitsByLang[langId] || new Set();
      const expectedCount = units.length; // 应该是 12
      
      // 找出缺失的课程单元
      for (const unit of units) {
        if (!existingUnitNames.has(unit.name)) {
          unitsToInsert.push({ language_id: langId, ...unit });
        }
      }
      
      if (existingUnitNames.size < expectedCount) {
        console.log(`[Config] ${langName} 课程单元不完整: 现有 ${existingUnitNames.size} 个, 需要补充 ${expectedCount - existingUnitNames.size} 个`);
      }
    }
    
    // 如果有缺失的课程单元，插入它们
    if (unitsToInsert.length > 0) {
      console.log('[Config] 发现缺失课程单元，正在补充', unitsToInsert.length, '个...');
      
      const { error: unitError } = await supabase
        .from('course_units')
        .insert(unitsToInsert);
      
      if (unitError) {
        console.error('[Config] 插入课程单元失败:', unitError.message);
        return;
      }
      
      console.log('[Config] 已补充', unitsToInsert.length, '个课程单元');
    } else {
      console.log('[Config] 课程单元数据完整，无需补充');
    }
  } catch (err) {
    console.error('[Config] 自动初始化异常:', err);
  }
}

export async function GET() {
  // 优先使用 NEXT_PUBLIC_ 变量，其次使用 COZE_ 变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;

  // 调试日志
  console.log('[Config] 环境变量检查:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlSource: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC' : (process.env.COZE_SUPABASE_URL ? 'COZE' : 'none'),
    keySource: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC' : (process.env.COZE_SUPABASE_ANON_KEY ? 'COZE' : 'none'),
    allSupabaseKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('COZE'))
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Config] Supabase 配置缺失');
    return NextResponse.json(
      { 
        error: 'Supabase not configured',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('COZE'))
        }
      },
      { status: 500 }
    );
  }

  // 自动初始化数据库（不阻塞响应）
  ensureInitialized().catch(err => console.error('[Config] 初始化失败:', err));

  return NextResponse.json({
    supabaseUrl,
    supabaseKey,
  });
}
