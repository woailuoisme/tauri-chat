export type ModelProvider = "openrouter" | "deepseek" | "openai" | "custom";
export type ModelCategory = "openrouter-free" | "deepseek" | "openrouter-flagship" | "custom";

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory;
  description: string;
  supportsThinking?: boolean;
  supportsVision?: boolean;
  maxThinkingBudget?: number;
  badge?: string;
  contextWindow?: string;
  pricing?: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  // 1. OpenRouter 流行免费模型 (Zero Cost / Free Endpoints)
  {
    id: "openrouter/free",
    name: "OpenRouter Free Router",
    provider: "openrouter",
    category: "openrouter-free",
    description:
      "官方智能免费模型路由器，自动匹配可用优质免费端点，支持多模态视觉与工具，0 Token 成本",
    supportsThinking: false,
    supportsVision: true,
    badge: "Auto Free",
    contextWindow: "128K",
    pricing: "Free (0成本)",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)",
    provider: "openrouter",
    category: "openrouter-free",
    description: "Google 极速多模态视觉模型，支持图片理解与毫秒级快速流式响应",
    supportsThinking: false,
    supportsVision: true,
    badge: "Free Flash",
    contextWindow: "1M",
    pricing: "Free (0成本)",
  },
  {
    id: "meta-llama/llama-3.2-11b-vision-instruct:free",
    name: "Llama 3.2 11B Vision (Free)",
    provider: "openrouter",
    category: "openrouter-free",
    description: "Meta 顶尖开源多模态视觉模型，精通高清图表、UI截图与自然图像问答",
    supportsThinking: false,
    supportsVision: true,
    badge: "Free Vision",
    contextWindow: "128K",
    pricing: "Free (0成本)",
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "openrouter",
    category: "openrouter-free",
    description: "开源深度推理模型免费版，展示完整 Thinking 思维链推演过程",
    supportsThinking: true,
    supportsVision: false,
    badge: "Free R1",
    contextWindow: "64K",
    pricing: "Free (0成本)",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B Instruct (Free)",
    provider: "openrouter",
    category: "openrouter-free",
    description: "Meta 顶尖开源 70B 旗舰指令微调模型，全能综合智力强劲",
    supportsThinking: false,
    supportsVision: false,
    badge: "Free 70B",
    contextWindow: "128K",
    pricing: "Free (0成本)",
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    name: "Qwen 2.5 Coder 32B (Free)",
    provider: "openrouter",
    category: "openrouter-free",
    description: "阿里通义千问 32B 代码专用模型，精通代码生成、重构与架构设计",
    supportsThinking: false,
    supportsVision: false,
    badge: "Free Code",
    contextWindow: "32K",
    pricing: "Free (0成本)",
  },

  // 2. DeepSeek 官方最新模型 (https://api-docs.deepseek.com/zh-cn/quick_start/pricing)
  {
    id: "deepseek-flash",
    name: "DeepSeek-V4.1 Flash (Direct)",
    provider: "deepseek",
    category: "deepseek",
    description: "DeepSeek 官方最新高性价比模型，1M 上下文，支持视觉理解，原生思考模式切换",
    supportsThinking: true,
    supportsVision: true,
    badge: "New Flash 1M",
    contextWindow: "1M",
    pricing: "输入 ¥0.15/1M (命中¥0.003) | 输出 ¥0.60/1M",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4 Pro (Direct)",
    provider: "deepseek",
    category: "deepseek",
    description: "DeepSeek 官方最新高性能旗舰模型，1M 上下文，最高水平推理与复杂任务规划",
    supportsThinking: true,
    supportsVision: true,
    badge: "New Pro 1M",
    contextWindow: "1M",
    pricing: "输入 ¥0.66/1M (命中¥0.022) | 输出 ¥1.98/1M",
  },

  // 3. OpenRouter 旗舰付费模型 (Flagship)
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet (OpenRouter)",
    provider: "openrouter",
    category: "openrouter-flagship",
    description:
      "Anthropic 旗舰混合推理模型，支持多模态视觉、Thinking 思考链与高质量代码 Artifacts",
    supportsThinking: true,
    supportsVision: true,
    maxThinkingBudget: 64000,
    badge: "Recommended",
    contextWindow: "200K",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet (OpenRouter)",
    provider: "openrouter",
    category: "openrouter-flagship",
    description: "极高多模态视觉理解与编码水平，前端 UI 像素级构建标杆",
    supportsThinking: false,
    supportsVision: true,
    badge: "Popular",
    contextWindow: "200K",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku (OpenRouter)",
    provider: "openrouter",
    category: "openrouter-flagship",
    description: "高性价比轻量推理与视觉识别，毫秒级快速流式生成",
    supportsThinking: false,
    supportsVision: true,
    contextWindow: "200K",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (OpenRouter)",
    provider: "openrouter",
    category: "openrouter-flagship",
    description: "OpenAI 旗舰全能多模态模型，高精度图像/图表/界面理解",
    supportsThinking: false,
    supportsVision: true,
    badge: "GPT-4o",
    contextWindow: "128K",
  },
  {
    id: "openai/o3-mini",
    name: "o3-mini (OpenRouter)",
    provider: "openrouter",
    category: "openrouter-flagship",
    description: "OpenAI 最新轻量推理模型，擅长数学与逻辑推导",
    supportsThinking: true,
    supportsVision: false,
    badge: "Reasoning",
    contextWindow: "128K",
  },
];

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
  icon?: string;
}

export interface ArtifactVersion {
  version: number;
  content: string;
  timestamp: number;
}

export type ArtifactType = "code" | "html" | "react" | "svg" | "mermaid" | "markdown";

export interface ArtifactItem {
  id: string;
  messageId?: string;
  title: string;
  type: ArtifactType;
  language: string;
  content: string;
  versions: ArtifactVersion[];
  currentVersion: number;
  createdAt: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  dataUrl?: string;
  content?: string;
  isImage?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  thinking?: string;
  thinkingDuration?: number;
  sources?: WebSource[];
  attachments?: ChatAttachment[];
  modelId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  projectId?: string;
}
