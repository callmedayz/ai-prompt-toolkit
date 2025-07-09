import { 
  OpenRouterAPIConfig, 
  OpenRouterCompletionRequest, 
  OpenRouterCompletionResponse, 
  OpenRouterTokenizeRequest,
  OpenRouterTokenizeResponse,
  OpenRouterError 
} from './types';

/**
 * OpenRouter API client for making authenticated requests
 */
export class OpenRouterClient {
  private config: Required<OpenRouterAPIConfig>;

  constructor(config: OpenRouterAPIConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };

    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  /**
   * Make a completion request to OpenRouter
   */
  async completion(request: OpenRouterCompletionRequest): Promise<OpenRouterCompletionResponse> {
    return this.makeRequest<OpenRouterCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request)
    });
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
   * Make an authenticated request to OpenRouter API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit
  ): Promise<T> {
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

    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json() as OpenRouterError;
          throw new Error(`OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof Error && error.message.includes('401')) {
          throw new Error('Invalid OpenRouter API key');
        }
        
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`OpenRouter API request failed after ${this.config.retries} attempts: ${lastError.message}`);
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
   * Create a client instance using environment variables
   */
  static fromEnv(config?: Partial<OpenRouterAPIConfig>): OpenRouterClient {
    return new OpenRouterClient({
      apiKey: this.getApiKeyFromEnv(),
      ...config
    });
  }
}
