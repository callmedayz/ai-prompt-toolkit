import { 
  OpenRouterClient,
  OpenRouterCompletion,
  OpenRouterError,
  ErrorType,
  CircuitBreaker,
  retryWithBackoff,
  RetryConfig
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating enhanced error handling and retry logic
 * 
 * This example shows:
 * 1. Different types of errors and how they're handled
 * 2. Retry logic with exponential backoff
 * 3. Circuit breaker pattern
 * 4. Custom retry configurations
 * 5. Error recovery strategies
 */

async function demonstrateErrorHandling() {
  try {
    console.log('🛡️ AI Prompt Toolkit - Enhanced Error Handling Demo\n');

    // Example 1: Basic error handling
    console.log('❌ Example 1: Basic Error Handling');
    
    try {
      // This will fail with authentication error
      const invalidClient = new OpenRouterClient({ apiKey: 'invalid-key' });
      await invalidClient.getModels();
    } catch (error) {
      if (error instanceof OpenRouterError) {
        console.log(`Error Type: ${error.type}`);
        console.log(`Retryable: ${error.retryable}`);
        console.log(`Status Code: ${error.statusCode}`);
        console.log(`Message: ${error.message}`);
      }
    }
    console.log();

    // Example 2: Retry configuration
    console.log('🔄 Example 2: Custom Retry Configuration');
    
    const customRetryConfig: RetryConfig = {
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 10000,
      exponentialBase: 1.5,
      jitter: true,
      retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER_ERROR]
    };

    const clientWithCustomRetry = new OpenRouterClient(
      { apiKey: process.env.OPENROUTER_API_KEY || 'test' },
      customRetryConfig
    );

    console.log('Custom retry config:', clientWithCustomRetry.getRetryConfig());
    console.log();

    // Example 3: Circuit breaker demonstration
    console.log('⚡ Example 3: Circuit Breaker Pattern');
    
    const circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5 second recovery
    
    // Simulate multiple failures
    for (let i = 1; i <= 5; i++) {
      try {
        await circuitBreaker.execute(async () => {
          if (i <= 3) {
            throw new Error(`Simulated failure ${i}`);
          }
          return `Success on attempt ${i}`;
        });
      } catch (error) {
        console.log(`Attempt ${i}: ${error instanceof Error ? error.message : error}`);
        console.log(`Circuit breaker state:`, circuitBreaker.getState());
      }
    }
    console.log();

    // Example 4: Retry with backoff demonstration
    console.log('⏱️ Example 4: Retry with Exponential Backoff');
    
    let attemptCount = 0;
    const startTime = Date.now();
    
    try {
      await retryWithBackoff(async () => {
        attemptCount++;
        console.log(`Attempt ${attemptCount} at ${Date.now() - startTime}ms`);
        
        if (attemptCount < 3) {
          throw new OpenRouterError(
            'Simulated network error',
            ErrorType.NETWORK,
            undefined,
            true
          );
        }
        
        return 'Success!';
      }, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        exponentialBase: 2,
        jitter: false,
        retryableErrors: [ErrorType.NETWORK]
      });
      
      console.log(`✅ Operation succeeded after ${attemptCount} attempts`);
    } catch (error) {
      console.log(`❌ Operation failed after ${attemptCount} attempts`);
    }
    console.log();

    // Example 5: Real API error handling (if API key is available)
    if (process.env.OPENROUTER_API_KEY) {
      console.log('🌐 Example 5: Real API Error Handling');
      
      const client = OpenRouterClient.fromEnv();
      const completion = new OpenRouterCompletion(client);
      
      // Test with invalid model
      try {
        await completion.complete('Test prompt', {
          model: 'invalid/model' as any,
          maxTokens: 10
        });
      } catch (error) {
        if (error instanceof OpenRouterError) {
          console.log(`API Error - Type: ${error.type}`);
          console.log(`API Error - Message: ${error.message}`);
          console.log(`API Error - Retryable: ${error.retryable}`);
        }
      }
      
      // Check circuit breaker status
      const cbStatus = client.getCircuitBreakerStatus();
      console.log('Circuit breaker status:', cbStatus);
      console.log();
    }

    // Example 6: Error recovery strategies
    console.log('🔧 Example 6: Error Recovery Strategies');
    
    async function robustApiCall(prompt: string): Promise<string> {
      const fallbackModels = [
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku',
        'meta-llama/llama-3.1-8b-instruct:free'
      ];
      
      for (const model of fallbackModels) {
        try {
          if (process.env.OPENROUTER_API_KEY) {
            const client = OpenRouterClient.fromEnv();
            const completion = new OpenRouterCompletion(client);
            
            const result = await completion.complete(prompt, {
              model: model as any,
              maxTokens: 50
            });
            
            console.log(`✅ Success with model: ${model}`);
            return result.text;
          } else {
            console.log(`Would try model: ${model}`);
            return `Simulated response from ${model}`;
          }
        } catch (error) {
          console.log(`❌ Failed with model ${model}: ${error instanceof Error ? error.message : error}`);
          
          if (error instanceof OpenRouterError) {
            // Don't try other models for certain error types
            if (error.type === ErrorType.AUTHENTICATION || error.type === ErrorType.QUOTA_EXCEEDED) {
              throw error;
            }
          }
          
          // Continue to next model
          continue;
        }
      }
      
      throw new Error('All fallback models failed');
    }
    
    try {
      const result = await robustApiCall('What is AI?');
      console.log(`Final result: "${result.substring(0, 100)}..."`);
    } catch (error) {
      console.log(`All recovery attempts failed: ${error instanceof Error ? error.message : error}`);
    }
    console.log();

    // Example 7: Monitoring and metrics
    console.log('📊 Example 7: Error Monitoring');
    
    const errorStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorsByType: {} as Record<string, number>
    };
    
    async function monitoredApiCall(prompt: string): Promise<string | null> {
      errorStats.totalRequests++;
      
      try {
        // Simulate API call
        if (Math.random() < 0.3) { // 30% failure rate
          const errorTypes = [ErrorType.RATE_LIMIT, ErrorType.NETWORK, ErrorType.SERVER_ERROR];
          const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
          throw new OpenRouterError(`Simulated ${randomError} error`, randomError, 500, true);
        }
        
        errorStats.successfulRequests++;
        return `Response to: ${prompt}`;
      } catch (error) {
        errorStats.failedRequests++;
        
        if (error instanceof OpenRouterError) {
          errorStats.errorsByType[error.type] = (errorStats.errorsByType[error.type] || 0) + 1;
        }
        
        throw error;
      }
    }
    
    // Make multiple monitored calls
    const testPrompts = ['Hello', 'How are you?', 'What is AI?', 'Explain quantum computing', 'Write a poem'];
    
    for (const prompt of testPrompts) {
      try {
        await monitoredApiCall(prompt);
      } catch (error) {
        // Error already logged in stats
      }
    }
    
    console.log('Error Statistics:');
    console.log(`Total requests: ${errorStats.totalRequests}`);
    console.log(`Successful: ${errorStats.successfulRequests} (${(errorStats.successfulRequests / errorStats.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Failed: ${errorStats.failedRequests} (${(errorStats.failedRequests / errorStats.totalRequests * 100).toFixed(1)}%)`);
    console.log('Errors by type:', errorStats.errorsByType);

    console.log('\n🎉 Enhanced error handling demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo Error:', error instanceof Error ? error.message : error);
  }
}

// Example of building a resilient service
class ResilientOpenRouterService {
  private client: OpenRouterClient;
  private completion: OpenRouterCompletion;
  private stats = {
    requests: 0,
    successes: 0,
    failures: 0
  };

  constructor(apiKey: string) {
    this.client = new OpenRouterClient(
      { apiKey },
      {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        exponentialBase: 2,
        jitter: true,
        retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER_ERROR, ErrorType.RATE_LIMIT]
      }
    );
    this.completion = new OpenRouterCompletion(this.client);
  }

  async generateText(prompt: string): Promise<string> {
    this.stats.requests++;
    
    try {
      const result = await this.completion.complete(prompt, {
        model: 'openai/gpt-3.5-turbo',
        maxTokens: 100
      });
      
      this.stats.successes++;
      return result.text;
    } catch (error) {
      this.stats.failures++;
      throw error;
    }
  }

  getStats() {
    return { ...this.stats };
  }

  getCircuitBreakerStatus() {
    return this.client.getCircuitBreakerStatus();
  }
}

// Run the demo
if (require.main === module) {
  demonstrateErrorHandling();
}

export { demonstrateErrorHandling, ResilientOpenRouterService };
