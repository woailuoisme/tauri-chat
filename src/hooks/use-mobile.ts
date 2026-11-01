import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * 判断视口是否为移动端宽度。
 *
 * 说明：应用层目前未消费该 hook，但 `components/ui/sidebar.tsx`（shadcn 生成，
 * 不允许修改）依赖此模块路径，因此必须保留。
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
