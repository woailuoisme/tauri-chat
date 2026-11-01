import type { ArtifactType } from "./types";

/** 可生成 Artifact 的语言集合（对话流与 Markdown 渲染共用同一份） */
export const ARTIFACT_LANGUAGES: ReadonlySet<string> = new Set([
  "html",
  "jsx",
  "tsx",
  "react",
  "svg",
  "mermaid",
  "mmd",
  "markdown",
  "md",
  "javascript",
  "typescript",
  "python",
  "css",
]);

/**
 * 有可视化预览能力的类型。
 *
 * 这是「Code / Preview」切换是否出现的唯一依据：
 * 不在集合里的类型只有源码可看，不应该给出一个点了没反应的 Preview。
 */
export const PREVIEWABLE_TYPES: ReadonlySet<ArtifactType> = new Set<ArtifactType>([
  "html",
  "react",
  "svg",
  "mermaid",
  "markdown",
]);

/** 是否支持预览 */
export function canPreviewArtifact(type: ArtifactType): boolean {
  return PREVIEWABLE_TYPES.has(type);
}

/** 语言 → Artifact 类型；未知语言归入通用 code */
export function resolveArtifactType(language: string): ArtifactType {
  switch (language.toLowerCase()) {
    case "html":
      return "html";
    case "jsx":
    case "tsx":
    case "react":
      return "react";
    case "svg":
      return "svg";
    case "mermaid":
    case "mmd":
      return "mermaid";
    case "markdown":
    case "md":
      return "markdown";
    default:
      return "code";
  }
}
