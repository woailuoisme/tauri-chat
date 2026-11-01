import * as React from "react";

import type { AppLanguage } from "@/lib/store/settings-store";

/* ---- Web Speech API 最小类型声明（TS lib.dom 未内置） ---- */

interface SpeechRecognitionResultLike {
  readonly [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  addEventListener(type: "result", listener: (event: SpeechRecognitionEventLike) => void): void;
  addEventListener(type: "error", listener: (event: SpeechRecognitionErrorLike) => void): void;
  addEventListener(type: "end", listener: () => void): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface UseSpeechRecognitionOptions {
  /** 识别语言跟随界面语言设置 */
  language: AppLanguage;
  /** 收到识别结果时追加到输入框 */
  onTranscript: (text: string) => void;
}

interface UseSpeechRecognitionResult {
  isListening: boolean;
  error: string | null;
  clearError: () => void;
  toggle: () => void;
}

const LANGUAGE_TAGS: Record<AppLanguage, string> = {
  zh: "zh-CN",
  en: "en-US",
};

/**
 * 语音听写。
 *
 * 卸载时必定 `stop()`，避免切换会话后仍在后台占用麦克风。
 */
export function useSpeechRecognition({
  language,
  onTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const languageRef = React.useRef(language);

  React.useEffect(() => {
    languageRef.current = language;
  }, [language]);

  React.useEffect(
    () => () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    },
    [],
  );

  const clearError = React.useCallback(() => setError(null), []);

  const toggle = React.useCallback(() => {
    const recognitionWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const Recognition =
      recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setError("当前环境不支持语音识别");
      return;
    }

    // 正在聆听：停止
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANGUAGE_TAGS[languageRef.current] ?? "zh-CN";

      recognition.addEventListener("result", (event) => {
        let transcript = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const alternative = event.results[index]?.[0];
          if (alternative) transcript += alternative.transcript;
        }

        if (transcript) onTranscript(transcript);
      });

      recognition.addEventListener("error", (event) => {
        setError(event.error === "not-allowed" ? "麦克风权限被拒绝" : "语音识别中断");
        setIsListening(false);
        recognitionRef.current = null;
      });

      recognition.addEventListener("end", () => {
        setIsListening(false);
        recognitionRef.current = null;
      });

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setError("语音识别启动失败");
    }
  }, [onTranscript]);

  return { isListening, error, clearError, toggle };
}
