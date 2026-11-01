import {
  CODE_FONT_FAMILIES,
  useSettingsStore,
  type AppFontSize,
  type AppTheme,
  type ChatWidth,
} from "@/lib/store/settings-store";

import { SegmentedControl } from "../SegmentedControl";
import { SettingCard } from "../SettingCard";

const THEME_OPTIONS: ReadonlyArray<{ value: AppTheme; label: string }> = [
  { value: "dark", label: "深色" },
  { value: "light", label: "浅色" },
  { value: "system", label: "跟随系统" },
];

const FONT_SIZE_OPTIONS: ReadonlyArray<{ value: AppFontSize; label: string }> = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

const CHAT_WIDTH_OPTIONS: ReadonlyArray<{ value: ChatWidth; label: string }> = [
  { value: "standard", label: "标准" },
  { value: "wide", label: "宽" },
  { value: "full", label: "全宽" },
];

const CODE_FONT_OPTIONS = CODE_FONT_FAMILIES.map((font) => ({ value: font, label: font }));

export function AppearanceTab() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const codeFont = useSettingsStore((state) => state.codeFont);
  const setCodeFont = useSettingsStore((state) => state.setCodeFont);
  const chatWidth = useSettingsStore((state) => state.chatWidth);
  const setChatWidth = useSettingsStore((state) => state.setChatWidth);

  return (
    <div className="space-y-4">
      <SettingCard title="主题模式" description="「跟随系统」会响应 macOS 外观切换。">
        <SegmentedControl
          ariaLabel="主题模式"
          value={theme}
          options={THEME_OPTIONS}
          onChange={setTheme}
        />
      </SettingCard>

      <SettingCard title="正文字号" description="仅作用于对话内容，不改变界面尺寸。">
        <SegmentedControl
          ariaLabel="正文字号"
          value={fontSize}
          options={FONT_SIZE_OPTIONS}
          onChange={setFontSize}
        />
      </SettingCard>

      <SettingCard title="代码字体" description="应用于代码块、Artifacts 代码视图与消息输入框。">
        <SegmentedControl
          ariaLabel="代码字体"
          value={codeFont}
          options={CODE_FONT_OPTIONS}
          onChange={setCodeFont}
          className="flex-wrap"
        />
      </SettingCard>

      <SettingCard title="对话宽度" description="内容区最大宽度，影响长表格与代码块的可读性。">
        <SegmentedControl
          ariaLabel="对话宽度"
          value={chatWidth}
          options={CHAT_WIDTH_OPTIONS}
          onChange={setChatWidth}
        />
      </SettingCard>

      <SettingCard title="字号预览" description="下方为对话区的实际渲染效果。">
        <div className="border-border/50 bg-background space-y-2 rounded-lg border p-3">
          <p
            className="text-foreground leading-relaxed"
            style={{ fontSize: "var(--chat-font-size)" }}
          >
            正文字号预览：Rust 通过借用检查器在编译期排除数据竞争，无需运行时 GC。
          </p>
          <code
            className="text-muted-foreground block font-mono"
            style={{ fontSize: "var(--chat-code-font-size)" }}
          >
            const total = items.reduce((sum, item) =&gt; sum + item.price, 0);
          </code>
        </div>
      </SettingCard>
    </div>
  );
}
