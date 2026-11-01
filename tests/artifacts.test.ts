import { describe, expect, test } from "vitest";

import {
  ARTIFACT_LANGUAGES,
  PREVIEWABLE_TYPES,
  canPreviewArtifact,
  resolveArtifactType,
} from "../src/lib/ai/artifacts";
import type { ArtifactType } from "../src/lib/ai/types";

describe("resolveArtifactType", () => {
  test("Markdown 的两种写法都归一为 markdown", () => {
    expect(resolveArtifactType("markdown")).toBe("markdown");
    expect(resolveArtifactType("md")).toBe("markdown");
    expect(resolveArtifactType("MD")).toBe("markdown");
  });

  test("Mermaid 支持 mmd 扩展名别名", () => {
    expect(resolveArtifactType("mermaid")).toBe("mermaid");
    expect(resolveArtifactType("mmd")).toBe("mermaid");
  });

  test("React 家族统一归为 react", () => {
    for (const language of ["jsx", "tsx", "react"]) {
      expect(resolveArtifactType(language)).toBe("react");
    }
  });

  test("大小写不敏感", () => {
    expect(resolveArtifactType("HTML")).toBe("html");
    expect(resolveArtifactType("Svg")).toBe("svg");
  });

  test("未知语言归入通用 code", () => {
    expect(resolveArtifactType("rust")).toBe("code");
    expect(resolveArtifactType("")).toBe("code");
  });
});

describe("canPreviewArtifact", () => {
  test("有预览能力的类型", () => {
    for (const type of ["html", "react", "svg", "mermaid", "markdown"] as ArtifactType[]) {
      expect(canPreviewArtifact(type)).toBe(true);
    }
  });

  test("纯代码类型不提供预览", () => {
    expect(canPreviewArtifact("code")).toBe(false);
    expect(canPreviewArtifact("text")).toBe(false);
  });
});

describe("语言与预览集合的一致性", () => {
  // 这些是通用编程语言，本来就没有可视化形态，归入 code 属预期
  const PLAIN_LANGUAGES = new Set(["javascript", "typescript", "python", "css"]);

  test("白名单里的语言除通用语言外都能解析成可预览类型", () => {
    for (const language of ARTIFACT_LANGUAGES) {
      const type = resolveArtifactType(language);

      if (PLAIN_LANGUAGES.has(language)) {
        expect(type).toBe("code");
      } else {
        // 新增语言却忘了在 resolveArtifactType 里映射时，这里会失败
        expect(canPreviewArtifact(type)).toBe(true);
      }
    }
  });

  test("白名单覆盖了除 code 之外的全部 ArtifactType", () => {
    const allTypes: ArtifactType[] = ["code", "html", "react", "svg", "mermaid", "markdown"];

    for (const type of allTypes) {
      if (type === "code") continue;
      expect(PREVIEWABLE_TYPES.has(type)).toBe(true);
    }
  });
});
