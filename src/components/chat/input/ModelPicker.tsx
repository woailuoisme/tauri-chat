import { Activity, Check, ChevronRight, ChevronUp, Eye } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_MODELS, type AIModel } from "@/lib/ai/types";
import { useSettingsStore, type ReasoningEffort } from "@/lib/store/settings-store";
import { cn } from "@/lib/utils";

const EFFORTS: ReadonlyArray<ReasoningEffort> = ["low", "medium", "high"];

/** 去掉模型名里的渠道后缀，避免菜单项过长 */
export function modelDisplayName(model: AIModel): string {
  return model.name.replace(/\s*\((Direct|OpenRouter|Free)\)/gi, "").trim();
}

/**
 * 模型选择器：一级菜单选模型，二级菜单选推理强度。
 * 选中支持思考的模型时自动开启 Thinking。
 */
export function ModelPicker() {
  const selectedModelId = useSettingsStore((state) => state.selectedModelId);
  const setSelectedModelId = useSettingsStore((state) => state.setSelectedModelId);
  const reasoningEffort = useSettingsStore((state) => state.reasoningEffort);
  const setReasoningEffort = useSettingsStore((state) => state.setReasoningEffort);
  const setThinkingEnabled = useSettingsStore((state) => state.setThinkingEnabled);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);
  const setActiveSettingsTab = useSettingsStore((state) => state.setActiveSettingsTab);

  const currentModel =
    AVAILABLE_MODELS.find((model) => model.id === selectedModelId) ?? AVAILABLE_MODELS[0];
  const effortLabel = reasoningEffort.charAt(0).toUpperCase() + reasoningEffort.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`当前模型 ${modelDisplayName(currentModel)}，推理强度 ${effortLabel}`}
        >
          <span className="font-normal">{modelDisplayName(currentModel)}</span>
          <span className="text-xs font-normal text-neutral-400">{effortLabel}</span>
          <ChevronUp className="size-3 stroke-2 text-neutral-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="text-foreground w-72 rounded-xl border border-white/10 bg-[#1c1c1f] p-1.5 shadow-2xl"
      >
        <div className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-neutral-400">模型</div>

        <div className="space-y-0.5">
          {AVAILABLE_MODELS.map((model) => {
            const isCurrent = selectedModelId === model.id;

            return (
              <DropdownMenuSub key={model.id}>
                <DropdownMenuSubTrigger className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/5 hover:text-white data-open:bg-white/5">
                  <div className="flex min-w-0 items-center gap-1.5 pr-1">
                    <span className="truncate font-normal">{modelDisplayName(model)}</span>
                    {model.supportsVision && (
                      <span
                        className="flex items-center gap-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-400"
                        title="支持多模态视觉"
                      >
                        <Eye className="size-2.5" aria-hidden="true" />
                        Vision
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[11px] text-neutral-400 capitalize">
                        {reasoningEffort}
                      </span>
                    )}
                    {model.badge && (
                      <span className="shrink-0 rounded-full bg-[#27272a] px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                        {model.badge}
                      </span>
                    )}
                  </div>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent className="text-foreground w-36 rounded-xl border border-white/10 bg-[#1c1c1f] p-1 shadow-2xl">
                  {EFFORTS.map((effort) => {
                    const isSelected = isCurrent && reasoningEffort === effort;

                    return (
                      <DropdownMenuItem
                        key={effort}
                        onClick={() => {
                          setSelectedModelId(model.id);
                          setReasoningEffort(effort);
                          if (model.supportsThinking) setThinkingEnabled(true);
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs capitalize transition-colors hover:bg-white/5",
                          isSelected ? "bg-white/5 font-medium text-white" : "text-neutral-300",
                        )}
                      >
                        <span className="capitalize">{effort}</span>
                        {isSelected && (
                          <Check
                            className="size-3.5 text-white"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5 border-white/10" />

        <DropdownMenuItem
          onClick={() => {
            setActiveSettingsTab("models");
            setIsSettingsOpen(true);
          }}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 opacity-70" aria-hidden="true" />
            <span>账户用量</span>
          </div>
          <ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
