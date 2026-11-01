import { describe, expect, test } from "vitest";

import { isSameStreamingScope, type StreamingScope } from "../src/lib/store/streaming";

const active: StreamingScope = { conversationId: "conv-a", messageId: "msg-1" };

describe("isSameStreamingScope", () => {
  test("同一会话的同一条消息：结束生效", () => {
    expect(isSameStreamingScope(active, "conv-a", "msg-1")).toBe(true);
  });

  test("新流已经接管时，旧流的 finally 不应生效", () => {
    // 旧流 msg-1 结束时，store 里已经是 msg-2
    const current: StreamingScope = { conversationId: "conv-a", messageId: "msg-2" };
    expect(isSameStreamingScope(current, "conv-a", "msg-1")).toBe(false);
  });

  test("不同会话互不影响", () => {
    expect(isSameStreamingScope(active, "conv-b", "msg-1")).toBe(false);
  });

  test("空闲状态（null）下任何结束通知都不生效", () => {
    expect(isSameStreamingScope(null, "conv-a", "msg-1")).toBe(false);
  });

  test("回归：流式中重试，旧流收尾不得清掉新流状态", () => {
    let state: StreamingScope | null = { conversationId: "conv-a", messageId: "msg-1" };

    // 用户在流式中点了「重新生成」，新流接管
    state = { conversationId: "conv-a", messageId: "msg-2" };

    // 旧流被 abort 后走 finally
    if (isSameStreamingScope(state, "conv-a", "msg-1")) state = null;
    expect(state).toEqual({ conversationId: "conv-a", messageId: "msg-2" });

    // 新流正常结束
    if (isSameStreamingScope(state, "conv-a", "msg-2")) state = null;
    expect(state).toBeNull();
  });
});
