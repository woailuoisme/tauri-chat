import { cn } from "@/lib/utils";

import { SETTINGS_TABS, type SettingsTabId } from "./settings-tabs";

interface SettingsNavProps {
  activeTab: SettingsTabId;
  onSelect: (tab: SettingsTabId) => void;
}

/** 设置面板左侧分类导航 */
export function SettingsNav({ activeTab, onSelect }: SettingsNavProps) {
  return (
    <nav
      aria-label="设置分类"
      className="border-border/60 bg-muted/30 flex w-52 shrink-0 flex-col justify-between border-r p-3 select-none"
    >
      <div className="space-y-1">
        <div className="text-foreground px-2.5 py-1.5 text-xs font-semibold tracking-tight">
          设置
        </div>

        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "bg-muted text-foreground font-medium shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-70" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="text-muted-foreground/60 border-border/40 border-t px-2.5 py-2 text-[10px]">
        Starter v0.1.0 · Tauri 2
      </div>
    </nav>
  );
}
