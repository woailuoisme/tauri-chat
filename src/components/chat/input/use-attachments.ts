import * as React from "react";

import type { ChatAttachment } from "@/lib/ai/types";

import { MAX_TOTAL_ATTACHMENTS, readFileAsAttachment } from "./attachment-utils";

interface UseAttachmentsResult {
  attachments: ChatAttachment[];
  error: string | null;
  clearError: () => void;
  isDraggingOver: boolean;
  appendFiles: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
}

/**
 * 附件状态与全部输入通道（选择、粘贴、拖放）。
 *
 * 数量裁剪在 setState 之外计算（用 ref 镜像当前数量），
 * 避免在 updater 内触发另一个 setState —— StrictMode 下 updater 会被调用两次。
 */
export function useAttachments(): UseAttachmentsResult {
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const countRef = React.useRef(0);

  React.useEffect(() => {
    countRef.current = attachments.length;
  }, [attachments.length]);

  const appendFiles = React.useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const results = await Promise.all(files.map(readFileAsAttachment));
    const accepted = results.flatMap((result) => (result.ok ? [result.attachment] : []));
    const rejected = results.flatMap((result) => (result.ok ? [] : [result.reason]));

    const available = Math.max(0, MAX_TOTAL_ATTACHMENTS - countRef.current);
    const taken = accepted.slice(0, available);
    const overflowed = accepted.length > taken.length;

    if (taken.length > 0) {
      countRef.current += taken.length;
      setAttachments((previous) => [...previous, ...taken]);
    }

    const messages = [...rejected];
    if (overflowed) messages.push(`最多添加 ${MAX_TOTAL_ATTACHMENTS} 个附件`);

    setError(messages.length > 0 ? messages.join("；") : null);
  }, []);

  const removeAttachment = React.useCallback((id: string) => {
    setAttachments((previous) => {
      const next = previous.filter((attachment) => attachment.id !== id);
      countRef.current = next.length;
      return next;
    });
  }, []);

  const clearAttachments = React.useCallback(() => {
    countRef.current = 0;
    setAttachments([]);
    setError(null);
  }, []);

  const clearError = React.useCallback(() => setError(null), []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      await appendFiles(Array.from(files));
      // 清空以便重复选择同一个文件
      event.target.value = "";
    },
    [appendFiles],
  );

  const handlePaste = React.useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;

        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }

      if (imageFiles.length === 0) return;

      // 剪贴板同时含文本时保留默认粘贴行为
      const hasText =
        event.clipboardData.types.includes("text/plain") &&
        event.clipboardData.getData("text/plain").length > 0;

      if (!hasText) event.preventDefault();

      await appendFiles(imageFiles);
    },
    [appendFiles],
  );

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDraggingOver(false);
  }, []);

  const handleDrop = React.useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingOver(false);

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;

      await appendFiles(Array.from(files));
    },
    [appendFiles],
  );

  return {
    attachments,
    error,
    clearError,
    isDraggingOver,
    appendFiles,
    removeAttachment,
    clearAttachments,
    handleFileChange,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
