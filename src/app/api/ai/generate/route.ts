import { NextRequest } from "next/server";
import { buildReportMessages } from "@/lib/ai/prompt";
import { generateInput, parseReport } from "@/lib/ai/validation";
import { invokeCompatible } from "@/lib/ai/provider";
import {
  aiFailure,
  aiJson,
  profileConnection,
  readSettings,
  verifiedUser,
} from "@/lib/ai/server";
import { AIError } from "@/lib/ai/errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedUser(request);
    const input = generateInput.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success)
      return aiJson(
        { error: "请检查学生、课程和六项能力评分是否填写完整。" },
        400,
      );
    const settings = await readSettings(userId);
    const messages = buildReportMessages(input.data);
    let content: string;
    if (settings.activeProfileId) {
      const profile = settings.profiles.find(
        (p) => p.id === settings.activeProfileId,
      );
      if (!profile)
        throw new AIError("默认 AI 接口不存在，请到“AI 接口”重新选择。", 503);
      const result = await invokeCompatible(
        profileConnection(userId, profile),
        messages,
      );
      content = result.content;
    } else {
      // Preserve the existing provider until the user explicitly selects a custom one.
      const { LLMClient, Config, HeaderUtils } = await import(
        "coze-coding-dev-sdk"
      );
      const client = new LLMClient(
        new Config(),
        HeaderUtils.extractForwardHeaders(request.headers),
      );
      try {
        const result = await client.invoke(messages, {
          model: "doubao-seed-2-0-lite-260215",
          temperature: 0.85,
        });
        content = result.content;
      } catch {
        throw new AIError(
          "扣子模型调用失败，请稍后重试或在“AI 接口”中选择其他服务。",
          502,
        );
      }
    }
    return aiJson(parseReport(content));
  } catch (error) {
    return aiFailure(error);
  }
}
