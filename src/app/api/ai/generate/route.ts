import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

// 默认的雷达图维度名称
const RADAR_DIMENSIONS = [
  "代码逻辑掌握",
  "语法规范运用",
  "问题排查解决",
  "课堂专注参与",
  "创意拓展实现",
  "知识点复用能力"
];

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GenerateRequest {
  languageName: string;
  courseUnitName: string;
  currentStageContent: string;
  nextStageContent: string;
  radarDimensions: Array<{ name: string; score: number }>;
  coreStrengths: string;
  areasToImprove: string;
  competitionPlans: string;
  studentName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const {
      languageName,
      courseUnitName,
      currentStageContent,
      nextStageContent,
      radarDimensions,
      coreStrengths,
      areasToImprove,
      competitionPlans,
      studentName
    } = body;

    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, customHeaders);

    // 将分数转换为描述性评价
    const getScoreLevel = (score: number): string => {
      if (score >= 9) return '表现卓越';
      if (score >= 7) return '表现优秀';
      if (score >= 5) return '表现良好';
      if (score >= 3) return '有待提高';
      return '需要重点关注';
    };

    // 构建提示词
    const systemPrompt = `你是一位资深的少儿编程教育专家，擅长为每个学生撰写个性化、温暖且具体的学习报告。你的文字风格亲切自然，像一位了解孩子的老师在与家长沟通。`;

    // 生成随机种子，增加多样性
    const randomSeed = Math.floor(Math.random() * 10000);
    const randomQuoteIndex = Math.floor(Math.random() * 10); // 用于选择不同的鼓励风格
    
    // 不同的鼓励寄语风格提示
    const encouragementStyles = [
      '用比喻的方式，将编程学习比作一次探险或建造过程',
      '引用一句适合少儿的古诗词或名言，结合编程学习',
      '用一个生动的小故事或场景来鼓励学生',
      '从学生本阶段的具体进步出发，展望未来的可能性',
      '用温暖的比喻，如种子发芽、小树成长等',
      '结合学生喜欢的编程知识点，表达对其能力的认可',
      '用一个有趣的编程相关比喻来鼓励',
      '从坚持和毅力的角度，肯定学生的努力',
      '用星空、宇宙等宏大意象，激发学生的想象力和志向',
      '从解决问题、克服困难的角度，肯定学生的成长'
    ];
    const selectedStyle = encouragementStyles[randomQuoteIndex];
    
    const userPrompt = `请为学生【${studentName}】撰写一份专属的学习报告文案。

【编程语言】：${languageName}
【课程单元】：${courseUnitName}
【本阶段学习内容】：${currentStageContent}
【下阶段学习内容】：${nextStageContent}

【六维能力表现】：
${radarDimensions.map((d, i) => {
  const level = getScoreLevel(d.score);
  return `${RADAR_DIMENSIONS[i] || d.name}：${level}`;
}).join('\n')}

【核心进步点】：${coreStrengths || '暂无'}
【待提升点】：${areasToImprove || '暂无'}
【后续赛考规划】：${competitionPlans || '暂无'}

【个性化要求】：
- 本次报告唯一编号：${randomSeed}（必须据此生成完全独特的内容）
- 学生姓名：${studentName}（请在文案中自然地多次提及学生姓名）
- 必须根据该学生的具体进步点和待提升点写出个性化内容，不得套用模板

请严格按以下规则生成报告内容：

## 第一段：进步表现描述（100-200字）
要求：
- 开头用亲切的语气引入，例如"${studentName}同学在本阶段..."
- 结合本阶段学习内容，对应核心进步点与表现优秀/卓越的能力维度
- 描述要具体生动，结合课堂上可能涉及的知识点和项目
- 使用"进步明显"、"表现出色"、"掌握扎实"等描述性词语，严禁出现任何分数
- 语言口语化，像和家长面对面交流

## 第二段：待提升方向描述（100-200字）
要求：
- 用委婉正面的方式描述，如"在...方面还有提升空间"
- 结合待提升点与有待提高/需要重点关注的维度
- 给出具体可行的改进建议，让学生知道如何进步
- 鼓励为主，不打击学生积极性
- 严禁出现任何分数，用"继续加强"、"多加练习"等表述

## 第三段：学生专属鼓励寄语（80-150字）
【重要：本次鼓励寄语的风格要求】-${selectedStyle}
要求：
- 必须提及学生姓名${studentName}
- 严格按照上述风格要求来写，确保每次生成都不同
- 真诚不敷衍，严禁使用"加油"、"继续努力"、"保持热情"等空泛词语
- 简短有力，适合打印在报告上
- 每次生成的内容必须与之前完全不同，体现真正的个性化
- 寄语中不要出现任何编号、随机数等技术性内容

## 第四部分：三条个性化学习建议
要求：
- 每条建议15-30字，简洁具体可执行
- 建议一：针对待提升的编程能力维度（如代码逻辑、语法规范等）
- 建议二：针对学习习惯或课堂表现方面的提升
- 建议三：推荐在ACGO平台（青少年编程刷题平台）进行练习，结合${languageName}语言特点和学生当前水平给出具体建议，如"可以去ACGO平台刷XX类型的题目来巩固XX知识点"
- 每条建议都要结合${studentName}的具体情况，体现个性化
- 避免空泛建议，要有具体行动方向

【重要禁止事项】：
- 禁止出现任何数字分数（如8分、6分等）
- 禁止使用"该生"等生硬称呼
- 禁止套用模板化语句
- 禁止与其他学生报告雷同
- 禁止在鼓励寄语中使用空泛的"加油"类词语

请用JSON格式返回，格式如下：
{
  "progressDescription": "第一段文案内容",
  "improvementDescription": "第二段文案内容",
  "encouragementMessage": "第三段文案内容",
  "improvementPlan1": "建议一内容",
  "improvementPlan2": "建议二内容",
  "improvementPlan3": "建议三内容"
}`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: "doubao-seed-2-0-lite-260215",
      temperature: 0.85 // 提高温度增加内容多样性
    });

    const content = response.content;
    
    // 尝试解析JSON
    try {
      // 提取JSON部分（可能在代码块中）
      let jsonStr = content;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      // 如果解析失败，尝试提取各部分内容
      const progressMatch = content.match(/progressDescription["']?\s*[:=]\s*["']([^"']+)["']/i) 
        || content.match(/进步表现描述[：:]\s*([\s\S]*?)(?=##|第二段|improvementDescription|$)/i);
      const improvementMatch = content.match(/improvementDescription["']?\s*[:=]\s*["']([^"']+)["']/i)
        || content.match(/待提升方向描述[：:]\s*([\s\S]*?)(?=##|第三段|encouragementMessage|$)/i);
      const encouragementMatch = content.match(/encouragementMessage["']?\s*[:=]\s*["']([^"']+)["']/i)
        || content.match(/鼓励寄语[：:]\s*([\s\S]*?)(?=##|improvementPlan|$)/i);
      const plan1Match = content.match(/improvementPlan1["']?\s*[:=]\s*["']([^"']+)["']/i);
      const plan2Match = content.match(/improvementPlan2["']?\s*[:=]\s*["']([^"']+)["']/i);
      const plan3Match = content.match(/improvementPlan3["']?\s*[:=]\s*["']([^"']+)["']/i);

      return NextResponse.json({
        progressDescription: progressMatch?.[1]?.trim() || "进步表现描述生成失败",
        improvementDescription: improvementMatch?.[1]?.trim() || "待提升方向描述生成失败",
        encouragementMessage: encouragementMatch?.[1]?.trim() || "鼓励寄语生成失败",
        improvementPlan1: plan1Match?.[1]?.trim() || "",
        improvementPlan2: plan2Match?.[1]?.trim() || "",
        improvementPlan3: plan3Match?.[1]?.trim() || ""
      });
    }
  } catch (error) {
    console.error("AI生成失败:", error);
    return NextResponse.json(
      { error: "AI生成失败，请重试" },
      { status: 500 }
    );
  }
}
