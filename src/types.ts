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

// Import OpenRouter model types
export type { SupportedModel, FreeModel, PaidModel } from './openrouter-types';
