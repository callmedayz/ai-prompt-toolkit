// Main exports for ai-prompt-toolkit
export { PromptTemplate } from './prompt-template';
export { TokenCounter } from './token-counter';
export { TextChunker } from './text-chunker';
export { PromptValidator } from './prompt-validator';
export { PromptOptimizer } from './prompt-optimizer';
export { ChainOfThoughtTemplate, createChainOfThought } from './chain-of-thought';
export { FewShotTemplate, createFewShot, createExamplesFromData } from './few-shot';
export { OpenRouterClient } from './openrouter-client';
export { OpenRouterCompletion } from './openrouter-completion';
export { TokenizationService } from './tokenization-service';
export { ModelTestingService } from './model-testing-service';
export {
  OpenRouterError,
  ErrorType,
  CircuitBreaker,
  retryWithBackoff,
  parseError,
  calculateRetryDelay
} from './error-handling';
export {
  RateLimiter,
  QuotaManager,
  DEFAULT_RATE_LIMITS
} from './rate-limiting';

// Type exports
export type {
  PromptTemplateOptions,
  TokenCountResult,
  ChunkOptions,
  ValidationResult,
  OptimizationResult,
  ChainOfThoughtOptions,
  ChainOfThoughtResult,
  ChainOfThoughtStep,
  FewShotOptions,
  FewShotResult,
  FewShotExample,
  OpenRouterAPIConfig,
  OpenRouterCompletionRequest,
  OpenRouterCompletionResponse
} from './types';
export type {
  CompletionConfig,
  CompletionResult,
  StreamingChunk,
  StreamingCallback
} from './openrouter-completion';
export type {
  ModelTestResult,
  BatchTestResult,
  ModelValidationResult
} from './model-testing-service';
export type { RetryConfig } from './error-handling';
export type {
  RateLimitConfig,
  QuotaConfig,
  UsageStats,
  QuotaUsage,
  RateLimitStatus,
  QuotaAlert
} from './rate-limiting';

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
