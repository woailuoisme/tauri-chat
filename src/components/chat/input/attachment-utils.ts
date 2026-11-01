import type { ChatAttachment } from "@/lib/ai/types";

/** 附件体积上限：图片走 base64 会膨胀约 4/3，过大会拖慢一次请求 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_TEXT_BYTES = 1024 * 1024;
export const MAX_TOTAL_ATTACHMENTS = 6;

const TEXT_FILE_PATTERN = /\.(txt|md|json|ts|tsx|js|jsx|py|rs|html|css|yaml|yml|toml)$/i;

export type AttachmentResult =
  | { ok: true; attachment: ChatAttachment }
  | { ok: false; reason: string };

/** 生成附件 ID */
function createAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 判断附件是否为图片（历史数据可能只留下 type，载荷已被剥离） */
export function isImageAttachment(attachment: ChatAttachment): boolean {
  return Boolean(attachment.isImage || attachment.dataUrl || attachment.type?.startsWith("image/"));
}

/** 读取单个文件为附件；超出限制或读取失败时返回原因 */
export async function readFileAsAttachment(file: File): Promise<AttachmentResult> {
  const isImage = file.type.startsWith("image/");
  const id = createAttachmentId();

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, reason: `${file.name} 超过 ${MAX_IMAGE_BYTES / 1024 / 1024}MB，已跳过` };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        resolve({
          ok: true,
          attachment: {
            id,
            name: file.name || "image.png",
            size: file.size,
            type: file.type || "image/png",
            dataUrl: reader.result as string,
            isImage: true,
          },
        });
      });

      reader.addEventListener("error", () => {
        resolve({ ok: false, reason: `${file.name} 读取失败` });
      });

      reader.readAsDataURL(file);
    });
  }

  const readable = file.size <= MAX_TEXT_BYTES && TEXT_FILE_PATTERN.test(file.name);

  if (!readable) {
    if (file.size > MAX_TEXT_BYTES) {
      return { ok: false, reason: `${file.name} 超过 ${MAX_TEXT_BYTES / 1024 / 1024}MB，已跳过` };
    }

    return {
      ok: true,
      attachment: {
        id,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        isImage: false,
      },
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve({
        ok: true,
        attachment: {
          id,
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          content: reader.result as string,
          isImage: false,
        },
      });
    });

    reader.addEventListener("error", () => {
      resolve({ ok: false, reason: `${file.name} 读取失败` });
    });

    reader.readAsText(file);
  });
}
