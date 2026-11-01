import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loadAllSecrets, saveSecret, type ApiKeyProvider } from "../tauri/secure-store";
import { migrateSettingsPersistedState, SETTINGS_PERSIST_VERSION } from "./persist-utils";

export type AppTheme = "dark" | "light" | "system";
export type SendKeyMode = "enter" | "meta-enter";
export type AppFontSize = "small" | "medium" | "large";
export type AppLanguage = "en" | "zh";
export type ChatWidth = "standard" | "wide" | "full";
export type ReasoningEffort = "low" | "medium" | "high";

export const REASONING_BUDGET_MAP: Record<ReasoningEffort, number> = {
  low: 2048,
  medium: 4096,
  high: 16384,
};

export const CHAT_WIDTH_CLASSES: Record<ChatWidth, string> = {
  standard: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-6xl xl:max-w-7xl",
};

/** 代码字体候选项，与 SettingsModal 的代码字体选择器保持一致 */
export const CODE_FONT_FAMILIES = ["JetBrains Mono", "Fira Code", "ui-monospace"] as const;

export type CodeFontFamily = (typeof CODE_FONT_FAMILIES)[number];

/** 解析字体名称为完整的 font-family 栈 */
export function resolveCodeFontStack(font: string): string {
  if (font === "ui-monospace") return "ui-monospace, SFMono-Regular, Menlo, monospace";
  return `${font}, ui-monospace, SFMono-Regular, Menlo, monospace`;
}

/**
 * 界面语言目前只支持「跟随硬编码双语文案」，完整 i18n 尚未接入。
 * 该常量用于在 UI 上把语言选择器置为禁用态，避免展示不生效的开关。
 */
export const IS_LANGUAGE_SWITCH_SUPPORTED = false;

/** store 字段 → Keychain provider 的映射 */
const SECRET_FIELDS: ReadonlyArray<[ApiKeyProvider, keyof SettingsState]> = [
  ["openrouter", "openrouterApiKey"],
  ["deepseek", "deepseekApiKey"],
  ["openai", "openaiApiKey"],
  ["custom", "customApiKey"],
];

/** localStorage 键名；启动期明文清理需要复用 */
export const SETTINGS_PERSIST_KEY = "claude-desktop-settings";

interface SettingsState {
  // General & Desktop System
  launchOnStartup: boolean;
  keepWindowOnTop: boolean;
  closeToTray: boolean;
  globalShortcut: string;
  /** 是否真正注册系统级全局唤起快捷键（默认关闭，避免无授权抢占热键） */
  globalShortcutEnabled: boolean;
  language: AppLanguage;

  // Application Behavior
  sendKey: SendKeyMode;
  autoSaveDrafts: boolean;
  downloadPath: string;

  // Appearance
  theme: AppTheme;
  fontSize: AppFontSize;
  codeFont: CodeFontFamily;
  chatWidth: ChatWidth;

  // Notifications
  notificationsEnabled: boolean;
  soundEnabled: boolean;

  // API Providers & Keys
  openrouterApiKey: string;
  openrouterBaseUrl: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  customApiKey: string;
  customBaseUrl: string;

  // Model & Inference
  selectedModelId: string;
  thinkingEnabled: boolean;
  thinkingBudget: number;
  reasoningEffort: ReasoningEffort;
  systemPrompt: string;

  // Modal State
  isSettingsOpen: boolean;
  activeSettingsTab: string;

  // Actions
  setLaunchOnStartup: (val: boolean) => void;
  setKeepWindowOnTop: (val: boolean) => void;
  setCloseToTray: (val: boolean) => void;
  setGlobalShortcut: (val: string) => void;
  setGlobalShortcutEnabled: (val: boolean) => void;
  setLanguage: (val: AppLanguage) => void;

  setSendKey: (val: SendKeyMode) => void;
  setAutoSaveDrafts: (val: boolean) => void;
  setDownloadPath: (val: string) => void;

  setTheme: (theme: AppTheme) => void;
  setFontSize: (size: AppFontSize) => void;
  setCodeFont: (font: CodeFontFamily) => void;
  setChatWidth: (width: ChatWidth) => void;

  setNotificationsEnabled: (val: boolean) => void;
  setSoundEnabled: (val: boolean) => void;

