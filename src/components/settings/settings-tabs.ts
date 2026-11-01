import { AppWindow, Bell, Cpu, FolderKanban, Keyboard, Palette, Sliders } from "lucide-react";
import type * as React from "react";

export interface SettingsTabMeta {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** 设置面板的分类定义（顺序即导航顺序） */
export const SETTINGS_TABS: readonly SettingsTabMeta[] = [
  { id: "general", label: "通用", description: "桌面行为、全局唤起与系统集成", icon: Sliders },
  {
    id: "application",
    label: "应用",
    description: "输入方式、下载目录与本地数据",
    icon: AppWindow,
  },
  { id: "appearance", label: "外观", description: "主题、字号、代码字体与阅读宽度", icon: Palette },
  { id: "shortcuts", label: "快捷键", description: "已实现的键盘操作一览", icon: Keyboard },
  { id: "notifications", label: "通知", description: "系统横幅与完成提示音", icon: Bell },
  { id: "models", label: "模型", description: "Provider 密钥与推理参数", icon: Cpu },
  { id: "projects", label: "指令", description: "注入每次会话的系统提示词", icon: FolderKanban },
];

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"];

/** 把任意字符串收敛到合法的 tab id，避免持久化的脏数据导致面板空白 */
export function normalizeSettingsTab(tab: string): SettingsTabId {
  return SETTINGS_TABS.some((item) => item.id === tab) ? (tab as SettingsTabId) : "general";
}

/** 取分类元信息 */
export function getSettingsTab(tab: string): SettingsTabMeta {
  const id = normalizeSettingsTab(tab);
  return SETTINGS_TABS.find((item) => item.id === id) ?? SETTINGS_TABS[0];
}
