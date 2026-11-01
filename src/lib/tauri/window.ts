import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";

import { normalizeAccelerator } from "./accelerator";
import { isTauri, reportCapabilityFailure } from "./env";

/** 同步开机自启状态 */
export async function syncLaunchOnStartup(enabled: boolean): Promise<void> {
  if (!isTauri()) return;

  try {
    if (enabled) await enableAutostart();
    else await disableAutostart();
  } catch (error) {
    reportCapabilityFailure("autostart", error);
  }
}

/** 同步窗口置顶 */
export async function syncAlwaysOnTop(enabled: boolean): Promise<void> {
  if (!isTauri()) return;

  try {
    await getCurrentWindow().setAlwaysOnTop(enabled);
  } catch (error) {
    reportCapabilityFailure("always_on_top", error);
  }
}

/**
 * 注册「关闭窗口即隐藏到托盘」。
 * 返回取消订阅函数；未启用时直接返回空操作。
 */
export async function setupCloseToTray(enabled: boolean): Promise<() => void> {
  if (!isTauri() || !enabled) return () => {};

  try {
    const appWindow = getCurrentWindow();

    const unlisten = await appWindow.onCloseRequested(async (event) => {
      event.preventDefault();
      await appWindow.hide();
    });

    return unlisten;
  } catch (error) {
    reportCapabilityFailure("close_to_tray", error);
    return () => {};
  }
}

/** 注销全部全局快捷键，失败仅记录日志 */
async function unregisterGlobalShortcuts(): Promise<void> {
  try {
    await unregisterAll();
  } catch (error) {
    reportCapabilityFailure("global_shortcut_unregister", error);
  }
}

/**
 * 注册全局唤起快捷键（默认 Alt+Space）。
 *
 * `enabled` 为 false 时主动注销——抢占系统级热键需要用户显式授权，
 * 默认状态下不应该悄悄占用。
 * 触发时显示并聚焦主窗口。注册失败（多半是系统占用）只记录日志。
 */
export async function syncGlobalShortcut(
  accelerator: string,
  enabled: boolean,
): Promise<() => Promise<void>> {
  if (!isTauri()) return async () => {};

  if (!enabled || !accelerator.trim()) {
    await unregisterGlobalShortcuts();
    return async () => {};
  }

  const normalized = normalizeAccelerator(accelerator);

  try {
    await register(normalized, async (event) => {
      if (event.state !== "Pressed") return;

      try {
        const appWindow = getCurrentWindow();
        await appWindow.show();
        await appWindow.setFocus();
      } catch (error) {
        reportCapabilityFailure("shortcut_focus", error);
      }
    });
  } catch (error) {
    reportCapabilityFailure(`global_shortcut:${normalized}`, error);
  }

  return unregisterGlobalShortcuts;
}
