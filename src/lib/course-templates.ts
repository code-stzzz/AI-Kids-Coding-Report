'use client';

import { CourseUnit } from './local-storage';

// Python U1-U12 课程单元模板（基于小码王V4.2课程体系）
const PYTHON_UNITS: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at' | 'next_stage_content'>[] = [
  {
    language_id: 'lang-python',
    name: 'U1',
    period_number: 1,
    current_stage_content: `【第1课】嘿！小艾同学1（感知课）
知识点：函数概念、print()、input()内置函数、变量创建与使用、变量命名规则、赋值符=的用法、IDLE开发环境

【第2课】嘿！小艾同学2（理解课）
知识点：Python模块、os操作系统模块、os.system()函数、while True循环、break语句、比较运算符==、if单分支语句、缩进语法

【第3课】口算大师1（理解课）
知识点：比较运算符==、if单分支语句、if...else双分支语句、type()函数、int整数类型、str字符串类型

【第4课】口算大师2（理解课）
知识点：float浮点数类型、random随机模块、randint()函数、str()、int()、float()类型转换函数、算术运算符+

【第5课】口算大师3（理解课）
知识点：float浮点数类型、random模块、randint()函数、类型转换函数综合应用、算术运算符综合练习

【第6课】谁先到20-1（实践课）
知识点：比较运算符!=、>、<、>=、<=、复合运算符+=、-=、*=、/=、循环累加计算、递减计算

【第7课】谁先到20-2（实践课）
知识点：关系运算符多级比较、逻辑运算符and、循环控制语句continue和break、巴什博弈概念

【第8课】画家小海龟1（理解课）
知识点：turtle绘图模块、forward()、backward()、left()、right()移动绘制函数、done()屏幕控制、注释符号#、正多边形边数与角度关系

【第9课】画家小海龟2（理解课）
知识点：turtle模块circle()、dot()函数、pendown()、penup()、pensize()绘图状态函数、pencolor()、fillcolor()、begin_fill()、end_fill()颜色控制、hideturtle()

【第10课】行星轨迹-1（理解课）
知识点：turtle的Screen()、bgpic()、setup()方法、Turtle()方法、register_shape()、addshape()注册形状

【第11课】行星轨迹-2（理解课）
知识点：turtle的goto()、speed()方法、tracer()、update()屏幕更新、time模块sleep()函数

【第12课】测评课
复习测评：U1全部知识点综合考核`,
    description: 'Python基础入门',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U2',
    period_number: 2,
    current_stage_content: `【第1课】读心术1（理解课）
知识点：print()默认参数end、转义字符\\n换行符、\\t制表符、算术运算符%取余、*乘法、**幂运算、运算符优先级、倍数概念

【第2课】读心术2（理解课）
知识点：list列表数据类型、列表创建、获取列表元素、索引访问、算术运算符*的两种用法

【第3课】老虎机1（实践课）
知识点：while条件循环语句、turtle模块write()、numinput()、clear()函数、random模块choice()随机选择

【第4课】老虎机2（实践课）
知识点：while条件循环综合应用、turtle模块综合应用、random.choice()函数

【第5课】千词斩1（实践课）
知识点：列表创建与获取元素、大驼峰命名法、小驼峰命名法、pop()、del、remove()删除列表元素、len()函数

【第6课】千词斩2（实践课）
知识点：列表操作综合应用、删除元素方法对比、变量命名规范

【第7课】小心心1（实践课）
知识点：自定义Draw模块heart()函数、turtle综合应用、append()添加列表元素

【第8课】小心心2（实践课）
知识点：自定义模块应用、turtle绘图综合、列表添加元素

【第9课】IronMan1（实践课）
知识点：turtle综合应用、random模块randint()、choice()函数、视觉暂留原理

【第10课】IronMan2（实践课）
知识点：turtle动画效果、random随机数综合应用、视觉暂留应用

【第11课】定时播报（理解课）
知识点：列表进阶使用、datetime模块基础方法、字符串基础函数、xmread模块基础方法

【第12课】测评课
复习测评：U2全部知识点综合考核`,
    description: '列表与循环',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U3',
    period_number: 3,
    current_stage_content: `【第1课】字符串急诊室1（理解课）
知识点：字符串函数format()、split()、多行字符串定义、pass关键字、join()连接、replace()替换、eval()函数

【第2课】字符串急诊室2（理解课）
知识点：字符串格式化与分割综合应用、多行字符串、pass语句、字符串连接与替换

【第3课】歌王争霸赛1（实践课）
知识点：for计步循环、字符串replace()函数、random模块sample()随机采样

【第4课】歌王争霸赛2（实践课）
知识点：for循环综合应用、字符串替换、随机采样

【第5课】密码猜猜猜1（实践课）
知识点：range()、list()内置函数、列表综合应用、循环结构综合应用、成员运算符in

【第6课】密码猜猜猜2（实践课）
知识点：range函数生成序列、列表操作、循环嵌套、成员判断

【第7课】智能棋手1（理解课）
知识点：列表综合应用、分支和变量进阶、列表更新元素、插入元素、注释快捷键、逻辑运算符or、and、not

【第8课】智能棋手2（理解课）
知识点：列表更新与插入、逻辑运算符综合应用、变量赋值进阶

【第9课】智能棋手3（理解课）
知识点：列表操作综合、分支结构进阶、逻辑运算符应用

【第10课】益智24点1（理解课）
知识点：二维列表定义、列表综合应用、eval()函数、for循环嵌套

【第11课】益智24点2（理解课）
知识点：二维列表应用、数学计算、循环嵌套综合

【第12课】测评课
复习测评：U3全部知识点综合考核`,
    description: '字符串与循环',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U4',
    period_number: 4,
    current_stage_content: `【第1课】汉字小状元1（理解课）
知识点：二维列表操作、字符串format()函数、字符串格式化%占位符

【第2课】汉字小状元2（理解课）
知识点：二维列表综合应用、字符串格式化方法对比

【第3课】歇后语1（理解课）
知识点：字典数据类型、字典概念与特性、字典创建、取值、修改、删除基本操作

【第4课】歇后语2（理解课）
知识点：字典操作综合应用、歇后语管理系统实现

【第5课】今日运势（实践课）
知识点：元组数据类型、元组概念、元组不可修改特性、元组与列表的异同、字典元组取值应用

【第6课】飞花令1（理解课）
知识点：文件基本操作、open()、read()、close()、文件读取多种方法、字符串高阶函数

【第7课】飞花令2（理解课）
知识点：文件读取综合应用、字符串处理、古诗词应用

【第8课】公鸡变蛋（理解课）
知识点：字符串与列表互相转换、字符串切片、join()连接、replace()替换、列表增删改查、字典创建添加

【第9课】Python与数学（理解课）
知识点：约数概念、辗转相除法、while条件循环、质数概念

【第10课】李白沽酒（理解课）
知识点：循环与判断解决实际问题、数学思维编程

【第11课】绚丽的烟花（实践课）
知识点：turtle模块综合应用、random模块choice()函数

【第12课】测评课
复习测评：U4全部知识点综合考核`,
    description: '字典与文件',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U5',
    period_number: 5,
    current_stage_content: `【第1课】夜空中最亮的星1（理解课）
知识点：事件概念、turtle监听事件、鼠标点击事件、自定义函数结构、函数参数传递

【第2课】夜空中最亮的星2（理解课）
知识点：函数间相互调用、turtle模块进阶操作、鼠标点击绘制星星

【第3课】幸运大抽奖1（实践课）
知识点：自定义函数基本结构、turtle监听事件、鼠标点击事件

【第4课】幸运大抽奖2（实践课）
知识点：turtle与函数结合、模拟抽奖案例

【第5课】我是大力士1（理解课）
知识点：turtle监听事件、鼠标点击、局部变量和全局变量作用域、自定义函数

【第6课】我是大力士2（理解课）
知识点：变量作用域综合应用、双人拔河案例

【第7课】海龟射击1（理解课）
知识点：turtle高级函数shapesize()、heading()、事件应用、变量作用域、global关键字、范围判断

【第8课】海龟射击2（理解课）
知识点：turtle事件综合、范围判断方法

【第9课】找不同1（实践课）
知识点：turtle高级操作、元组创建取值、二维列表应用、for循环嵌套、函数定义调用、全局局部变量

【第10课】找不同2（实践课）
知识点：二维列表与循环嵌套综合、变量作用域应用

【第11课】智能读书机器人（基础课）
知识点：pdfplumber和pyttsx3模块、try...except...else...finally异常处理、文字转语音

【第12课】测评课
复习测评：U5全部知识点综合考核`,
    description: '函数与事件',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U6',
    period_number: 6,
    current_stage_content: `【第1课】令人惊奇的二维码（理解课）
知识点：第三方模块概念、pip下载安装、模块多种导入方法、Python程序打包为可执行文件

【第2课】百变词云（理解课）
知识点：jieba模块、wordcloud模块、imageio模块、cmd+pip安装、词云生成、文档阅读方法、open()、read()、close()、jieba.cut()、字典统计词频

【第3课】名侦探小码君1（理解课）
知识点：Python类的使用、类的方法编写规则

【第4课】名侦探小码君2（理解课）
知识点：类的创建与实例化、方法定义

【第5课】给你介绍一个对象（实践课）
知识点：class类创建、__init__初始化方法、self参数、方法的调用、元组应用

【第6课】卡牌对决1（实践课）
知识点：类的属性与类的方法创建、max()、exit()内置函数

【第7课】卡牌对决2（实践课）
知识点：面向对象编程应用、类方法综合

【第8课】turtle贪吃蛇1（实践课）
知识点：贪吃蛇控制逻辑、移动逻辑、turtle按键控制

【第9课】turtle贪吃蛇2（实践课）
知识点：贪吃蛇吃鸡蛋逻辑、turtle函数setup()、addshape()、shape()、tracer()

【第10课】turtle贪吃蛇3（实践课）
知识点：turtle综合运用、游戏逻辑完善

【第11课】拼图大师（基础课）
知识点：Image模块new()、open()、paste()、save()、matplotlib.pyplot绘图imshow()、show()、二维数组、numpy模块、pillow模块、os.listdir()

【第12课】测评课
复习测评：U6全部知识点综合考核`,
    description: '模块与面向对象',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U7',
    period_number: 7,
    current_stage_content: `【第1-4课】面向对象进阶
知识点：类的继承机制、方法重写、多态应用、类的组合

【第5-8课】GUI编程入门
知识点：Tkinter窗口创建、常用组件Button/Label/Entry、布局管理pack/grid/place、事件绑定与处理

【第9-11课】综合项目
知识点：面向对象综合应用、GUI项目开发

【第12课】测评课
复习测评：U7全部知识点综合考核`,
    description: '面向对象进阶',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U8',
    period_number: 8,
    current_stage_content: `【第1课】迷宫-1（基础课）
知识点：一维数组、二维数组的创建、数组应用

【第2课】迷宫-2（基础课）
知识点：最短路径算法原理、数组综合应用

【第3课】迷宫-3（基础课）
知识点：csv模块应用、CSV文件读写

【第4课】解析算法（基础课）
知识点：解析算法原理、算法解决实际问题

【第5课】枚举算法（基础课）
知识点：枚举算法原理、算法解决实际问题

【第6课】蒙特卡洛算法（基础课）
知识点：蒙特卡洛算法、turtle模块dot()、distance()、tracer()、write()、update()、random.randint()、圆面积计算

【第7课】请你来排序1（基础课）
知识点：冒泡排序算法原理与实现

【第8课】请你来排序2（基础课）
知识点：选择排序算法原理与实现

【第9课】神秘的二分法（基础课）
知识点：二分查找算法思想、binary_search模块、二分查找要素

【第10课】递归算法（基础课）
知识点：递归思想、递归函数的创建

【第11课】递推算法（基础课）
知识点：递推思想、递推函数的创建

【第12课】测评课
复习测评：U8全部知识点综合考核`,
    description: '算法与数据结构',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U9',
    period_number: 9,
    current_stage_content: `【第1-4课】数据结构深入
知识点：栈与队列概念、链表结构与操作、树与二叉树基础

【第5-8课】图与哈希
知识点：图的基础概念、哈希表原理、集合操作与应用

【第9-11课】综合应用
知识点：数据结构综合应用项目

【第12课】测评课
复习测评：U9全部知识点综合考核`,
    description: '数据结构深入',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U10',
    period_number: 10,
    current_stage_content: `【第1-4课】高级算法
知识点：动态规划入门、贪心算法原理与应用

【第5-8课】搜索算法
知识点：深度优先搜索DFS、广度优先搜索BFS、图论算法基础

【第9-11课】算法竞赛
知识点：算法竞赛入门、经典题目训练

【第12课】测评课
复习测评：U10全部知识点综合考核`,
    description: '高级算法',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U11',
    period_number: 11,
    current_stage_content: `【第1-4课】Web开发入门
知识点：Flask/Django基础、路由与视图、模板渲染

【第5-8课】数据库与API
知识点：数据库操作、API接口设计、前后端交互

【第9-11课】项目部署
知识点：项目部署上线、服务器配置

【第12课】测评课
复习测评：U11全部知识点综合考核`,
    description: '项目实战',
    is_active: true
  },
  {
    language_id: 'lang-python',
    name: 'U12',
    period_number: 12,
    current_stage_content: `【第1-3课】项目规划
知识点：项目需求分析、系统设计、功能模块划分

【第4-6课】功能开发
知识点：核心功能模块开发、代码实现

【第7-9课】测试优化
知识点：功能测试、性能优化、Bug修复

【第10-11课】展示答辩
知识点：项目文档编写、作品展示、答辩技巧

【第12课】测评课
复习测评：U12全部知识点综合考核`,
    description: '综合项目',
    is_active: true
  }
];

