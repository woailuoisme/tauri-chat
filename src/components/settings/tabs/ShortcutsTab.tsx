import * as React from "react";

import { useSettingsStore } from "@/lib/store/settings-store";

import { SettingCard } from "../SettingCard";

interface ShortcutEntry {
  action: string;
  keys: string[];
  /** 系统级快捷键由 Tauri 全局注册，即使窗口失焦也生效 */
  scope: "应用内" | "系统级";
}

export function ShortcutsTab() {
  const sendKey = useSettingsStore((state) => state.sendKey);
  const globalShortcut = useSettingsStore((state) => state.globalShortcut);
  const globalShortcutEnabled = useSettingsStore((state) => state.globalShortcutEnabled);

  const shortcuts = React.useMemo<ShortcutEntry[]>(
    () => [
      { action: "新建会话", keys: ["⌘", "N"], scope: "应用内" },
      { action: "命令面板 / 搜索", keys: ["⌘", "K"], scope: "应用内" },
      { action: "设置", keys: ["⌘", ","], scope: "应用内" },
      { action: "折叠 / 展开侧边栏", keys: ["⌘", "B"], scope: "应用内" },
      { action: "切换 Artifacts 分栏", keys: ["⌘", "J"], scope: "应用内" },
      {
        action: "发送消息",
        keys: sendKey === "enter" ? ["Enter"] : ["⌘", "Enter"],
        scope: "应用内",
      },
      { action: "在输入框内换行", keys: ["⇧", "Enter"], scope: "应用内" },
      { action: "打断正在生成的回复", keys: ["Esc"], scope: "应用内" },
      {
        // 未开启时如实显示数组，避免看起来已经生效
        action: globalShortcutEnabled ? "全局唤起窗口" : "全局唤起窗口（未启用）",
        keys: [globalShortcut],
        scope: "系统级",
      },
    ],
    [globalShortcut, globalShortcutEnabled, sendKey],
  );

  return (
    <SettingCard title="键盘快捷键" description="以下快捷键均已接入真实行为。" className="p-0">
      <div className="divide-border/40 divide-y">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.action}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
          >
            <div className="min-w-0">
              <div className="text-foreground font-medium">{shortcut.action}</div>
              <div className="text-muted-foreground text-[10px]">{shortcut.scope}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {shortcut.keys.map((key, index) => (
                <kbd
                  key={`${shortcut.action}-${index}`}
                  className="border-border/70 bg-background text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[11px] font-semibold shadow-2xs"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SettingCard>
  );
}
