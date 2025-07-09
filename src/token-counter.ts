import { TokenCountResult, SupportedModel, ModelConfig } from './types';

/**
 * Token counting utility for various AI models
 */
export class TokenCounter {
  private static readonly MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
    // Free tier models
    'meta-llama/llama-3.1-8b-instruct:free': { name: 'Llama 3.1 8B', maxTokens: 8192, costPerToken: 0 },
    'google/gemma-2-9b-it:free': { name: 'Gemma 2 9B', maxTokens: 8192, costPerToken: 0 },
    'microsoft/phi-3-medium-128k-instruct:free': { name: 'Phi-3 Medium', maxTokens: 128000, costPerToken: 0 },
    'mistralai/mistral-7b-instruct:free': { name: 'Mistral 7B', maxTokens: 8192, costPerToken: 0 },
    // OpenAI models
    'openai/gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', maxTokens: 4096, costPerToken: 0.0015 / 1000 },
    'openai/gpt-4': { name: 'GPT-4', maxTokens: 8192, costPerToken: 0.03 / 1000 },
    'openai/gpt-4-turbo': { name: 'GPT-4 Turbo', maxTokens: 128000, costPerToken: 0.01 / 1000 },
    'openai/gpt-4o': { name: 'GPT-4o', maxTokens: 128000, costPerToken: 0.005 / 1000 },
    // Anthropic models
    'anthropic/claude-3-haiku': { name: 'Claude 3 Haiku', maxTokens: 200000, costPerToken: 0.00025 / 1000 },
    'anthropic/claude-3-sonnet': { name: 'Claude 3 Sonnet', maxTokens: 200000, costPerToken: 0.003 / 1000 },
    'anthropic/claude-3-opus': { name: 'Claude 3 Opus', maxTokens: 200000, costPerToken: 0.015 / 1000 },
    'anthropic/claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', maxTokens: 200000, costPerToken: 0.003 / 1000 },
    // Google models
    'google/gemini-pro': { name: 'Gemini Pro', maxTokens: 32768, costPerToken: 0.0005 / 1000 },
    'google/gemini-pro-vision': { name: 'Gemini Pro Vision', maxTokens: 32768, costPerToken: 0.0005 / 1000 },
    // Meta models
    'meta-llama/llama-3.1-70b-instruct': { name: 'Llama 3.1 70B', maxTokens: 8192, costPerToken: 0.0009 / 1000 },
    'meta-llama/llama-3.1-405b-instruct': { name: 'Llama 3.1 405B', maxTokens: 8192, costPerToken: 0.003 / 1000 }
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
