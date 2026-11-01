import { ChevronDown, Code2, Eye, History, Layers, Maximize2, Minimize2, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canPreviewArtifact } from "@/lib/ai/artifacts";
import type { ArtifactItem } from "@/lib/ai/types";
import { useArtifactsStore } from "@/lib/store/artifacts-store";

import { CodeViewer } from "./CodeViewer";
import { MarkdownPreview } from "./MarkdownPreview";
import { MermaidViewer } from "./MermaidViewer";
import { SandboxPreview } from "./SandboxPreview";

type ViewMode = "preview" | "code";

/** 头部下方的内容区：按类型分派到对应渲染器 */
function ArtifactBody({ artifact, mode }: { artifact: ArtifactItem; mode: ViewMode }) {
  if (mode === "code" || !canPreviewArtifact(artifact.type)) {
    return (
      <CodeViewer
        code={artifact.content}
        language={artifact.language}
        filename={`${artifact.title.toLowerCase().replace(/\s+/g, "_")}.${artifact.language}`}
      />
    );
  }

  switch (artifact.type) {
    case "markdown":
      return <MarkdownPreview content={artifact.content} />;
    case "mermaid":
      return <MermaidViewer code={artifact.content} />;
    default:
      return <SandboxPreview content={artifact.content} type={artifact.type} />;
  }
}

export function ArtifactsPanel() {
  const activeArtifact = useArtifactsStore((state) => state.activeArtifact);
  const isOpen = useArtifactsStore((state) => state.isOpen);
  const viewMode = useArtifactsStore((state) => state.viewMode);
  const closeArtifact = useArtifactsStore((state) => state.closeArtifact);
  const setViewMode = useArtifactsStore((state) => state.setViewMode);
  const switchVersion = useArtifactsStore((state) => state.switchVersion);

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  if (!isOpen || !activeArtifact) return null;

  const previewable = canPreviewArtifact(activeArtifact.type);

  return (
    <div
      className={`border-border/70 bg-background flex h-full flex-col border-l transition-all ${
        isFullscreen ? "fixed inset-0 z-50" : "w-full"
      }`}
    >
      {/* Top Header Bar */}
      <div className="border-border/70 bg-muted/30 flex h-12 shrink-0 items-center justify-between border-b px-3 select-none">
        {/* Left: Artifact info */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="bg-primary/10 text-primary border-primary/20 flex size-7 shrink-0 items-center justify-center rounded-md border">
            <Layers className="size-4" />
          </div>

          <div className="min-w-0">
            <h2 className="text-foreground truncate text-xs font-semibold">
              {activeArtifact.title}
            </h2>
            <span className="text-muted-foreground font-mono text-[10px] uppercase">
              {activeArtifact.type} • {activeArtifact.language}
            </span>
          </div>

          {/* Versions dropdown */}
          {activeArtifact.versions.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-6 gap-1 rounded-md px-1.5 text-xs"
                >
                  <History className="size-3" />
                  <span>v{activeArtifact.currentVersion}</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuLabel className="text-xs">版本历史</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activeArtifact.versions.map((version) => (
                  <DropdownMenuItem
                    key={version.version}
                    onClick={() => switchVersion(version.version)}
                    className={`cursor-pointer text-xs ${
                      activeArtifact.currentVersion === version.version ? "bg-muted font-bold" : ""
                    }`}
                  >
                    版本 {version.version}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right: Controls & Tabs */}
        <div className="flex items-center gap-1.5">
          {/* 只有可预览的类型才显示切换：Code 在前，Preview 在后 */}
          {previewable && (
            <div
              role="group"
              aria-label="查看方式"
              className="bg-muted/60 border-border/40 flex items-center rounded-lg border p-0.5"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("code")}
                aria-pressed={viewMode === "code"}
                className={`h-6 gap-1 rounded-md px-2 text-xs ${
                  viewMode === "code"
                    ? "bg-background text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="size-3.5" aria-hidden="true" />
                <span>Code</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("preview")}
                aria-pressed={viewMode === "preview"}
                className={`h-6 gap-1 rounded-md px-2 text-xs ${
                  viewMode === "preview"
                    ? "bg-background text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="size-3.5" aria-hidden="true" />
                <span>Preview</span>
              </Button>
            </div>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            title={isFullscreen ? "退出全屏" : "全屏"}
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-3.5" aria-hidden="true" />
            )}
          </Button>

          {/* Close Panel Button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={closeArtifact}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            title="关闭面板"
            aria-label="关闭 Artifacts 面板"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ArtifactBody artifact={activeArtifact} mode={viewMode} />
      </div>
    </div>
  );
}