// Scratch U1-U12 课程单元模板
const SCRATCH_UNITS: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at' | 'next_stage_content'>[] = [
  {
    language_id: 'lang-scratch',
    name: 'U1',
    period_number: 1,
    current_stage_content: `【第1课】Scratch初体验
知识点：Scratch界面介绍、角色与舞台概念

【第2课】让角色动起来
知识点：运动积木、简单动画制作

【第3课】事件与控制
知识点：事件积木、绿旗启动、停止脚本

【第4课】外观变化
知识点：外观积木、造型切换、说话气泡

【第5课】声音的世界
知识点：声音积木、播放声音、录制声音

【第6课】画笔功能
知识点：画笔积木、绘制图形

【第7课】侦测模块
知识点：侦测积木、鼠标位置、键盘输入

【第8课】运算入门
知识点：算术运算、比较运算

【第9课】变量初识
知识点：变量的概念、创建和使用变量

【第10课】广播消息
知识点：广播积木、消息传递

【第11课】综合项目
知识点：综合运用所学知识

【第12课】测评课
复习测评：U1全部知识点综合考核`,
    description: 'Scratch基础入门',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U2',
    period_number: 2,
    current_stage_content: `【第1-3课】角色控制
知识点：键盘控制角色、鼠标跟随、运动指令

【第4-6课】动画效果
知识点：造型切换动画、移动动画、旋转动画

【第7-9课】外观与声音
知识点：外观效果、声音播放、背景音乐

【第10-11课】综合项目
知识点：动画故事制作

【第12课】测评课
复习测评：U2全部知识点综合考核`,
    description: '角色控制',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U3',
    period_number: 3,
    current_stage_content: `【第1-4课】条件判断
知识点：if条件、比较运算、逻辑判断

【第5-8课】循环结构
知识点：重复执行、有限循环、条件循环

【第9-11课】综合项目
知识点：交互式故事设计

【第12课】测评课
复习测评：U3全部知识点综合考核`,
    description: '外观声音',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U4',
    period_number: 4,
    current_stage_content: `【第1-4课】消息广播
知识点：广播消息、接收消息、多角色通信

【第5-8课】等待机制
知识点：等待积木、等待条件、同步控制

【第9-11课】综合项目
知识点：多人互动游戏

【第12课】测评课
复习测评：U4全部知识点综合考核`,
    description: '事件控制',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U5',
    period_number: 5,
    current_stage_content: `【第1-4课】变量应用
知识点：变量概念、变量操作、数据存储

【第5-8课】计分系统
知识点：计分板设计、分数增减、最高分记录

【第9-11课】综合项目
知识点：计分游戏开发

【第12课】测评课
复习测评：U5全部知识点综合考核`,
    description: '变量应用',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U6',
    period_number: 6,
    current_stage_content: `【第1-4课】运算逻辑
知识点：算术运算、比较判断、逻辑运算

【第5-8课】随机数
知识点：随机数应用、随机选择、概率概念

【第9-11课】综合项目
知识点：随机事件游戏

【第12课】测评课
复习测评：U6全部知识点综合考核`,
    description: '运算逻辑',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U7',
    period_number: 7,
    current_stage_content: `【第1-4课】自制积木
知识点：创建积木、参数传递、积木调用

【第5-8课】模块化编程
知识点：模块化思维、代码复用

【第9-11课】综合项目
知识点：模块化项目开发

【第12课】测评课
复习测评：U7全部知识点综合考核`,
    description: '自定义积木',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U8',
    period_number: 8,
    current_stage_content: `【第1-4课】克隆技术
知识点：克隆创建、克隆控制、克隆删除

【第5-8课】多角色互动
知识点：角色碰撞、角色通信

【第9-11课】综合项目
知识点：克隆游戏开发

【第12课】测评课
复习测评：U8全部知识点综合考核`,
    description: '克隆技术',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U9',
    period_number: 9,
    current_stage_content: `【第1-4课】列表概念
知识点：列表创建、数据存储、列表操作

【第5-8课】列表遍历
知识点：遍历列表、数据查找、排序算法

【第9-11课】综合项目
知识点：数据管理项目

【第12课】测评课
复习测评：U9全部知识点综合考核`,
    description: '列表数据',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U10',
    period_number: 10,
    current_stage_content: `【第1-4课】游戏设计
知识点：游戏规则设计、角色设计

【第5-8课】关卡制作
知识点：关卡设计、计分系统

【第9-11课】综合项目
知识点：完整游戏开发

【第12课】测评课
复习测评：U10全部知识点综合考核`,
    description: '游戏开发',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U11',
    period_number: 11,
    current_stage_content: `【第1-4课】动画设计
知识点：动画原理、分镜设计

【第5-8课】故事编排
知识点：角色配音、场景切换

【第9-11课】综合项目
知识点：动画作品创作

【第12课】测评课
复习测评：U11全部知识点综合考核`,
    description: '动画创作',
    is_active: true
  },
  {
    language_id: 'lang-scratch',
    name: 'U12',
    period_number: 12,
    current_stage_content: `【第1-3课】项目构思
知识点：项目规划、分工协作

【第4-6课】功能实现
知识点：核心功能开发

【第7-9课】测试优化
知识点：测试调试、作品优化

【第10-11课】作品展示
知识点：作品发布、展示演讲

【第12课】测评课
复习测评：U12全部知识点综合考核`,
    description: '综合项目',
    is_active: true
  }
];

