// Main exports for ai-prompt-toolkit
export { PromptTemplate } from './prompt-template';
export { TokenCounter } from './token-counter';
export { TextChunker } from './text-chunker';
export { PromptValidator } from './prompt-validator';
export { PromptOptimizer } from './prompt-optimizer';
export { ChainOfThoughtTemplate, createChainOfThought } from './chain-of-thought';
export { FewShotTemplate, createFewShot, createExamplesFromData } from './few-shot';
export { PromptVersionManager, createQuickABTest } from './prompt-versioning';
export { PromptAnalytics } from './prompt-analytics';
export { AutoPromptOptimizer } from './auto-prompt-optimizer';
export { MultimodalPromptTemplate, MultimodalCompletion, createImageInput, validateImageInput } from './multimodal-prompt';
export { AdvancedPromptTemplate } from './advanced-prompt-template';
export { TemplateComposer, createTemplateComposer, createCommonRules } from './template-composition';
export { TemplateInheritanceManager, createInheritanceManager, createCommonBaseTemplates } from './template-inheritance';
export { RealTimeDashboard } from './real-time-dashboard';
export { EnhancedAnalytics, AnomalyDetector, AlertManager } from './enhanced-analytics';
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
  OpenRouterCompletionResponse,
  AdvancedTemplateOptions,
  TemplateContext,
  ConditionalBlock,
  LoopBlock,
  ConditionalResult,
  LoopResult,
  DashboardWidget,
  DashboardLayout,
  DashboardFilter,
  RealTimeMetric,
  LiveMonitoringEvent
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
export type {
  PromptVersion,
  PromptPerformanceMetrics,
  ABTestConfig,
  ABTestResult,
  TestExecution
} from './prompt-versioning';
export type {
  AnalyticsDataPoint,
  AnalyticsAggregation,
  PromptComparison,
  PerformanceInsights,
  AnalyticsConfig
} from './prompt-analytics';
export type {
  AutoOptimizationConfig,
  OptimizationStrategy,
  OptimizationResult as AutoOptimizationResult,
  OptimizationRecommendation
} from './auto-prompt-optimizer';
export type {
  ImageFormat,
  ImageInput,
  MultimodalContent,
  MultimodalPromptOptions,
  MultimodalPromptResult,
  MultimodalCapabilities
} from './multimodal-prompt';
export type {
  CompositionRule,
  ContextCondition,
  BehaviorPattern,
  ApplicableTemplate,
  CompositionResult,
  CompositionStats
} from './template-composition';
export type {
  BaseTemplate,
  ChildTemplateOptions,
  BlockDefinition,
  SectionDefinition,
  TemplateHierarchy,
  ValidationResult as InheritanceValidationResult
} from './template-inheritance';

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
