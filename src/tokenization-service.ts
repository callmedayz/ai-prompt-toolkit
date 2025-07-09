import { OpenRouterClient } from './openrouter-client';
import { SupportedModel, TokenCountResult } from './types';
import { MODEL_CONFIGS } from './openrouter-models';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Advanced tokenization service with caching and multiple counting methods
 */
export class TokenizationService {
  private client: OpenRouterClient;
  private cache: Map<string, TokenCountResult> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  /**
   * Get accurate token count using OpenRouter API with caching
   */
  async getAccurateTokenCount(
    text: string, 
    model: SupportedModel = DEFAULT_FREE_MODEL,
    useCache: boolean = true
  ): Promise<TokenCountResult> {
    const cacheKey = `${model}:${this.hashText(text)}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached;
    }

    try {
      // Use completion API to get token count
      const response = await this.client.tokenize({ model, text });
      const config = MODEL_CONFIGS[model];
      
      const result: TokenCountResult = {
        tokens: response.tokens,
        characters: text.length,
        words: text.trim().split(/\s+/).filter(word => word.length > 0).length,
        estimatedCost: config.costPerToken ? response.tokens * config.costPerToken : undefined
      };

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, result);
        // Clear cache entry after timeout
        setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      }

      return result;
    } catch (error) {
      console.warn(`OpenRouter tokenization failed for model ${model}: ${error}`);
      // Fall back to estimation
      return this.estimateTokens(text, model);
    }
  }

  /**
   * Get token count with completion and generation details for maximum accuracy
   */
  async getDetailedTokenCount(
    text: string,
    model: SupportedModel = DEFAULT_FREE_MODEL
  ): Promise<TokenCountResult & { generationId?: string; nativeTokens?: number }> {
    try {
      // Make a minimal completion to get generation ID
      const completion = await this.client.completion({
        model,
        messages: [{ role: 'user', content: text }],
        max_tokens: 1,
        temperature: 0
      });

      // Get detailed generation info
      const generation = await this.client.getGeneration(completion.id);
      const config = MODEL_CONFIGS[model];

      return {
        tokens: completion.usage.prompt_tokens,
        characters: text.length,
        words: text.trim().split(/\s+/).filter(word => word.length > 0).length,
        estimatedCost: config.costPerToken ? completion.usage.prompt_tokens * config.costPerToken : undefined,
        generationId: completion.id,
        nativeTokens: generation.native_tokens_prompt || completion.usage.prompt_tokens
      };
    } catch (error) {
      console.warn(`Detailed tokenization failed: ${error}`);
      return this.estimateTokens(text, model);
    }
  }

  /**
   * Batch tokenize multiple texts efficiently
   */
  async batchTokenize(
    texts: string[],
    model: SupportedModel = DEFAULT_FREE_MODEL
  ): Promise<TokenCountResult[]> {
    const results: TokenCountResult[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => 
        this.getAccurateTokenCount(text, model)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Fall back to estimation for failed requests
          const text = batch[results.length % batch.length];
          results.push(this.estimateTokens(text, model));
        }
      }
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Compare estimation vs actual token count
   */
  async compareTokenCounts(
    text: string,
    model: SupportedModel = DEFAULT_FREE_MODEL
  ): Promise<{
    estimated: TokenCountResult;
    actual: TokenCountResult;
    difference: number;
    accuracy: number;
  }> {
    const estimated = this.estimateTokens(text, model);
    const actual = await this.getAccurateTokenCount(text, model);
    const difference = Math.abs(actual.tokens - estimated.tokens);
    const accuracy = 1 - (difference / actual.tokens);

    return {
      estimated,
      actual,
      difference,
      accuracy: Math.max(0, accuracy) // Ensure accuracy is not negative
    };
  }

  /**
   * Fallback estimation method
   */
  private estimateTokens(text: string, model: SupportedModel): TokenCountResult {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    let tokens: number;
    
    if (model.includes('gpt')) {
      tokens = Math.ceil(characters / 4);
    } else if (model.includes('claude')) {
      tokens = Math.ceil(characters / 3.8);
    } else if (model.includes('llama')) {
      tokens = Math.ceil(characters / 3.5);
    } else {
      tokens = Math.ceil(characters / 4);
    }

    const config = MODEL_CONFIGS[model];
    const estimatedCost = config.costPerToken ? tokens * config.costPerToken : undefined;

    return {
      tokens,
      characters,
      words,
      estimatedCost
    };
  }

  /**
   * Simple hash function for cache keys
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear the token count cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Create tokenization service from API key
   */
  static fromApiKey(apiKey: string): TokenizationService {
    const client = new OpenRouterClient({ apiKey });
    return new TokenizationService(client);
  }

  /**
   * Create tokenization service from environment
   */
  static fromEnv(): TokenizationService {
    const client = OpenRouterClient.fromEnv();
    return new TokenizationService(client);
  }
}
