import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AIError } from "./errors";

function encryptionKey() {
  const raw = process.env.AI_CONFIG_ENCRYPTION_KEY?.trim();
  if (!raw || !/^[A-Za-z0-9+/]{43}=$/.test(raw))
    throw new AIError("管理员尚未配置接口密钥加密，请完成部署设置。", 503);
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new AIError("接口密钥加密配置无效。", 503);
  return key;
}

export function encryptionReady(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptKey(value: string, context: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptKey(value: string, context: string): string {
  const key = encryptionKey();
  try {
    const [version, iv, tag, content, extra] = value.split(".");
    if (version !== "v1" || !iv || !tag || !content || extra) throw new Error();
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64"),
    );
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(content, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new AIError("无法读取已保存的接口密钥，请重新填写并保存。", 503);
  }
}
