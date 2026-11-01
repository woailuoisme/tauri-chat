import { Layers, MessageSquare, Plus, Settings, Sparkles } from "lucide-react";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { AVAILABLE_MODELS } from "@/lib/ai/types";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";

/**
 * 全局命令面板。
 *
 * ⌘K 的注册已收敛到 `use-app-shortcuts`，这里只负责渲染。
 * 消息条数按需从 store 快照读取，避免面板常驻时被流式更新反复唤醒。
 */
export function CommandPalette() {
  const conversations = useChatStore((state) => state.conversations);
  const isCommandPaletteOpen = useChatStore((state) => state.isCommandPaletteOpen);
  const setCommandPaletteOpen = useChatStore((state) => state.setCommandPaletteOpen);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const createConversation = useChatStore((state) => state.createConversation);

  const artifactsList = useArtifactsStore((state) => state.artifactsList);
  const openArtifact = useArtifactsStore((state) => state.openArtifact);

  const selectedModelId = useSettingsStore((state) => state.selectedModelId);
  const setSelectedModelId = useSettingsStore((state) => state.setSelectedModelId);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);

  const closePalette = React.useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  return (
    <CommandDialog
      open={isCommandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="搜索 Starter"
      description="搜索会话、Artifacts 与命令"
    >
      <CommandInput placeholder="搜索会话、Artifacts 或命令（⌘K）…" />
      <CommandList className="max-h-80 overflow-y-auto">
        <CommandEmpty>没有匹配结果。</CommandEmpty>

        <CommandGroup heading="操作">
          <CommandItem
            onSelect={() => {
              createConversation(selectedModelId);
              closePalette();
            }}
            className="cursor-pointer gap-2 text-xs"
          >
            <Plus className="text-primary size-3.5" aria-hidden="true" />
            <span>新建会话</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setIsSettingsOpen(true);
              closePalette();
            }}
            className="cursor-pointer gap-2 text-xs"
          >
            <Settings className="text-muted-foreground size-3.5" aria-hidden="true" />
            <span>打开设置与 API Key</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {conversations.length > 0 && (
          <CommandGroup heading="会话">
            {conversations.map((conversation) => {
              // 只在面板打开时取一次快照，无需订阅整表消息
              const messageCount = useChatStore.getState().messages[conversation.id]?.length ?? 0;

              return (
                <CommandItem
                  key={conversation.id}
                  value={`${conversation.title} ${conversation.id}`}
                  onSelect={() => {
                    selectConversation(conversation.id);
                    closePalette();
                  }}
                  className="flex cursor-pointer items-center justify-between gap-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
                    <span className="truncate">{conversation.title}</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {messageCount} 条
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {artifactsList.length > 0 && (
          <CommandGroup heading="Artifacts">
            {artifactsList.map((artifact) => (
              <CommandItem
                key={artifact.id}
                value={`${artifact.title} ${artifact.language} ${artifact.type}`}
                onSelect={() => {
                  openArtifact(artifact);
                  closePalette();
                }}
                className="flex cursor-pointer items-center justify-between gap-2 text-xs"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Layers className="text-primary/80 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{artifact.title}</span>
                </div>
                <span className="text-muted-foreground font-mono text-[10px] uppercase">
                  {artifact.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="切换模型">
          {AVAILABLE_MODELS.map((model) => (
            <CommandItem
              key={model.id}
              value={model.name}
              onSelect={() => {
                setSelectedModelId(model.id);
                closePalette();
              }}
              className="flex cursor-pointer items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary size-3.5" aria-hidden="true" />
                <span>{model.name}</span>
              </div>
              {selectedModelId === model.id && (
                <span className="text-primary text-[10px] font-semibold">当前</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
