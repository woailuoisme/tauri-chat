# AGENTS.md

给编码代理（Claude Code / Codex / Cursor 等）的项目约定。人类读者请看 `README.md`。

## 项目定位

Tauri 2 桌面端 AI 对话客户端。前端 React 19 + TypeScript，后端只提供系统能力（钥匙串、文件写入、窗口管理），**没有服务端**，模型请求由 WebView 直连 provider。

## 常用命令

```bash
bun install                  # 安装依赖（不要用 npm/yarn/pnpm，存在 bun.lock）
bun run dev                  # 仅前端，浏览器调试
bun run tauri dev            # 完整桌面端
bun run build                # tsc 类型检查 + vite build
bun run test                 # vitest run（tests/ 目录）
bun run lint                 # oxlint
bun run format               # oxfmt 写入
bun run format:check         # oxfmt 校验

cd src-tauri
cargo check
cargo clippy -- -D warnings  # 必须零告警
cargo fmt -- --check
```

`just check` 串起 build + cargo check + lint；`just fmt-check` 串起两边格式校验；**`just verify` 是提交前全量门禁**（构建、测试、lint、格式、Markdown lint、密钥扫描、Rust 三件套）。

## 目录

```text
src/
  components/
    ui/            shadcn 生成代码，见下方红线
    chat/          对话区；input/ 下是输入框的拆分模块
    artifacts/     Artifact 面板与内嵌预览（Sandbox / Mermaid / Markdown）
    layout/        侧边栏、头部、整体布局
    settings/      设置外壳 + tabs/ 下 7 个面板
    search/        命令面板
    common/        ErrorBoundary
  lib/
    ai/            types、providers（AI SDK 封装）、artifacts（语言映射）
    chat/          纯函数：消息 ID、历史截取
    store/         zustand：chat / settings / artifacts，外加 persist-utils、streaming
    tauri/         env、secure-store、window、fs、accelerator
    utils/         relative-time、transcript、clipboard
  hooks/           use-chat-stream、use-chat-scroll、use-tauri-sync 等
  styles/          应用级样式（chat-typography.css）
  global.css       shadcn 生成的主题变量
tests/             vitest 用例，纯函数为主，node 环境
src-tauri/         Rust 侧：keyring 命令、save_text_file、窗口事件、capabilities
```

## 红线

1. **`src/components/ui/**` 禁止修改与删除。** 这是 shadcn 生成的 63 个文件。需要不同行为时改调用方，或在 `src/components/` 下另建组件包一层。格式化与 lint 已通过 `ignorePatterns` / `exclude` 排除该目录，不要撤销。
2. **`src/global.css` 视为生成文件。** 它可能被 `shadcn add` 整体覆盖。应用级样式写到 `src/styles/*.css`，从 `src/main.tsx` 引入。唯一例外是必须由 Tailwind 编译的指令（如 `@plugin "@tailwindcss/typography"`），这类只能留在该文件里。
3. **不要改 `src-tauri/tauri.conf.json` 的 `identifier` 与 `productName`。** 它们绑定了签名、钥匙串服务名与更新源。
4. **未经明确要求不要执行 `git commit` / `git push`。**
5. **删除文件前先全局搜引用。** `src/hooks/use-mobile.ts` 看似无人使用，实际被 `components/ui/sidebar.tsx` 引用，删了会直接让 `tsc` 失败。

## 架构约定

### 状态

- 三个 zustand store 都带 `persist` + `version` + `migrate`。schema 变更必须提升版本并写迁移。
- **订阅一律用选择器**：`useChatStore((s) => s.messages[id])`。禁止 `useChatStore()` 全量解构——会让无关更新（命令面板开关、流式 token）触发整棵组件树重渲染。
- 回调里读最新状态用 `useChatStore.getState()`，不要把它放进 `useCallback` 依赖。

### 持久化

