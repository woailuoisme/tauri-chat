import { describe, expect, test } from "vitest";

import type { ChatAttachment, ChatMessage } from "../src/lib/ai/types";
import {
  CHAT_PERSIST_VERSION,
  EMPTY_CHAT_PERSISTED_STATE,
  SETTINGS_PERSIST_VERSION,
  migrateChatPersistedState,
  migrateSettingsPersistedState,
  scrubLegacySecrets,
  stripAttachmentPayload,
  stripMessagesPayload,
} from "../src/lib/store/persist-utils";

const IMAGE: ChatAttachment = {
  id: "att-1",
  name: "shot.png",
  size: 2048,
  type: "image/png",
  dataUrl: "data:image/png;base64,AAAA",
  isImage: true,
};

const TEXT_FILE: ChatAttachment = {
  id: "att-2",
  name: "notes.md",
  size: 128,
  type: "text/markdown",
  content: "# hello",
  isImage: false,
};

function userMessage(id: string, attachments?: ChatAttachment[]): ChatMessage {
  return { id, role: "user", content: "hi", createdAt: 1, attachments };
}

/** 构造 settings 的持久化原始字符串（zustand 的 `{ state, version }` 结构） */
function wrapSettings(state: Record<string, unknown>, version = 1): string {
  return JSON.stringify({ state, version });
}

describe("stripAttachmentPayload", () => {
  test("剥离二进制载荷，保留元数据", () => {
    const [image, file] = stripAttachmentPayload([IMAGE, TEXT_FILE]) ?? [];

    expect(image).toEqual({
      id: "att-1",
      name: "shot.png",
      size: 2048,
      type: "image/png",
      url: undefined,
      isImage: true,
    });
    expect(image).not.toHaveProperty("dataUrl");
    expect(file).not.toHaveProperty("content");
  });

  test("空数组与 undefined 均返回 undefined", () => {
    expect(stripAttachmentPayload([])).toBeUndefined();
    expect(stripAttachmentPayload(undefined)).toBeUndefined();
  });
});

describe("stripMessagesPayload", () => {
  const messages = {
    "conv-1": [
      userMessage("m1", [IMAGE]),
      { id: "m2", role: "assistant", content: "ok", createdAt: 2 },
    ],
    "conv-2": [userMessage("m3", [TEXT_FILE])],
  } as Record<string, ChatMessage[]>;

  test("去掉附件载荷", () => {
    const result = stripMessagesPayload(messages);

    expect(result["conv-1"][0].attachments?.[0]).not.toHaveProperty("dataUrl");
    expect(result["conv-2"][0].attachments?.[0]).not.toHaveProperty("content");
  });

  test("幂等：连续两次剥离结果一致", () => {
    const once = stripMessagesPayload(messages);
    const twice = stripMessagesPayload(once);

    expect(twice).toEqual(once);
  });

  test("无附件的消息保持原引用，避免无谓分配", () => {
    const result = stripMessagesPayload(messages);

    expect(result["conv-1"][1]).toBe(messages["conv-1"][1]);
  });

  test("空对象返回空对象", () => {
    expect(stripMessagesPayload({})).toEqual({});
  });
});

