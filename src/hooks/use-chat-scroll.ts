import * as React from "react";

import type { ChatMessage } from "@/lib/ai/types";

/** 距底部小于该像素时视为「贴底」，流式内容增长才自动跟随 */
const STICK_TO_BOTTOM_THRESHOLD = 96;

interface UseChatScrollOptions {
  activeConversationId: string | null;
  messages: ChatMessage[];
  isStreamingHere: boolean;
}

/**
 * 对话区滚动跟随。
 *
 * 关键点：签名里必须包含「末条消息长度」而不仅是「消息条数」，
 * 否则流式过程中长度不变会让视图完全不跟随内容增长。
 * 用户向上翻阅时（距底部超过阈值）停止跟随，不强行拉回。
 */
export function useChatScroll({
  activeConversationId,
  messages,
  isStreamingHere,
}: UseChatScrollOptions) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollEndRef = React.useRef<HTMLDivElement>(null);
  const stickToBottomRef = React.useRef(true);
  const scrollSignatureRef = React.useRef("");
  const lastConversationRef = React.useRef<string | null>(null);

  const lastMessage = messages[messages.length - 1];
  const lastContentLength = lastMessage?.content.length ?? 0;

  const handleScroll = React.useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottomRef.current = distanceToBottom < STICK_TO_BOTTOM_THRESHOLD;
  }, []);

  React.useLayoutEffect(() => {
    const signature = `${activeConversationId ?? "-"}:${messages.length}:${lastContentLength}`;
    if (signature === scrollSignatureRef.current) return;

    const conversationChanged = activeConversationId !== lastConversationRef.current;
    lastConversationRef.current = activeConversationId;
    scrollSignatureRef.current = signature;

    if (conversationChanged) {
      stickToBottomRef.current = true;
    }

    if (messages.length === 0 || !stickToBottomRef.current) return;

    scrollEndRef.current?.scrollIntoView({
      block: "end",
      behavior: isStreamingHere ? "auto" : "smooth",
    });
  });

  return { scrollContainerRef, scrollEndRef, handleScroll };
}
