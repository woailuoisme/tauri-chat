import * as React from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageLightboxProps {
  /** 为 null 时关闭 */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * 图片放大预览。
 *
 * 复用 `ui/dialog`（Radix）以获得焦点陷阱、Escape 关闭与关闭后焦点归还，
 * 避免手写遮罩层带来的可访问性缺口。
 */
export function ImageLightbox({ src, alt = "图片预览", onClose }: ImageLightboxProps) {
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={src !== null} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        aria-describedby={undefined}
        className="max-w-[92vw] gap-0 border border-white/10 bg-[#141416] p-2 sm:max-w-[92vw]"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] w-full rounded-lg object-contain"
            draggable={false}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
