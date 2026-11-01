import { describe, expect, test } from "vitest";

import { ROLE_LABELS, buildTranscript } from "../src/lib/utils/transcript";

const messages = [
  { role: "user", content: "解释一下所有权" },
  { role: "assistant", content: "Rust 通过借用检查器…" },
  { role: "system", content: "系统提示" },
];

describe("buildTranscript", () => {
  test("markdown 带一级标题与角色标签", () => {
    const result = buildTranscript(messages, "Rust 所有权", "markdown");

    expect(result.startsWith("# Rust 所有权")).toBe(true);
    expect(result).toContain(`**${ROLE_LABELS.user}**`);
    expect(result).toContain(`**${ROLE_LABELS.assistant}**`);
    expect(result).toContain("---");
  });

  test("plain 用换行分隔，不含 markdown 标记", () => {
    const result = buildTranscript(messages.slice(0, 2), "标题", "plain");

    expect(result).toBe(`我：解释一下所有权\n\n助手：Rust 通过借用检查器…`);
    expect(result).not.toContain("#");
    expect(result).not.toContain("**");
  });

  test("两种格式使用同一套角色词汇（不出现 USER/ASSISTANT）", () => {
    const markdown = buildTranscript(messages, "t", "markdown");
    const plain = buildTranscript(messages, "t", "plain");

    for (const text of [markdown, plain]) {
      expect(text).not.toContain("USER");
      expect(text).not.toContain("ASSISTANT");
    }
  });

  test("未知角色回落到原始 role 值", () => {
    const result = buildTranscript([{ role: "tool", content: "结果" }], "t", "plain");

    expect(result).toBe("tool：结果");
  });

  test("空列表只产出标题（markdown）", () => {
    expect(buildTranscript([], "空会话", "markdown")).toBe("# 空会话\n\n");
    expect(buildTranscript([], "空会话", "plain")).toBe("");
  });
});
