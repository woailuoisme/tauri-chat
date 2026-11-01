import type { StreamChatParams } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/ai/types";

/** 传给 AI 的历史消息形状 */
export type StreamHistory = StreamChatParams["messages"];

/** 生成带随机后缀的消息 ID，避免同毫秒碰撞 */
export function createMessageId(prefix: "u" | "a"): string {
  return `msg-${Date.now()}-${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 取到指定消息为止的历史，供重新生成使用。
 * `overrideContent` 用于「编辑后重发」——用新正文替换该条消息，其余原样带入。
 */
export function buildHistoryUntil(
  messages: readonly ChatMessage[],
  messageId: string,
  overrideContent?: string,
): StreamHistory {
  const index = messages.findIndex((message) => message.id === messageId);
  const sliced = index === -1 ? messages : messages.slice(0, index + 1);

  return sliced.map((message) => ({
    role: message.role,
    content:
      overrideContent !== undefined && message.id === messageId ? overrideContent : message.content,
    attachments: message.attachments,
  }));
}
