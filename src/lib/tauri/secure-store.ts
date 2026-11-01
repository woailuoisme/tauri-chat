import { invoke } from "@tauri-apps/api/core";

import { isTauri, reportCapabilityFailure } from "./env";

/** 需要独立保管密钥的 provider */
export type ApiKeyProvider = "openrouter" | "deepseek" | "openai" | "custom";

export const API_KEY_PROVIDERS: readonly ApiKeyProvider[] = [
  "openrouter",
  "deepseek",
  "openai",
  "custom",
];

const SESSION_PREFIX = "starter.secret.";

/**
 * 非 Tauri 环境（纯浏览器调试）的兜底缓存。
 * 只在当前标签页会话内有效，不落盘。
 */
const sessionCache = new Map<ApiKeyProvider, string>();

function readSession(provider: ApiKeyProvider): string {
  if (sessionCache.has(provider)) return sessionCache.get(provider) ?? "";
  try {
    return window.sessionStorage.getItem(SESSION_PREFIX + provider) ?? "";
  } catch {
    return "";
  }
}

function writeSession(provider: ApiKeyProvider, value: string): void {
  sessionCache.set(provider, value);
  try {
    if (value) window.sessionStorage.setItem(SESSION_PREFIX + provider, value);
    else window.sessionStorage.removeItem(SESSION_PREFIX + provider);
  } catch {
    // sessionStorage 不可用时仅保留内存副本
  }
}

/**
 * 一次性拉取全部密钥。
 * Tauri 环境下读取的是 macOS Keychain（Rust 侧 `secret_get`）；
 * 任一 provider 失败只影响自身，不阻断启动。
 */
export async function loadAllSecrets(): Promise<Partial<Record<ApiKeyProvider, string>>> {
  const result: Partial<Record<ApiKeyProvider, string>> = {};

  if (!isTauri()) {
    for (const provider of API_KEY_PROVIDERS) {
      const value = readSession(provider);
      if (value) result[provider] = value;
    }
    return result;
  }

  await Promise.all(
    API_KEY_PROVIDERS.map(async (provider) => {
      try {
        const value = await invoke<string | null>("secret_get", { provider });
        if (value) result[provider] = value;
      } catch (error) {
        reportCapabilityFailure(`secret_get:${provider}`, error);
      }
    }),
  );

  return result;
}

/** 写入单个密钥，空字符串等价于删除 */
export async function saveSecret(provider: ApiKeyProvider, value: string): Promise<void> {
  const trimmed = value.trim();

  if (!trimmed) {
    await removeSecret(provider);
    return;
  }

  if (!isTauri()) {
    writeSession(provider, trimmed);
    return;
  }

  try {
    await invoke("secret_set", { provider, value: trimmed });
  } catch (error) {
    reportCapabilityFailure(`secret_set:${provider}`, error);
  }
}

/** 删除单个密钥 */
export async function removeSecret(provider: ApiKeyProvider): Promise<void> {
  if (!isTauri()) {
    writeSession(provider, "");
    return;
  }

  try {
    await invoke("secret_delete", { provider });
  } catch (error) {
    reportCapabilityFailure(`secret_delete:${provider}`, error);
  }
}
