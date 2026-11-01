# ==============================================================================
# Justfile - Claude Desktop (Tauri 2 + Bun + Vite + React 19 + Rust)
# ==============================================================================

set shell := ["bash", "-uc"]

# 默认列出所有可用命令
default:
    @just --list --unsorted

# ------------------------------------------------------------------------------
# 1. 开发与运行 (Development)
# ------------------------------------------------------------------------------

# 启动完整 Tauri 桌面端开发环境（带热更新）
dev:
    bun run tauri dev

# 仅启动 Web 前端（浏览器调试，速度更快）
dev-web:
    bun run dev

# ------------------------------------------------------------------------------
# 2. 构建与打包 (Build & Release)
# ------------------------------------------------------------------------------

# 构建前端产物 (TypeScript 类型校验 + Vite 构建)
build:
    bun run build

# 构建桌面端 Release 正式安装包 (.dmg / .app)
build-app:
    bun run tauri build

# 构建桌面端 Debug 测试安装包
build-debug:
    bun run tauri build --debug

# ------------------------------------------------------------------------------
# 3. 代码质量与检查 (Quality & Linting)
# ------------------------------------------------------------------------------

# 全栈完整校验 (TypeScript + Rust + Lint)
check:
    @echo "==> 1/3 Checking TypeScript & Web Build..."
    bun run build
    @echo "==> 2/3 Checking Rust Backend..."
    cargo check --manifest-path src-tauri/Cargo.toml
    @echo "==> 3/3 Checking Linter..."
    bun run lint
    @echo "All checks passed successfully!"

# 提交前全量门禁：AGENTS.md 约定的四条，外加格式 / Markdown / 密钥扫描
verify:
    @echo "==> 1/7 Frontend build & type check"
    bun run build
    @echo "==> 2/7 Unit tests"
    bun run test
    @echo "==> 3/7 Lint"
    bun run lint
    @echo "==> 4/7 Frontend format"
    bun run format:check
    @echo "==> 5/7 Markdown lint"
    rumdl check .
    @echo "==> 6/7 Secret scan"
    gitleaks dir . --config .gitleaks.toml --no-banner --redact
    @echo "==> 7/7 Rust check / fmt / clippy"
    cargo check --manifest-path src-tauri/Cargo.toml
    cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
    cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
    @echo "All checks passed."

# 运行前端代码静态检查 (oxlint)
lint:
    bun run lint

# 自动修复前端代码格式与 Lint 警告
lint-fix:
    bun run lint:fix

# 格式化代码 (前端 oxfmt + 后端 cargo fmt)
fmt:
    bun run format
    cargo fmt --manifest-path src-tauri/Cargo.toml

# 校验代码格式规范 (不修改文件)
fmt-check:
    bun run format:check
    cargo fmt --manifest-path src-tauri/Cargo.toml -- --check

# 运行 Rust 后端 Clippy 代码分析
clippy:
    cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# ------------------------------------------------------------------------------
# 4. 项目维护与辅助 (Maintenance & Tools)
# ------------------------------------------------------------------------------

# 安装 / 重新同步前端依赖
install:
    bun install

# 清理构建缓存与临时文件 (dist / target)
clean:
    rm -rf dist
    cargo clean --manifest-path src-tauri/Cargo.toml
    @echo "Cleaned dist/ and src-tauri/target/."

# 查看当前 Tauri 系统环境与插件诊断报告
info:
    bun run tauri info

# 从单个高清图片生成全套 Tauri 应用图标 (例如: just icon ./app-icon.png)
icon input:
    bun run tauri icon {{input}}
