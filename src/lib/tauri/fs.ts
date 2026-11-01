import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

import { isTauri, reportCapabilityFailure } from "./env";

/**
 * 把文本写入用户配置的下载目录。
 * Tauri 环境走 Rust 侧 `save_text_file`（自动展开 `~`、自动建目录）；
 * 纯浏览器环境退回 blob 下载。
 */
export async function saveTextFile(
  dir: string,
  filename: string,
  contents: string,
): Promise<boolean> {
  if (!isTauri()) {
    return downloadViaBlob(filename, contents);
  }

  try {
    await invoke<string>("save_text_file", { dir, filename, contents });
    return true;
  } catch (error) {
    reportCapabilityFailure("save_text_file", error);
    return downloadViaBlob(filename, contents);
  }
}

/** 浏览器兜底下载 */
function downloadViaBlob(filename: string, contents: string): boolean {
  try {
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    reportCapabilityFailure("blob_download", error);
    return false;
  }
}

/** 发送系统通知，失败静默（用户可能在系统层关闭了权限） */
export async function notifyCompletion(title: string, body: string): Promise<void> {
  if (!isTauri()) return;

  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch (error) {
    reportCapabilityFailure("notification", error);
  }
}

/**
 * 提示音共用的 AudioContext 单例。
 *
 * 每次新建再 close 会导致泄漏（`ended` 事件不保证触发），
 * 而 WKWebView 对并发 AudioContext 有硬上限（约 6 个），
 * 泄漏几次后提示音会永久静默。
 */
let chimeContext: AudioContext | null = null;

function getChimeContext(): AudioContext | null {
  if (chimeContext) return chimeContext;
  if (typeof window === "undefined") return null;

  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) return null;

  chimeContext = new AudioContextClass();
  return chimeContext;
}

/**
 * 播放一段极短的完成提示音。
 * 用 Web Audio 合成，避免额外音频资源与网络请求；每次只新建振荡器与增益节点。
 */
export function playCompletionChime(): void {
  try {
    const context = getChimeContext();
    if (!context) return;

    // 未经用户手势创建的上下文初始为 suspended
    if (context.state === "suspended") {
      void context.resume();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);

    oscillator.addEventListener("ended", () => {
      // 断开节点即可，context 保留复用
      oscillator.disconnect();
      gain.disconnect();
    });
  } catch (error) {
    reportCapabilityFailure("chime", error);
  }
}
