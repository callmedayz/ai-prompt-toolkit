// Type definitions for ai-prompt-toolkit

export interface PromptTemplateOptions {
  template: string;
  variables?: Record<string, any>;
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
}

// Advanced Template Types (v2.5.0)
export interface ConditionalBlock {
  condition: string;
  trueContent: string;
  falseContent?: string;
}

export interface LoopBlock {
  variable: string;
  array: string;
  template: string;
  separator?: string;
}

export interface AdvancedTemplateOptions extends PromptTemplateOptions {
  enableConditionals?: boolean;
  enableLoops?: boolean;
  enableInheritance?: boolean;
  baseTemplate?: string;
  customFunctions?: Record<string, (value: any, ...args: any[]) => any>;
}

export interface TemplateContext {
  variables: Record<string, any>;
  functions: Record<string, Function>;
  metadata: Record<string, any>;
}

export interface ConditionalResult {
  condition: string;
  result: boolean;
  evaluatedContent: string;
}

export interface LoopResult {
  variable: string;
  iterations: number;
  content: string;
}

// Real-time Dashboard Types (v2.6.0)
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'trend';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  refreshInterval?: number; // seconds
  dataSource: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  autoRefresh: boolean;
  refreshInterval: number; // seconds
}

export interface DashboardFilter {
  id: string;
  type: 'timeRange' | 'promptVersion' | 'model' | 'metric' | 'custom';
  label: string;
  value: any;
  options?: any[];
}

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  timestamp: Date;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface LiveMonitoringEvent {
  id: string;
  type: 'execution' | 'alert' | 'anomaly' | 'threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  promptVersionId?: string;
  model?: string;
  metadata?: Record<string, any>;
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
