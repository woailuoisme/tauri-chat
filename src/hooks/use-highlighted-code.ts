import * as React from "react";

import { loadHighlighter } from "@/lib/highlighter";

/**
 * 流式友好的增量语法高亮。
 *
 * 设计要点：
 * 1. 高亮器按语言懒加载，加载完成前返回纯文本，不阻塞渲染；
 * 2. 已完成的整行只 tokenize 一次，后续只从上一行的 grammar state 续接，
 *    因此流式追加内容时的工作量与「新增行数」成正比，而非「全文长度」；
 * 3. 末行仍在变动，每帧重新 tokenize（成本可控）。
 *
 * 关于渲染期 `setDone`：这是 React 文档允许的「派生状态」写法——
 * 条件严格限制为 `next !== done`，即只在增量真正推进时提交，
 * 下一次渲染即可收敛，不会形成无限循环。
 */
export function useHighlightedCode(value: string, language: string) {
  // A trailing newline would render as an extra empty line.
  const code = value.endsWith("\n") ? value.slice(0, -1) : value;
  const [loaded, setLoaded] = React.useState<{
    language: string;
    highlighter: Awaited<ReturnType<typeof loadHighlighter>>;
  } | null>(null);
  const highlighter = loaded?.language === language ? loaded.highlighter : null;

  React.useEffect(() => {
    let cancelled = false;

    loadHighlighter(language)
      .then((next) => {
        if (!cancelled) {
          setLoaded({ language, highlighter: next });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [language]);

  // The complete lines, highlighted. While the code streams, only the new
  // lines are tokenized, starting from the grammar state of the last one.
  const [done, setDone] = React.useState<{
    highlighter: typeof highlighter;
    text: string;
    lines: React.ReactNode[];
    state?: Parameters<NonNullable<typeof highlighter>["highlight"]>[1];
  }>({ highlighter: null, text: "", lines: [] });

  let next = done;

  if (next.highlighter !== highlighter || !code.startsWith(next.text)) {
    next = { highlighter, text: "", lines: [] };
  }

  const end = code.lastIndexOf("\n") + 1;

  if (highlighter && end > next.text.length) {
    const result = highlighter.highlight(code.slice(next.text.length, end - 1), next.state);

    next = {
      highlighter,
      text: code.slice(0, end),
      lines: [...next.lines, ...result.lines],
      state: result.state,
    };
  }

  if (next !== done) {
    setDone(next);
  }

  // The last line is still being written, so it is tokenized on every render.
  const tail = code.slice(end);

  return React.useMemo(() => {
    if (!highlighter) {
      return code.split("\n");
    }

    return [...next.lines, highlighter.highlight(tail, next.state).lines[0]];
  }, [code, highlighter, next, tail]);
}
