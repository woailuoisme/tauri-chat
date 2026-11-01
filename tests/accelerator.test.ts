import { describe, expect, test } from "vitest";

import { normalizeAccelerator } from "../src/lib/tauri/accelerator";

describe("normalizeAccelerator", () => {
  test("macOS 的 Option 别名为 Alt", () => {
    expect(normalizeAccelerator("Option+Space")).toBe("Alt+Space");
    expect(normalizeAccelerator("opt+space")).toBe("Alt+Space");
    expect(normalizeAccelerator("alt+space")).toBe("Alt+Space");
  });

  test("Cmd / Command / Meta / Super 统一为 CommandOrControl", () => {
    for (const alias of ["cmd", "command", "meta", "super", "CMD"]) {
      expect(normalizeAccelerator(`${alias}+k`)).toBe("CommandOrControl+K");
    }
  });

  test("多修饰键顺序保持不变", () => {
    expect(normalizeAccelerator("cmd+shift+k")).toBe("CommandOrControl+Shift+K");
    expect(normalizeAccelerator("shift+cmd+k")).toBe("Shift+CommandOrControl+K");
  });

  test("单字符键大写，功能键保持原样", () => {
    expect(normalizeAccelerator("alt+t")).toBe("Alt+T");
    expect(normalizeAccelerator("Control+F5")).toBe("Control+F5");
  });

  test("忽略空白与多余分隔符", () => {
    expect(normalizeAccelerator("  Option + Space  ")).toBe("Alt+Space");
    expect(normalizeAccelerator("cmd++k")).toBe("CommandOrControl+K");
  });

  test("空输入返回空串（调用方据此跳过注册）", () => {
    expect(normalizeAccelerator("")).toBe("");
    expect(normalizeAccelerator("+")).toBe("");
    expect(normalizeAccelerator("   ")).toBe("");
  });
});