// C++ U1-U12 课程单元模板
const CPP_UNITS: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at' | 'next_stage_content'>[] = [
  {
    language_id: 'lang-cpp',
    name: 'U1',
    period_number: 1,
    current_stage_content: `【第1课】C++初识
知识点：C++简介、开发环境搭建

【第2课】第一个程序
知识点：程序结构、main函数、编译运行

【第3课】注释与规范
知识点：单行注释、多行注释、代码规范

【第4课】变量入门
知识点：变量的概念、变量定义

【第5课】数据类型
知识点：整型、浮点型、字符型

【第6课】常量
知识点：常量定义、const关键字

【第7课】输入输出
知识点：cin输入、cout输出

【第8课】格式控制
知识点：setw、setprecision

【第9课】运算符
知识点：算术运算符、赋值运算符

【第10课】表达式
知识点：表达式求值、运算优先级

【第11课】综合练习
知识点：简单计算器程序

【第12课】测评课
复习测评：U1全部知识点综合考核`,
    description: 'C++基础入门',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U2',
    period_number: 2,
    current_stage_content: `【第1-3课】数据类型深入
知识点：整型int、浮点型float/double、字符型char

【第4-6课】布尔类型
知识点：布尔型bool、真假值

【第7-9课】类型转换
知识点：自动转换、强制转换

【第10-11课】综合项目
知识点：类型应用综合练习

【第12课】测评课
复习测评：U2全部知识点综合考核`,
    description: '数据类型',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U3',
    period_number: 3,
    current_stage_content: `【第1-4课】标准输入输出
知识点：cin、cout详细用法

【第5-8课】流操作符
知识点：>>、<<操作符、格式化输出

【第9-11课】文件流基础
知识点：文件读写入门

【第12课】测评课
复习测评：U3全部知识点综合考核`,
    description: '输入输出',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U4',
    period_number: 4,
    current_stage_content: `【第1-3课】算术运算
知识点：加减乘除、取余运算

【第4-6课】关系运算
知识点：比较运算符、真值判断

【第7-9课】逻辑运算
知识点：与或非运算、逻辑表达式

【第10-11课】综合项目
知识点：运算符综合应用

【第12课】测评课
复习测评：U4全部知识点综合考核`,
    description: '运算符',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U5',
    period_number: 5,
    current_stage_content: `【第1-3课】if语句
知识点：单分支if、双分支if-else

【第4-6课】多分支语句
知识点：if-else if-else、switch-case

【第7-9课】条件嵌套
知识点：条件语句嵌套、逻辑判断

【第10-11课】综合项目
知识点：分支结构应用

【第12课】测评课
复习测评：U5全部知识点综合考核`,
    description: '条件判断',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U6',
    period_number: 6,
    current_stage_content: `【第1-3课】for循环
知识点：for循环结构、循环变量

【第4-6课】while循环
知识点：while循环、do-while循环

【第7-9课】循环控制
知识点：break、continue语句

【第10-11课】综合项目
知识点：循环嵌套应用

【第12课】测评课
复习测评：U6全部知识点综合考核`,
    description: '循环结构',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U7',
    period_number: 7,
    current_stage_content: `【第1-3课】一维数组
知识点：数组定义、数组访问

【第4-6课】数组操作
知识点：数组遍历、元素操作

【第7-9课】排序算法
知识点：冒泡排序、选择排序

【第10-11课】综合项目
知识点：数组综合应用

【第12课】测评课
复习测评：U7全部知识点综合考核`,
    description: '数组应用',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U8',
    period_number: 8,
    current_stage_content: `【第1-3课】二维数组
知识点：二维数组定义与访问

【第4-6课】字符数组
知识点：字符数组、字符串操作

【第7-9课】字符串函数
知识点：strlen、strcpy、strcmp

【第10-11课】综合项目
知识点：数组与字符串综合

【第12课】测评课
复习测评：U8全部知识点综合考核`,
    description: '数组进阶',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U9',
    period_number: 9,
    current_stage_content: `【第1-3课】函数定义
知识点：函数声明、函数定义

【第4-6课】参数传递
知识点：值传递、引用传递

【第7-9课】返回值
知识点：return语句、返回值类型

【第10-11课】综合项目
知识点：函数综合应用

【第12课】测评课
复习测评：U9全部知识点综合考核`,
    description: '函数入门',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U10',
    period_number: 10,
    current_stage_content: `【第1-3课】递归算法
知识点：递归思想、递归函数

【第4-6课】函数模板
知识点：模板概念、模板函数

【第7-9课】STL基础
知识点：vector、string

【第10-11课】综合项目
知识点：函数进阶应用

【第12课】测评课
复习测评：U10全部知识点综合考核`,
    description: '函数进阶',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U11',
    period_number: 11,
    current_stage_content: `【第1-3课】指针概念
知识点：指针定义、指针操作

【第4-6课】指针与数组
知识点：指针遍历数组、指针运算

【第7-9课】动态内存
知识点：new、delete动态分配

【第10-11课】综合项目
知识点：指针综合应用

【第12课】测评课
复习测评：U11全部知识点综合考核`,
    description: '指针应用',
    is_active: true
  },
  {
    language_id: 'lang-cpp',
    name: 'U12',
    period_number: 12,
    current_stage_content: `【第1-3课】结构体
知识点：struct定义、结构体变量

【第4-6课】枚举类型
知识点：enum枚举、枚举应用

【第7-9课】综合项目
知识点：数据结构综合应用

【第10-11课】算法竞赛入门
知识点：竞赛题型、解题技巧

【第12课】测评课
复习测评：U12全部知识点综合考核`,
    description: '综合应用',
    is_active: true
  }
];

// 获取所有课程单元模板（包含空的 next_stage_content）
export function getDefaultCourseUnits(): Omit<CourseUnit, 'id' | 'created_at' | 'updated_at'>[] {
  return [
    ...PYTHON_UNITS.map(u => ({ ...u, next_stage_content: '' })),
    ...SCRATCH_UNITS.map(u => ({ ...u, next_stage_content: '' })),
    ...CPP_UNITS.map(u => ({ ...u, next_stage_content: '' }))
  ];
}

// 根据语言ID获取课程单元模板
export function getDefaultUnitsByLanguage(languageId: string): Omit<CourseUnit, 'id' | 'created_at' | 'updated_at'>[] {
  let units: Omit<CourseUnit, 'id' | 'created_at' | 'updated_at' | 'next_stage_content'>[] = [];
  
  switch (languageId) {
    case 'lang-python':
      units = PYTHON_UNITS;
      break;
    case 'lang-scratch':
      units = SCRATCH_UNITS;
      break;
    case 'lang-cpp':
      units = CPP_UNITS;
      break;
  }
  
  return units.map(u => ({ ...u, next_stage_content: '' }));
}
