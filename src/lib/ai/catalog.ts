export const AI_PRESETS = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
    docs: "https://api-docs.deepseek.com/zh-cn/",
  },
  dashscope: {
    name: "通义千问 · 阿里云百炼",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    docs: "https://help.aliyun.com/zh/model-studio/base-url",
  },
  siliconflow: {
    name: "硅基流动",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "",
    docs: "https://docs.siliconflow.cn/docs/userguide/quickstart",
  },
  custom: { name: "其他兼容接口", baseUrl: "", model: "", docs: "" },
} as const;

export type AIProvider = keyof typeof AI_PRESETS;
export interface PublicAIProfile {
  id: string;
  name: string;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  keyHint: string;
}
export interface AISettingsView {
  profiles: PublicAIProfile[];
  activeProfileId: string | null;
  revision: number;
  storageReady: boolean;
  encryptionReady: boolean;
}
