// Auto-generated OpenRouter model types
// Generated on: 2025-07-09T13:31:29.516Z
// Source: OpenRouter API v1

// Free tier models (recommended selection)
export type FreeModel = 
  | 'tencent/hunyuan-a13b-instruct:free'
  | 'tngtech/deepseek-r1t2-chimera:free'
  | 'openrouter/cypher-alpha:free'
  | 'mistralai/mistral-small-3.2-24b-instruct:free'
  | 'moonshotai/kimi-dev-72b:free'
  | 'deepseek/deepseek-r1-0528-qwen3-8b:free'
  | 'deepseek/deepseek-r1-0528:free'
  | 'sarvamai/sarvam-m:free'
  | 'mistralai/devstral-small:free'
  | 'google/gemma-3n-e4b-it:free';

// Paid models (popular selection)
export type PaidModel = 
  | 'mistralai/mistral-small-3.2-24b-instruct'
  | 'mistralai/magistral-small-2506'
  | 'mistralai/magistral-medium-2506'
  | 'mistralai/magistral-medium-2506:thinking'
  | 'anthropic/claude-opus-4'
  | 'anthropic/claude-sonnet-4'
  | 'mistralai/devstral-small'
  | 'mistralai/mistral-medium-3'
  | 'openai/gpt-4.1'
  | 'openai/gpt-4.1-mini'
  | 'openai/gpt-4.1-nano'
  | 'mistralai/mistral-small-3.1-24b-instruct'
  | 'openai/gpt-4o-mini-search-preview'
  | 'openai/gpt-4o-search-preview'
  | 'openai/gpt-4.5-preview';

// All supported models
export type SupportedModel = FreeModel | PaidModel;

// Default free model for development
export const DEFAULT_FREE_MODEL: FreeModel = 'tencent/hunyuan-a13b-instruct:free';

// Model configuration interface
export interface ModelConfig {
  name: string;
  maxTokens: number;
  costPerToken: number;
  modality?: string;
  architecture?: string;
  provider?: string;
}
