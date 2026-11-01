import * as React from "react";

import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";

interface AppShortcutHandlers {
  /** ⌘B 折叠 / 展开侧边栏 */
  onToggleSidebar: () => void;
}

/**
 * 应用级快捷键。
 *
 * 集中在一处注册，避免各组件各自 `window.addEventListener` 造成重复绑定。
 * 已实现：⌘N 新建会话、⌘K 命令面板、⌘, 设置、⌘B 侧边栏、⌘J Artifacts。
 * （Esc 打断生成由 ChatArea 处理，因为它需要 AbortController 引用。）
 */
export function useAppShortcuts({ onToggleSidebar }: AppShortcutHandlers): void {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;

      switch (event.key.toLowerCase()) {
        case "n": {
          event.preventDefault();
          const { selectedModelId } = useSettingsStore.getState();
          useChatStore.getState().createConversation(selectedModelId);
          break;
        }
        case "k": {
          event.preventDefault();
          const chat = useChatStore.getState();
          chat.setCommandPaletteOpen(!chat.isCommandPaletteOpen);
          break;
        }
        case ",": {
          event.preventDefault();
          const settings = useSettingsStore.getState();
          settings.setIsSettingsOpen(!settings.isSettingsOpen);
          break;
        }
        case "b": {
          event.preventDefault();
          onToggleSidebar();
          break;
        }
        case "j": {
          event.preventDefault();
          useArtifactsStore.getState().togglePanel();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleSidebar]);
}
