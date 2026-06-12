import { Logger } from '@nestjs/common';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  /** Stable id used in env config (AI_PROVIDER_ORDER) and in the response. */
  id: string;
  /** Human label for logs. */
  label: string;
  /** Env var holding the API key; provider is skipped when it's empty. */
  apiKeyEnv: string;
  /** Env var overriding the default model (optional). */
  modelEnv: string;
  /** Default model when modelEnv is unset. */
  defaultModel: string;
  /** Calling convention. */
  kind: 'openai' | 'anthropic' | 'gemini';
  /** Base URL for openai-compatible providers. */
  baseUrl?: string;
  /** Extra headers (e.g. OpenRouter attribution). */
  extraHeaders?: Record<string, string>;
}

/**
 * Built-in provider catalogue. A provider is only used when its API key env var
 * is set, so unconfigured providers are silently skipped. Order of attempts is
 * controlled by AI_PROVIDER_ORDER (comma-separated ids); otherwise this order.
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'glm',
    label: 'GLM / Zhipu',
    apiKeyEnv: 'GLM_API_KEY',
    modelEnv: 'GLM_MODEL',
    defaultModel: 'glm-4-flash',
    kind: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    apiKeyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    modelEnv: 'ANTHROPIC_MODEL',
    defaultModel: 'claude-3-5-haiku-latest',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    apiKeyEnv: 'GEMINI_API_KEY',
    modelEnv: 'GEMINI_MODEL',
    defaultModel: 'gemini-1.5-flash',
    kind: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'groq',
    label: 'Groq',
    apiKeyEnv: 'GROQ_API_KEY',
    modelEnv: 'GROQ_MODEL',
    defaultModel: 'llama-3.3-70b-versatile',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'qwen',
    label: 'Qwen / DashScope',
    apiKeyEnv: 'QWEN_API_KEY',
    modelEnv: 'QWEN_MODEL',
    defaultModel: 'qwen-plus',
    kind: 'openai',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    modelEnv: 'OPENROUTER_MODEL',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    // GitHub Models: GitHub's free, OpenAI-compatible inference API (the
    // actionable "Copilot via GitHub" option). Authenticated with a GitHub
    // personal access token that has the "models" permission.
    id: 'github',
    label: 'GitHub Models',
    apiKeyEnv: 'GITHUB_MODELS_TOKEN',
    modelEnv: 'GITHUB_MODELS_MODEL',
    defaultModel: 'gpt-4o-mini',
    kind: 'openai',
    baseUrl: 'https://models.inference.ai.azure.com',
  },
];

const logger = new Logger('AiProviders');
const TIMEOUT_MS = 20000;
const MAX_TOKENS = 600;
const TEMPERATURE = 0.5;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** OpenAI-compatible /chat/completions (OpenAI, GLM, Groq, Qwen, OpenRouter, ...). */
async function callOpenAICompatible(
  provider: ProviderConfig,
  apiKey: string,
  model: string,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const res = await fetchWithTimeout(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(provider.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...turns],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty completion');
  return reply;
}

/** Anthropic Messages API. */
async function callAnthropic(
  provider: ProviderConfig,
  apiKey: string,
  model: string,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const res = await fetchWithTimeout(`${provider.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: turns.map((t) => ({ role: t.role, content: t.content })),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const reply = data?.content?.[0]?.text?.trim();
  if (!reply) throw new Error('Empty completion');
  return reply;
}

/** Google Gemini generateContent API. */
async function callGemini(
  provider: ProviderConfig,
  apiKey: string,
  model: string,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const url = `${provider.baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({
        role: t.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: t.content }],
      })),
      generationConfig: { temperature: TEMPERATURE, maxOutputTokens: MAX_TOKENS },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) throw new Error('Empty completion');
  return reply;
}

/** Dispatch to the right calling convention. Throws on any failure. */
export async function callProvider(
  provider: ProviderConfig,
  apiKey: string,
  model: string,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  switch (provider.kind) {
    case 'anthropic':
      return callAnthropic(provider, apiKey, model, system, turns);
    case 'gemini':
      return callGemini(provider, apiKey, model, system, turns);
    case 'openai':
    default:
      return callOpenAICompatible(provider, apiKey, model, system, turns);
  }
}

export { logger as aiLogger };
