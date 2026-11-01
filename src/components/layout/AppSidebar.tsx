import {
  Edit2,
  FolderKanban,
  Layers,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sliders,
  Trash2,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNow } from "@/hooks/use-now";
import type { Conversation } from "@/lib/ai/types";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

export function AppSidebar() {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const createConversation = useChatStore((state) => state.createConversation);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);
  const setCommandPaletteOpen = useChatStore((state) => state.setCommandPaletteOpen);

  const artifactsList = useArtifactsStore((state) => state.artifactsList);
  const openArtifact = useArtifactsStore((state) => state.openArtifact);

  const selectedModelId = useSettingsStore((state) => state.selectedModelId);
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);
  const setActiveSettingsTab = useSettingsStore((state) => state.setActiveSettingsTab);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  // 每 60s 推进一次，保证「今天 / 最近 7 天」分组不会随运行时间过期
  const now = useNow(60_000);

  const groupedConversations = React.useMemo(() => {
    const today: Conversation[] = [];
    const recent: Conversation[] = [];
    const older: Conversation[] = [];

    for (const conversation of conversations) {
      const age = now - conversation.updatedAt;
      if (age < DAY_MS) today.push(conversation);
      else if (age < 7 * DAY_MS) recent.push(conversation);
      else older.push(conversation);
    }

    return [
      { label: "今天", items: today },
      { label: "最近 7 天", items: recent },
      { label: "更早", items: older },
    ].filter((group) => group.items.length > 0);
  }, [conversations, now]);

  const startRename = React.useCallback((conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  }, []);

  const finishRename = React.useCallback(
    (id: string) => {
      const next = editingTitle.trim();
      if (next) renameConversation(id, next);
      setEditingId(null);
    },
    [editingTitle, renameConversation],
  );

  const openSettingsTab = React.useCallback(
    (tab: string) => {
      setActiveSettingsTab(tab);
      setIsSettingsOpen(true);
    },
    [setActiveSettingsTab, setIsSettingsOpen],
  );

  return (
    <aside className="border-border/60 bg-sidebar/50 text-sidebar-foreground flex h-full w-64 shrink-0 flex-col border-r select-none">
      {/* 为 macOS 红绿灯留出空间，同时支持拖窗 */}
      <div className="h-9 w-full shrink-0" data-tauri-drag-region />

      <div className="space-y-1 px-3 pb-3">
        <Button
          onClick={() => createConversation(selectedModelId)}
          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:text-primary h-9 w-full justify-start gap-2 rounded-xl border text-xs font-medium shadow-none"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>新建会话</span>
        </Button>

        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4 opacity-70" aria-hidden="true" />
            <span>搜索</span>
          </span>
          <kbd className="border-border/60 bg-muted/50 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => openSettingsTab("projects")}
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <FolderKanban className="size-4 opacity-70" aria-hidden="true" />
          <span>项目指令</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="flex items-center gap-2">
                <Layers className="size-4 opacity-70" aria-hidden="true" />
                <span>Artifacts</span>
              </span>
              {artifactsList.length > 0 && (
                <span className="bg-primary/15 text-primary rounded-full px-1.5 text-[10px] font-semibold">
                  {artifactsList.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {artifactsList.length === 0 ? (
              <div className="text-muted-foreground p-2 text-center text-xs italic">
                还没有生成过 Artifact
              </div>
            ) : (
              artifactsList.slice(0, 8).map((artifact) => (
                <DropdownMenuItem
                  key={artifact.id}
                  onClick={() => openArtifact(artifact)}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-1.5 text-xs"
                >
                  <span className="text-foreground line-clamp-1 font-medium">{artifact.title}</span>
                  <span className="text-muted-foreground font-mono text-[10px] uppercase">
                    {artifact.type} · {artifact.language}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => openSettingsTab("general")}
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Sliders className="size-4 opacity-70" aria-hidden="true" />
          <span>偏好设置</span>
        </button>
      </div>

      <div className="border-border/40 mx-3 my-1 border-t" />

      <nav aria-label="会话列表" className="flex-1 overflow-y-auto px-2 py-2">
        {groupedConversations.length === 0 ? (
          <p className="text-muted-foreground/60 px-3 py-6 text-center text-xs italic">
            暂无会话记录
          </p>
        ) : (
          <div className="space-y-4">
            {groupedConversations.map((group) => (
              <section key={group.label}>
                <h3 className="text-muted-foreground/70 px-2 text-[11px] font-medium">
                  {group.label}
                </h3>

                <ul className="mt-1 space-y-1">
                  {group.items.map((conversation) => {
                    const isActive = conversation.id === activeConversationId;
                    const isEditing = conversation.id === editingId;

                    return (
                      <li
                        key={conversation.id}
                        className={cn(
                          "group relative flex w-full items-center rounded-lg transition-colors",
                          isActive
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        )}
                      >
                        {isEditing ? (
                          <>
                            <label className="sr-only" htmlFor={`rename-${conversation.id}`}>
                              会话标题
                            </label>
                            <input
                              id={`rename-${conversation.id}`}
                              type="text"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              onBlur={() => finishRename(conversation.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") finishRename(conversation.id);
                                if (event.key === "Escape") setEditingId(null);
                              }}
                              autoFocus
                              className="ring-primary w-full rounded bg-transparent px-2.5 py-1.5 text-xs ring-1 outline-none"
                            />
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => selectConversation(conversation.id)}
                              aria-current={isActive ? "true" : undefined}
                              className="focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <MessageSquare
                                className="size-3.5 shrink-0 opacity-60"
                                aria-hidden="true"
                              />
                              <span className="truncate">{conversation.title}</span>
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`「${conversation.title}」的更多操作`}
                                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring mr-1 size-5 shrink-0 cursor-pointer rounded p-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
                                >
                                  <MoreHorizontal className="size-3.5" aria-hidden="true" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                  onClick={() => startRename(conversation)}
                                  className="cursor-pointer gap-2 text-xs"
                                >
                                  <Edit2 className="size-3.5" aria-hidden="true" />
                                  <span>重命名</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteConversation(conversation.id)}
                                  className="text-destructive cursor-pointer gap-2 text-xs"
                                >
                                  <Trash2 className="size-3.5" aria-hidden="true" />
                                  <span>删除</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </nav>

      <div className="border-border/50 border-t p-2.5">
        <button
          type="button"
          onClick={() => openSettingsTab("general")}
          className="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center justify-between rounded-xl p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="bg-primary/20 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold">
              S
            </span>
            <span className="min-w-0 text-left">
              <span className="text-foreground block truncate text-xs font-medium">
                Starter Desktop
              </span>
              <span className="text-muted-foreground block text-[10px]">本地密钥 · 系统钥匙串</span>
            </span>
          </span>
          <Settings className="text-muted-foreground size-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
