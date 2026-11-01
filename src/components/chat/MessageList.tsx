import * as React from "react";

import type { ChatMessage } from "@/lib/ai/types";

import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: ChatMessage[];
  /** 当前正在流式输出的消息 ID；null 表示没有进行中的流 */
  streamingMessageId: string | null;
  onEditUserMessage: (messageId: string, newContent: string) => void;
  onRetryUserMessage: (messageId: string) => void;
}

/**
 * 消息列表。
 *
 * `memo` 的意义与 `MessageItem` 相同：流式生成时只有最后一条消息内容在变，
 * 其余消息因引用不变而整棵子树跳过渲染。
 */
export const MessageList = React.memo(function MessageList({
  messages,
  streamingMessageId,
  onEditUserMessage,
  onRetryUserMessage,
}: MessageListProps) {
  return (
    <div role="log" aria-label="对话消息">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
          onEditUserMessage={onEditUserMessage}
          onRetryUserMessage={onRetryUserMessage}
        />
      ))}
    </div>
  );
});
