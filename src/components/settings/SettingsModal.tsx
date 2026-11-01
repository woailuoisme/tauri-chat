import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSettingsStore } from "@/lib/store/settings-store";

import { getSettingsTab, normalizeSettingsTab, type SettingsTabId } from "./settings-tabs";
import { SettingsNav } from "./SettingsNav";
import { AppearanceTab } from "./tabs/AppearanceTab";
import { ApplicationTab } from "./tabs/ApplicationTab";
import { GeneralTab } from "./tabs/GeneralTab";
import { ModelsTab } from "./tabs/ModelsTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { ShortcutsTab } from "./tabs/ShortcutsTab";

/** tab id → 面板组件。新增分类只需在此登记一行 */
const TAB_PANELS: Record<SettingsTabId, React.ComponentType> = {
  general: GeneralTab,
  application: ApplicationTab,
  appearance: AppearanceTab,
  shortcuts: ShortcutsTab,
  notifications: NotificationsTab,
  models: ModelsTab,
  projects: ProjectsTab,
};

/**
 * 设置面板外壳。
 *
 * 只负责导航与容器：具体设置项各自独立成组件，
 * 所有 OS 副作用集中在 `use-tauri-sync`，这里保持纯受控渲染。
 */
export function SettingsModal() {
  const isSettingsOpen = useSettingsStore((state) => state.isSettingsOpen);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);
  const activeSettingsTab = useSettingsStore((state) => state.activeSettingsTab);
  const setActiveSettingsTab = useSettingsStore((state) => state.setActiveSettingsTab);

  const activeTab = normalizeSettingsTab(activeSettingsTab);
  const tabMeta = getSettingsTab(activeTab);
  const ActivePanel = TAB_PANELS[activeTab];

  const handleSelectTab = React.useCallback(
    (tab: SettingsTabId) => setActiveSettingsTab(tab),
    [setActiveSettingsTab],
  );

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="border-border/70 bg-card w-[92vw] max-w-3xl gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-3xl">
        <DialogTitle className="sr-only">设置</DialogTitle>
        <DialogDescription className="sr-only">
          调整桌面行为、外观、模型接入与指令
        </DialogDescription>

        <div className="flex h-140">
          <SettingsNav activeTab={activeTab} onSelect={handleSelectTab} />

          <div className="flex-1 overflow-y-auto p-6 pr-10">
            <header className="mb-5 space-y-1">
              <h2 className="text-foreground text-sm font-semibold">{tabMeta.label}</h2>
              <p className="text-muted-foreground text-xs">{tabMeta.description}</p>
            </header>

            <ActivePanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
