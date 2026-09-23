import { z } from "zod";
import { AI_PRESETS } from "./catalog";
import { AIError } from "./errors";

export const profileInput = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(60),
    provider: z.enum(["deepseek", "dashscope", "siliconflow", "custom"]),
    baseUrl: z.string().trim().min(1).max(500),
    model: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[\w./:\-]+$/),
    apiKey: z
      .string()
      .trim()
      .max(4096)
      .refine(
        (value) => !value || (value.length >= 8 && /^[!-~]+$/.test(value)),
      )
      .optional(),
  })
  .strict();

export const settingsAction = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("save"),
      revision: z.number().int().min(0),
      profile: profileInput,
    })
    .strict(),
  z
    .object({
      action: z.literal("select"),
      revision: z.number().int().min(0),
      id: z.string().uuid().nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal("delete"),
      revision: z.number().int().min(0),
      id: z.string().uuid(),
    })
    .strict(),
]);

export type SettingsAction = z.infer<typeof settingsAction>;

export function validateBaseUrl(
  provider: keyof typeof AI_PRESETS,
  value: string,
): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AIError("请填写正确的 HTTPS 接口地址。");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== "443")
  ) {
    throw new AIError(
      "接口地址必须使用 HTTPS，且不能包含密码、参数或自定义端口。",
    );
  }
  const normalized = url.href
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/, "");
  if (provider !== "custom") {
    if (normalized !== AI_PRESETS[provider].baseUrl)
      throw new AIError("预设平台的接口地址不匹配，请使用“其他兼容接口”。");
    return normalized;
  }
  const allowed = new Set([
    ...Object.values(AI_PRESETS)
      .filter((p) => p.baseUrl)
      .map((p) => new URL(p.baseUrl).hostname),
    ...(process.env.AI_ALLOWED_HOSTS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ]);
  // Only operator-approved HTTPS hosts; redirects are also disabled by the caller.
  if (!allowed.has(url.hostname))
    throw new AIError("此接口域名尚未开放，请联系管理员添加后使用。");
  return normalized;
}

export const generateInput = z.object({
  languageName: z.string().trim().min(1).max(80),
  courseUnitName: z.string().trim().min(1).max(160),
  currentStageContent: z.string().max(20000),
  nextStageContent: z.string().max(20000).default(""),
  radarDimensions: z
    .array(
      z.object({ name: z.string().max(80), score: z.number().min(0).max(10) }),
    )
    .length(6),
  coreStrengths: z.string().max(5000).default(""),
  areasToImprove: z.string().max(5000).default(""),
  competitionPlans: z.string().max(5000).default(""),
  studentName: z.string().trim().min(1).max(100),
});
export type GenerateInput = z.infer<typeof generateInput>;

const reportOutput = z.object({
  progressDescription: z.string().trim().min(1).max(10000),
  improvementDescription: z.string().trim().min(1).max(10000),
  encouragementMessage: z.string().trim().min(1).max(10000),
  improvementPlan1: z.string().trim().min(1).max(2000),
  improvementPlan2: z.string().trim().min(1).max(2000),
  improvementPlan3: z.string().trim().min(1).max(2000),
});

export function parseReport(content: string) {
  try {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    const raw =
      fenced ||
      content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
    return reportOutput.parse(JSON.parse(raw));
  } catch {
    throw new AIError(
      "模型返回的报告不完整，请重试或更换模型；原报告未被替换。",
      502,
    );
  }
}
