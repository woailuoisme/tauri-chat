import { Check, Copy, Eye, FileText, Info, Pencil, RotateCcw, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/lib/ai/types";
import { copyText } from "@/lib/utils/clipboard";
import { formatRelativeTime } from "@/lib/utils/relative-time";

import { CitationsBlock } from "./CitationsBlock";
import { ImageLightbox } from "./ImageLightbox";
import { isImageAttachment } from "./input/attachment-utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ThinkingBlock } from "./ThinkingBlock";

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onEditUserMessage?: (messageId: string, newContent: string) => void;
  onRetryUserMessage?: (messageId: string) => void;
}

function MessageItemBase({
  message,
  isStreaming = false,
  onEditUserMessage,
  onRetryUserMessage,
}: MessageItemProps) {
  const isUser = message.role === "user";

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.content);
  const [copied, setCopied] = React.useState(false);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = React.useCallback(() => {
    copyText(message.content, "clipboard:message").then((ok) => ok && setCopied(true));
  }, [message.content]);

  const handleSaveEdit = React.useCallback(() => {
    const next = editText.trim();
    if (!next) return;

    setIsEditing(false);
    onEditUserMessage?.(message.id, next);
  }, [editText, message.id, onEditUserMessage]);

  const handleCancelEdit = React.useCallback(() => {
    setEditText(message.content);
    setIsEditing(false);
  }, [message.content]);

  const closeLightbox = React.useCallback(() => setPreviewImageUrl(null), []);

  if (isUser && isEditing) {
    return (
      <div className="flex w-full justify-end py-3">
        <div className="w-full max-w-2xl space-y-2">
          <div className="relative rounded-2xl border-2 border-sky-500 bg-[#1c1c1f] p-3 shadow-lg ring-2 ring-sky-500/20 transition-all">
            <label className="sr-only" htmlFor={`edit-${message.id}`}>
              编辑消息内容
            </label>
            <textarea
              id={`edit-${message.id}`}
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  handleSaveEdit();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  handleCancelEdit();
                }
              }}
              rows={Math.max(2, Math.min(8, editText.split("\n").length))}
              autoFocus
              className="text-foreground w-full resize-none bg-transparent leading-relaxed placeholder:text-neutral-500 focus:outline-none"
              style={{ fontSize: "var(--chat-font-size)" }}
            />
          </div>

          <div className="flex items-center justify-between px-1 text-xs select-none">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Info className="size-3.5 opacity-70" aria-hidden="true" />
              <span className="text-[11px]">按 ⌘+Enter 发送，Esc 取消</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="cursor-pointer rounded-lg bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                保存并重新生成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    const attachments = message.attachments ?? [];
    const imageAttachments = attachments.filter(isImageAttachment);
    const fileAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));

    return (
      <div className="group flex w-full flex-col items-end py-3">
        <div className="max-w-[85%] space-y-1 sm:max-w-[75%]">
          {imageAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {imageAttachments.map((image) => {
                const src = image.dataUrl ?? image.url;

                // 载荷在持久化时被剥离：明确告知，而不是静默渲染空白
                if (!src) {
                  return (
                    <span
                      key={image.id}
                      className="border-border/60 bg-muted/40 text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
                    >
                      <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="max-w-35 truncate">{image.name}</span>
                      <span className="text-[10px] opacity-70">（已清理）</span>
                    </span>
                  );
                }

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setPreviewImageUrl(src)}
                    aria-label={`放大查看图片 ${image.name}`}
                    className="group/img relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-md transition-all hover:border-white/30 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                  >
                    <img
                      src={src}
                      alt={image.name}
                      className="max-h-56 max-w-70 rounded-xl object-cover transition-transform group-hover/img:scale-[1.02]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/img:opacity-100 group-focus-visible/img:opacity-100">
                      <span className="flex size-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs">
                        <Eye className="size-4" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {fileAttachments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap justify-end gap-2">
              {fileAttachments.map((file) => (
                <div
                  key={file.id}
                  className="border-border/60 bg-muted/50 text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
                >
                  <FileText className="text-primary size-3.5" aria-hidden="true" />
                  <span className="max-w-35 truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <div
            className="rounded-2xl rounded-tr-xs bg-[#242427] px-4 py-2.5 leading-relaxed whitespace-pre-wrap text-white/95 shadow-2xs"
            style={{ fontSize: "var(--chat-font-size)" }}
          >
            {message.content}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1 text-xs text-neutral-400 opacity-0 transition-opacity select-none group-focus-within:opacity-100 group-hover:opacity-100">
            <span className="text-[11px] text-neutral-400">
              {formatRelativeTime(message.createdAt)}
            </span>

            {onRetryUserMessage && (
              <button
                type="button"
                onClick={() => onRetryUserMessage(message.id)}
                className="cursor-pointer rounded p-1 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                title="重新生成"
                aria-label="从此消息重新生成"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
              </button>
            )}

            {onEditUserMessage && (
              <button
                type="button"
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                className="cursor-pointer rounded p-1 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                title="编辑此消息"
                aria-label="编辑此消息"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="cursor-pointer rounded p-1 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              title="复制内容"
              aria-label="复制消息内容"
            >
              {copied ? (
                <Check className="size-3.5 text-green-400" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <ImageLightbox src={previewImageUrl} alt="图片预览" onClose={closeLightbox} />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex w-full gap-3 py-4">
      <div className="bg-primary/10 text-primary border-primary/20 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border select-none">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {(message.thinking || (isStreaming && !message.content)) && (
          <ThinkingBlock
            thinking={message.thinking ?? ""}
            isStreaming={isStreaming && !message.content}
            duration={message.thinkingDuration}
          />
        )}

        {message.sources && message.sources.length > 0 && (
          <CitationsBlock sources={message.sources} />
        )}

        {message.content ? (
          <div className="relative">
            <MarkdownRenderer content={message.content} />
            {isStreaming && (
              <span
                className="bg-primary mb-0.5 ml-1 inline-block size-2 animate-pulse rounded-full align-middle"
                aria-hidden="true"
              />
            )}
          </div>
        ) : isStreaming ? (
          <div className="text-muted-foreground flex items-center gap-1.5 py-1 text-xs">
            <span className="bg-primary size-1.5 animate-pulse rounded-full" />
            <span className="bg-primary size-1.5 animate-pulse rounded-full [animation-delay:200ms]" />
            <span className="bg-primary size-1.5 animate-pulse rounded-full [animation-delay:400ms]" />
            <span className="sr-only">正在生成</span>
          </div>
        ) : null}

        {!isStreaming && message.content && (
          <div className="flex items-center gap-1 pt-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              onClick={handleCopy}
              title="复制回复"
              aria-label="复制回复"
            >
              {copied ? (
                <Check className="size-3.5 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 消息行。
 *
 * 用 `memo` 包裹是本项目最关键的性能手段：流式生成时只有最后一条消息的内容会变，
 * 历史消息因 `message` 引用不变而整棵子树跳过渲染，避免每条消息每秒被重新解析
 * Markdown 数十次。前提是父组件传入的回调必须稳定（ChatArea 已通过
 * `useCallback` + `useChatStore.getState()` 保证）。
 */
export const MessageItem = React.memo(MessageItemBase);
