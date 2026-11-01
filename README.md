# starter

基于 Tauri 2 的桌面端 AI 对话客户端。前端 React 19 + TypeScript + Vite，后端只提供系统能力；没有服务端，模型请求由 WebView 直连 provider。

## 功能

- 多 provider 对话：OpenRouter、DeepSeek、OpenAI 及自定义 OpenAI 兼容端点
- 流式输出与思维链（Thinking）分块展示，逐行增量语法高亮
- Markdown 渲染：GFM 表格、任务列表、KaTeX 公式
- Artifact 面板：HTML / React / SVG / Mermaid / Markdown 预览，其余类型查看源码
- 附件输入：图片走多模态，文本文件作为上下文
- 会话本地持久化、草稿按会话隔离、命令面板、全局唤起快捷键
- 系统集成：开机自启、窗口置顶、关闭到托盘、完成通知与提示音

## 环境要求

| 依赖 | 版本                            |
| ---- | ------------------------------- |
| Bun  | 1.4+                            |
| Rust | stable（需支持 `edition 2024`） |
| Node | 不需要，构建与测试均由 Bun 运行 |

macOS 需安装 Xcode Command Line Tools。Linux 需先装 Tauri 的依赖：

```bash
sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev \
  librsvg2-dev libxdo-dev libssl-dev build-essential curl wget file
```

## 快速开始

```bash
bun install
bun run tauri dev
```

首次启动后到「设置 → 模型」填入任一 provider 的 API Key。密钥保存在系统钥匙串（macOS Keychain），不写入浏览器存储。

仅调试界面时用 `bun run dev`，此时所有系统能力（钥匙串、通知、写入文件、窗口控制）自动降级。

## 脚本

| 命令                   | 作用                           |
| ---------------------- | ------------------------------ |
| `bun run dev`          | 启动 Vite 开发服务器（浏览器） |
| `bun run tauri dev`    | 启动完整桌面端                 |
| `bun run build`        | 类型检查 + 前端生产构建        |
| `bun run test`         | 运行单元测试（Vitest）         |
| `bun run test:watch`   | 监听模式                       |
| `bun run lint`         | oxlint                         |
| `bun run format`       | oxfmt 格式化                   |
| `bun run format:check` | 校验格式                       |
| `bun run tauri build`  | 打包当前平台安装包             |

`justfile` 提供了组合命令：`just check`（构建 + Rust 检查 + lint）、`just fmt-check`（两边格式校验）、`just clippy`、`just clean`。

## 项目结构

```text
src/
  components/    chat、artifacts、layout、settings、search、common、ui
  lib/ai/        模型定义与 AI SDK 封装
  lib/store/     zustand 状态与持久化
  lib/tauri/     系统能力封装
  hooks/         通用与 Tauri 同步 hooks
  styles/        应用级样式
tests/           单元测试
src-tauri/       Rust 后端与打包配置
```

`src/components/ui/` 是 shadcn 生成的组件库，不参与手工维护，格式化与 lint 已排除该目录。

## 测试

```bash
bun run test
```

覆盖持久化迁移与附件剥离、密钥清洗、流式状态作用域、快捷键归一化、会话导出等纯逻辑。用例放在 `tests/`，运行在 node 环境，不依赖 DOM。

## 打包与发布

打 tag 触发 GitHub Actions 构建三平台安装包并自动生成 release notes：

```bash
git tag v0.1.0
git push origin v0.1.0
```

产物：macOS（仅 Apple Silicon）`.dmg`、Windows `.msi` / `.exe`、Linux `.AppImage` / `.deb` / `.rpm`，附 `SHA256SUMS.txt`。

macOS 签名与公证、Windows Authenticode 为可选项，未配置 Secret 时产出未签名安装包。

## 更多

- 给编码代理的约定见 `AGENTS.md`
- 授权配置见 `src-tauri/capabilities/default.json`
- 发布流水线见 `.github/workflows/release.yml`
