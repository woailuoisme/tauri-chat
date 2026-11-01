import { Check, Copy, PanelRightOpen, Terminal } from "lucide-react";
import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock, CodeBlockContent, CodeBlockLine } from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { ARTIFACT_LANGUAGES, resolveArtifactType } from "@/lib/ai/artifacts";
import type { ArtifactItem } from "@/lib/ai/types";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/utils/clipboard";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function HighlightedCodeBlock({ code, language }: { code: string; language: string }) {
  const highlightedLines = useHighlightedCode(code, language);
  const openArtifact = useArtifactsStore((state) => state.openArtifact);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const normalizedLanguage = language.toLowerCase();
  const isArtifactCandidate = ARTIFACT_LANGUAGES.has(normalizedLanguage) || code.length > 120;

  const handleOpenArtifact = React.useCallback(() => {
    const artifact: ArtifactItem = {
      id: `art-${Math.random().toString(36).slice(2, 9)}`,
      title: `${language.toUpperCase()} Snippet`,
      type: resolveArtifactType(normalizedLanguage),
      language,
      content: code,
      versions: [{ version: 1, content: code, timestamp: Date.now() }],
      currentVersion: 1,
      createdAt: Date.now(),
    };

    openArtifact(artifact);
  }, [code, language, normalizedLanguage, openArtifact]);

  const handleCopy = React.useCallback(() => {
    copyText(code, "clipboard:code").then((ok) => ok && setCopied(true));
  }, [code]);

  return (
    <div className="border-border/60 bg-muted/20 my-3 overflow-hidden rounded-xl border shadow-xs">
      <div className="border-border/40 flex h-9 items-center justify-between border-b bg-[#1e1e21] px-3.5">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-neutral-400 uppercase select-none">
          <Terminal className="text-primary size-3.5" aria-hidden="true" />
          <span>{language || "code"}</span>
        </div>
        <div className="flex items-center gap-2">
          {isArtifactCandidate && (
            <button
              type="button"
              onClick={handleOpenArtifact}
              title="在 Artifacts 面板中打开"
              className="border-primary/30 bg-primary/10 hover:border-primary/50 hover:bg-primary/20 text-primary focus-visible:ring-ring flex h-6 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors select-none focus-visible:ring-2 focus-visible:outline-none"
            >
              <PanelRightOpen className="size-3.5" aria-hidden="true" />
              <span>Artifact</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "已复制" : "复制代码"}
            aria-label={copied ? "已复制代码" : "复制代码"}
            className="focus-visible:ring-ring flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <CodeBlock size="sm" className="border-0 bg-transparent">
        <CodeBlockContent
          lineNumbers
          // 跟随「正文字号」缩放：CodeBlock 根节点是 text-xs(rem)，
          // 用 em 会以 12px 为基准，所以这里直接消费派生变量
          className="py-2.5 font-mono text-(length:--chat-code-font-size)"
        >
          {highlightedLines.map((line, index) => (
            <CodeBlockLine key={index}>{line}</CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

/**
 * 行内代码与代码块的分发。
 * react-markdown v10 不再提供 `inline` 参数，只能依据 `language-*` 类名与换行判断。
 */
function CodeComponent({ className, children }: React.ComponentProps<"code">) {
  const match = /language-(\w+)/.exec(className ?? "");
  const language = match?.[1] ?? "";
  const codeString = String(children).replace(/\n$/, "");
  const isInline = !match && !codeString.includes("\n");

  if (isInline) {
    return (
      <code className="bg-muted/70 text-foreground border-border/40 rounded border px-1.5 py-0.5 font-mono text-[0.85em] font-medium">
        {children}
      </code>
    );
  }

  return <HighlightedCodeBlock code={codeString} language={language || "text"} />;
}

const LinkComponent = (props: React.ComponentProps<"a">) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
    {...props}
  />
);

const MARKDOWN_COMPONENTS: Components = {
  code: CodeComponent,
  a: LinkComponent,
};

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

function MarkdownRendererBase({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        // `prose` 排版依赖 @tailwindcss/typography，已在 global.css 通过 @plugin 启用
        "prose prose-sm dark:prose-invert text-foreground max-w-none font-sans leading-relaxed wrap-break-word selection:bg-primary/20",
        "prose-p:my-2.5 prose-p:leading-relaxed",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        // 用 em 而非固定 rem，标题才会跟随「字号」设置一起缩放
        "prose-h1:text-[1.5em] prose-h2:text-[1.25em] prose-h3:text-[1.125em]",
        "prose-ul:my-2 prose-ul:list-disc prose-ul:ps-5",
        "prose-ol:my-2 prose-ol:list-decimal prose-ol:ps-5",
        "prose-li:my-0.5",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
        "prose-table:block prose-table:overflow-x-auto prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-border/40",
        "prose-pre:bg-transparent prose-pre:p-0",
        className,
      )}
      // 行内样式优先级最高，确保「聊天字号」设置不受 prose-sm 覆盖
      style={{ fontSize: "var(--chat-font-size)" }}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Markdown 渲染。
 *
 * `memo` 让内容未变的消息跳过整棵 remark/rehype 解析树重建，
 * 这是长对话流式场景下的主要性能屏障。
 */
export const MarkdownRenderer = React.memo(MarkdownRendererBase);
MarkdownRenderer.displayName = "MarkdownRenderer";
