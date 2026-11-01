/** 当前正在流式生成的目标 */
export interface StreamingScope {
  conversationId: string;
  messageId: string;
}

/**
 * 判断一次流式结束是否应当生效。
 *
 * 并发场景下旧流的 `finally` 也会执行；若此时已经开了新流，
 * 直接清空会把新流的「生成中」状态一起抹掉（停止按钮消失、旧请求无法中断）。
 */
export function isSameStreamingScope(
  current: StreamingScope | null,
  conversationId: string,
  messageId: string,
): boolean {
  return current?.conversationId === conversationId && current?.messageId === messageId;
}
