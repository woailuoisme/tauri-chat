import { AlertTriangle, Plus, UploadCloud, X } from "lucide-react";
import * as React from "react";

import { AVAILABLE_MODELS, type ChatAttachment } from "@/lib/ai/types";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { cn } from "@/lib/utils";

import { isImageAttachment } from "./input/attachment-utils";
import { AttachmentStrip } from "./input/AttachmentStrip";
import { ModelPicker, modelDisplayName } from "./input/ModelPicker";
import { SendControls } from "./input/SendControls";
import { ThinkingModePicker } from "./input/ThinkingModePicker";
import { useAttachments } from "./input/use-attachments";
import { useSpeechRecognition } from "./input/use-speech-recognition";

const MAX_TEXTAREA_HEIGHT = 220;
const TEXTAREA_ID = "chat-input";

interface ChatInputProps {
  conversationId?: string | null;
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

/**
 * 消息输入区。
 *
 * 只负责组合：文本状态、草稿、提交，以及把工具栏各部件拼起来。
 * 附件通道、语音识别、模型选择器分别由 `./input/*` 承担。
 */
export function ChatInput({
  conversationId = null,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
}: ChatInputProps) {
  // 草稿按会话隔离：父组件通过 key 触发重挂载，这里只做一次性初始化。
  // 关闭「保留草稿」后既不写入也不恢复，避免开关形同虚设。
  const [input, setInput] = React.useState(() => {
    if (!conversationId) return "";
    if (!useSettingsStore.getState().autoSaveDrafts) return "";

    return useChatStore.getState().drafts[conversationId] ?? "";
  });

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedModelId = useSettingsStore((state) => state.selectedModelId);
  const setSelectedModelId = useSettingsStore((state) => state.setSelectedModelId);
  const sendKey = useSettingsStore((state) => state.sendKey);
  const language = useSettingsStore((state) => state.language);

  const {
    attachments,
    error: attachmentError,
    clearError: clearAttachmentError,
    isDraggingOver,
    removeAttachment,
    clearAttachments,
    handleFileChange,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useAttachments();

  /**
   * 把 textarea 高度贴合内容（上限 `MAX_TEXTAREA_HEIGHT`）。
   *
   * 空输入时清除内联高度、回落到 `rows={1}` 的自然高度——
   * 否则清空后仍会保留上一次的像素高度，看起来像「被凭空抬高」。
   */
  const syncTextareaHeight = React.useCallback((value: string) => {
    const element = textareaRef.current;
    if (!element) return;

    if (!value) {
      // 清掉内联高度，交由 rows={1} 决定
      element.style.height = "";
      return;
    }

    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  // 仅在内容变化时重算（键入 / 语音 / 草稿恢复）
  React.useLayoutEffect(() => {
    syncTextareaHeight(input);
  }, [syncTextareaHeight, input]);

  // 宽度变化会让文本重新折行，但不会触发 React 渲染（面板开合、窗口缩放），
  // 因此单独监听尺寸；只对宽度变化做响应，避免与高度写入形成循环。
  React.useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    let lastWidth = element.clientWidth;
    let frame = 0;

    const observer = new ResizeObserver(() => {
      if (element.clientWidth === lastWidth) return;
      lastWidth = element.clientWidth;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        syncTextareaHeight(element.value);
      });
    });

    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [syncTextareaHeight]);

  const handleTranscript = React.useCallback((text: string) => {
    setInput((previous) => (previous ? `${previous} ${text}` : text));
  }, []);

  const {
    isListening,
    error: speechError,
    clearError: clearSpeechError,
    toggle: toggleListening,
  } = useSpeechRecognition({ language, onTranscript: handleTranscript });

  const currentModel =
    AVAILABLE_MODELS.find((model) => model.id === selectedModelId) ?? AVAILABLE_MODELS[0];
  const hasImageAttachments = attachments.some(isImageAttachment);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInput(value);

    if (conversationId && useSettingsStore.getState().autoSaveDrafts) {
      useChatStore.getState().setDraft(conversationId, value);
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isStreaming && !disabled;

  const handleSend = React.useCallback(() => {
    if (!canSend) return;

    onSend(input.trim(), attachments);
    setInput("");
    clearAttachments();
    clearSpeechError();

    if (conversationId) {
      useChatStore.getState().clearDraft(conversationId);
    }
  }, [attachments, canSend, clearAttachments, clearSpeechError, conversationId, input, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法组合期间的回车不应触发发送
    if (event.nativeEvent.isComposing) return;

    const withModifier = event.metaKey || event.ctrlKey;

    if (sendKey === "meta-enter") {
      if (event.key === "Enter" && withModifier) {
        event.preventDefault();
        handleSend();
      }
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const banner = attachmentError ?? speechError;
  const clearBanner = () => {
    clearAttachmentError();
    clearSpeechError();
  };

  return (
    <div className="relative w-full">
      {hasImageAttachments && !currentModel.supportsVision && (
        <div
          role="alert"
          aria-live="assertive"
          className="animate-in fade-in mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200 shadow-sm duration-200"
        >
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="truncate">
              当前 <strong>{modelDisplayName(currentModel)}</strong> 为纯文本模型，可能无法分析图片
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedModelId("google/gemini-2.0-flash-exp:free")}
            className="ml-1 shrink-0 cursor-pointer text-xs font-medium text-amber-300 underline hover:text-white focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            切换到 Gemini 2.0 Flash（免费多模态）
          </button>
        </div>
      )}

      {banner && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-200"
        >
          <span className="min-w-0 truncate">{banner}</span>
          <button
            type="button"
            onClick={clearBanner}
            className="shrink-0 cursor-pointer rounded p-0.5 hover:text-white focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            aria-label="关闭提示"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <AttachmentStrip attachments={attachments} onRemove={removeAttachment} />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col rounded-[20px] border border-white/10 bg-[#1c1c1f] shadow-xl transition-all focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/10",
          isDraggingOver && "border-primary/60 ring-primary/20 ring-2",
        )}
      >
        {isDraggingOver && (
          <div className="border-primary pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed bg-[#1c1c1f]/95 backdrop-blur-sm">
            <div className="bg-primary/20 text-primary flex size-12 items-center justify-center rounded-full">
              <UploadCloud className="size-6 animate-bounce" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-white">松开鼠标添加图片或文件</p>
            <p className="text-xs text-neutral-400">图片单张上限 4MB，文本文件 1MB</p>
          </div>
        )}

        <label className="sr-only" htmlFor={TEXTAREA_ID}>
          消息输入框
        </label>
        <textarea
          id={TEXTAREA_ID}
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="随便问点什么，@ 引用，/ 唤起操作"
          rows={1}
          disabled={disabled}
          className="text-foreground max-h-55 min-h-11.5 w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm leading-relaxed placeholder:text-neutral-400/70 focus:outline-none"
        />

        <div className="flex items-center justify-between px-3 pt-1 pb-2.5 select-none">
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-visible:ring-ring flex size-7 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
              aria-label="添加附件"
              title="添加附件"
            >
              <Plus className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>

            <ModelPicker />
          </div>

          <div className="flex items-center gap-2">
            <ThinkingModePicker />

            <SendControls
              isStreaming={isStreaming}
              canSend={canSend}
              isListening={isListening}
              onToggleMic={toggleListening}
              onSend={handleSend}
              onStop={onStop}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
