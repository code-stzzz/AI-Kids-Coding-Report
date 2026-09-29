import { NextRequest } from 'next/server';
import { aiFailure, aiJson, verifiedUser } from '@/lib/ai/server';
import { promptAction, readPrompt, savePrompt } from '@/lib/ai/prompt-settings';

export async function GET(request: NextRequest) {
  try { return aiJson(await readPrompt(await verifiedUser(request))); }
  catch (error) { return aiFailure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedUser(request);
    const input = promptAction.safeParse(await request.json().catch(() => null));
    if (!input.success) return aiJson({ error: '提示词需要包含 1～12000 个字符，请检查后保存。' }, 400);
    return aiJson(await savePrompt(userId, input.data));
  } catch (error) { return aiFailure(error); }
}
