# 少儿编程AI学习报告生成助手 - 项目规范

## 项目概述

本项目是一款专为少儿编程老师设计的Web应用，用于生成学生学习报告。核心功能包括：
- 支持 Python/Scratch/C++ 三种编程语言课程管理
- 班级与学生信息管理
- 六维能力雷达图可视化评分
- AI智能生成学习报告文案
- 一键导出高清学习报告海报（手机适配比例）

## 技术栈

- **框架**: Next.js 16 (App Router)
- **核心**: React 19
- **语言**: TypeScript 5
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **数据存储**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (JWT)
- **海报生成**: modern-screenshot
- **AI生成**: coze-coding-dev-sdk (LLM)

## 目录结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ai/generate/   # AI文案生成API
│   │   │   ├── auth/          # 认证API（注册/登录/登出）
│   │   │   ├── classes/       # 班级CRUD API
│   │   │   ├── courses/       # 课程单元API
│   │   │   ├── init/          # 数据库初始化API
│   │   │   ├── languages/     # 编程语言API
│   │   │   ├── reports/       # 学习报告CRUD API
│   │   │   └── students/      # 学生CRUD API
│   │   ├── auth/              # 登录注册页面
│   │   ├── courses/           # 课程管理页面
│   │   ├── classes/           # 班级管理页面
│   │   ├── reports/           # 报告相关页面
│   │   │   └── [studentId]/   # 报告编辑页面
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/             # React组件
│   │   ├── RadarChart.tsx     # 雷达图组件
│   │   └── PosterGenerator.tsx # 海报生成器
│   ├── lib/                   # 工具库
│   │   ├── data-api.ts        # 统一数据访问层
│   │   ├── supabase-browser.ts # 浏览器端Supabase客户端
│   │   └── course-templates.ts # 课程单元模板（U1-U12）
│   ├── storage/database/       # 数据库相关
│   │   ├── shared/            # 共享数据库定义
│   │   └── supabase-client.ts # Supabase服务端客户端
│   └── middleware.ts          # 认证中间件
├── scripts/                   # 构建脚本
├── public/                    # 静态资源
└── .env.local                 # 环境变量配置
```

## 核心数据模型

### 1. ProgrammingLanguage (编程语言)
固定三种语言：Python、Scratch、C++

### 2. CourseUnit (课程单元)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| language_id | string | 关联编程语言 |
| name | string | 课程单元名称（U1-U12） |
| period_number | number | 期数（1-12） |
| current_stage_content | string | 本阶段学习内容 |
| description | string | 课程描述 |

> 注：下阶段内容动态从下一单元获取，无需单独存储

### 3. Class (班级)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| name | string | 班级名称 |
| language_id | string | 关联编程语言 |

### 4. Student (学生)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| class_id | string | 关联班级 |
| name | string | 学生姓名 |
| student_number | string | 学号 |
| learning_cycle | number | 学习周期 |

### 5. StudyReport (学习报告)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| student_id | string | 关联学生 |
| course_unit_id | string | 关联课程单元 |
| radar_dimensions | object | 雷达图数据 |
| core_strengths | string | 核心进步点 |
| areas_to_improve | string | 待提升点 |
| progress_description | string | AI生成的进步描述 |
| improvement_description | string | AI生成的待提升描述 |
| encouragement_message | string | AI生成的鼓励寄语 |

## 课程模板（小码王V4.2体系）

### Python课程 U1-U12
- **U1**: Python基础入门（变量、函数、分支结构、循环、turtle绘图）
- **U2**: 列表与循环进阶（列表操作、random模块、datetime模块）
- **U3**: 字符串与循环结构（字符串函数、for循环、二维列表）
- **U4**: 字典与文件操作（字典、元组、文件读写）
- **U5**: 函数与事件编程（自定义函数、变量作用域、异常处理）
- **U6**: 模块与面向对象（第三方模块、类与对象、jieba/wordcloud）
- **U7**: 面向对象进阶（继承、多态、GUI编程）
- **U8**: 算法与数据结构（数组、排序、二分查找、递归）
- **U9-U12**: 数据结构深入、高级算法、项目实战

### Scratch课程 U1-U12
图形化编程基础到游戏设计、动画创作

### C++课程 U1-U12
从基础语法到算法竞赛入门

## 雷达图六维度

1. 代码逻辑掌握
2. 语法规范运用
3. 问题排查解决
4. 课堂专注参与
5. 创意拓展实现
6. 知识点复用能力

## API接口

### POST /api/ai/generate
AI生成学习报告文案

**请求体**:
```json
{
  "languageName": "Python",
  "courseUnitName": "U1",
  "currentStageContent": "...",
  "nextStageContent": "...",
  "radarDimensions": [{"name": "代码逻辑掌握", "score": 8}],
  "coreStrengths": "...",
  "areasToImprove": "...",
  "studentName": "张三"
}
```

**响应**:
```json
{
  "progressDescription": "进步表现描述...",
  "improvementDescription": "待提升方向描述...",
  "encouragementMessage": "鼓励寄语..."
}
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（端口5000）
pnpm dev

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint

# 构建
pnpm build

# 生产模式
pnpm start
```

## 数据存储说明

### Supabase 数据库配置

项目使用 Supabase 作为云端数据库，支持多设备同步和用户数据隔离。

#### 环境变量配置
在 `.env.local` 文件中配置：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 获取方式
1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 进入项目 → Settings → API
3. 复制 `URL` 和 `anon public` key

### 数据库表结构

1. **programming_languages** - 编程语言表（公开读取）
2. **course_units** - 课程单元表（公开读取）
3. **classes** - 班级表（用户私有）
4. **students** - 学生表（用户私有）
5. **study_reports** - 学习报告表（用户私有）

### RLS 策略
- 编程语言和课程单元：所有人可读
- 班级、学生、报告：用户只能访问自己创建的数据

### 初始化数据
- 自动创建 Python、Scratch、C++ 三种编程语言
- 自动创建对应的 U1-U4 课程单元（可扩展至 U12）

## AI生成规则

1. **语言要求**: 通俗易懂、口语化，贴合少儿和家长阅读习惯
2. **内容要求**: 严格绑定本阶段学习内容，对应进步点、待提升点和雷达图数值
3. **篇幅要求**: 每段100-200字
4. **导向要求**: 正向积极，待提升点描述委婉有指导性

## 海报生成规格

- 尺寸: 手机适配比例（1080px 宽度，9:16 比例）
- 分辨率: 高清PNG
- 模板: 蓝色系教育风格简约设计
- 内容: 包含雷达图、学生信息、学习内容、AI评价
