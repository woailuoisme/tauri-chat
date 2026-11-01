import * as React from "react";

import { executeStreamChat } from "@/lib/ai/providers";
import { AVAILABLE_MODELS, type ChatMessage } from "@/lib/ai/types";
import type { StreamHistory } from "@/lib/chat/messages";
import { createMessageId } from "@/lib/chat/messages";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { notifyCompletion, playCompletionChime } from "@/lib/tauri/fs";

/** 系统通知正文的最大字数：macOS 横幅约两行，超出部分会被系统截断 */
const NOTIFICATION_SUMMARY_LENGTH = 80;

/** 从回复正文中提取一段可读摘要，用于系统通知 */
function summarise(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "已完成回复";

  return compact.length > NOTIFICATION_SUMMARY_LENGTH
    ? `${compact.slice(0, NOTIFICATION_SUMMARY_LENGTH)}…`
    : compact;
}

interface UseChatStreamOptions {
  /**
   * 一条流正常结束后的回调（打开 Artifact 面板等）。
   * 用 ref 持有以保持 `startAssistantStream` 身份稳定，避免消息列表整体重渲染。
   */
  onFinish?: (fullText: string, messageId: string) => void;
}

/**
 * 一条 AI 回复的完整生命周期：创建占位消息 → 合帧写入 token → 结束/中断收尾。
 *
 * 不变量：
 * - 同一时刻只允许一条流，入口先中止上一条；
 * - token 先写 ref，再按 requestAnimationFrame 合帧写入 store；
 * - 收尾时 controller 与 streaming 状态都按归属判定清理。
 */
export function useChatStream({ onFinish }: UseChatStreamOptions = {}) {
  const updateMessage = useChatStore((s) => s.updateMessage);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // 流式文本先写入 ref，再按帧合并进 store，
  // 把「每 token 一次 setState + 一次全表重渲染」压到「每帧一次」。
  const textBufferRef = React.useRef("");
  const reasoningBufferRef = React.useRef("");
  const streamStartedAtRef = React.useRef(0);
  const frameRef = React.useRef<number | null>(null);

  const onFinishRef = React.useRef(onFinish);
  React.useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const cancelPendingFrame = React.useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  React.useEffect(() => cancelPendingFrame, [cancelPendingFrame]);

  /** 把缓冲的流式文本合并写回 store */
  const scheduleFlush = React.useCallback(
    (conversationId: string, messageId: string) => {
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;

        const patch: Partial<ChatMessage> = { content: textBufferRef.current };

        if (reasoningBufferRef.current) {
          patch.thinking = reasoningBufferRef.current;
          patch.thinkingDuration = Math.round((Date.now() - streamStartedAtRef.current) / 1000);
        }

        updateMessage(conversationId, messageId, patch);
      });
    },
    [updateMessage],
  );

  const startAssistantStream = React.useCallback(
    async (conversationId: string, history: StreamHistory) => {
      const settings = useSettingsStore.getState();
      const store = useChatStore.getState();

      // 通知文案统一取本请求实际使用的模型，避免与渲染态模型双源
      const modelName =
        AVAILABLE_MODELS.find((model) => model.id === settings.selectedModelId)?.name ??
        settings.selectedModelId;

      // 同一时刻只允许一条流：先中止上一条，避免并发请求与重复通知
      abortControllerRef.current?.abort();

      const assistantMessageId = createMessageId("a");

      store.addMessage(conversationId, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        thinking: "",
        createdAt: Date.now(),
        modelId: settings.selectedModelId,
      });
      store.beginStreaming(conversationId, assistantMessageId);

      textBufferRef.current = "";
      reasoningBufferRef.current = "";
      streamStartedAtRef.current = Date.now();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await executeStreamChat({
          modelId: settings.selectedModelId,
          messages: history,
          system: settings.systemPrompt,
          thinkingEnabled: settings.thinkingEnabled,
          thinkingBudget: settings.thinkingBudget,
          abortSignal: controller.signal,
          onChunk: (chunk) => {
            textBufferRef.current += chunk;
            scheduleFlush(conversationId, assistantMessageId);
          },
          onReasoning: (chunk) => {
            reasoningBufferRef.current += chunk;
            scheduleFlush(conversationId, assistantMessageId);
          },
          onFinish: (fullText, fullReasoning) => {
            cancelPendingFrame();
            textBufferRef.current = fullText;
            reasoningBufferRef.current = fullReasoning;

            useChatStore.getState().updateMessage(conversationId, assistantMessageId, {
              content: fullText,
              thinking: fullReasoning,
              thinkingDuration: Math.round((Date.now() - streamStartedAtRef.current) / 1000),
            });

            // 只在窗口失焦时打扰用户
            if (!document.hasFocus() && settings.notificationsEnabled) {
              void notifyCompletion(modelName, summarise(fullText));
            }
            if (settings.soundEnabled) {
              playCompletionChime();
            }

            onFinishRef.current?.(fullText, assistantMessageId);
          },
        });
      } catch (error: unknown) {
        cancelPendingFrame();

        const isAbort = (error as Error | undefined)?.name === "AbortError";
        const buffered = textBufferRef.current;

        useChatStore.getState().updateMessage(conversationId, assistantMessageId, {
          content: isAbort
            ? buffered
              ? `${buffered} _(已中断)_`
              : "_(已中断生成)_"
            : `${buffered}\n\n> ⚠️ **请求失败**：请在「设置 → 模型」中检查 API Key 与 Base URL。`,
        });
      } finally {
        // 只在 controller 仍属于本条流时清空，
        // 否则旧流的 finally 会把新流的 controller 置空，导致「停止」按钮失效
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        // endStreaming 已作用域化，不匹配时是 no-op
        useChatStore.getState().endStreaming(conversationId, assistantMessageId);
      }
    },
    [cancelPendingFrame, scheduleFlush],
  );

  const stop = React.useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { startAssistantStream, stop };
}
