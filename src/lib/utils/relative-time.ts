/**
 * 相对时间格式化。
 *
 * 取代原先手写的 `formatRelativeTime`（依赖 `date-fns` 却未使用），
 * 统一走 `Intl.RelativeTimeFormat`，自动获得本地化输出。
 */

type UnitStep = [Intl.RelativeTimeFormatUnit, number];

/** 各时间单位的进位阈值（当前单位下，达到多少即进到下一单位） */
const UNIT_STEPS: readonly UnitStep[] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
];

const formatter = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

/**
 * 把时间戳格式化成「3 分钟前」这类相对时间。
 * @param target 目标时间戳（毫秒）
 * @param now 参照时间，默认当前时刻
 */
export function formatRelativeTime(target: number, now: number = Date.now()): string {
  if (!target) return "刚刚";

  // 转为「秒」差，负数表示过去
  let delta = Math.round((target - now) / 1000);

  for (const [unit, limit] of UNIT_STEPS) {
    if (Math.abs(delta) < limit) {
      return formatter.format(delta, unit);
    }
    delta = Math.round(delta / limit);
  }

  return formatter.format(delta, "year");
}
