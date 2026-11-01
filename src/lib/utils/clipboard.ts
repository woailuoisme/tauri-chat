import { reportCapabilityFailure } from "@/lib/tauri/env";

/**
 * 写入系统剪贴板。
 *
 * 复制属于尽力而为的旁路操作：失败只上报不抛出，调用方据返回值决定是否展示成功反馈。
 */
export function copyText(text: string, scope = "clipboard"): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    (error: unknown) => {
      reportCapabilityFailure(scope, error);
      return false;
    },
  );
}
