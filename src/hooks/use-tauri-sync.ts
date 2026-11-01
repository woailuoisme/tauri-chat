import * as React from "react";

import { resolveCodeFontStack, useSettingsStore } from "@/lib/store/settings-store";
import {
  setupCloseToTray,
  syncAlwaysOnTop,
  syncGlobalShortcut,
  syncLaunchOnStartup,
} from "@/lib/tauri/window";

/**
 * 把「设置项」落到真实的 OS 行为。
 *
 * 所有副作用集中在这一个 hook 里，`SettingsModal` 保持纯受控组件，
 * 新增设置项只需在这里补一支 `useEffect`。
 */
export function useTauriSync(): void {
  const launchOnStartup = useSettingsStore((state) => state.launchOnStartup);
  const keepWindowOnTop = useSettingsStore((state) => state.keepWindowOnTop);
  const closeToTray = useSettingsStore((state) => state.closeToTray);
  const globalShortcut = useSettingsStore((state) => state.globalShortcut);
  const globalShortcutEnabled = useSettingsStore((state) => state.globalShortcutEnabled);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const codeFont = useSettingsStore((state) => state.codeFont);

  // 字号：以 data 属性驱动 global.css 中的 --chat-font-size
  React.useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  // 代码字体：覆盖 :root 上的 --font-mono，Tailwind 的 font-mono 工具类随之生效
  React.useEffect(() => {
    document.documentElement.style.setProperty("--font-mono", resolveCodeFontStack(codeFont));
  }, [codeFont]);

  React.useEffect(() => {
    void syncLaunchOnStartup(launchOnStartup);
  }, [launchOnStartup]);

  React.useEffect(() => {
    void syncAlwaysOnTop(keepWindowOnTop);
  }, [keepWindowOnTop]);

  React.useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;

    void setupCloseToTray(closeToTray).then((unlisten) => {
      if (cancelled) {
        unlisten();
        return;
      }
      dispose = unlisten;
    });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [closeToTray]);

  React.useEffect(() => {
    let dispose: (() => Promise<void>) | null = null;
    let cancelled = false;

    void syncGlobalShortcut(globalShortcut, globalShortcutEnabled).then((unregister) => {
      if (cancelled) {
        void unregister();
        return;
      }
      dispose = unregister;
    });

    return () => {
      cancelled = true;
      void dispose?.();
    };
  }, [globalShortcut, globalShortcutEnabled]);
}
