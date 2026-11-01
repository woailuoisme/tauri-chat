import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { scrubLegacySecrets } from "./lib/store/persist-utils";
import { hydrateApiKeys, SETTINGS_PERSIST_KEY } from "./lib/store/settings-store";
import { reportCapabilityFailure } from "./lib/tauri/env";

// global.css 由 shadcn 生成，应用级样式单独引入，避免被 `shadcn add` 覆盖
import "./global.css";
import "./styles/chat-typography.css";
import "katex/dist/katex.min.css";

const container = document.getElementById("root");

/**
 * 清理 v1 遗留在 localStorage 的明文 API Key。
 *
 * zustand 的 `migrate` 只改内存对象、hydration 后不回写 storage，
 * 因此磁盘上的明文必须在这里显式重写一次，否则会一直残留到
 * 「用户某天恰好改了某个设置」才被覆盖。
 */
function scrubLegacyPersistedSecrets(): void {
  try {
    const raw = localStorage.getItem(SETTINGS_PERSIST_KEY);
    if (!raw) return;

    const scrubbed = scrubLegacySecrets(raw);
    if (scrubbed) {
      localStorage.setItem(SETTINGS_PERSIST_KEY, scrubbed);
      console.info("[bootstrap] 已清除历史遗留的明文 API Key");
    }
  } catch (error) {
    reportCapabilityFailure("bootstrap:legacy-secret-scrub", error);
  }
}

/** 挂载 React 根节点 */
function renderApp() {
  if (!container) {
    throw new Error('未找到挂载节点 "#root"');
  }

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// 顺序不可调换：先擦除磁盘明文，再从钥匙串回填密钥并渲染
scrubLegacyPersistedSecrets();

hydrateApiKeys()
  .catch((error: unknown) => {
    reportCapabilityFailure("bootstrap:hydrate-api-keys", error);
  })
  .finally(renderApp);
