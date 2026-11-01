import * as React from "react";

import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useChatStream } from "@/hooks/use-chat-stream";
import { resolveArtifactType } from "@/lib/ai/artifacts";
import { AVAILABLE_MODELS, type ChatAttachment, type ChatMessage } from "@/lib/ai/types";
import { buildHistoryUntil, createMessageId, type StreamHistory } from "@/lib/chat/messages";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { CHAT_WIDTH_CLASSES, useSettingsStore } from "@/lib/store/settings-store";
import { cn } from "@/lib/utils";

import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { SuggestionGrid } from "./SuggestionGrid";

/** 空数组常量，保证选择器返回稳定引用 */
const EMPTY_MESSAGES: ChatMessage[] = [];

/** 从完整回答里识别足够长的代码块并自动打开 Artifact 面板 */
const CODE_BLOCK_REGEX =
  /```(html|jsx|tsx|react|svg|mermaid|typescript|javascript|python)\s*\n([\s\S]*?)```/i;

export function ChatArea() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) =>
    s.activeConversationId
      ? (s.messages[s.activeConversationId] ?? EMPTY_MESSAGES)
      : EMPTY_MESSAGES,
  );
  const streaming = useChatStore((s) => s.streaming);

  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const truncateMessagesAfter = useChatStore((s) => s.truncateMessagesAfter);
  const createConversation = useChatStore((s) => s.createConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const clearDraft = useChatStore((s) => s.clearDraft);

  const chatWidth = useSettingsStore((s) => s.chatWidth);
  const selectedModelId = useSettingsStore((s) => s.selectedModelId);
  const thinkingEnabled = useSettingsStore((s) => s.thinkingEnabled);

  const openArtifact = useArtifactsStore((s) => s.openArtifact);

  const currentModel =
    AVAILABLE_MODELS.find((model) => model.id === selectedModelId) ?? AVAILABLE_MODELS[0];

  const isStreamingHere = streaming !== null && streaming.conversationId === activeConversationId;
  const streamingMessageId = isStreamingHere ? streaming.messageId : null;

  const { scrollContainerRef, scrollEndRef, handleScroll } = useChatScroll({
    activeConversationId,
    messages,
    isStreamingHere,
  });

  /** 从完整回答里识别足够长的代码块并自动打开 Artifact 面板 */
  const handleStreamFinish = React.useCallback(
    (content: string, messageId: string) => {
      const match = CODE_BLOCK_REGEX.exec(content);
      if (!match || match[2].trim().length <= 80) return;

      const rawLanguage = match[1].toLowerCase();
      const body = match[2].trim();

      openArtifact({
        id: `art-${messageId}`,
        messageId,
        title: `${rawLanguage.toUpperCase()} Application`,
        type: resolveArtifactType(rawLanguage),
        language: rawLanguage,
        content: body,
        versions: [{ version: 1, content: body, timestamp: Date.now() }],
        currentVersion: 1,
        createdAt: Date.now(),
      });
    },
    [openArtifact],
  );

  const { startAssistantStream, stop } = useChatStream({ onFinish: handleStreamFinish });

  const handleSend = React.useCallback(
    async (text: string, attachments?: ChatAttachment[]) => {
      const store = useChatStore.getState();
      const settings = useSettingsStore.getState();

      let conversationId = store.activeConversationId;

      if (!conversationId) {
        conversationId = createConversation(
          settings.selectedModelId,
          text.slice(0, 30) || "New chat",
        );
      } else if ((store.messages[conversationId] ?? []).length === 0) {
        renameConversation(conversationId, text.slice(0, 30));
      }

      const userMessage: ChatMessage = {
        id: createMessageId("u"),
        role: "user",
        content: text,
        createdAt: Date.now(),
        attachments,
      };

      // 历史必须在写入新消息之前读取，避免重复带上本轮提问
      const history: StreamHistory = [...(store.messages[conversationId] ?? []), userMessage].map(
        (message) => ({
          role: message.role,
          content: message.content,
          attachments: message.attachments,
        }),
      );

      addMessage(conversationId, userMessage);
      clearDraft(conversationId);

      await startAssistantStream(conversationId, history);
    },
    [addMessage, clearDraft, createConversation, renameConversation, startAssistantStream],
  );

  const handleEditUserMessage = React.useCallback(
    async (messageId: string, newContent: string) => {
      const store = useChatStore.getState();
      const conversationId = store.activeConversationId;
      if (!conversationId) return;

      const history = buildHistoryUntil(
        store.messages[conversationId] ?? [],
        messageId,
        newContent,
      );

      updateMessage(conversationId, messageId, { content: newContent });
      truncateMessagesAfter(conversationId, messageId);

      await startAssistantStream(conversationId, history);
    },
    [startAssistantStream, truncateMessagesAfter, updateMessage],
  );

  const handleRetryUserMessage = React.useCallback(
    async (messageId: string) => {
      const store = useChatStore.getState();
      const conversationId = store.activeConversationId;
      if (!conversationId) return;

      const history = buildHistoryUntil(store.messages[conversationId] ?? [], messageId);

      truncateMessagesAfter(conversationId, messageId);

      await startAssistantStream(conversationId, history);
    },
    [startAssistantStream, truncateMessagesAfter],
  );

  const handleSuggestionPick = React.useCallback(
    (prompt: string) => {
      void handleSend(prompt);
    },
    [handleSend],
  );

  // Esc 打断生成
  React.useEffect(() => {
    if (streaming === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      stop();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stop, streaming]);

  return (
    <div className="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-8"
      >
        <div
          className={cn(
            "mx-auto w-full transition-all duration-150",
            CHAT_WIDTH_CLASSES[chatWidth] ?? "max-w-5xl",
          )}
        >
          {messages.length === 0 ? (
            <SuggestionGrid
              modelName={currentModel.name}
              showThinkingBadge={Boolean(currentModel.supportsThinking && thinkingEnabled)}
              onPick={handleSuggestionPick}
            />
          ) : (
            <MessageList
              messages={messages}
              streamingMessageId={streamingMessageId}
              onEditUserMessage={handleEditUserMessage}
              onRetryUserMessage={handleRetryUserMessage}
            />
          )}

          <p className="sr-only" role="status" aria-live="polite">
            {isStreamingHere ? "正在生成回复" : ""}
          </p>

          <div ref={scrollEndRef} />
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-8">
        <div
          className={cn(
            "mx-auto w-full transition-all duration-150",
            CHAT_WIDTH_CLASSES[chatWidth] ?? "max-w-5xl",
          )}
        >
          <ChatInput
            // 按会话重挂载，让草稿与附件状态天然隔离
            key={activeConversationId ?? "new-conversation"}
            conversationId={activeConversationId}
            onSend={handleSend}
            onStop={stop}
            isStreaming={isStreamingHere}
          />
        </div>
      </div>
    </div>
  );
}
