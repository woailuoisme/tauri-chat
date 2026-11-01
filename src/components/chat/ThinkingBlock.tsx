import { BrainCircuit, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
  /** 由上层统计的思考耗时（秒）；提供时以其为准 */
  duration?: number;
  defaultOpen?: boolean;
}

export function ThinkingBlock({
  thinking,
  isStreaming = false,
  duration,
  defaultOpen = false,
}: ThinkingBlockProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [localSeconds, setLocalSeconds] = React.useState(0);

  // 上层未提供 duration 时才本地计时，避免与 store 中的统计双重累加
  React.useEffect(() => {
    if (!isStreaming || duration !== undefined) return;

    const timer = setInterval(() => setLocalSeconds((previous) => previous + 1), 1000);
    return () => clearInterval(timer);
  }, [duration, isStreaming]);

  const seconds = duration ?? localSeconds;

  if (!thinking && !isStreaming) return null;

  return (
    <div className="my-2.5 w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "group border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isStreaming && "border-primary/30 bg-primary/5 text-primary",
            )}
          >
            {isStreaming ? (
              <Loader2 className="text-primary size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <BrainCircuit
                className="text-muted-foreground group-hover:text-foreground size-3.5"
                aria-hidden="true"
              />
            )}

            <span className="font-medium">
              {isStreaming
                ? `思考中…（${seconds}s）`
                : seconds > 0
                  ? `已思考 ${seconds} 秒`
                  : "查看思考过程"}
            </span>

            {isOpen ? (
              <ChevronDown
                className="size-3.5 opacity-60 group-hover:opacity-100"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="size-3.5 opacity-60 group-hover:opacity-100"
                aria-hidden="true"
              />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2.5">
          <div className="border-border/40 bg-muted/20 text-muted-foreground relative rounded-lg border px-4 py-3 font-sans text-sm leading-relaxed">
            <div className="selection:bg-primary/20 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {thinking || (isStreaming ? "正在构建推理路径…" : "")}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
