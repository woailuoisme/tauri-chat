import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { persistApiKey, useSettingsStore, type ReasoningEffort } from "@/lib/store/settings-store";
import type { ApiKeyProvider } from "@/lib/tauri/secure-store";

import { SegmentedControl } from "../SegmentedControl";
import { SettingCard, SettingRow } from "../SettingCard";

const EFFORT_OPTIONS: ReadonlyArray<{ value: ReasoningEffort; label: string }> = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];

interface ProviderCardProps {
  provider: ApiKeyProvider;
  title: string;
  description: string;
  keyPlaceholder: string;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  baseUrlPlaceholder: string;
  tone?: "default" | "primary";
  footer?: React.ReactNode;
}

/**
 * 单个 Provider 的配置卡片。
 * API Key 只在离焦时写入钥匙串，避免每次按键都触发一次系统调用。
 */
function ProviderCard({
  provider,
  title,
  description,
  keyPlaceholder,
  apiKey,
  onApiKeyChange,
  baseUrl,
  onBaseUrlChange,
  baseUrlPlaceholder,
  tone = "default",
  footer,
}: ProviderCardProps) {
  const keyInputId = `api-key-${provider}`;
  const baseUrlInputId = `api-base-url-${provider}`;

  const handleBlur = React.useCallback(() => {
    void persistApiKey(provider, apiKey);
  }, [apiKey, provider]);

  return (
    <SettingCard title={title} description={description} tone={tone} footnote={footer}>
      <div className="space-y-2">
        <Label htmlFor={keyInputId} className="text-muted-foreground text-[11px]">
          API Key
        </Label>
        <Input
          id={keyInputId}
          type="password"
          placeholder={keyPlaceholder}
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          onBlur={handleBlur}
          autoComplete="off"
          className="bg-background h-8 font-mono text-xs"
        />

        <Label htmlFor={baseUrlInputId} className="text-muted-foreground pt-1 text-[11px]">
          Base URL
        </Label>
        <Input
          id={baseUrlInputId}
          type="text"
          placeholder={baseUrlPlaceholder}
          value={baseUrl}
          onChange={(event) => onBaseUrlChange(event.target.value)}
          className="bg-background h-8 font-mono text-xs"
        />
      </div>
    </SettingCard>
  );
}

export function ModelsTab() {
  const openrouterApiKey = useSettingsStore((state) => state.openrouterApiKey);
  const setOpenrouterApiKey = useSettingsStore((state) => state.setOpenrouterApiKey);
  const openrouterBaseUrl = useSettingsStore((state) => state.openrouterBaseUrl);
  const setOpenrouterBaseUrl = useSettingsStore((state) => state.setOpenrouterBaseUrl);

  const deepseekApiKey = useSettingsStore((state) => state.deepseekApiKey);
  const setDeepseekApiKey = useSettingsStore((state) => state.setDeepseekApiKey);
  const deepseekBaseUrl = useSettingsStore((state) => state.deepseekBaseUrl);
  const setDeepseekBaseUrl = useSettingsStore((state) => state.setDeepseekBaseUrl);

  const openaiApiKey = useSettingsStore((state) => state.openaiApiKey);
  const setOpenaiApiKey = useSettingsStore((state) => state.setOpenaiApiKey);
  const openaiBaseUrl = useSettingsStore((state) => state.openaiBaseUrl);
  const setOpenaiBaseUrl = useSettingsStore((state) => state.setOpenaiBaseUrl);

  const customApiKey = useSettingsStore((state) => state.customApiKey);
  const setCustomApiKey = useSettingsStore((state) => state.setCustomApiKey);
  const customBaseUrl = useSettingsStore((state) => state.customBaseUrl);
  const setCustomBaseUrl = useSettingsStore((state) => state.setCustomBaseUrl);

  const thinkingEnabled = useSettingsStore((state) => state.thinkingEnabled);
  const setThinkingEnabled = useSettingsStore((state) => state.setThinkingEnabled);
  const reasoningEffort = useSettingsStore((state) => state.reasoningEffort);
  const setReasoningEffort = useSettingsStore((state) => state.setReasoningEffort);
  const thinkingBudget = useSettingsStore((state) => state.thinkingBudget);
  const setThinkingBudget = useSettingsStore((state) => state.setThinkingBudget);

  return (
    <div className="space-y-4">
      <ProviderCard
        provider="openrouter"
        title="OpenRouter（推荐）"
        description="一个 Key 访问 Claude、GPT、Gemini、DeepSeek 等数百款模型，含免费端点。"
        keyPlaceholder="sk-or-v1-…"
        apiKey={openrouterApiKey}
        onApiKeyChange={setOpenrouterApiKey}
        baseUrl={openrouterBaseUrl}
        onBaseUrlChange={setOpenrouterBaseUrl}
        baseUrlPlaceholder="https://openrouter.ai/api/v1"
        tone="primary"
        footer="密钥保存在 macOS 钥匙串，不会写入 WebView 的 localStorage。"
      />

      <ProviderCard
        provider="deepseek"
        title="DeepSeek 官方直连"
        description="低延迟、低成本，原生支持思考模式切换。"
        keyPlaceholder="sk-…"
        apiKey={deepseekApiKey}
        onApiKeyChange={setDeepseekApiKey}
        baseUrl={deepseekBaseUrl}
        onBaseUrlChange={setDeepseekBaseUrl}
        baseUrlPlaceholder="https://api.deepseek.com"
      />

      <ProviderCard
        provider="openai"
        title="OpenAI 直连"
        description="直接使用 OpenAI 官方端点。"
        keyPlaceholder="sk-…"
        apiKey={openaiApiKey}
        onApiKeyChange={setOpenaiApiKey}
        baseUrl={openaiBaseUrl}
        onBaseUrlChange={setOpenaiBaseUrl}
        baseUrlPlaceholder="https://api.openai.com/v1"
      />

      <ProviderCard
        provider="custom"
        title="本地 / 自建端点"
        description="兼容 OpenAI 协议的服务，例如 Ollama、vLLM、LM Studio。"
        keyPlaceholder="ollama"
        apiKey={customApiKey}
        onApiKeyChange={setCustomApiKey}
        baseUrl={customBaseUrl}
        onBaseUrlChange={setCustomBaseUrl}
        baseUrlPlaceholder="http://localhost:11434/v1"
      />

      <SettingCard title="推理参数" description="控制模型在回答前的思考预算。">
        <div className="divide-border/40 divide-y">
          <SettingRow
            label="启用深度思考"
            description="关闭后模型直接作答，延迟更低。"
            htmlFor="thinking-enabled"
            className="pb-3"
          >
            <Switch
              id="thinking-enabled"
              checked={thinkingEnabled}
              onCheckedChange={setThinkingEnabled}
            />
          </SettingRow>

          <SettingRow
            label="推理强度"
            description="调整后会自动套用对应的思考 Token 预算。"
            className="py-3"
          >
            <SegmentedControl
              ariaLabel="推理强度"
              value={reasoningEffort}
              options={EFFORT_OPTIONS}
              onChange={setReasoningEffort}
            />
          </SettingRow>

          <div className="pt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="thinking-budget" className="text-foreground text-xs font-medium">
                思考 Token 预算
              </Label>
              <span className="text-primary font-mono text-xs font-medium">
                {thinkingBudget} tokens
              </span>
            </div>
            <input
              id="thinking-budget"
              type="range"
              min={1024}
              max={32000}
              step={1024}
              value={thinkingBudget}
              onChange={(event) => setThinkingBudget(Number(event.target.value))}
              className="accent-primary mt-2 w-full"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  );
}
