export type ModelTier = 'light' | 'pro' | 'max';

// Shared logo URLs (Cloudinary-hosted, already used by AILogoMarquee)
const CDN = 'https://res.cloudinary.com/domyd01x9/image/upload/q_auto/f_auto';
export const PROVIDER_LOGOS: Record<string, string> = {
  OpenAI:      `${CDN}/v1778425627/chatgpt-icon_dnsvgw.webp`,
  Google:      `${CDN}/v1778425667/Google_Gemini_icon_2025.svg_rsefbe.webp`,
  Anthropic:   `${CDN}/v1778425650/claude-ai-icon_kp64b4.webp`,
  Perplexity:  `${CDN}/v1778425477/perplexity-ai-icon_tdawdq.webp`,
  DeepSeek:    `${CDN}/v1778425429/deepseek-logo-icon_hpuvjw.webp`,
  xAI:         `${CDN}/v1778426015/Grok-icon.svg_y9wwzw.png`,
  Meta:        'https://cdn.simpleicons.org/meta/0467DF',
  Mistral:     'https://cdn.simpleicons.org/mistral/FF7000',
  Microsoft:   'https://cdn.simpleicons.org/microsoft/0078D4',
  Qwen:        'https://cdn.simpleicons.org/alibabadotcom/FF6A00',
};

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  providerShort: string;
  tier: ModelTier | 'auto';
  multiplier?: string;
  description: string;
  tags?: string[];
  bestAt: string[];
  speed: number;   // 1-5
  quality: number; // 1-5
  cost: number;    // 1-5 (5 = cheapest)
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'auto',
    name: 'Auto Select',
    provider: 'Seamless',
    providerShort: '',
    tier: 'auto',
    description: 'Automatically picks the best model for your task — speed, quality, and cost balanced.',
    bestAt: ['General', 'Speed', 'Balance'],
    speed: 5,
    quality: 4,
    cost: 5,
  },
  // Meta / Llama (via Groq — free)
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'pro',
    description: "Meta's latest multimodal model — great for everyday chat, analysis, and coding.",
    tags: ['Open Source', 'Multilingual', 'Free'],
    bestAt: ['Chat', 'Analysis', 'Tasks'],
    speed: 5,
    quality: 4,
    cost: 5,
  },
  {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'max',
    description: "Larger Llama 4 variant with stronger reasoning and instruction-following.",
    tags: ['Open Source', 'Free'],
    bestAt: ['Reasoning', 'Coding', 'Writing'],
    speed: 4,
    quality: 5,
    cost: 5,
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'pro',
    description: "High-quality open model — excellent all-rounder for chat, coding, and writing.",
    tags: ['Open Source', 'Free'],
    bestAt: ['Chat', 'Coding', 'Writing'],
    speed: 4,
    quality: 4,
    cost: 5,
  },
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'light',
    description: 'Compact and blazing fast — ideal for quick responses and simple tasks.',
    tags: ['Open Source', 'Fast', 'Free'],
    bestAt: ['Speed', 'Tasks', 'Chat'],
    speed: 5,
    quality: 3,
    cost: 5,
  },
  // Mistral (via Groq — free)
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B',
    provider: 'Mistral',
    providerShort: 'Mistral',
    tier: 'pro',
    description: 'Mixture-of-experts model — strong multilingual performance and code generation.',
    tags: ['Open Source', 'Multilingual', 'Free'],
    bestAt: ['Coding', 'Languages', 'Chat'],
    speed: 4,
    quality: 4,
    cost: 5,
  },
  // Google Gemma (via Groq — free)
  {
    id: 'gemma2-9b',
    name: 'Gemma 2 9B',
    provider: 'Google',
    providerShort: 'Google',
    tier: 'light',
    description: "Google's open Gemma model — efficient and capable for everyday tasks.",
    tags: ['Open Source', 'Fast', 'Free'],
    bestAt: ['Speed', 'Tasks', 'Chat'],
    speed: 5,
    quality: 3,
    cost: 5,
  },
  // DeepSeek (via Groq — free)
  {
    id: 'deepseek-r1-groq',
    name: 'DeepSeek R1 70B',
    provider: 'DeepSeek',
    providerShort: 'DeepSeek',
    tier: 'pro',
    description: 'Reasoning-focused model distilled on Llama — great for math, logic, and coding.',
    tags: ['Reasoning', 'Coding', 'Free'],
    bestAt: ['Reasoning', 'Coding', 'Math'],
    speed: 3,
    quality: 4,
    cost: 5,
  },

  // ── Together AI free-tier ───────────────────────────────────────────────────
  {
    id: 'llama-3.3-70b-together',
    name: 'Llama 3.3 70B Turbo',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'pro',
    description: 'High-speed Llama 3.3 70B via Together AI — great all-rounder for chat and coding.',
    tags: ['Open Source', 'Fast', 'Free'],
    bestAt: ['Chat', 'Coding', 'Writing'],
    speed: 5,
    quality: 4,
    cost: 5,
  },
  {
    id: 'llama-3.1-8b-together',
    name: 'Llama 3.1 8B Turbo',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'light',
    description: 'Ultra-fast compact Llama 3.1 8B via Together AI — ideal for quick tasks.',
    tags: ['Open Source', 'Fast', 'Free'],
    bestAt: ['Speed', 'Tasks', 'Chat'],
    speed: 5,
    quality: 3,
    cost: 5,
  },
  {
    id: 'deepseek-r1-together',
    name: 'DeepSeek R1 Distill',
    provider: 'DeepSeek',
    providerShort: 'DeepSeek',
    tier: 'pro',
    description: 'DeepSeek R1 distilled on Llama via Together AI — strong reasoning and math.',
    tags: ['Reasoning', 'Free'],
    bestAt: ['Reasoning', 'Math', 'Coding'],
    speed: 3,
    quality: 4,
    cost: 5,
  },

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    providerShort: 'OpenAI',
    tier: 'light',
    description: "OpenAI's fast and affordable GPT-4o mini — great for everyday tasks and chat.",
    tags: ['Fast', 'Chat'],
    bestAt: ['Chat', 'Speed', 'Tasks'],
    speed: 5,
    quality: 4,
    cost: 4,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerShort: 'OpenAI',
    tier: 'pro',
    description: "OpenAI's flagship multimodal model — top-tier reasoning, coding, and analysis.",
    tags: ['Multimodal', 'Coding'],
    bestAt: ['Reasoning', 'Coding', 'Analysis'],
    speed: 4,
    quality: 5,
    cost: 3,
  },

  // ── OpenRouter free-tier ────────────────────────────────────────────────────
  {
    id: 'gemini-flash-or',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerShort: 'Google',
    tier: 'pro',
    description: "Google's Gemini 2.0 Flash — fast multimodal reasoning via OpenRouter.",
    tags: ['Multimodal', 'Free'],
    bestAt: ['Chat', 'Analysis', 'Speed'],
    speed: 5,
    quality: 4,
    cost: 5,
  },
  {
    id: 'deepseek-r1-or',
    name: 'DeepSeek R1 Full',
    provider: 'DeepSeek',
    providerShort: 'DeepSeek',
    tier: 'max',
    description: 'Full DeepSeek R1 via OpenRouter — top-tier reasoning, math, and coding.',
    tags: ['Reasoning', 'Coding', 'Free'],
    bestAt: ['Reasoning', 'Math', 'Coding'],
    speed: 2,
    quality: 5,
    cost: 5,
  },
  {
    id: 'qwen3-235b',
    name: 'Qwen3 235B',
    provider: 'Qwen',
    providerShort: 'Qwen',
    tier: 'max',
    description: "Alibaba's massive 235B Qwen3 model — exceptional reasoning and multilingual support.",
    tags: ['Open Source', 'Multilingual', 'Free'],
    bestAt: ['Reasoning', 'Languages', 'Coding'],
    speed: 2,
    quality: 5,
    cost: 5,
  },
  {
    id: 'phi4-reasoning',
    name: 'Phi-4 Reasoning',
    provider: 'Microsoft',
    providerShort: 'Microsoft',
    tier: 'pro',
    description: "Microsoft's Phi-4 with extended reasoning — punches above its weight on logic tasks.",
    tags: ['Reasoning', 'Compact', 'Free'],
    bestAt: ['Reasoning', 'Math', 'Coding'],
    speed: 4,
    quality: 4,
    cost: 5,
  },
  {
    id: 'mistral-7b-or',
    name: 'Mistral 7B',
    provider: 'Mistral',
    providerShort: 'Mistral',
    tier: 'light',
    description: 'Compact Mistral 7B via OpenRouter — fast, multilingual, and free.',
    tags: ['Open Source', 'Fast', 'Free'],
    bestAt: ['Speed', 'Languages', 'Chat'],
    speed: 5,
    quality: 3,
    cost: 5,
  },
];

// Map our model IDs to Gemini model names for backend routing
export function mapToGeminiModel(modelId: string): string {
  const mapping: Record<string, string> = {
    'auto': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
  };
  return mapping[modelId] ?? 'gemini-2.5-flash';
}

export const TIER_LABELS: Record<string, string> = {
  auto: 'Auto',
  light: 'Light',
  pro: 'Pro',
  max: 'Max',
};

export const TIER_COLORS: Record<string, string> = {
  auto: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  light: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pro: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  max: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
