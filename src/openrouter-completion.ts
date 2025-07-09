import { OpenRouterClient } from './openrouter-client';
import { 
  SupportedModel, 
  OpenRouterCompletionRequest, 
  OpenRouterCompletionResponse,
  OpenRouterMessage 
} from './types';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Configuration for completion requests
 */
export interface CompletionConfig {
  model?: SupportedModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * Result of a completion request
 */
export interface CompletionResult {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * OpenRouter completion service for generating text responses
 */
export class OpenRouterCompletion {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  /**
   * Generate a completion for a single prompt
   */
  async complete(
    prompt: string, 
    config: CompletionConfig = {}
  ): Promise<CompletionResult> {
    const messages: OpenRouterMessage[] = [
      { role: 'user', content: prompt }
    ];

    return this.chat(messages, config);
  }

  /**
   * Generate a completion for a chat conversation
   */
  async chat(
    messages: OpenRouterMessage[], 
    config: CompletionConfig = {}
  ): Promise<CompletionResult> {
    const request: OpenRouterCompletionRequest = {
      model: config.model || DEFAULT_FREE_MODEL,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP,
      stop: config.stop,
      stream: config.stream || false
    };

    const response = await this.client.completion(request);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No completion choices returned from OpenRouter');
    }

    const choice = response.choices[0];
    
    return {
      text: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      finishReason: choice.finish_reason
    };
  }

  /**
   * Generate a completion with system message
   */
  async completeWithSystem(
    systemMessage: string,
    userPrompt: string,
    config: CompletionConfig = {}
  ): Promise<CompletionResult> {
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    return this.chat(messages, config);
  }

  /**
   * Test a prompt against a model and return the response
   */
  async testPrompt(
    prompt: string,
    model: SupportedModel,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<CompletionResult> {
    return this.complete(prompt, {
      model,
      maxTokens: options.maxTokens || 100,
      temperature: options.temperature || 0.7
    });
  }

  /**
   * Validate that a prompt works with a specific model
   */
  async validatePrompt(
    prompt: string,
    model: SupportedModel
  ): Promise<{ isValid: boolean; error?: string; result?: CompletionResult }> {
    try {
      const result = await this.testPrompt(prompt, model, { maxTokens: 50 });
      return { isValid: true, result };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Create a completion service from API key
   */
  static fromApiKey(apiKey: string): OpenRouterCompletion {
    const client = new OpenRouterClient({ apiKey });
    return new OpenRouterCompletion(client);
  }

  /**
   * Create a completion service from environment variables
   */
  static fromEnv(): OpenRouterCompletion {
    const client = OpenRouterClient.fromEnv();
    return new OpenRouterCompletion(client);
  }
}
