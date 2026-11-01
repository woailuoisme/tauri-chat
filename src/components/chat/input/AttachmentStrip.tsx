import { Paperclip, X } from "lucide-react";

import type { ChatAttachment } from "@/lib/ai/types";

interface AttachmentStripProps {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}

/** 待发送附件预览：图片走缩略图，其余走文件名胶囊 */
export function AttachmentStrip({ attachments, onRemove }: AttachmentStripProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mb-2.5 flex flex-wrap gap-2.5">
      {attachments.map((file) =>
        file.dataUrl ? (
          <div
            key={file.id}
            className="group relative flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-neutral-900 shadow-md transition-all hover:border-white/30"
          >
            <img src={file.dataUrl} alt={file.name} className="size-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-1 left-1.5 max-w-[calc(100%-12px)] truncate font-mono text-[9px] text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white/90 shadow-xs backdrop-blur-xs transition-colors hover:bg-red-500 hover:text-white focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              aria-label={`移除图片 ${file.name}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div
            key={file.id}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#252528] px-3 py-1.5 text-xs text-neutral-200 shadow-xs"
          >
            <Paperclip className="text-primary size-3.5" aria-hidden="true" />
            <span className="max-w-40 truncate">{file.name}</span>
            <span className="font-mono text-[10px] text-neutral-400">
              ({Math.round(file.size / 1024)}KB)
            </span>
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="focus-visible:ring-ring ml-1 cursor-pointer rounded p-0.5 text-neutral-400 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
              aria-label={`移除附件 ${file.name}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ),
      )}
    </div>
  );
}
