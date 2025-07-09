// Utility functions for ai-prompt-toolkit

import { TokenCounter } from './token-counter';
import { TextChunker } from './text-chunker';
import { PromptValidator } from './prompt-validator';
import { PromptOptimizer } from './prompt-optimizer';
import { TokenCountResult, ChunkOptions, ValidationResult, OptimizationResult, SupportedModel } from './types';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Quick token estimation utility function
 */
export function estimateTokens(text: string, model: SupportedModel = DEFAULT_FREE_MODEL): TokenCountResult {
  return TokenCounter.estimateTokens(text, model);
}

/**
 * Quick text chunking utility function
 */
export function chunkText(text: string, options: ChunkOptions): string[] {
  return TextChunker.chunkText(text, options);
}

/**
 * Quick prompt validation utility function
 */
export function validatePrompt(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): ValidationResult {
  return PromptValidator.validate(prompt, model);
}

/**
 * Quick prompt optimization utility function
 */
export function optimizePrompt(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): OptimizationResult {
  return PromptOptimizer.optimize(prompt, model);
}

/**
 * Check if text fits in a specific model's context window
 */
export function fitsInModel(text: string, model: SupportedModel): boolean {
  return TokenCounter.fitsInModel(text, model);
}

/**
 * Get the best model recommendation for a given text
 */
export function recommendModel(text: string): { model: SupportedModel; reason: string } {
  return TokenCounter.recommendModel(text);
}

/**
 * Calculate the cost of processing text with a specific model
 */
export function calculateCost(text: string, model: SupportedModel): number {
  return TokenCounter.calculateCost(text, model);
}

/**
 * Get a quality score for a prompt (0-100)
 */
export function getPromptQuality(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): number {
  return PromptValidator.getQualityScore(prompt, model);
}

/**
 * Chunk text specifically for a model with optimal settings
 */
export function chunkForModel(text: string, model: SupportedModel, overlapPercent: number = 10): string[] {
  return TextChunker.chunkForModel(text, model, overlapPercent);
}

/**
 * Optimize prompt to fit within a specific token limit
 */
export function optimizeToTarget(prompt: string, targetTokens: number, model: SupportedModel = DEFAULT_FREE_MODEL): OptimizationResult {
  return PromptOptimizer.optimizeToTarget(prompt, targetTokens, model);
}

/**
 * Get comprehensive analysis of a prompt
 */
export function analyzePrompt(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL) {
  const tokens = estimateTokens(prompt, model);
  const validation = validatePrompt(prompt, model);
  const quality = getPromptQuality(prompt, model);
  const recommendation = recommendModel(prompt);
  
  return {
    tokens,
    validation,
    quality,
    recommendation,
    fitsInModel: fitsInModel(prompt, model),
    cost: calculateCost(prompt, model)
  };
}
