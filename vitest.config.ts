import { defineConfig } from "vitest/config";

import { alias } from "./vite.alias.ts";

/**
 * 与 `vite.config.ts` 分离：跑测试不需要 react / tailwind 插件。
 * 加组件测试时用 `test.projects` 拆出 jsdom 环境即可。
 */
export default defineConfig({
  resolve: { alias },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
