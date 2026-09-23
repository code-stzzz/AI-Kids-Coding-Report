export class AIError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export function publicAIError(error: unknown): {
  error: string;
  status: number;
} {
  if (error instanceof AIError)
    return { error: error.message, status: error.status };
  // Never return provider responses, credentials, prompts, or database errors.
  return { error: "AI 服务暂时不可用，请稍后重试。", status: 500 };
}
