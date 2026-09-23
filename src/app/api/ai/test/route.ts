import { NextRequest } from "next/server";
import { z } from "zod";
import {
  aiFailure,
  aiJson,
  profileConnection,
  readSettings,
  verifiedUser,
} from "@/lib/ai/server";
import { invokeCompatible } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedUser(request);
    const body = z
      .object({ id: z.string().uuid() })
      .strict()
      .safeParse(await request.json().catch(() => null));
    if (!body.success) return aiJson({ error: "请选择已保存的接口。" }, 400);
    const settings = await readSettings(userId);
    const profile = settings.profiles.find((p) => p.id === body.data.id);
    if (!profile) return aiJson({ error: "接口不存在，请刷新后重试。" }, 404);
    const started = Date.now();
    const result = await invokeCompatible(profileConnection(userId, profile), [
      { role: "user", content: "这是接口连通测试。请仅回复：连接成功。" },
    ]);
    return aiJson({
      success: true,
      elapsedMs: Date.now() - started,
      totalTokens: result.totalTokens,
    });
  } catch (error) {
    return aiFailure(error);
  }
}
