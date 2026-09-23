import { NextRequest } from "next/server";
import {
  aiFailure,
  aiJson,
  readSettings,
  settingsView,
  verifiedUser,
  writeSettings,
} from "@/lib/ai/server";
import { settingsAction } from "@/lib/ai/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const userId = await verifiedUser(request);
    return aiJson(settingsView(await readSettings(userId)));
  } catch (error) {
    return aiFailure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedUser(request);
    const action = settingsAction.safeParse(
      await request.json().catch(() => null),
    );
    if (!action.success)
      return aiJson(
        { error: "配置不完整，请检查接口名称、地址、模型名称和密钥。" },
        400,
      );
    return aiJson(
      await writeSettings(userId, await readSettings(userId), action.data),
    );
  } catch (error) {
    return aiFailure(error);
  }
}
