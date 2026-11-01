import { Check, Trash2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore, type SendKeyMode } from "@/lib/store/settings-store";

import { SegmentedControl } from "../SegmentedControl";
import { SettingCard, SettingRow } from "../SettingCard";

const SEND_KEY_OPTIONS: ReadonlyArray<{ value: SendKeyMode; label: string }> = [
  { value: "enter", label: "Enter（↵）" },
  { value: "meta-enter", label: "⌘ + Enter" },
];

export function ApplicationTab() {
  const sendKey = useSettingsStore((state) => state.sendKey);
  const setSendKey = useSettingsStore((state) => state.setSendKey);
  const autoSaveDrafts = useSettingsStore((state) => state.autoSaveDrafts);
  const setAutoSaveDrafts = useSettingsStore((state) => state.setAutoSaveDrafts);
  const downloadPath = useSettingsStore((state) => state.downloadPath);
  const setDownloadPath = useSettingsStore((state) => state.setDownloadPath);

  const clearAllConversations = useChatStore((state) => state.clearAllConversations);
  const clearAllDrafts = useChatStore((state) => state.clearAllDrafts);

  /**
   * 关闭草稿保留时清空已存草稿。
   *
   * 刻意不动输入框里**当前**已显示的文字——那可能是用户正在写的内容，
   * 清掉等于替他删草稿。切走再切回时不会再恢复（`ChatInput` 初始化会读开关）。
   */
  const handleAutoSaveDraftsChange = React.useCallback(
    (enabled: boolean) => {
      setAutoSaveDrafts(enabled);
      if (!enabled) clearAllDrafts();
    },
    [clearAllDrafts, setAutoSaveDrafts],
  );

  const [cleared, setCleared] = React.useState(false);

  React.useEffect(() => {
    if (!cleared) return;
    const timer = setTimeout(() => setCleared(false), 2500);
    return () => clearTimeout(timer);
  }, [cleared]);

  const handleClearConversations = React.useCallback(() => {
    clearAllConversations();
    setCleared(true);
  }, [clearAllConversations]);

  return (
    <div className="space-y-4">
      <SettingCard title="发送方式" description="选择提交消息的按键组合；换行始终为 ⇧ + Enter。">
        <SegmentedControl
          ariaLabel="发送消息按键"
          value={sendKey}
          options={SEND_KEY_OPTIONS}
          onChange={setSendKey}
        />
      </SettingCard>

      <SettingCard>
        <SettingRow
          label="保留草稿"
          description="切换会话时记住尚未发送的输入内容。"
          htmlFor="auto-save-drafts"
        >
          <Switch
            id="auto-save-drafts"
            checked={autoSaveDrafts}
            onCheckedChange={handleAutoSaveDraftsChange}
          />
        </SettingRow>
      </SettingCard>

      <SettingCard
        title="下载目录"
        description="Artifacts 导出与代码下载保存到该路径。"
        footnote="支持 ~ 前缀；目录不存在时会自动创建。"
      >
        <Label htmlFor="download-path" className="sr-only">
          下载目录路径
        </Label>
        <Input
          id="download-path"
          value={downloadPath}
          onChange={(event) => setDownloadPath(event.target.value)}
          placeholder="~/Downloads"
          className="bg-background h-8 font-mono text-xs"
        />
      </SettingCard>

      <SettingCard
        tone="danger"
        title="重置本地数据"
        description="清空全部会话、消息与草稿。API Key 保存在系统钥匙串中，不受影响。"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5 text-xs">
              {cleared ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              <span>{cleared ? "已清空" : "清空全部会话"}</span>
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空全部会话？</AlertDialogTitle>
              <AlertDialogDescription>
                该操作会删除本机保存的所有对话记录，且无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearConversations}>确认清空</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingCard>
    </div>
  );
}
