import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/store/settings-store";

import { SettingCard } from "../SettingCard";

export function ProjectsTab() {
  const systemPrompt = useSettingsStore((state) => state.systemPrompt);
  const setSystemPrompt = useSettingsStore((state) => state.setSystemPrompt);

  return (
    <div className="space-y-4">
      <SettingCard
        title="全局系统指令"
        description="每次请求都会作为 system message 注入，用于统一模型的语气与格式。"
        footnote="留空则不发送 system message。修改即时生效，无需重启。"
      >
        <Label htmlFor="system-prompt" className="sr-only">
          系统指令
        </Label>
        <textarea
          id="system-prompt"
          rows={10}
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          placeholder="例如：始终使用简体中文回答，代码块标注语言。"
          className="border-border/70 bg-background text-foreground focus:ring-primary/40 w-full resize-none rounded-lg p-3 text-xs leading-relaxed focus:ring-1 focus:outline-none"
        />
      </SettingCard>
    </div>
  );
}
