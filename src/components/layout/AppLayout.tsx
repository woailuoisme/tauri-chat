import * as React from "react";

import { ErrorBoundary, PanelErrorFallback } from "@/components/common/ErrorBoundary";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAppShortcuts } from "@/hooks/use-app-shortcuts";
import { useTauriSync } from "@/hooks/use-tauri-sync";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";

import { ArtifactsPanel } from "../artifacts/ArtifactsPanel";
import { ChatArea } from "../chat/ChatArea";
import { CommandPalette } from "../search/CommandPalette";
import { SettingsModal } from "../settings/SettingsModal";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const isArtifactsOpen = useArtifactsStore((state) => state.isOpen);
  const theme = useSettingsStore((state) => state.theme);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // 把设置项落到真实 OS 行为（自启 / 置顶 / 托盘 / 全局快捷键 / 字号 / 代码字体）
  useTauriSync();

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen((previous) => !previous);
  }, []);

  useAppShortcuts({ onToggleSidebar: toggleSidebar });

  // 主题：system 模式下必须持续跟随系统变化，而不是只在挂载时读一次
  React.useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const shouldUseDark = theme === "dark" || (theme === "system" && media.matches);
      root.classList.toggle("dark", shouldUseDark);
    };

    applyTheme();

    if (theme !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  return (
    <div className="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans">
      {/* 跳过导航：键盘用户可一键越过侧边栏直达对话区 */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:px-3 focus:py-1.5 focus:text-xs"
      >
        跳到主内容
      </a>

      {isSidebarOpen && <AppSidebar />}

      <main id="main-content" className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-hidden">
          {isArtifactsOpen ? (
            <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
              <ResizablePanel defaultSize={55} minSize={30}>
                <ErrorBoundary
                  fallback={<PanelErrorFallback label="对话区" />}
                  resetKeys={[activeConversationId]}
                >
                  <ChatArea />
                </ErrorBoundary>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={30}>
                <ErrorBoundary fallback={<PanelErrorFallback label="Artifacts 面板" />}>
                  <ArtifactsPanel />
                </ErrorBoundary>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <ErrorBoundary
              fallback={<PanelErrorFallback label="对话区" />}
              resetKeys={[activeConversationId]}
            >
              <ChatArea />
            </ErrorBoundary>
          )}
        </div>
      </main>

      <CommandPalette />
      <SettingsModal />
    </div>
  );
}
