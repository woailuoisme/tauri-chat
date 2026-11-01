import { Check, ChevronDown, Code2, Copy, PanelLeft, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVAILABLE_MODELS } from "@/lib/ai/types";
import { useArtifactsStore } from "@/lib/store/artifacts-store";
import { useChatStore } from "@/lib/store/chat-store";
import { copyText } from "@/lib/utils/clipboard";
import { buildTranscript, type TranscriptFormat } from "@/lib/utils/transcript";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({ onToggleSidebar, isSidebarOpen = true }: AppHeaderProps) {
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const renameConversation = useChatStore((state) => state.renameConversation);

  const isArtifactsOpen = useArtifactsStore((state) => state.isOpen);
  const togglePanel = useArtifactsStore((state) => state.togglePanel);

  // 只订阅「是否有消息」这一布尔量，避免流式期间每帧重渲染头部
  const hasMessages = useChatStore((state) =>
    activeConversationId ? (state.messages[activeConversationId]?.length ?? 0) > 0 : false,
  );

  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [copiedKind, setCopiedKind] = React.useState<TranscriptFormat | null>(null);

  React.useEffect(() => {
    if (!copiedKind) return;
    const timer = setTimeout(() => setCopiedKind(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedKind]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const currentModel = AVAILABLE_MODELS.find((model) => model.id === activeConversation?.modelId);

  const openRenameDialog = React.useCallback(() => {
    if (!activeConversation) return;
    setDraftTitle(activeConversation.title);
    setIsRenameOpen(true);
  }, [activeConversation]);

  const submitRename = React.useCallback(() => {
    if (!activeConversation) return;

    const next = draftTitle.trim();
    if (next) renameConversation(activeConversation.id, next);

    setIsRenameOpen(false);
  }, [activeConversation, draftTitle, renameConversation]);

  const copyTranscript = React.useCallback((format: TranscriptFormat) => {
    const state = useChatStore.getState();
    const conversationId = state.activeConversationId;
    if (!conversationId) return;

    const messages = state.messages[conversationId] ?? [];
    if (messages.length === 0) return;

    const title =
      state.conversations.find((conversation) => conversation.id === conversationId)?.title ??
      "对话";

    copyText(buildTranscript(messages, title, format), "clipboard:transcript").then((ok) => {
      if (ok) setCopiedKind(format);
    });
  }, []);

  return (
    <header
      className="border-border/50 bg-background/80 flex h-11 shrink-0 items-center justify-between border-b px-3 backdrop-blur-xs select-none"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1.5">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            aria-label={isSidebarOpen ? "折叠侧边栏" : "展开侧边栏"}
            title={isSidebarOpen ? "折叠侧边栏 (⌘B)" : "展开侧边栏 (⌘B)"}
          >
            <PanelLeft className="size-4" aria-hidden="true" />
          </Button>
        )}

        {activeConversation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group text-foreground hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="max-w-50 truncate">{activeConversation.title}</span>
                <ChevronDown
                  className="text-muted-foreground group-hover:text-foreground size-3 transition-transform"
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <div className="text-muted-foreground px-2 py-1 text-[11px]">
                模型：{currentModel?.name ?? "未指定"}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openRenameDialog} className="cursor-pointer text-xs">
                重命名会话
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteConversation(activeConversation.id)}
                className="text-destructive cursor-pointer gap-2 text-xs"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span>删除会话</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={togglePanel}
          aria-pressed={isArtifactsOpen}
          aria-label={isArtifactsOpen ? "关闭 Artifacts 面板" : "打开 Artifacts 面板"}
          className={`h-7 w-7 ${
            isArtifactsOpen
              ? "bg-primary/10 text-primary border-primary/20 border"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={isArtifactsOpen ? "关闭 Artifacts 面板 (⌘J)" : "打开 Artifacts 面板 (⌘J)"}
        >
          <Code2 className="size-4" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={!hasMessages}
              aria-label="复制整段对话"
              className="text-muted-foreground hover:text-foreground h-7 w-7 disabled:opacity-30"
              title="复制整段对话"
            >
              {copiedKind ? (
                <Check className="size-3.5 text-green-500" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => copyTranscript("markdown")}
              className="cursor-pointer text-xs"
            >
              复制为 Markdown
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => copyTranscript("plain")}
              className="cursor-pointer text-xs"
            >
              复制为纯文本
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>重命名会话</DialogTitle>
          <DialogDescription>输入新的会话标题，回车保存。</DialogDescription>

          <Label htmlFor="rename-conversation" className="sr-only">
            会话标题
          </Label>
          <Input
            id="rename-conversation"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitRename();
              }
            }}
            autoFocus
            maxLength={80}
            className="h-8 text-xs"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              取消
            </Button>
            <Button onClick={submitRename} disabled={!draftTitle.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
