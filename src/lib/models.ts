export type ModelTier = 'light' | 'pro' | 'max';

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
  iconColor: string;
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
    iconColor: '#a855f7',
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerShort: 'OpenAI',
    tier: 'max',
    multiplier: '3.5x',
    description: "OpenAI's frontier model for complex coding, professional writing, and deep analysis. Faster and more affordable than GPT-4.5.",
    tags: ['Reasoning', 'Vision', 'Web Search', 'Image Context'],
    bestAt: ['Coding', 'Analysis', 'Writing'],
    speed: 4,
    quality: 5,
    cost: 2,
    iconColor: '#10a37f',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    providerShort: 'OpenAI',
    tier: 'pro',
    multiplier: '1x',
    description: 'Fast and affordable OpenAI model optimized for everyday tasks and high-volume use cases.',
    tags: ['Vision', 'Fast'],
    bestAt: ['Speed', 'Cost', 'Tasks'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#10a37f',
  },
  // Google
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerShort: 'Google',
    tier: 'max',
    multiplier: '3.5x',
    description: "Google's most capable model with advanced reasoning and a massive 1M token context window.",
    tags: ['Reasoning', 'Vision', 'Long Context'],
    bestAt: ['Reasoning', 'Analysis', 'Coding'],
    speed: 3,
    quality: 5,
    cost: 2,
    iconColor: '#4285F4',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerShort: 'Google',
    tier: 'pro',
    multiplier: '0.5x',
    description: 'Fast Gemini model with strong reasoning capabilities and great cost-efficiency.',
    tags: ['Vision', 'Fast', 'Reasoning'],
    bestAt: ['Speed', 'Balance', 'Coding'],
    speed: 5,
    quality: 4,
    cost: 4,
    iconColor: '#4285F4',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerShort: 'Google',
    tier: 'light',
    multiplier: '0.5x',
    description: 'Google\'s fast and efficient model, great for real-time interactions and high-volume tasks.',
    tags: ['Fast', 'Vision'],
    bestAt: ['Speed', 'Tasks'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#4285F4',
  },
  // Anthropic
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    providerShort: 'Anthropic',
    tier: 'max',
    multiplier: '3x',
    description: "Anthropic's most intelligent model — exceptional at nuanced writing, coding, and reasoning.",
    tags: ['Reasoning', 'Vision', 'Long Context'],
    bestAt: ['Writing', 'Coding', 'Analysis'],
    speed: 3,
    quality: 5,
    cost: 2,
    iconColor: '#d97706',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    providerShort: 'Anthropic',
    tier: 'light',
    multiplier: '0.5x',
    description: 'Anthropic\'s fastest model — ideal for lightweight tasks requiring speed and efficiency.',
    tags: ['Fast'],
    bestAt: ['Speed', 'Tasks'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#d97706',
  },
  // xAI
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    providerShort: 'xAI',
    tier: 'pro',
    multiplier: '1.5x',
    description: "xAI's flagship model with built-in reasoning and live web search. Great for research-heavy chats.",
    tags: ['Reasoning', 'Vision', 'Web Search'],
    bestAt: ['Analysis', 'Coding', 'Writing'],
    speed: 4,
    quality: 4,
    cost: 3,
    iconColor: '#7c3aed',
  },
  {
    id: 'grok-3-mini',
    name: 'Grok 3 Mini',
    provider: 'xAI',
    providerShort: 'xAI',
    tier: 'light',
    multiplier: '0.5x',
    description: "xAI's smaller reasoning model — fast and affordable for everyday tasks.",
    tags: ['Fast', 'Reasoning'],
    bestAt: ['Speed', 'Tasks'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#7c3aed',
  },
  // DeepSeek
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 Flash',
    provider: 'DeepSeek',
    providerShort: 'DeepSeek',
    tier: 'light',
    multiplier: '0.5x',
    description: "DeepSeek's powerful open-weight model with exceptional coding and math capabilities.",
    tags: ['Coding', 'Math'],
    bestAt: ['Coding', 'Analysis'],
    speed: 4,
    quality: 4,
    cost: 5,
    iconColor: '#3b82f6',
  },
  // Perplexity
  {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    providerShort: 'Perplexity',
    tier: 'pro',
    multiplier: '0.5x',
    description: 'Perplexity\'s real-time search-augmented model — ideal for up-to-date information retrieval.',
    tags: ['Web Search', 'Real-time'],
    bestAt: ['Research', 'Search', 'Facts'],
    speed: 4,
    quality: 4,
    cost: 4,
    iconColor: '#06b6d4',
  },
  // Meta
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    providerShort: 'Meta',
    tier: 'light',
    multiplier: '0.5x',
    description: "Meta's open-weight model optimized for multilingual understanding and efficient inference.",
    tags: ['Open Source', 'Multilingual'],
    bestAt: ['Tasks', 'Speed'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#1877f2',
  },
  // Mistral
  {
    id: 'mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral',
    providerShort: 'Mistral',
    tier: 'light',
    multiplier: '0.5x',
    description: "Mistral's efficient model with strong multilingual capabilities and a large context window.",
    tags: ['Multilingual', 'Open Source'],
    bestAt: ['Tasks', 'Languages'],
    speed: 5,
    quality: 3,
    cost: 5,
    iconColor: '#f59e0b',
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