describe("migrateChatPersistedState", () => {
  test("v1 → v2 剥离历史附件 base64", () => {
    const snapshot = {
      conversations: [],
      activeConversationId: "c1",
      messages: { c1: [userMessage("m1", [IMAGE])] },
    };

    const migrated = migrateChatPersistedState(snapshot, 1);

    expect(migrated.messages.c1[0].attachments?.[0]).not.toHaveProperty("dataUrl");
  });

  test("v2 不再改写附件（数据已符合当前 schema）", () => {
    const snapshot = {
      conversations: [],
      activeConversationId: "c1",
      messages: { c1: [userMessage("m1", [IMAGE])] },
    };

    const migrated = migrateChatPersistedState(snapshot, CHAT_PERSIST_VERSION);

    expect(migrated.messages.c1[0].attachments?.[0].dataUrl).toBe(IMAGE.dataUrl);
  });

  test("未知/损坏的快照回落到空状态，而不是抛错", () => {
    expect(migrateChatPersistedState(null, 1)).toEqual(EMPTY_CHAT_PERSISTED_STATE);
    expect(migrateChatPersistedState("nope", 1)).toEqual(EMPTY_CHAT_PERSISTED_STATE);
    expect(migrateChatPersistedState({}, 1)).toEqual(EMPTY_CHAT_PERSISTED_STATE);
  });

  test("缺失字段用空值补齐，不返回 undefined", () => {
    const migrated = migrateChatPersistedState({ conversations: [] }, 1);

    expect(migrated.activeConversationId).toBeNull();
    expect(migrated.messages).toEqual({});
    expect(migrated.drafts).toEqual({});
  });

  test("保留草稿与 activeConversationId", () => {
    const migrated = migrateChatPersistedState(
      { conversations: [], activeConversationId: "c9", messages: {}, drafts: { c9: "draft text" } },
      2,
    );

    expect(migrated.activeConversationId).toBe("c9");
    expect(migrated.drafts).toEqual({ c9: "draft text" });
  });
});

describe("migrateSettingsPersistedState", () => {
  const legacy = {
    theme: "dark",
    openrouterApiKey: "sk-or-secret",
    deepseekApiKey: "sk-ds-secret",
    openaiApiKey: "sk-oa-secret",
    customApiKey: "sk-custom-secret",
  };

  test("v1 → v2 剥除四个明文密钥", () => {
    const migrated = migrateSettingsPersistedState(legacy, 1);

    expect(migrated).not.toHaveProperty("openrouterApiKey");
    expect(migrated).not.toHaveProperty("deepseekApiKey");
    expect(migrated).not.toHaveProperty("openaiApiKey");
    expect(migrated).not.toHaveProperty("customApiKey");
  });

  test("非密钥字段原样保留", () => {
    const migrated = migrateSettingsPersistedState(legacy, 1);

    expect(migrated.theme).toBe("dark");
  });

  test("已是当前版本时不改动快照", () => {
    const migrated = migrateSettingsPersistedState(legacy, SETTINGS_PERSIST_VERSION);

    expect(migrated).toEqual(legacy);
  });

  test("损坏快照回落到空对象", () => {
    expect(migrateSettingsPersistedState(null, 1)).toEqual({});
    expect(migrateSettingsPersistedState(42, 1)).toEqual({});
  });
});

describe("scrubLegacySecrets", () => {
  test("无明文密钥时返回 null（调用方跳过写盘）", () => {
    expect(scrubLegacySecrets(wrapSettings({ theme: "dark" }))).toBeNull();
  });

  test("空字符串密钥不算残留", () => {
    expect(scrubLegacySecrets(wrapSettings({ openrouterApiKey: "" }))).toBeNull();
  });

  test("清除密钥并把版本提升到当前值", () => {
    const raw = wrapSettings({ theme: "dark", openaiApiKey: "sk-secret" }, 1);
    const scrubbed = scrubLegacySecrets(raw);

    expect(scrubbed).not.toBeNull();

    const parsed = JSON.parse(scrubbed as string) as {
      state: Record<string, unknown>;
      version: number;
    };

    expect(parsed.state).not.toHaveProperty("openaiApiKey");
    expect(parsed.state.theme).toBe("dark");
    expect(parsed.version).toBe(SETTINGS_PERSIST_VERSION);
  });

  test("非法 JSON 返回 null 而不是抛错", () => {
    expect(scrubLegacySecrets("{not json")).toBeNull();
    expect(scrubLegacySecrets("null")).toBeNull();
    expect(scrubLegacySecrets(JSON.stringify({ state: null }))).toBeNull();
  });
});
