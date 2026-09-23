import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSupabaseCredentials,
  getSupabaseServiceRoleKey,
} from "@/storage/database/supabase-client";
import type { AISettingsView } from "./catalog";
import { decryptKey, encryptKey, encryptionReady } from "./crypto";
import { AIError, publicAIError } from "./errors";
import {
  profileInput,
  type SettingsAction,
  validateBaseUrl,
} from "./validation";

const savedProfileSchema = profileInput.omit({ apiKey: true }).extend({
  id: z.string().uuid(),
  ciphertext: z.string(),
  keyHint: z.string(),
});
export type SavedProfile = z.infer<typeof savedProfileSchema>;
export interface StoredSettings {
  profiles: SavedProfile[];
  activeProfileId: string | null;
  revision: number;
  storageReady: boolean;
}

export async function verifiedUser(request: NextRequest): Promise<string> {
  const { url, anonKey } = getSupabaseCredentials();
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : request.cookies.get("sb-access-token")?.value;
  const client = token
    ? createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : createServerClient(url, anonKey, {
        cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
      });
  const { data, error } = token
    ? await client.auth.getUser(token)
    : await client.auth.getUser();
  if (error || !data.user) throw new AIError("请先登录后使用 AI 功能。", 401);
  return data.user.id;
}

function adminClient() {
  const { url } = getSupabaseCredentials();
  const key = getSupabaseServiceRoleKey();
  if (!key) throw new AIError("AI 接口管理尚未完成服务端配置。", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readSettings(userId: string): Promise<StoredSettings> {
  const { data, error } = await adminClient()
    .from("ai_provider_settings")
    .select("profiles, active_profile_id, revision")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205")
      return {
        profiles: [],
        activeProfileId: null,
        revision: 0,
        storageReady: false,
      };
    throw new AIError("读取 AI 配置失败，请稍后重试。", 503);
  }
  if (!data)
    return {
      profiles: [],
      activeProfileId: null,
      revision: 0,
      storageReady: true,
    };
  const profiles = z.array(savedProfileSchema).max(10).safeParse(data.profiles);
  if (!profiles.success)
    throw new AIError("已保存的 AI 配置格式异常，请联系管理员。", 503);
  return {
    profiles: profiles.data,
    activeProfileId: data.active_profile_id,
    revision: data.revision,
    storageReady: true,
  };
}

export function settingsView(settings: StoredSettings): AISettingsView {
  return {
    profiles: settings.profiles.map(
      ({ id, name, provider, baseUrl, model, keyHint }) => ({
        id,
        name,
        provider,
        baseUrl,
        model,
        keyHint,
      }),
    ),
    activeProfileId: settings.activeProfileId,
    revision: settings.revision,
    storageReady: settings.storageReady,
    encryptionReady: encryptionReady(),
  };
}

export function keyContext(
  userId: string,
  profile: { id: string; baseUrl: string },
) {
  return JSON.stringify([userId, profile.id, profile.baseUrl]);
}

export function profileConnection(userId: string, profile: SavedProfile) {
  return {
    ...profile,
    apiKey: decryptKey(profile.ciphertext, keyContext(userId, profile)),
  };
}

export function changeSettings(
  userId: string,
  current: StoredSettings,
  action: SettingsAction,
): StoredSettings {
  if (!current.storageReady)
    throw new AIError("请先完成 AI 接口配置表的初始化。", 503);
  if (action.revision !== current.revision)
    throw new AIError("配置已在其他页面修改，请刷新后重试。", 409);
  const next = {
    ...current,
    profiles: [...current.profiles],
    revision: current.revision + 1,
  };
  if (action.action === "select") {
    if (action.id !== null) {
      const profile = current.profiles.find((p) => p.id === action.id);
      if (!profile) throw new AIError("接口不存在，请刷新后重试。", 404);
      validateBaseUrl(profile.provider, profile.baseUrl);
      profileConnection(userId, profile);
    }
    next.activeProfileId = action.id;
  } else if (action.action === "delete") {
    if (action.id === current.activeProfileId)
      throw new AIError("请先切换默认接口，再删除此配置。");
    if (!current.profiles.some((p) => p.id === action.id))
      throw new AIError("接口不存在。", 404);
    next.profiles = next.profiles.filter((p) => p.id !== action.id);
  } else {
    const input = action.profile;
    const old = current.profiles.find((p) => p.id === input.id);
    if (input.id && !old) throw new AIError("接口不存在，请刷新后重试。", 404);
    if (!old && current.profiles.length >= 10)
      throw new AIError("每个账号最多保存 10 个接口。");
    const baseUrl = validateBaseUrl(input.provider, input.baseUrl);
    if (
      !input.apiKey &&
      (!old || old.baseUrl !== baseUrl || old.provider !== input.provider)
    ) {
      throw new AIError("新增接口或更换平台、地址时，请重新填写 API 密钥。");
    }
    const id = old?.id || randomUUID();
    const profile: SavedProfile = {
      id,
      name: input.name,
      provider: input.provider,
      baseUrl,
      model: input.model,
      ciphertext: input.apiKey
        ? encryptKey(input.apiKey, keyContext(userId, { id, baseUrl }))
        : old!.ciphertext,
      keyHint: input.apiKey ? input.apiKey.slice(-4) : old!.keyHint,
    };
    // Detect an encryption-key change before preserving an unreadable credential.
    profileConnection(userId, profile);
    next.profiles = old
      ? next.profiles.map((p) => (p.id === id ? profile : p))
      : [...next.profiles, profile];
  }
  return next;
}

export async function writeSettings(
  userId: string,
  current: StoredSettings,
  action: SettingsAction,
) {
  const next = changeSettings(userId, current, action);
  const row = {
    profiles: next.profiles,
    active_profile_id: next.activeProfileId,
    revision: next.revision,
    updated_at: new Date().toISOString(),
  };
  const db = adminClient();
  const { data, error } =
    current.revision === 0
      ? await db
          .from("ai_provider_settings")
          .insert({ user_id: userId, ...row })
          .select("user_id")
      : await db
          .from("ai_provider_settings")
          .update(row)
          .eq("user_id", userId)
          .eq("revision", current.revision)
          .select("user_id");
  if (error?.code === "23505" || (!error && data?.length !== 1))
    throw new AIError("配置已在其他页面修改，请刷新后重试。", 409);
  if (error) throw new AIError("保存 AI 配置失败，请稍后重试。", 503);
  return settingsView(next);
}

export function aiJson(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function aiFailure(error: unknown) {
  const result = publicAIError(error);
  return aiJson({ error: result.error }, result.status);
}