- 密钥**不进 localStorage**。四个 API Key 走系统钥匙串（`lib/tauri/secure-store.ts` → Rust `secret_get/set/delete`），`settings-store` 的 `partialize` 显式排除。
- 附件二进制（`dataUrl` / `content`）**不进持久化**，写入前由 `stripMessagesPayload` 剥离，只保留元数据。
- 聊天历史的写入路径是 `lib/store/chat-persist-storage.ts`：缓冲对象引用，500ms 合并后才 `strip + JSON.stringify`。**不要**改成在 `partialize` 里遍历消息——那会让每次 `set`（含每个按键、每帧流式）都做全量序列化。
- 纯函数（剥离、迁移、密钥清洗）放在 `lib/store/persist-utils.ts`，不 import store / localStorage / Tauri，以便单测。

### 流式

- token 先写 ref，再按 `requestAnimationFrame` 合帧写入 store。不要在 `onChunk` 里直接 `set`。
- `endStreaming(conversationId, messageId)` 是**作用域化**的：旧流的 `finally` 不得清掉新流的状态。判定逻辑在 `lib/store/streaming.ts`，有回归测试。
- `abortControllerRef` 清理前要判归属，否则旧流会把新流的 controller 置空，导致「停止」按钮失效。
- `MessageItem` 由 `memo` 包裹，父组件传给它的回调必须稳定（`useCallback` + `getState`）。

### Tauri 能力层

- 所有 OS 调用先过 `isTauri()`（`lib/tauri/env.ts`），保证纯浏览器 `bun run dev` 不产生未捕获异常。
- 失败统一走 `reportCapabilityFailure(scope, error)`，不要裸 `console.error` 吞掉。
- 新增 Rust command 后要同步 `src-tauri/src/lib.rs` 的 `generate_handler!` 与 `capabilities/default.json` 的权限。`cargo check` 只校验标识符合法性，不校验运行时是否真的需要，删权限前先搜前端 import 清单。

## 代码风格

- 注释、提交信息、界面文案用中文；标识符用英文。
- 注释解释**为什么**，不复述代码；显而易见的实现不写注释。
- 禁用 `any`。`strict` / `noUnusedLocals` / `noUnusedParameters` 全开，任何未使用的导入都会让构建失败。
- 组件超过约 300 行或承担多种职责时拆分。参考 `components/chat/input/`：纯工具、hook、展示组件各自成文件。
- 不为「将来可能需要」加参数或抽象。

## 已知陷阱

- **Vite 配置的相对导入必须带扩展名。** `vite.config.ts` / `vitest.config.ts` 里写 `./vite.alias.ts`，少写扩展名会触发 `configLoader: 'native'` 的告警（未来的默认模式会直接失败）。
- **zustand `persist` 的 `migrate` 只改内存对象**，不影响磁盘上的旧值。需要清除旧数据（如历史明文密钥）必须显式重写 storage，参考 `main.tsx` 的启动期清洗。
- **`tsconfig.json` 的 `include` 只有 `src`**，所以 `tests/` 与根目录配置文件不参与主构建的类型检查。给 `tests/` 加类型约束需要单独的 tsconfig。
- **Tailwind 的 `rem` 不随字号设置变化。** 正文用 `--chat-font-size`，代码块用派生的 `--chat-code-font-size`；用 `em` 会以中间层元素的字号为准，结果不可控。
- **oxlint 的 `react-hooks` 规则会拒绝「多余依赖」。** 需要每次渲染都跑的逻辑可以不写依赖数组；被 lint 拒绝的依赖（如只用于触发时机的 `input`）改成显式参数传进回调。
- **Rust 的 `if let` 嵌套会被 clippy 判为 collapsible**，用 `if let ... && let ...` 的 let-chain 写法（edition 2024 可用）。

## 改动前自检

1. 改动是否落在 `src/components/ui/` 或 `src/global.css`？如果是，停下来重新设计。
2. 是否新增了会写入 localStorage 的数据？先确认不含密钥与 base64。
3. 是否新增了每次渲染 / 每个 token 都会执行的昂贵逻辑？
4. 是否动了 `endStreaming`、`partialize`、流式路径？这三处最容易引入回归，跑 `bun run test` 并手动验证并发重试。
5. `just verify` 是否全绿。
