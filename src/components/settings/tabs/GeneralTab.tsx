import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  IS_LANGUAGE_SWITCH_SUPPORTED,
  useSettingsStore,
  type AppLanguage,
} from "@/lib/store/settings-store";

import { SegmentedControl } from "../SegmentedControl";
import { SettingCard, SettingRow } from "../SettingCard";

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: AppLanguage; label: string; disabled?: boolean }> = [
  { value: "zh", label: "简体中文", disabled: !IS_LANGUAGE_SWITCH_SUPPORTED },
  { value: "en", label: "English", disabled: !IS_LANGUAGE_SWITCH_SUPPORTED },
];

export function GeneralTab() {
  const launchOnStartup = useSettingsStore((state) => state.launchOnStartup);
  const setLaunchOnStartup = useSettingsStore((state) => state.setLaunchOnStartup);
  const keepWindowOnTop = useSettingsStore((state) => state.keepWindowOnTop);
  const setKeepWindowOnTop = useSettingsStore((state) => state.setKeepWindowOnTop);
  const closeToTray = useSettingsStore((state) => state.closeToTray);
  const setCloseToTray = useSettingsStore((state) => state.setCloseToTray);
  const globalShortcut = useSettingsStore((state) => state.globalShortcut);
  const setGlobalShortcut = useSettingsStore((state) => state.setGlobalShortcut);
  const globalShortcutEnabled = useSettingsStore((state) => state.globalShortcutEnabled);
  const setGlobalShortcutEnabled = useSettingsStore((state) => state.setGlobalShortcutEnabled);
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  return (
    <div className="space-y-4">
      <SettingCard
        title="全局唤起"
        description="在任何应用中按快捷键把窗口拉到前台。"
        footnote="默认关闭：系统级快捷键会抢占其他应用，需手动开启。支持 Alt / Option / CommandOrControl / Shift 与字母、功能键组合。"
      >
        <div className="space-y-3">
          <SettingRow
            label="启用全局唤起"
            description="开启后才会向系统注册下面的组合键。"
            htmlFor="global-shortcut-enabled"
          >
            <Switch
              id="global-shortcut-enabled"
              checked={globalShortcutEnabled}
              onCheckedChange={setGlobalShortcutEnabled}
            />
          </SettingRow>

          <div>
            <Label htmlFor="global-shortcut" className="sr-only">
              全局唤起快捷键
            </Label>
            <Input
              id="global-shortcut"
              aria-label="全局唤起快捷键"
              value={globalShortcut}
              onChange={(event) => setGlobalShortcut(event.target.value)}
              placeholder="Option+Space"
              disabled={!globalShortcutEnabled}
              className="bg-background h-8 font-mono text-xs disabled:opacity-50"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="桌面系统集成">
        <div className="divide-border/40 divide-y">
          <SettingRow
            label="开机自启"
            description="登录 macOS 时自动启动应用。"
            htmlFor="launch-on-startup"
            className="pb-3"
          >
            <Switch
              id="launch-on-startup"
              checked={launchOnStartup}
              onCheckedChange={setLaunchOnStartup}
            />
          </SettingRow>

          <SettingRow
            label="窗口置顶"
            description="让窗口始终浮在其他应用之上。"
            htmlFor="keep-on-top"
            className="py-3"
          >
            <Switch
              id="keep-on-top"
              checked={keepWindowOnTop}
              onCheckedChange={setKeepWindowOnTop}
            />
          </SettingRow>

          <SettingRow
            label="关闭窗口时隐藏到托盘"
            description="关闭后进程继续驻留，点击 Dock 图标可重新唤回。"
            htmlFor="close-to-tray"
            className="pt-3"
          >
            <Switch id="close-to-tray" checked={closeToTray} onCheckedChange={setCloseToTray} />
          </SettingRow>
        </div>
      </SettingCard>

      <SettingCard
        title="界面语言"
        description="当前所有文案均为中英双语硬编码。"
        footnote="完整国际化（i18n）尚未接入，故此处暂时禁用，避免展示不生效的开关。"
      >
        <SegmentedControl
          ariaLabel="界面语言"
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={setLanguage}
        />
      </SettingCard>
    </div>
  );
}
