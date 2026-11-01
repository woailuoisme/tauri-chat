import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  streamText,
  type FilePart,
  type LanguageModel,
  type ModelMessage,
  type UserContent,
} from "ai";

import { useSettingsStore } from "../store/settings-store";
import { AVAILABLE_MODELS, type ChatAttachment } from "./types";

/**
 * 从 `streamText` 的参数签名推导 providerOptions 类型，
 * 避免直接依赖 `@ai-sdk/provider-utils`（非直接声明的依赖）。
 */
type StreamProviderOptions = NonNullable<Parameters<typeof streamText>[0]["providerOptions"]>;

/**
 * 依据模型元数据选择对应的 provider 客户端。
 * 密钥来自 store 的运行时字段（启动时已从系统钥匙串回填）。
 */
export function getLanguageModel(modelId: string): LanguageModel {
  const settings = useSettingsStore.getState();
  const modelMeta = AVAILABLE_MODELS.find((model) => model.id === modelId);
  const provider = modelMeta?.provider ?? "openrouter";

  if (provider === "openrouter") {
    const openrouter = createOpenRouter({
      apiKey: settings.openrouterApiKey || undefined,
      baseURL: settings.openrouterBaseUrl || "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://starter.local",
        "X-Title": "Starter Desktop",
      },
    });
    return openrouter(modelId);
  }

  if (provider === "deepseek") {
    const deepseek = createDeepSeek({
      apiKey: settings.deepseekApiKey || undefined,
      baseURL: settings.deepseekBaseUrl || "https://api.deepseek.com",
    });
    return deepseek(modelId);
  }

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: settings.openaiApiKey || undefined,
      baseURL: settings.openaiBaseUrl || undefined,
    });
    return openai(modelId);
  }

  // 兜底：本地 Ollama 等 OpenAI 兼容端点
  const custom = createOpenAI({
    apiKey: settings.customApiKey || "ollama",
    baseURL: settings.customBaseUrl || "http://localhost:11434/v1",
  });
  return custom(modelId);
}

export interface StreamChatParams {
  modelId: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    attachments?: ChatAttachment[];
  }>;
  system?: string;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  abortSignal?: AbortSignal;
  onChunk?: (text: string) => void;
  onReasoning?: (reasoningChunk: string) => void;
  onFinish?: (fullText: string, fullReasoning: string) => void;
  onError?: (error: Error) => void;
}

/** 去掉 `data:image/png;base64,` 前缀，AI SDK 只接受裸 base64 */
function dataUrlToBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

/**
 * 把附件转换成 AI SDK 的 file part。
 * 注意字段名是 `mediaType`（不是 `mimeType`），AI SDK v7 已统一为此命名。
 */
function toFilePart(attachment: ChatAttachment): FilePart | null {
  const mediaType = attachment.type || "image/png";

  if (attachment.dataUrl) {
    return {
      type: "file",
      data: { type: "data", data: dataUrlToBase64(attachment.dataUrl) },
      mediaType,
      filename: attachment.name,
    };
  }

  if (attachment.url) {
    try {
      return {
        type: "file",
        data: { type: "url", url: new URL(attachment.url) },
        mediaType,
        filename: attachment.name,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/** 一次推理相关的完整配置；单独成类型避免四元组到处传递 */
interface ReasoningConfig {
  provider: string | undefined;
  enabled: boolean;
  budget: number;
  effort: "low" | "medium" | "high";
}

/** 依据模型能力拼装 provider 专属推理参数 */
function buildStreamProviderOptions({
  provider,
  enabled,
  budget,
  effort,
}: ReasoningConfig): StreamProviderOptions | undefined {
  const options: StreamProviderOptions = {};

  if (enabled && provider === "openrouter") {
    options.openrouter = { reasoning: { max_tokens: budget } };
  }

  if (provider === "deepseek") {
    options.deepseek = enabled
      ? { thinking: { type: "enabled" }, reasoningEffort: effort }
      : { thinking: { type: "disabled" } };
  }

  return Object.keys(options).length > 0 ? options : undefined;
}

/**
 * 执行一次流式对话。
 * 逐块回调文本与推理内容，结束后回调完整结果。
 */
export async function executeStreamChat(params: StreamChatParams) {
  const {
    modelId,
    messages,
    system,
    thinkingEnabled,
    thinkingBudget = 4096,
    abortSignal,
    onChunk,
    onReasoning,
    onFinish,
    onError,
  } = params;

  try {
    const model = getLanguageModel(modelId);
    const modelMeta = AVAILABLE_MODELS.find((entry) => entry.id === modelId);
    const settings = useSettingsStore.getState();

    const providerOptions = buildStreamProviderOptions({
      provider: modelMeta?.provider,
      enabled: Boolean(thinkingEnabled && modelMeta?.supportsThinking),
      budget: thinkingBudget,
      effort: settings.reasoningEffort,
    });

    const modelMessages: ModelMessage[] = messages.map((message) => {
      if (message.role !== "user") {
        return { role: message.role, content: message.content };
      }

      const fileParts = (message.attachments ?? [])
        .map(toFilePart)
        .filter((part): part is FilePart => part !== null);

      if (fileParts.length === 0) {
        return { role: "user", content: message.content };
      }

      const content: UserContent = [];
      if (message.content) {
        content.push({ type: "text", text: message.content });
      }
      content.push(...fileParts);

      return { role: "user", content };
    });

    const result = streamText({
      model,
      system: system || undefined,
      messages: modelMessages,
      abortSignal,
      providerOptions,
    });

    let fullText = "";
    let fullReasoning = "";

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        fullText += part.text;
        onChunk?.(part.text);
      } else if (part.type === "reasoning-delta") {
        fullReasoning += part.text;
        onReasoning?.(part.text);
      }
    }

    onFinish?.(fullText, fullReasoning);
    return { text: fullText, reasoning: fullReasoning };
  } catch (error: unknown) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    onError?.(normalized);
    throw normalized;
  }
}
