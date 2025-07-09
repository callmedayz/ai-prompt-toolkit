import { TokenCountResult, SupportedModel, ModelConfig } from './types';

/**
 * Token counting utility for various AI models
 */
export class TokenCounter {
  private static readonly MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
    'gpt-3.5-turbo': { name: 'gpt-3.5-turbo', maxTokens: 4096, costPerToken: 0.0015 / 1000 },
    'gpt-4': { name: 'gpt-4', maxTokens: 8192, costPerToken: 0.03 / 1000 },
    'gpt-4-turbo': { name: 'gpt-4-turbo', maxTokens: 128000, costPerToken: 0.01 / 1000 },
    'claude-3-sonnet': { name: 'claude-3-sonnet', maxTokens: 200000, costPerToken: 0.003 / 1000 },
    'claude-3-opus': { name: 'claude-3-opus', maxTokens: 200000, costPerToken: 0.015 / 1000 }
  };

  /**
   * Estimate token count for a given text
   * This is a rough estimation based on character count and word patterns
   */
  static estimateTokens(text: string, model: SupportedModel = 'gpt-3.5-turbo'): TokenCountResult {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This varies by model and language, but provides a reasonable estimate
    let tokens: number;
    
    if (model.startsWith('gpt')) {
      // GPT models: roughly 1 token per 4 characters
      tokens = Math.ceil(characters / 4);
    } else if (model.startsWith('claude')) {
      // Claude models: slightly different tokenization
      tokens = Math.ceil(characters / 3.8);
    } else {
      // Default estimation
      tokens = Math.ceil(characters / 4);
    }

    const config = this.MODEL_CONFIGS[model];
    const estimatedCost = config.costPerToken ? tokens * config.costPerToken : undefined;

    return {
      tokens,
      characters,
      words,
      estimatedCost
    };
  }

  /**
   * Check if text fits within model's token limit
   */
  static fitsInModel(text: string, model: SupportedModel): boolean {
    const result = this.estimateTokens(text, model);
    const config = this.MODEL_CONFIGS[model];
    return result.tokens <= config.maxTokens;
  }

  /**
   * Get model configuration
   */
  static getModelConfig(model: SupportedModel): ModelConfig {
    return this.MODEL_CONFIGS[model];
  }

  /**
   * Get all supported models
   */
  static getSupportedModels(): SupportedModel[] {
    return Object.keys(this.MODEL_CONFIGS) as SupportedModel[];
  }

  /**
   * Find the best model for a given text length
   */
  static recommendModel(text: string): { model: SupportedModel; reason: string } {
    const result = this.estimateTokens(text, 'gpt-3.5-turbo');

    if (result.tokens <= 3000) {
      return { model: 'gpt-3.5-turbo', reason: 'Text fits in GPT-3.5-turbo (most cost-effective)' };
    } else if (result.tokens <= 6000) {
      return { model: 'gpt-4', reason: 'Text requires GPT-4 capacity' };
    } else if (result.tokens <= 100000) {
      return { model: 'gpt-4-turbo', reason: 'Text requires GPT-4-turbo for large context' };
    } else {
      return { model: 'claude-3-sonnet', reason: 'Text requires Claude-3 for very large context' };
    }
  }

  /**
   * Calculate cost for processing text with a specific model
   */
  static calculateCost(text: string, model: SupportedModel): number {
    const result = this.estimateTokens(text, model);
    return result.estimatedCost || 0;
  }
}
