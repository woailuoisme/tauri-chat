/**
 * 运行时环境探测与统一降级日志。
 *
 * 所有 OS 能力模块（`secure-store` / `window` / `fs`）都必须先过 `isTauri()`，
 * 保证 `bun run dev` 在纯浏览器中打开时不产生未捕获的 promise rejection。
 */

/** 判断当前是否运行在 Tauri WebView 内 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 记录一次降级/失败。
 *
 * Tauri 环境下额外写入 `tauri-plugin-log`（已注册），便于在应用日志里排查；
 * 浏览器环境只走 console。动态 import 保证纯浏览器不会加载插件包。
 * 禁止传入密钥、附件内容或完整 prompt。
 */
export function reportCapabilityFailure(scope: string, error: unknown): void {
  // 浏览器环境里失败多半与 Tauri 无关，前缀据实标注，避免排查时被带偏
  const prefix = isTauri() ? "tauri" : "capability";
  const message = `[${prefix}:${scope}] ${error instanceof Error ? error.message : String(error)}`;

  console.warn(message);

  if (!isTauri()) return;

  void import("@tauri-apps/plugin-log")
    .then((log) => log.warn(message))
    .catch(() => {
      // 日志插件不可用时保持静默，避免降级路径本身报错
    });
}
