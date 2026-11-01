import {
  AlertCircle,
  Download,
  Monitor,
  RotateCcw,
  Smartphone,
  Tablet,
  Terminal,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { ArtifactType } from "@/lib/ai/types";
import { useSettingsStore } from "@/lib/store/settings-store";
import { saveTextFile } from "@/lib/tauri/fs";

/** 控制台输出上限，避免长时间运行导致内存无限增长 */
const MAX_LOG_ENTRIES = 200;

/** 注入到 iframe 的控制台桥接脚本（父窗口只能收到 iframe 自己的消息） */
const CONSOLE_BRIDGE = `
  window.onerror = function (msg, url, line) {
    window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: msg + ' (line ' + line + ')' }, '*');
  };
  const origLog = console.log;
  console.log = function (...args) {
    origLog.apply(console, args);
    window.parent.postMessage({
      type: 'CONSOLE_LOG',
      level: 'log',
      message: args.map(function (a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ')
    }, '*');
  };
`;

interface SandboxPreviewProps {
  content: string;
  type: ArtifactType;
}

export function SandboxPreview({ content, type }: SandboxPreviewProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = React.useState<"desktop" | "tablet" | "mobile">("desktop");
  const [logs, setLogs] = React.useState<Array<{ type: "log" | "error"; message: string }>>([]);
  const [showConsole, setShowConsole] = React.useState(false);

  const downloadPath = useSettingsStore((state) => state.downloadPath);

  const srcDoc = React.useMemo(() => {
    if (type === "svg") {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #121212;
      background-image: radial-gradient(#262626 1px, transparent 1px);
      background-size: 16px 16px;
    }
    svg { max-width: 90vw; max-height: 90vh; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
    }

    if (type === "react") {
      // React 19 已不再发布 UMD 构建，这里沿用 18 的 UMD + Babel standalone。
      // 构建产物用 production.min 版本，避免在预览里跑开发期检查。
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
  <script>${CONSOLE_BRIDGE}</script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4">
  <div id="root"></div>
  <script type="text/babel">
    ${content}

    // 依次尝试挂载 default export / App / Component
    try {
      const TargetComponent = typeof App !== 'undefined' ? App : (typeof Component !== 'undefined' ? Component : null);
      if (TargetComponent) {
        ReactDOM.createRoot(document.getElementById('root')).render(<TargetComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div class="p-4 text-amber-400">提示：请定义一个 App 组件用于渲染。</div>';
      }
    } catch (e) {
      console.error(e.message);
    }
  </script>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
  <script>${CONSOLE_BRIDGE}</script>
</head>
<body>
  ${content}
</body>
</html>`;
  }, [content, type]);

  // 只接受来自本 iframe 的消息，防止页面内其他上下文伪造日志
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const payload = event.data as { type?: string; level?: string; message?: string } | null;
      if (!payload || payload.type !== "CONSOLE_LOG") return;

      const entry = {
        type: payload.level === "error" ? ("error" as const) : ("log" as const),
        message: String(payload.message ?? ""),
      };

      setLogs((previous) => [...previous, entry].slice(-MAX_LOG_ENTRIES));
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleReload = React.useCallback(() => {
    setLogs([]);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = srcDoc;
    }
  }, [srcDoc]);

  const handleExport = React.useCallback(() => {
    void saveTextFile(downloadPath, `preview-${Date.now()}.html`, srcDoc);
  }, [downloadPath, srcDoc]);

  const deviceWidth = React.useMemo(() => {
    switch (device) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  }, [device]);

  const deviceOptions = [
    { id: "desktop" as const, icon: Monitor, label: "桌面视图" },
    { id: "tablet" as const, icon: Tablet, label: "平板视图 (768px)" },
    { id: "mobile" as const, icon: Smartphone, label: "手机视图 (375px)" },
  ];

  return (
    <div className="bg-background relative flex h-full flex-col">
      <div className="border-border/50 bg-muted/20 flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-1" role="group" aria-label="预览设备尺寸">
          {deviceOptions.map((option) => {
            const Icon = option.icon;

            return (
              <Button
                key={option.id}
                variant="ghost"
                size="icon-xs"
                onClick={() => setDevice(option.id)}
                aria-pressed={device === option.id}
                aria-label={option.label}
                className={`h-7 w-7 ${
                  device === option.id ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                title={option.label}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-muted-foreground h-7 gap-1 px-2 text-xs"
            title="导出当前预览为 HTML 文件"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>导出</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConsole((current) => !current)}
            aria-expanded={showConsole}
            className={`h-7 gap-1 px-2 text-xs ${
              logs.length > 0 ? "text-amber-500" : "text-muted-foreground"
            }`}
            title="展开/收起控制台"
          >
            <Terminal className="size-3.5" aria-hidden="true" />
            <span>控制台 ({logs.length})</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleReload}
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            aria-label="重新加载预览"
            title="重新加载预览"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-neutral-900/60 p-2 sm:p-4">
        <div
          className={`h-full ${deviceWidth} border-border/60 bg-background overflow-hidden rounded-lg border shadow-lg transition-all duration-200`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            // 故意不给 allow-same-origin：脚本无法访问父页面存储与 DOM
            sandbox="allow-scripts allow-modals"
            className="bg-background h-full w-full border-none"
            title="Artifacts 沙箱预览"
          />
        </div>
      </div>

      {showConsole && (
        <div
          role="log"
          aria-label="沙箱控制台输出"
          className="border-border/60 bg-muted/40 max-h-40 overflow-y-auto border-t p-2 font-mono text-xs"
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground/60 py-1 italic">暂无控制台输出或错误。</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${index}-${log.message.slice(0, 12)}`}
                className={`flex items-start gap-1.5 py-0.5 ${
                  log.type === "error" ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {log.type === "error" && (
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
