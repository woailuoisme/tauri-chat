import { Code, Compass, FileText, Lightbulb, Sparkles } from "lucide-react";
import * as React from "react";

interface Suggestion {
  prompt: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SUGGESTIONS: readonly Suggestion[] = [
  {
    prompt: "Write an interactive React Counter app with Tailwind CSS styling.",
    title: "Build interactive React app",
    description: "生成可实时预览的 Artifacts 组件",
    icon: Code,
  },
  {
    prompt: "Create a Mermaid sequence diagram explaining OAuth 2.0 PKCE flow.",
    title: "Diagram OAuth 2.0 PKCE",
    description: "渲染矢量 Mermaid 图表",
    icon: Compass,
  },
  {
    prompt: "Explain how Rust ownership and borrowing prevents data races at compile time.",
    title: "Rust Borrowing Deep-Dive",
    description: "深入内存模型与所有权规则",
    icon: Lightbulb,
  },
  {
    prompt: "Draft a concise product release email for a developer tool 2.0 launch.",
    title: "Draft Product Announcement",
    description: "简洁有说服力的发布文案",
    icon: FileText,
  },
];

interface SuggestionGridProps {
  modelName: string;
  /** 是否展示「Extended Thinking」后缀 */
  showThinkingBadge: boolean;
  onPick: (prompt: string) => void;
}

/** 空会话的问候区与建议卡片，纯展示组件 */
export function SuggestionGrid({ modelName, showThinkingBadge, onPick }: SuggestionGridProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center select-none sm:py-24">
      <div className="bg-primary/10 text-primary border-primary/20 mb-4 flex size-14 items-center justify-center rounded-2xl border shadow-xs">
        <Sparkles className="size-7" aria-hidden="true" />
      </div>

      <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
        今天想让我帮你做什么？
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        由 <span className="text-foreground font-semibold">{modelName}</span> 驱动
        {showThinkingBadge ? " · 已开启深度思考" : null}
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;

          return (
            <button
              key={suggestion.prompt}
              type="button"
              onClick={() => onPick(suggestion.prompt)}
              className="group border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/50 focus-visible:ring-ring flex items-start gap-2.5 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="text-foreground group-hover:text-primary block text-sm font-medium">
                  {suggestion.title}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {suggestion.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
