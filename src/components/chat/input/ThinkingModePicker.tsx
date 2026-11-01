import { Brain, ChevronUp, Shield, Zap } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/lib/store/settings-store";
import { cn } from "@/lib/utils";

/** Turbo（关闭思考）/ Thinking（开启思考）模式切换 */
export function ThinkingModePicker() {
  const thinkingEnabled = useSettingsStore((state) => state.thinkingEnabled);
  const setThinkingEnabled = useSettingsStore((state) => state.setThinkingEnabled);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`推理模式：${thinkingEnabled ? "深度思考" : "极速"}`}
        >
          <Shield className="size-3.5 opacity-80" aria-hidden="true" />
          <span className="text-xs font-normal">{thinkingEnabled ? "Thinking" : "Turbo"}</span>
          <ChevronUp className="size-3 stroke-2 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border-white/10 bg-[#1c1c1f] p-1.5 shadow-2xl"
      >
        <DropdownMenuItem
          onClick={() => setThinkingEnabled(false)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5",
            !thinkingEnabled && "bg-white/5 font-medium text-white",
          )}
        >
          <Zap className="size-3.5 text-amber-500" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-foreground font-medium">Turbo（极速）</span>
            <span className="text-muted-foreground text-[10px]">低延迟直接响应</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setThinkingEnabled(true)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-white/5",
            thinkingEnabled && "bg-white/5 font-medium text-white",
          )}
        >
          <Brain className="text-primary size-3.5" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-foreground font-medium">Thinking（思维链）</span>
            <span className="text-muted-foreground text-[10px]">深度推理后再作答</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
