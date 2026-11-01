import { ArrowUp, Mic } from "lucide-react";

import { cn } from "@/lib/utils";

interface SendControlsProps {
  isStreaming: boolean;
  canSend: boolean;
  isListening: boolean;
  onToggleMic: () => void;
  onSend: () => void;
  onStop?: () => void;
}

/** 麦克风 + 发送/停止按钮组 */
export function SendControls({
  isStreaming,
  canSend,
  isListening,
  onToggleMic,
  onSend,
  onStop,
}: SendControlsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggleMic}
        aria-pressed={isListening}
        aria-label={isListening ? "停止语音输入" : "开始语音输入"}
        className={cn(
          "flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isListening
            ? "animate-pulse bg-red-500/20 text-red-500"
            : "text-neutral-400 hover:bg-white/5 hover:text-white",
        )}
        title={isListening ? "正在聆听，点击停止" : "语音输入"}
      >
        <Mic className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="focus-visible:ring-ring flex size-7.5 cursor-pointer items-center justify-center rounded-full bg-[#2a2a2d] shadow-xs transition-colors hover:bg-[#343438] focus-visible:ring-2 focus-visible:outline-none"
          aria-label="停止生成"
          title="停止生成"
        >
          <span className="size-3 rounded-[2.5px] bg-[#ea4335]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="发送消息"
          title="发送消息"
          className={cn(
            "flex size-7.5 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            canSend
              ? "cursor-pointer bg-white text-black shadow-sm hover:bg-neutral-200"
              : "cursor-not-allowed bg-[#2a2a2d] text-neutral-500",
          )}
        >
          <ArrowUp className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </>
  );
}
