import { AlertTriangle, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import mermaid from "mermaid";
import * as React from "react";

import { Button } from "@/components/ui/button";

// 全局只初始化一次。
// 之前放在 useEffect 内，每次 code 变化都会重设全局配置，属于隐式副作用。
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  // 图表内容来自 LLM 输出，属于不可信输入：
  // strict 会过滤 HTML 标签与 script 链接，避免注入到主文档上下文。
  securityLevel: "strict",
  fontFamily: "Inter, sans-serif",
  suppressErrorRendering: true,
});

interface MermaidViewerProps {
  code: string;
}

export function MermaidViewer({ code }: MermaidViewerProps) {
  const [svgHtml, setSvgHtml] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);

  // useId 保证 SSR/并发渲染下的稳定唯一前缀（去掉冒号以满足 mermaid 的 id 规则）
  const reactId = React.useId();
  const idPrefix = React.useMemo(() => `mermaid-${reactId.replace(/:/g, "")}`, [reactId]);

  React.useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      try {
        setError(null);
        // mermaid.render 要求每次调用使用不同 id，否则会复用旧节点
        const { svg } = await mermaid.render(`${idPrefix}-${Date.now()}`, code);
        if (!cancelled) setSvgHtml(svg);
      } catch (renderError: unknown) {
        if (cancelled) return;
        setSvgHtml("");
        setError(renderError instanceof Error ? renderError.message : String(renderError));
      }
    };

    void renderChart();

    return () => {
      cancelled = true;
    };
  }, [code, idPrefix]);

  return (
    <div className="bg-background relative flex h-full flex-col">
      <div className="border-border/50 bg-muted/20 flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground text-xs">Mermaid 图表</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom((current) => Math.min(current + 0.2, 2.5))}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            aria-label="放大"
            title="放大"
          >
            <ZoomIn className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom((current) => Math.max(current - 0.2, 0.4))}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            aria-label="缩小"
            title="缩小"
          >
            <ZoomOut className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom(1)}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            aria-label="重置缩放"
            title="重置缩放"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        {error ? (
          // 渲染失败降级为源码视图，让用户仍能复制/修改
          <div className="w-full max-w-2xl space-y-2">
            <div
              role="alert"
              aria-live="assertive"
              className="text-destructive flex items-center gap-2 text-xs"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span className="font-semibold">Mermaid 渲染失败，已降级为源码视图</span>
            </div>
            <pre className="border-border/60 bg-muted/30 text-muted-foreground overflow-auto rounded-lg border p-3 font-mono text-[11px] whitespace-pre-wrap">
              {code}
            </pre>
            <p className="text-muted-foreground text-[11px]">{error}</p>
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="transition-transform duration-150"
            // mermaid 在 securityLevel: "strict" 下已对输出做净化
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>
    </div>
  );
}
