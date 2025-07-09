import { TokenCountResult, SupportedModel, ModelConfig, FreeModel } from './types';
import { MODEL_CONFIGS, getModelConfig, getFreeModels } from './openrouter-models';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Token counting utility for various AI models
 */
export class TokenCounter {
  private static readonly MODEL_CONFIGS = MODEL_CONFIGS;

  /**
   * Estimate token count for a given text
   * This is a rough estimation based on character count and word patterns
   */
  static estimateTokens(text: string, model: SupportedModel = DEFAULT_FREE_MODEL): TokenCountResult {
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
    const result = this.estimateTokens(text, DEFAULT_FREE_MODEL);

    if (result.tokens <= 8000) {
      return { model: DEFAULT_FREE_MODEL, reason: 'Text fits in free tier model (most cost-effective)' };
    } else if (result.tokens <= 32000) {
      return { model: 'mistralai/mistral-small-3.2-24b-instruct', reason: 'Text requires medium context model' };
    } else if (result.tokens <= 100000) {
      return { model: 'anthropic/claude-sonnet-4', reason: 'Text requires large context model' };
    } else {
      return { model: 'anthropic/claude-opus-4', reason: 'Text requires very large context model' };
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
