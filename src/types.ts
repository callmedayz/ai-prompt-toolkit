// Type definitions for ai-prompt-toolkit

export interface PromptTemplateOptions {
  template: string;
  variables?: Record<string, any>;
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
}

export interface TokenCountResult {
  tokens: number;
  characters: number;
  words: number;
  estimatedCost?: number;
}

export interface ChunkOptions {
  maxTokens: number;
  overlap?: number;
  preserveWords?: boolean;
  preserveSentences?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  tokensSaved: number;
  optimizations: string[];
}

export interface ModelConfig {
  name: string;
  maxTokens: number;
  costPerToken?: number;
  encoding?: string;
}

// OpenRouter model identifiers
export type SupportedModel =
  // Free tier models
  | 'meta-llama/llama-3.1-8b-instruct:free'
  | 'google/gemma-2-9b-it:free'
  | 'microsoft/phi-3-medium-128k-instruct:free'
  | 'mistralai/mistral-7b-instruct:free'
  // OpenAI models
  | 'openai/gpt-3.5-turbo'
  | 'openai/gpt-4'
  | 'openai/gpt-4-turbo'
  | 'openai/gpt-4o'
  // Anthropic models
  | 'anthropic/claude-3-haiku'
  | 'anthropic/claude-3-sonnet'
  | 'anthropic/claude-3-opus'
  | 'anthropic/claude-3.5-sonnet'
  // Google models
  | 'google/gemini-pro'
  | 'google/gemini-pro-vision'
  // Meta models
  | 'meta-llama/llama-3.1-70b-instruct'
  | 'meta-llama/llama-3.1-405b-instruct';
