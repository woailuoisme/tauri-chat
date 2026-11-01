import { Globe, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { WebSource } from "@/lib/ai/types";

interface CitationsBlockProps {
  sources: WebSource[];
  defaultOpen?: boolean;
}

export function CitationsBlock({ sources, defaultOpen = false }: CitationsBlockProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="my-2 w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
          >
            <Globe className="text-primary/70 size-3.5" />
            <span className="font-medium">
              Searched the web, read {sources.length} {sources.length === 1 ? "page" : "pages"}
            </span>
            {isOpen ? (
              <ChevronDown className="size-3.5 opacity-60" />
            ) : (
              <ChevronRight className="size-3.5 opacity-60" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-1.5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {sources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border-border/40 bg-card/60 hover:border-primary/40 hover:bg-muted/40 flex items-start gap-2 rounded-lg border p-2 text-xs transition-colors"
              >
                <div className="bg-muted text-muted-foreground mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[10px]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground group-hover:text-primary truncate font-medium">
                    {source.title}
                  </div>
                  <div className="text-muted-foreground truncate text-[10px]">
                    {source.url.replace(/^https?:\/\//, "")}
                  </div>
                </div>
                <ExternalLink className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
