import * as React from "react";

/**
 * 低频时钟：按固定间隔返回当前时间戳。
 * 用于让「今天 / 最近 7 天 / 更早」这类分组随时间自然刷新，
 * 而不是在挂载时把时间冻结。
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
