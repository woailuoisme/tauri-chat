import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";

interface MarkdownPreviewProps {
  content: string;
}

/**
 * Markdown 预览。
 *
 * 直接复用对话区的渲染器，保证代码高亮、表格、KaTeX 与聊天里看到的一致。
 */
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="bg-background h-full overflow-auto px-6 py-5">
      <div className="mx-auto max-w-3xl">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
