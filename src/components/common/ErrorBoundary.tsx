import { AlertTriangle, RotateCcw } from "lucide-react";
import * as React from "react";

interface Props {
  children: React.ReactNode;
  /** 自定义降级 UI；缺省时渲染整屏错误页 */
  fallback?: React.ReactNode;
  /** 这些值变化时自动清除错误状态（常用于切换会话 / 切换面板） */
  resetKeys?: readonly unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  /** 上一次的 resetKeys，用于在 props 变化时自动恢复 */
  resetKeys: readonly unknown[];
}

/**
 * 错误边界。
 *
 * 推荐用法：除根级兜底外，在对话区、Artifacts 面板各包一层，
 * 让单个渲染错误只降级局部区域，而不是整页白屏。
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false, error: null, resetKeys: [] };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  /**
   * resetKeys 变化时清除错误状态。
   * 放在 getDerivedStateFromProps 而非 componentDidUpdate，
   * 避免「更新后再 setState」引发的第二轮渲染。
   */
  public static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    const previousKeys = state.resetKeys;
    const nextKeys = props.resetKeys ?? [];

    const changed =
      previousKeys.length !== nextKeys.length ||
      nextKeys.some((key, index) => key !== previousKeys[index]);

    if (!changed) return null;

    return { hasError: false, error: null, resetKeys: nextKeys };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] 捕获到渲染错误", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return (
      <div className="bg-background text-foreground flex h-screen w-screen flex-col items-center justify-center p-6 select-none">
        <div className="flex max-w-md flex-col items-center space-y-4 text-center">
          <div className="bg-destructive/10 text-destructive border-destructive/20 flex size-14 items-center justify-center rounded-2xl border shadow-sm">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">页面出错了</h2>
          <p
            role="alert"
            aria-live="assertive"
            className="text-muted-foreground bg-muted/40 border-border/60 max-w-full overflow-x-auto rounded-lg border p-3 text-left font-mono text-xs"
          >
            {this.state.error?.message ?? "桌面视图中发生了未预期的错误。"}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>重新加载应用</span>
          </button>
        </div>
      </div>
    );
  }
}

interface PanelErrorFallbackProps {
  label: string;
}

/**
 * 局部区域降级 UI，用于分区错误边界。
 * 错误详情由边界自身打印到控制台，这里只给用户一个明确的范围提示。
 */
export function PanelErrorFallback({ label }: PanelErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-xs"
    >
      <AlertTriangle className="text-destructive size-6" aria-hidden="true" />
      <span className="text-foreground font-medium">{label}渲染失败</span>
      <span>已隔离该区域，其余功能仍可正常使用。切换会话或收起面板后会自动重试。</span>
    </div>
  );
}
