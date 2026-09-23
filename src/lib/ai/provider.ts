import type { AIProvider } from "./catalog";
import { AIError } from "./errors";
import { validateBaseUrl } from "./validation";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface ProviderConnection {
  provider: AIProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export async function invokeCompatible(
  connection: ProviderConnection,
  messages: AIMessage[],
  fetcher: typeof fetch = fetch,
) {
  const baseUrl = validateBaseUrl(connection.provider, connection.baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetcher(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connection.apiKey}`,
      },
      body: JSON.stringify({
        model: connection.model,
        messages,
        stream: false,
      }),
      redirect: "error",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const status = response.status;
      await response.body?.cancel();
      if (status === 401 || status === 403)
        throw new AIError("接口鉴权失败，请检查 API 密钥及模型访问权限。", 502);
      if (status === 402)
        throw new AIError("接口余额不足，请到对应平台检查账户余额。", 502);
      if (status === 429)
        throw new AIError("接口调用受限，请稍后重试并检查平台额度。", 429);
      if (status === 400 || status === 404)
        throw new AIError("接口地址或模型名称不可用，请核对配置。", 502);
      throw new AIError("模型服务暂时不可用，请稍后重试。", 502);
    }
    // Bound the response, including providers that omit Content-Length.
    const reader = response.body?.getReader();
    if (!reader) throw new AIError("模型没有返回内容，请重试。", 502);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024) {
        await reader.cancel();
        throw new AIError("模型返回内容过长，请更换模型后重试。", 502);
      }
      chunks.push(value);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim())
      throw new AIError("模型没有返回文本，请确认选择了文本对话模型。", 502);
    const count = data?.usage?.total_tokens;
    return {
      content,
      totalTokens:
        Number.isSafeInteger(count) && count >= 0 ? (count as number) : null,
    };
  } catch (error) {
    if (error instanceof AIError) throw error;
    if (controller.signal.aborted)
      throw new AIError("模型响应超时，请稍后重试。", 504);
    throw new AIError("无法连接模型接口，或返回格式不兼容，请检查配置。", 502);
  } finally {
    clearTimeout(timer);
  }
}
