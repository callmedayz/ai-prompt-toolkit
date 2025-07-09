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
  costPerToken: number;
  modality?: string;
  architecture?: string;
  provider?: string;
}

// OpenRouter API types
export interface OpenRouterAPIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterCompletionRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
}

export interface OpenRouterCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterTokenizeRequest {
  model: string;
  text: string;
}

export interface OpenRouterTokenizeResponse {
  tokens: number;
  token_ids?: number[];
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

// Import OpenRouter model types
export type { SupportedModel, FreeModel, PaidModel } from './openrouter-types';
