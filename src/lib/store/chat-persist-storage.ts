import type { PersistStorage, StorageValue } from "zustand/middleware";

import { stripMessagesPayload, type ChatPersistedState } from "./persist-utils";

/**
 * 对话 store 的写入路径。
 *
 * 为什么不用 `createJSONStorage`：它会在**节流之前**就 `JSON.stringify` 整份状态，
 * 于是每敲一个字符、每个 rAF 帧都要做一次「全表 strip + 全量序列化」。
 * 这里改成直接实现 `PersistStorage`（契约要求 `setItem` 接收对象），
 * 把序列化推迟到 flush 阶段，频率从 ~60 次/秒降到 ~2 次/秒。
 *
 * 注意：**不可以**改成「流式期间跳过写盘并把 messages 置空」——
 * 那会让 `pagehide` flush 把空对象写盘，重启后历史全丢。
 */

const PERSIST_WRITE_DELAY_MS = 500;

type ChatStorageValue = StorageValue<ChatPersistedState>;

export interface ChatPersistStorage extends PersistStorage<ChatPersistedState> {
  /** 立即落盘挂起的写入（页面卸载、测试、以及需要强一致时使用） */
  flush: () => void;
}

export function createChatPersistStorage(): ChatPersistStorage {
  let pendingName: string | null = null;
  let pendingValue: ChatStorageValue | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  /** 真正落盘：此时才做附件剥离与序列化 */
  const flush = (): void => {
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (pendingName === null || pendingValue === null) return;

    const name = pendingName;
    const value = pendingValue;
    pendingName = null;
    pendingValue = null;

    try {
      const payload: ChatStorageValue = {
        ...value,
        state: {
          ...value.state,
          messages: stripMessagesPayload(value.state.messages),
        },
      };

      localStorage.setItem(name, JSON.stringify(payload));
    } catch (error) {
      console.warn("[chat-persist] 写入失败，可能已超出 localStorage 配额", error);
    }
  };

  const schedule = (): void => {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(flush, PERSIST_WRITE_DELAY_MS);
  };

  const clearPending = (): void => {
    pendingName = null;
    pendingValue = null;
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }

  return {
    flush,

    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as ChatStorageValue) : null;
      } catch {
        return null;
      }
    },

    // 只缓冲引用并启动节流，不做任何序列化
    setItem: (name, value) => {
      pendingName = name;
      pendingValue = value;
      schedule();
    },

    removeItem: (name) => {
      clearPending();
      try {
        localStorage.removeItem(name);
      } catch {
        // 存储不可用时无需处理
      }
    },
  };
}
