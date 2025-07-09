import {
  OpenRouterAPIConfig,
  OpenRouterCompletionRequest,
  OpenRouterCompletionResponse,
  OpenRouterTokenizeRequest,
  OpenRouterTokenizeResponse
} from './types';
import {
  OpenRouterError,
  parseError,
  retryWithBackoff,
  CircuitBreaker,
  RetryConfig,
  DEFAULT_RETRY_CONFIG
} from './error-handling';
import {
  RateLimiter,
  QuotaManager,
  RateLimitConfig,
  QuotaConfig,
  DEFAULT_RATE_LIMITS
} from './rate-limiting';

/**
 * OpenRouter API client for making authenticated requests
 */
export class OpenRouterClient {
  private config: Required<OpenRouterAPIConfig>;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter?: RateLimiter;
  private quotaManager?: QuotaManager;

  constructor(
    config: OpenRouterAPIConfig,
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: RateLimitConfig,
    quotaConfig?: QuotaConfig
  ) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };

    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.circuitBreaker = new CircuitBreaker();

    // Initialize rate limiter if config provided
    if (rateLimitConfig) {
      this.rateLimiter = new RateLimiter(rateLimitConfig);
    }

    // Initialize quota manager if config provided
    if (quotaConfig) {
      this.quotaManager = new QuotaManager(quotaConfig);
    }

    if (!this.config.apiKey) {
      throw new OpenRouterError(
        'OpenRouter API key is required',
        'authentication' as any,
        undefined,
        false
      );
    }
  }

  /**
   * Make a completion request to OpenRouter
   */
  async completion(request: OpenRouterCompletionRequest): Promise<OpenRouterCompletionResponse> {
    if (request.stream) {
      throw new Error('Use completionStream() for streaming requests');
    }

    // Estimate tokens and cost for rate limiting
    const estimatedTokens = this.estimateTokens(request);
    const estimatedCost = this.estimateCost(request);

    const response = await this.makeRequest<OpenRouterCompletionResponse>(
      '/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify(request)
      },
      estimatedTokens,
      estimatedCost
    );

    // Record actual usage
    this.recordUsage(response.usage.total_tokens, this.calculateActualCost(response));

    return response;
  }

  /**
   * Make a streaming completion request to OpenRouter
   */
  async completionStream(request: OpenRouterCompletionRequest): Promise<ReadableStream<string>> {
    const streamRequest = { ...request, stream: true };
    const url = `${this.config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/callmedayz/ai-prompt-toolkit',
      'X-Title': 'AI Prompt Toolkit'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(streamRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter streaming error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming request');
    }

    return this.createStreamParser(response.body);
  }

  /**
   * Get token count for text using OpenRouter's completion API
   * This makes a minimal completion request to get accurate token counts
   */
  async tokenize(request: OpenRouterTokenizeRequest): Promise<OpenRouterTokenizeResponse> {
    // Make a minimal completion request to get token count
    const completionRequest: OpenRouterCompletionRequest = {
      model: request.model,
      messages: [{ role: 'user', content: request.text }],
      max_tokens: 1, // Minimal completion to just get token count
      temperature: 0
    };

    try {
      const response = await this.completion(completionRequest);
      return {
        tokens: response.usage.prompt_tokens,
        token_ids: undefined // Not available through this method
      };
    } catch (error) {
      throw new Error(`Tokenization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getModels(): Promise<any> {
    return this.makeRequest<any>('/models', {
      method: 'GET'
    });
  }

  /**
   * Get generation details including native token counts
   */
  async getGeneration(id: string): Promise<any> {
    return this.makeRequest<any>(`/generation?id=${id}`, {
      method: 'GET'
    });
  }

  /**
   * Make an authenticated request to OpenRouter API with enhanced error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    estimatedTokens: number = 0,
    estimatedCost: number = 0
  ): Promise<T> {
    // Check rate limits
    if (this.rateLimiter) {
      const rateLimitStatus = this.rateLimiter.checkRequest(estimatedTokens, estimatedCost);
      if (!rateLimitStatus.allowed) {
        throw new OpenRouterError(
          rateLimitStatus.reason || 'Rate limit exceeded',
          'rate_limit' as any,
          429,
          true,
          rateLimitStatus.retryAfter
        );
      }
    }

    // Check quota
    if (this.quotaManager) {
      const quotaStatus = this.quotaManager.checkQuota(estimatedCost);
      if (!quotaStatus.allowed) {
        throw new OpenRouterError(
          quotaStatus.alert?.message || 'Quota exceeded',
          'quota_exceeded' as any,
          402,
          false
        );
      }
    }

    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(async () => {
        const url = `${this.config.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/callmedayz/ai-prompt-toolkit',
          'X-Title': 'AI Prompt Toolkit'
        };

        const requestOptions: RequestInit = {
          ...options,
          headers: {
            ...headers,
            ...options.headers
          }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw parseError(response, errorText);
          }

          return await response.json() as T;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, this.retryConfig);
    });
  }

  /**
   * Parse Server-Sent Events stream from OpenRouter
   */
  private createStreamParser(body: ReadableStream<Uint8Array>): ReadableStream<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();

              // Skip empty lines and comments
              if (!trimmed || trimmed.startsWith(':')) {
                continue;
              }

              // Parse SSE format: "data: {...}"
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);

                // Check for end of stream
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    controller.enqueue(content);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', data);
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }

        controller.close();
      }
    });
  }

  /**
   * Test the API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API key from environment or throw error
   */
  static getApiKeyFromEnv(): string {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY environment variable is required. ' +
        'Get your API key from https://openrouter.ai/keys'
      );
    }
    return apiKey;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): { state: string; failures: number; lastFailureTime: number } {
    return this.circuitBreaker.getState();
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get current retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Estimate tokens for a request (rough estimation)
   */
  private estimateTokens(request: OpenRouterCompletionRequest): number {
    const text = request.messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }

  /**
   * Estimate cost for a request (very rough estimation)
   */
  private estimateCost(request: OpenRouterCompletionRequest): number {
    const tokens = this.estimateTokens(request);
    // Very rough cost estimation - would need model-specific pricing
    return tokens * 0.00002; // Rough estimate for GPT-3.5-turbo pricing
  }

  /**
   * Calculate actual cost from response
   */
  private calculateActualCost(response: OpenRouterCompletionResponse): number {
    // This would need model-specific pricing data
    // For now, use rough estimation
    return response.usage.total_tokens * 0.00002;
  }

  /**
   * Record usage in rate limiter and quota manager
   */
  private recordUsage(tokens: number, cost: number): void {
    if (this.rateLimiter) {
      this.rateLimiter.recordUsage(tokens, cost);
    }

    if (this.quotaManager) {
      this.quotaManager.recordSpending(cost);
    }
  }

  /**
   * Get rate limiting status
   */
  getRateLimitStatus() {
    return this.rateLimiter?.getUsage();
  }

  /**
   * Get quota status
   */
  getQuotaStatus() {
    return this.quotaManager?.getUsage();
  }

  /**
   * Get quota alerts
   */
  getQuotaAlerts() {
    return this.quotaManager?.getAlerts() || [];
  }

  /**
   * Enable rate limiting
   */
  enableRateLimiting(config: RateLimitConfig): void {
    this.rateLimiter = new RateLimiter(config);
  }

  /**
   * Enable quota management
   */
  enableQuotaManagement(config: QuotaConfig): void {
    this.quotaManager = new QuotaManager(config);
  }

  /**
   * Create a client instance using environment variables
   */
  static fromEnv(
    config?: Partial<OpenRouterAPIConfig>,
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: RateLimitConfig,
    quotaConfig?: QuotaConfig
  ): OpenRouterClient {
    return new OpenRouterClient({
      apiKey: this.getApiKeyFromEnv(),
      ...config
    }, retryConfig, rateLimitConfig, quotaConfig);
  }
}
