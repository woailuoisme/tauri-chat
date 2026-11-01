import type { ChatAttachment, ChatMessage, Conversation } from "../ai/types";

/**
 * 持久化相关的纯函数集合。
 *
 * 这里**只允许**依赖类型，不得 import store、localStorage 或任何 Tauri 模块，
 * 否则无法在 `vitest` 的纯 Node 环境下被单测覆盖。
 */

/** 对话 store 真正落盘的字段 */
export interface ChatPersistedState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  drafts: Record<string, string>;
}

/** 持久化 schema 版本，变更字段结构时递增并补 migrate 分支 */
export const CHAT_PERSIST_VERSION = 2;
export const SETTINGS_PERSIST_VERSION = 2;

/** 历史上以明文写入 localStorage 的字段（v1 遗留，v2 起改由系统钥匙串保管） */
export const SECRET_STORAGE_FIELDS = [
  "openrouterApiKey",
  "deepseekApiKey",
  "openaiApiKey",
  "customApiKey",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMessageMap(value: unknown): value is Record<string, ChatMessage[]> {
  return isRecord(value);
}

/**
 * 剥离附件中的二进制载荷。
 * base64 图片一旦进入 localStorage，两三张截图就会撑爆 5MB 配额，
 * 后果不是「图片丢失」而是「此后全部历史静默不再落盘」。
 */
export function stripAttachmentPayload(
  attachments?: ChatAttachment[],
): ChatAttachment[] | undefined {
  if (!attachments || attachments.length === 0) return undefined;

  return attachments.map(({ id, name, size, type, url, isImage }) => ({
    id,
    name,
    size,
    type,
    url,
    isImage,
  }));
}

/** 对整表消息做附件降级（幂等：已剥离过的消息不会产生新对象） */
export function stripMessagesPayload(
  messages: Record<string, ChatMessage[]>,
): Record<string, ChatMessage[]> {
  const next: Record<string, ChatMessage[]> = {};

  for (const [conversationId, list] of Object.entries(messages ?? {})) {
    next[conversationId] = list.map((message) =>
      message.attachments?.length
        ? { ...message, attachments: stripAttachmentPayload(message.attachments) }
        : message,
    );
  }

  return next;
}

/** 对话 store 落盘状态的空值，用于迁移时补齐缺失字段 */
export const EMPTY_CHAT_PERSISTED_STATE: ChatPersistedState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  drafts: {},
};

/**
 * 对话 store 的 v1 → v2 迁移。
 *
 * 始终返回**完整**的落盘状态：缺失字段用空值补齐后交给 zustand 浅合并，
 * 与 store 默认值一致，避免出现「返回 undefined 覆盖掉默认值」的隐性 bug。
 */
export function migrateChatPersistedState(persisted: unknown, version: number): ChatPersistedState {
  if (!isRecord(persisted)) return { ...EMPTY_CHAT_PERSISTED_STATE };

  const result: ChatPersistedState = { ...EMPTY_CHAT_PERSISTED_STATE };

  if (Array.isArray(persisted.conversations)) {
    result.conversations = persisted.conversations as Conversation[];
  }

  if (typeof persisted.activeConversationId === "string") {
    result.activeConversationId = persisted.activeConversationId;
  }

  if (isMessageMap(persisted.messages)) {
    result.messages =
      version < CHAT_PERSIST_VERSION
        ? stripMessagesPayload(persisted.messages)
        : persisted.messages;
  }

  if (isRecord(persisted.drafts)) {
    result.drafts = persisted.drafts as Record<string, string>;
  }

  return result;
}

/**
 * 设置 store 的 v1 → v2 迁移：剥除明文密钥字段。
 *
 * 注意此处只影响内存中的已解析对象；磁盘上的明文需要 `scrubLegacySecrets`
 * 在启动期显式重写一次才会消失（zustand hydration 后不会回写 storage）。
 */
export function migrateSettingsPersistedState(
  persisted: unknown,
  version: number,
): Record<string, unknown> {
  if (!isRecord(persisted)) return {};

  const next: Record<string, unknown> = { ...persisted };

  if (version < SETTINGS_PERSIST_VERSION) {
    for (const field of SECRET_STORAGE_FIELDS) {
      delete next[field];
    }
  }

  return next;
}

/**
 * 清理 v1 遗留在 localStorage 里的明文密钥。
 *
 * 入参是 `localStorage` 中的原始字符串（`{ state, version }` 结构）。
 * 返回清洗后的新字符串；无需处理时返回 `null`，调用方据此跳过写盘。
 */
export function scrubLegacySecrets(rawSettingsJson: string): string | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawSettingsJson);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !isRecord(parsed.state)) return null;

  const state = parsed.state;
  const hasSecret = SECRET_STORAGE_FIELDS.some((field) => {
    const value = state[field];
    return typeof value === "string" && value.length > 0;
  });

  if (!hasSecret) return null;

  const nextState: Record<string, unknown> = { ...state };
  for (const field of SECRET_STORAGE_FIELDS) {
    delete nextState[field];
  }

  return JSON.stringify({
    ...parsed,
    state: nextState,
    version: SETTINGS_PERSIST_VERSION,
  });
}
