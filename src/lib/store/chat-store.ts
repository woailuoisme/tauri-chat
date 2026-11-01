import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ChatMessage, Conversation } from "../ai/types";
import { createChatPersistStorage } from "./chat-persist-storage";
import {
  CHAT_PERSIST_VERSION,
  migrateChatPersistedState,
  type ChatPersistedState,
} from "./persist-utils";
import { isSameStreamingScope, type StreamingScope } from "./streaming";

const CHAT_PERSIST_KEY = "claude-desktop-chat";

/** 写入路径在模块级唯一实例，保证 pagehide 监听只注册一次 */
const chatPersistStorage = createChatPersistStorage();

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, ChatMessage[]>;
  /** 按会话保存的输入框草稿（受 `autoSaveDrafts` 控制是否写入） */
  drafts: Record<string, string>;
  /** 当前正在流式生成的目标，为 null 表示空闲；按会话隔离避免切换会话错位 */
  streaming: StreamingScope | null;
  isCommandPaletteOpen: boolean;

  // Conversation actions
  createConversation: (modelId?: string, title?: string) => string;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;

  // Message actions
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  truncateMessagesAfter: (conversationId: string, messageId: string) => void;

  // Draft actions
  setDraft: (conversationId: string, text: string) => void;
  clearDraft: (conversationId: string) => void;
  clearAllDrafts: () => void;

  // Streaming actions
  beginStreaming: (conversationId: string, messageId: string) => void;
  /**
   * 结束流式。必须带 (conversationId, messageId) 作用域：
   * 否则旧流的 finally 会把新开始的流状态一并清空。
   */
  endStreaming: (conversationId: string, messageId: string) => void;

  setCommandPaletteOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist<ChatState, [], [], ChatPersistedState>(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      drafts: {},
      streaming: null,
      isCommandPaletteOpen: false,

      createConversation: (modelId = "anthropic/claude-3.7-sonnet", title = "New chat") => {
        const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const now = Date.now();
        const newConversation: Conversation = {
          id,
          title,
          modelId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
          messages: { ...state.messages, [id]: [] },
        }));

        return id;
      },

      selectConversation: (id) => {
        set({ activeConversationId: id });
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === id
              ? { ...conversation, title, updatedAt: Date.now() }
              : conversation,
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((conversation) => conversation.id !== id);
          const nextActiveId =
            state.activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : state.activeConversationId;

          const nextMessages = { ...state.messages };
          delete nextMessages[id];

          const nextDrafts = { ...state.drafts };
          delete nextDrafts[id];

          return {
            conversations: remaining,
            activeConversationId: nextActiveId,
            messages: nextMessages,
            drafts: nextDrafts,
            streaming: state.streaming?.conversationId === id ? null : state.streaming,
          };
        });
      },

      clearAllConversations: () => {
        set({
          conversations: [],
          activeConversationId: null,
          messages: {},
          drafts: {},
          streaming: null,
        });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const current = state.messages[conversationId] ?? [];
          return {
            messages: { ...state.messages, [conversationId]: [...current, message] },
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, updatedAt: Date.now() }
                : conversation,
            ),
          };
        });
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const current = state.messages[conversationId] ?? [];
          return {
            messages: {
              ...state.messages,
              [conversationId]: current.map((message) =>
                message.id === messageId ? { ...message, ...updates } : message,
              ),
            },
          };
        });
      },

      truncateMessagesAfter: (conversationId, messageId) => {
        set((state) => {
          const current = state.messages[conversationId] ?? [];
          const index = current.findIndex((message) => message.id === messageId);
          if (index === -1) return state;

          return {
            messages: { ...state.messages, [conversationId]: current.slice(0, index + 1) },
          };
        });
      },

      setDraft: (conversationId, text) => {
        set((state) => ({ drafts: { ...state.drafts, [conversationId]: text } }));
      },

      clearDraft: (conversationId) => {
        set((state) => {
          if (state.drafts[conversationId] === undefined) return state;

          const nextDrafts = { ...state.drafts };
          delete nextDrafts[conversationId];
          return { drafts: nextDrafts };
        });
      },

      clearAllDrafts: () => {
        set((state) => (Object.keys(state.drafts).length === 0 ? state : { drafts: {} }));
      },

      beginStreaming: (conversationId, messageId) => {
        set({ streaming: { conversationId, messageId } });
      },

      endStreaming: (conversationId, messageId) => {
        set((state) =>
          isSameStreamingScope(state.streaming, conversationId, messageId)
            ? { streaming: null }
            : state,
        );
      },

      setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
    }),
    {
      name: CHAT_PERSIST_KEY,
      version: CHAT_PERSIST_VERSION,
      storage: chatPersistStorage,
      /** 只做字段挑选；附件剥离与序列化都推迟到 flush 阶段 */
      partialize: (state): ChatPersistedState => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        messages: state.messages,
        drafts: state.drafts,
      }),
      migrate: (persistedState, version) => migrateChatPersistedState(persistedState, version),
    },
  ),
);
