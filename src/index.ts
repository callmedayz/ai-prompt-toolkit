// Main exports for ai-prompt-toolkit
export { PromptTemplate } from './prompt-template';
export { TokenCounter } from './token-counter';
export { TextChunker } from './text-chunker';
export { PromptValidator } from './prompt-validator';
export { PromptOptimizer } from './prompt-optimizer';
export { OpenRouterClient } from './openrouter-client';
export { OpenRouterCompletion } from './openrouter-completion';
export { TokenizationService } from './tokenization-service';
export { ModelTestingService } from './model-testing-service';

// Type exports
export type {
  PromptTemplateOptions,
  TokenCountResult,
  ChunkOptions,
  ValidationResult,
  OptimizationResult,
  OpenRouterAPIConfig,
  OpenRouterCompletionRequest,
  OpenRouterCompletionResponse
} from './types';
export type { CompletionConfig, CompletionResult } from './openrouter-completion';
export type {
  ModelTestResult,
  BatchTestResult,
  ModelValidationResult
} from './model-testing-service';

// Utility functions
export {
  getTokenCount,
  getDetailedTokenCount,
  compareTokenCounts,
  estimateTokens,
  chunkText,
  validatePrompt,
  optimizePrompt,
  analyzePrompt,
  fitsInModel,
  recommendModel,
  calculateCost,
  getPromptQuality,
  chunkForModel,
  optimizeToTarget
} from './utils';