  setOpenrouterApiKey: (key: string) => void;
  setOpenrouterBaseUrl: (url: string) => void;
  setDeepseekApiKey: (key: string) => void;
  setDeepseekBaseUrl: (url: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setOpenaiBaseUrl: (url: string) => void;
  setCustomApiKey: (key: string) => void;
  setCustomBaseUrl: (url: string) => void;

  setSelectedModelId: (modelId: string) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setThinkingBudget: (budget: number) => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  setSystemPrompt: (prompt: string) => void;

  setIsSettingsOpen: (open: boolean) => void;
  setActiveSettingsTab: (tab: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // General Defaults
      launchOnStartup: false,
      keepWindowOnTop: false,
      closeToTray: true,
      globalShortcut: "Option+Space",
      // 默认不抢占系统级热键，须由用户在「设置 → 通用」显式开启
      globalShortcutEnabled: false,
      language: "zh",

      // Application Defaults
      sendKey: "enter",
      autoSaveDrafts: true,
      downloadPath: "~/Downloads",

      // Appearance Defaults
      theme: "dark",
      fontSize: "medium",
      codeFont: "JetBrains Mono",
      chatWidth: "wide",

      // Notifications Defaults
      notificationsEnabled: true,
      soundEnabled: true,

      // API Providers Defaults
      openrouterApiKey: "",
      openrouterBaseUrl: "https://openrouter.ai/api/v1",
      deepseekApiKey: "",
      deepseekBaseUrl: "https://api.deepseek.com",
      openaiApiKey: "",
      openaiBaseUrl: "https://api.openai.com/v1",
      customApiKey: "",
      customBaseUrl: "http://localhost:11434/v1",

      // Models Defaults
      selectedModelId: "anthropic/claude-3.7-sonnet",
      thinkingEnabled: true,
      thinkingBudget: 16384,
      reasoningEffort: "high",
      systemPrompt:
        "You are Claude, a helpful, thoughtful, and precise AI assistant made by Anthropic.",

      isSettingsOpen: false,
      activeSettingsTab: "general",

      // Setters
      setLaunchOnStartup: (launchOnStartup) => set({ launchOnStartup }),
      setKeepWindowOnTop: (keepWindowOnTop) => set({ keepWindowOnTop }),
      setCloseToTray: (closeToTray) => set({ closeToTray }),
      setGlobalShortcut: (globalShortcut) => set({ globalShortcut }),
      setGlobalShortcutEnabled: (globalShortcutEnabled) => set({ globalShortcutEnabled }),
      setLanguage: (language) => set({ language }),

      setSendKey: (sendKey) => set({ sendKey }),
      setAutoSaveDrafts: (autoSaveDrafts) => set({ autoSaveDrafts }),
      setDownloadPath: (downloadPath) => set({ downloadPath }),

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCodeFont: (codeFont) => set({ codeFont }),
      setChatWidth: (chatWidth) => set({ chatWidth }),

      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

      setOpenrouterApiKey: (openrouterApiKey) => set({ openrouterApiKey }),
      setOpenrouterBaseUrl: (openrouterBaseUrl) => set({ openrouterBaseUrl }),
      setDeepseekApiKey: (deepseekApiKey) => set({ deepseekApiKey }),
      setDeepseekBaseUrl: (deepseekBaseUrl) => set({ deepseekBaseUrl }),
      setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),
      setOpenaiBaseUrl: (openaiBaseUrl) => set({ openaiBaseUrl }),
      setCustomApiKey: (customApiKey) => set({ customApiKey }),
      setCustomBaseUrl: (customBaseUrl) => set({ customBaseUrl }),

      setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
      setThinkingEnabled: (thinkingEnabled) => set({ thinkingEnabled }),
      setThinkingBudget: (thinkingBudget) => set({ thinkingBudget }),
      setReasoningEffort: (reasoningEffort) =>
        set({
          reasoningEffort,
          thinkingBudget: REASONING_BUDGET_MAP[reasoningEffort] || 4096,
        }),
      setSystemPrompt: (systemPrompt) => set({ systemPrompt }),

      setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
      setActiveSettingsTab: (activeSettingsTab) => set({ activeSettingsTab }),
    }),
    {
      name: SETTINGS_PERSIST_KEY,
      version: SETTINGS_PERSIST_VERSION,
      /**
       * 只持久化「非机密」字段。
       * 4 个 API Key 改由系统钥匙串保管（见 `secure-store.ts`），
       * 启动时通过 `hydrateApiKeys()` 回填到本 store 的运行时字段。
       */
      partialize: (state) => ({
        launchOnStartup: state.launchOnStartup,
        keepWindowOnTop: state.keepWindowOnTop,
        closeToTray: state.closeToTray,
        globalShortcut: state.globalShortcut,
        globalShortcutEnabled: state.globalShortcutEnabled,
        language: state.language,
        sendKey: state.sendKey,
        autoSaveDrafts: state.autoSaveDrafts,
        downloadPath: state.downloadPath,
        theme: state.theme,
        fontSize: state.fontSize,
        codeFont: state.codeFont,
        chatWidth: state.chatWidth,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
        openrouterBaseUrl: state.openrouterBaseUrl,
        deepseekBaseUrl: state.deepseekBaseUrl,
        openaiBaseUrl: state.openaiBaseUrl,
        customBaseUrl: state.customBaseUrl,
        selectedModelId: state.selectedModelId,
        thinkingEnabled: state.thinkingEnabled,
        thinkingBudget: state.thinkingBudget,
        reasoningEffort: state.reasoningEffort,
        systemPrompt: state.systemPrompt,
      }),
      /**
       * v1 曾把 API Key 明文写入 localStorage。
       * 迁移剥除只作用于内存对象；磁盘上的明文由 `main.tsx` 启动期的
       * `scrubLegacySecrets()` 显式重写清除。
       */
      migrate: (persisted, version) => migrateSettingsPersistedState(persisted, version),
    },
  ),
);

/**
 * 启动时从钥匙串回填密钥。
 * 必须在首次渲染前 await，避免首帧内 `getLanguageModel` 读到空 key。
 */
export async function hydrateApiKeys(): Promise<void> {
  const secrets = await loadAllSecrets();
  const patch: Partial<SettingsState> = {};

  for (const [provider, field] of SECRET_FIELDS) {
    const value = secrets[provider];
    if (value) {
      // 逐字段赋值以保持 SettingsState 的类型约束
      (patch as Record<string, unknown>)[field] = value;
    }
  }

  if (Object.keys(patch).length > 0) {
    useSettingsStore.setState(patch);
  }
}

/** 把单个 provider 的密钥写入钥匙串（空值即删除） */
export async function persistApiKey(provider: ApiKeyProvider, value: string): Promise<void> {
  await saveSecret(provider, value);
}
