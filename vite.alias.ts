import path from "node:path";

/** `@/` → `src/`，与 tsconfig.json 的 paths 保持一致 */
export const alias = {
  "@": path.resolve(import.meta.dirname, "./src"),
};
