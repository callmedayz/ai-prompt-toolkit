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
 * Streaming completion chunk
 */
export interface StreamingChunk {
  content: string;
  isComplete: boolean;
  model?: string;
}

/**
 * Callback for streaming responses
 */
export type StreamingCallback = (chunk: StreamingChunk) => void;

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
    if (config.stream) {
      throw new Error('Use completeStream() for streaming completions');
    }

    const messages: OpenRouterMessage[] = [
      { role: 'user', content: prompt }
    ];

    return this.chat(messages, config);
  }

  /**
   * Generate a streaming completion for a single prompt
   */
  async completeStream(
    prompt: string,
    callback: StreamingCallback,
    config: CompletionConfig = {}
  ): Promise<void> {
    const messages: OpenRouterMessage[] = [
      { role: 'user', content: prompt }
    ];

    return this.chatStream(messages, callback, config);
  }

  /**
   * Generate a completion for a chat conversation
   */
  async chat(
    messages: OpenRouterMessage[],
    config: CompletionConfig = {}
  ): Promise<CompletionResult> {
    if (config.stream) {
      throw new Error('Use chatStream() for streaming completions');
    }

    const request: OpenRouterCompletionRequest = {
      model: config.model || DEFAULT_FREE_MODEL,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP,
      stop: config.stop,
      stream: false
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
   * Generate a streaming completion for a chat conversation
   */
  async chatStream(
    messages: OpenRouterMessage[],
    callback: StreamingCallback,
    config: CompletionConfig = {}
  ): Promise<void> {
    const request: OpenRouterCompletionRequest = {
      model: config.model || DEFAULT_FREE_MODEL,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      top_p: config.topP,
      stop: config.stop,
      stream: true
    };

    const stream = await this.client.completionStream(request);
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          callback({
            content: '',
            isComplete: true,
            model: request.model
          });
          break;
        }

        callback({
          content: value,
          isComplete: false,
          model: request.model
        });
      }
    } finally {
      reader.releaseLock();
    }
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
   * Collect streaming response into a complete result
   */
  async completeStreamCollected(
    prompt: string,
    config: CompletionConfig = {}
  ): Promise<{ text: string; chunks: string[] }> {
    const chunks: string[] = [];
    let fullText = '';

    await this.completeStream(prompt, (chunk) => {
      if (!chunk.isComplete && chunk.content) {
        chunks.push(chunk.content);
        fullText += chunk.content;
      }
    }, config);

    return { text: fullText, chunks };
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
