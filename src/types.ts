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

// Chain-of-Thought Template Types
export interface ChainOfThoughtStep {
  id: string;
  title: string;
  instruction: string;
  reasoning?: string;
  examples?: string[];
}

export interface ChainOfThoughtOptions {
  problem: string;
  steps: ChainOfThoughtStep[];
  context?: string;
  constraints?: string[];
  expectedOutput?: string;
  reasoningStyle?: 'detailed' | 'concise' | 'step-by-step';
}

export interface ChainOfThoughtResult {
  prompt: string;
  stepCount: number;
  estimatedTokens: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Few-Shot Learning Types
export interface FewShotExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface FewShotOptions {
  task: string;
  examples: FewShotExample[];
  inputFormat?: string;
  outputFormat?: string;
  instructions?: string;
  maxExamples?: number;
}

export interface FewShotResult {
  prompt: string;
  exampleCount: number;
  estimatedTokens: number;
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
