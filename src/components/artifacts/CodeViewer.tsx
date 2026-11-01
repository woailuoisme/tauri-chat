import { Check, Copy, Download, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent, CodeBlockLine } from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { useSettingsStore } from "@/lib/store/settings-store";
import { saveTextFile } from "@/lib/tauri/fs";
import { copyText } from "@/lib/utils/clipboard";

interface CodeViewerProps {
  code: string;
  language: string;
  filename?: string;
}

export function CodeViewer({ code, language, filename }: CodeViewerProps) {
  const [copied, setCopied] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedPath, setSavedPath] = React.useState<string | null>(null);

  const lines = useHighlightedCode(code, language);
  const downloadPath = useSettingsStore((state) => state.downloadPath);

  React.useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  React.useEffect(() => {
    if (!savedPath) return;
    const timer = setTimeout(() => setSavedPath(null), 3000);
    return () => clearTimeout(timer);
  }, [savedPath]);

  const handleCopy = React.useCallback(() => {
    copyText(code, "clipboard:code").then((ok) => ok && setCopied(true));
  }, [code]);

  const handleDownload = React.useCallback(async () => {
    const targetName = filename || `artifact.${language || "txt"}`;

    setIsSaving(true);
    const ok = await saveTextFile(downloadPath, targetName, code);
    setIsSaving(false);

    if (ok) {
      setSavedPath(`${downloadPath.replace(/\/$/, "")}/${targetName}`);
    }
  }, [code, downloadPath, filename, language]);

  const lineCount = code.split("\n").length;

  return (
    <div className="bg-background relative flex h-full flex-col">
      <div className="border-border/50 bg-muted/20 flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground font-mono text-xs uppercase">
          {language} · {lineCount} 行
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span>{copied ? "已复制" : "复制"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleDownload()}
            disabled={isSaving}
            aria-busy={isSaving}
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
            title={`保存到 ${downloadPath}`}
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-3.5" aria-hidden="true" />
            )}
            <span>{isSaving ? "保存中" : "下载"}</span>
          </Button>
        </div>
      </div>

      {savedPath && (
        <p
          role="status"
          aria-live="polite"
          className="border-border/40 bg-muted/30 text-muted-foreground border-b px-4 py-1.5 font-mono text-[11px]"
        >
          已保存到 {savedPath}
        </p>
      )}

      <div className="flex-1 overflow-auto">
        <CodeBlock size="sm" className="h-full rounded-none border-0 bg-transparent">
          <CodeBlockContent lineNumbers className="h-full p-4 font-mono text-xs">
            {lines.map((line, index) => (
              <CodeBlockLine key={index}>{line}</CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      </div>
    </div>
  );
}
