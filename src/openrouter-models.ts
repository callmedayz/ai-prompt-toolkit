// Auto-generated OpenRouter model configurations
// Generated on: 2025-07-09T13:31:29.518Z

import { SupportedModel, ModelConfig } from './types';

export const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
  'tencent/hunyuan-a13b-instruct:free': {
    name: 'Tencent: Hunyuan A13B Instruct (free)',
    maxTokens: 32768,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'tencent'
  },
  'tngtech/deepseek-r1t2-chimera:free': {
    name: 'TNG: DeepSeek R1T2 Chimera (free)',
    maxTokens: 163840,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'tngtech'
  },
  'openrouter/cypher-alpha:free': {
    name: 'Cypher Alpha (free)',
    maxTokens: 1000000,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'openrouter'
  },
  'mistralai/mistral-small-3.2-24b-instruct:free': {
    name: 'Mistral: Mistral Small 3.2 24B (free)',
    maxTokens: 96000,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'mistralai'
  },
  'moonshotai/kimi-dev-72b:free': {
    name: 'Kimi Dev 72b (free)',
    maxTokens: 131072,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'moonshotai'
  },
  'deepseek/deepseek-r1-0528-qwen3-8b:free': {
    name: 'DeepSeek: Deepseek R1 0528 Qwen3 8B (free)',
    maxTokens: 131072,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'deepseek'
  },
  'deepseek/deepseek-r1-0528:free': {
    name: 'DeepSeek: R1 0528 (free)',
    maxTokens: 163840,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'deepseek'
  },
  'sarvamai/sarvam-m:free': {
    name: 'Sarvam AI: Sarvam-M (free)',
    maxTokens: 32768,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'sarvamai'
  },
  'mistralai/devstral-small:free': {
    name: 'Mistral: Devstral Small (free)',
    maxTokens: 32768,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'mistralai'
  },
  'google/gemma-3n-e4b-it:free': {
    name: 'Google: Gemma 3n 4B (free)',
    maxTokens: 8192,
    costPerToken: 0,
    modality: 'text',
    architecture: 'text->text',
    provider: 'google'
  },
  'mistralai/mistral-small-3.2-24b-instruct': {
    name: 'Mistral: Mistral Small 3.2 24B',
    maxTokens: 128000,
    costPerToken: 5e-8,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'mistralai'
  },
  'mistralai/magistral-small-2506': {
    name: 'Mistral: Magistral Small 2506',
    maxTokens: 40960,
    costPerToken: 1e-7,
    modality: 'text',
    architecture: 'text->text',
    provider: 'mistralai'
  },
  'mistralai/magistral-medium-2506': {
    name: 'Mistral: Magistral Medium 2506',
    maxTokens: 40960,
    costPerToken: 0.000002,
    modality: 'text',
    architecture: 'text->text',
    provider: 'mistralai'
  },
  'mistralai/magistral-medium-2506:thinking': {
    name: 'Mistral: Magistral Medium 2506 (thinking)',
    maxTokens: 40960,
    costPerToken: 0.000002,
    modality: 'text',
    architecture: 'text->text',
    provider: 'mistralai'
  },
  'anthropic/claude-opus-4': {
    name: 'Anthropic: Claude Opus 4',
    maxTokens: 200000,
    costPerToken: 0.000015,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'anthropic'
  },
  'anthropic/claude-sonnet-4': {
    name: 'Anthropic: Claude Sonnet 4',
    maxTokens: 200000,
    costPerToken: 0.000003,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'anthropic'
  },
  'mistralai/devstral-small': {
    name: 'Mistral: Devstral Small',
    maxTokens: 128000,
    costPerToken: 6e-8,
    modality: 'text',
    architecture: 'text->text',
    provider: 'mistralai'
  },
  'mistralai/mistral-medium-3': {
    name: 'Mistral: Mistral Medium 3',
    maxTokens: 131072,
    costPerToken: 4e-7,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'mistralai'
  },
  'openai/gpt-4.1': {
    name: 'OpenAI: GPT-4.1',
    maxTokens: 1047576,
    costPerToken: 0.000002,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'openai'
  },
  'openai/gpt-4.1-mini': {
    name: 'OpenAI: GPT-4.1 Mini',
    maxTokens: 1047576,
    costPerToken: 4e-7,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'openai'
  },
  'openai/gpt-4.1-nano': {
    name: 'OpenAI: GPT-4.1 Nano',
    maxTokens: 1047576,
    costPerToken: 1e-7,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'openai'
  },
  'mistralai/mistral-small-3.1-24b-instruct': {
    name: 'Mistral: Mistral Small 3.1 24B',
    maxTokens: 128000,
    costPerToken: 5e-8,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'mistralai'
  },
  'openai/gpt-4o-mini-search-preview': {
    name: 'OpenAI: GPT-4o-mini Search Preview',
    maxTokens: 128000,
    costPerToken: 1.5e-7,
    modality: 'text',
    architecture: 'text->text',
    provider: 'openai'
  },
  'openai/gpt-4o-search-preview': {
    name: 'OpenAI: GPT-4o Search Preview',
    maxTokens: 128000,
    costPerToken: 0.0000025,
    modality: 'text',
    architecture: 'text->text',
    provider: 'openai'
  },
  'openai/gpt-4.5-preview': {
    name: 'OpenAI: GPT-4.5 (Preview)',
    maxTokens: 128000,
    costPerToken: 0.000075,
    modality: 'text',
    architecture: 'text+image->text',
    provider: 'openai'
  }
};

// Helper functions
export function getModelConfig(model: SupportedModel): ModelConfig {
  return MODEL_CONFIGS[model];
}

export function getFreeModels(): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].costPerToken === 0
  ) as SupportedModel[];
}

export function getPaidModels(): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].costPerToken > 0
  ) as SupportedModel[];
}

export function getModelsByProvider(provider: string): SupportedModel[] {
  return Object.keys(MODEL_CONFIGS).filter(
    model => MODEL_CONFIGS[model as SupportedModel].provider === provider
  ) as SupportedModel[];
}
