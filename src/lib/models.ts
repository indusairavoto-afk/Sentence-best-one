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
    id: 'deepseek-r1',
    name: 'DeepSeek R1 (Llama)',
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
