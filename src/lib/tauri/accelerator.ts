/**
 * 全局快捷键加速键归一化。
 *
 * 独立成模块（不 import 任何 `@tauri-apps/*`），以便在 `vitest` 中直接单测。
 */

/** macOS 叫法 → Tauri / global-hotkey 认可的修饰键名称 */
const MODIFIER_ALIASES: Record<string, string> = {
  option: "Alt",
  opt: "Alt",
  alt: "Alt",
  cmd: "CommandOrControl",
  command: "CommandOrControl",
  meta: "CommandOrControl",
  super: "CommandOrControl",
  ctrl: "Control",
  control: "Control",
  shift: "Shift",
  space: "Space",
};

/**
 * 把用户配置里的修饰键写法（Option / Cmd …）规范化为 Tauri 认可的加速键。
 * 例如 `"option+space"` → `"Alt+Space"`，`"cmd+shift+k"` → `"CommandOrControl+Shift+K"`。
 *
 * 空串或仅含分隔符时返回空串，调用方据此跳过注册。
 */
export function normalizeAccelerator(input: string): string {
  return input
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const alias = MODIFIER_ALIASES[part.toLowerCase()];
      if (alias) return alias;

      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join("+");
}
