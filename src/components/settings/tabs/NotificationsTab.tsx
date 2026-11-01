import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/lib/store/settings-store";

import { SettingCard, SettingRow } from "../SettingCard";

export function NotificationsTab() {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);

  return (
    <div className="space-y-4">
      <SettingCard title="完成提醒">
        <div className="divide-border/40 divide-y">
          <SettingRow
            label="系统通知"
            description="回复完成且窗口不在前台时发送 macOS 通知。"
            htmlFor="notifications-enabled"
            className="pb-3"
          >
            <Switch
              id="notifications-enabled"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </SettingRow>

          <SettingRow
            label="完成提示音"
            description="生成结束时播放一声轻提示。"
            htmlFor="sound-enabled"
            className="pt-3"
          >
            <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </SettingRow>
        </div>
      </SettingCard>
    </div>
  );
}
