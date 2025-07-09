import { OpenRouterClient } from './openrouter-client';
import { OpenRouterCompletion, CompletionResult } from './openrouter-completion';
import { SupportedModel } from './types';
import { MODEL_CONFIGS } from './openrouter-models';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Test result for a single prompt-model combination
 */
export interface ModelTestResult {
  model: SupportedModel;
  prompt: string;
  success: boolean;
  response?: string;
  error?: string;
  latency: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  finishReason?: string;
}

/**
 * Batch test results for multiple models
 */
export interface BatchTestResult {
  prompt: string;
  results: ModelTestResult[];
  summary: {
    totalTests: number;
    successful: number;
    failed: number;
    averageLatency: number;
    totalCost: number;
  };
}

/**
 * Model validation result
 */
export interface ModelValidationResult {
  model: SupportedModel;
  isAvailable: boolean;
  isWorking: boolean;
  error?: string;
  testResponse?: string;
  latency?: number;
}

/**
 * Service for testing and validating AI models through OpenRouter
 */
export class ModelTestingService {
  private completion: OpenRouterCompletion;
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
    this.completion = new OpenRouterCompletion(client);
  }

  /**
   * Test a single prompt against a specific model
   */
  async testModel(
    prompt: string,
    model: SupportedModel,
    options: {
      maxTokens?: number;
      temperature?: number;
      timeout?: number;
    } = {}
  ): Promise<ModelTestResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.completion.complete(prompt, {
        model,
        maxTokens: options.maxTokens || 100,
        temperature: options.temperature || 0.7
      });

      const latency = Date.now() - startTime;
      const config = MODEL_CONFIGS[model];
      const cost = config.costPerToken ? result.usage.totalTokens * config.costPerToken : 0;

      return {
        model,
        prompt,
        success: true,
        response: result.text,
        latency,
        tokenUsage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens
        },
        cost,
        finishReason: result.finishReason
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        model,
        prompt,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency
      };
    }
  }

  /**
   * Test a prompt against multiple models
   */
  async testMultipleModels(
    prompt: string,
    models: SupportedModel[],
    options: {
      maxTokens?: number;
      temperature?: number;
      concurrent?: boolean;
    } = {}
  ): Promise<BatchTestResult> {
    const { concurrent = true } = options;
    let results: ModelTestResult[];

    if (concurrent) {
      // Run tests concurrently for faster execution
      const testPromises = models.map(model => 
        this.testModel(prompt, model, options)
      );
      results = await Promise.all(testPromises);
    } else {
      // Run tests sequentially to avoid rate limits
      results = [];
      for (const model of models) {
        const result = await this.testModel(prompt, model, options);
        results.push(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate summary statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      prompt,
      results,
      summary: {
        totalTests: results.length,
        successful,
        failed,
        averageLatency,
        totalCost
      }
    };
  }

  /**
   * Validate that a model is available and working
   */
  async validateModel(model: SupportedModel): Promise<ModelValidationResult> {
    const testPrompt = 'Hello! Please respond with "OK" to confirm you are working.';
    const startTime = Date.now();

    try {
      // First check if model exists in our configuration
      if (!MODEL_CONFIGS[model]) {
        return {
          model,
          isAvailable: false,
          isWorking: false,
          error: 'Model not found in configuration'
        };
      }

      // Test with a simple prompt
      const result = await this.completion.complete(testPrompt, {
        model,
        maxTokens: 10,
        temperature: 0
      });

      const latency = Date.now() - startTime;

      return {
        model,
        isAvailable: true,
        isWorking: true,
        testResponse: result.text,
        latency
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        model,
        isAvailable: true, // Model exists but may have issues
        isWorking: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency
      };
    }
  }

  /**
   * Validate multiple models
   */
  async validateMultipleModels(models: SupportedModel[]): Promise<ModelValidationResult[]> {
    const validationPromises = models.map(model => this.validateModel(model));
    return Promise.all(validationPromises);
  }

  /**
   * Find the best performing model for a given prompt
   */
  async findBestModel(
    prompt: string,
    models: SupportedModel[],
    criteria: {
      prioritizeSpeed?: boolean;
      prioritizeCost?: boolean;
      prioritizeQuality?: boolean;
      maxLatency?: number;
      maxCost?: number;
    } = {}
  ): Promise<{
    bestModel: SupportedModel;
    reason: string;
    testResult: ModelTestResult;
    allResults: ModelTestResult[];
  }> {
    const batchResult = await this.testMultipleModels(prompt, models, { concurrent: false });
    const successfulResults = batchResult.results.filter(r => r.success);

    if (successfulResults.length === 0) {
      throw new Error('No models successfully completed the test');
    }

    // Apply filters
    let filteredResults = successfulResults;
    
    if (criteria.maxLatency) {
      filteredResults = filteredResults.filter(r => r.latency <= criteria.maxLatency!);
    }
    
    if (criteria.maxCost) {
      filteredResults = filteredResults.filter(r => (r.cost || 0) <= criteria.maxCost!);
    }

    if (filteredResults.length === 0) {
      throw new Error('No models meet the specified criteria');
    }

    // Select best model based on criteria
    let bestResult: ModelTestResult;
    let reason: string;

    if (criteria.prioritizeSpeed) {
      bestResult = filteredResults.reduce((best, current) => 
        current.latency < best.latency ? current : best
      );
      reason = `Fastest response time: ${bestResult.latency}ms`;
    } else if (criteria.prioritizeCost) {
      bestResult = filteredResults.reduce((best, current) => 
        (current.cost || 0) < (best.cost || 0) ? current : best
      );
      reason = `Lowest cost: $${bestResult.cost?.toFixed(6) || '0'}`;
    } else {
      // Default: balance of speed and cost
      bestResult = filteredResults.reduce((best, current) => {
        const bestScore = (best.cost || 0) * 1000 + best.latency;
        const currentScore = (current.cost || 0) * 1000 + current.latency;
        return currentScore < bestScore ? current : best;
      });
      reason = `Best balance of speed (${bestResult.latency}ms) and cost ($${bestResult.cost?.toFixed(6) || '0'})`;
    }

    return {
      bestModel: bestResult.model,
      reason,
      testResult: bestResult,
      allResults: batchResult.results
    };
  }

  /**
   * Run a comprehensive model health check
   */
  async runHealthCheck(models?: SupportedModel[]): Promise<{
    timestamp: string;
    totalModels: number;
    healthyModels: number;
    unhealthyModels: number;
    results: ModelValidationResult[];
  }> {
    const testModels = models || Object.keys(MODEL_CONFIGS) as SupportedModel[];
    const results = await this.validateMultipleModels(testModels);
    
    const healthyModels = results.filter(r => r.isWorking).length;
    const unhealthyModels = results.length - healthyModels;

    return {
      timestamp: new Date().toISOString(),
      totalModels: results.length,
      healthyModels,
      unhealthyModels,
      results
    };
  }

  /**
   * Create testing service from API key
   */
  static fromApiKey(apiKey: string): ModelTestingService {
    const client = new OpenRouterClient({ apiKey });
    return new ModelTestingService(client);
  }

  /**
   * Create testing service from environment
   */
  static fromEnv(): ModelTestingService {
    const client = OpenRouterClient.fromEnv();
    return new ModelTestingService(client);
  }
}
