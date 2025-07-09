/**
 * Enhanced error handling and retry logic for OpenRouter API
 */

/**
 * Types of errors that can occur
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  MODEL_UNAVAILABLE = 'model_unavailable',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown'
}

/**
 * Enhanced error class with retry information
 */
export class OpenRouterError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType,
    statusCode?: number,
    retryable: boolean = false,
    retryAfter?: number,
    originalError?: Error
  ) {
    super(message);
    this.name = 'OpenRouterError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.originalError = originalError;
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors: ErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true,
  retryableErrors: [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER_ERROR,
    ErrorType.RATE_LIMIT
  ]
};

/**
 * Parse HTTP response and create appropriate error
 */
export function parseError(response: Response, responseText: string): OpenRouterError {
  const statusCode = response.status;
  
  try {
    const errorData = JSON.parse(responseText);
    const message = errorData.error?.message || errorData.message || response.statusText;
    
    switch (statusCode) {
      case 401:
        return new OpenRouterError(
          `Authentication failed: ${message}`,
          ErrorType.AUTHENTICATION,
          statusCode,
          false
        );
      
      case 429:
        const retryAfter = response.headers.get('retry-after');
        return new OpenRouterError(
          `Rate limit exceeded: ${message}`,
          ErrorType.RATE_LIMIT,
          statusCode,
          true,
          retryAfter ? parseInt(retryAfter) * 1000 : undefined
        );
      
      case 402:
        return new OpenRouterError(
          `Quota exceeded: ${message}`,
          ErrorType.QUOTA_EXCEEDED,
          statusCode,
          false
        );
      
      case 400:
        if (message.toLowerCase().includes('model')) {
          return new OpenRouterError(
            `Model unavailable: ${message}`,
            ErrorType.MODEL_UNAVAILABLE,
            statusCode,
            false
          );
        }
        return new OpenRouterError(
          `Validation error: ${message}`,
          ErrorType.VALIDATION,
          statusCode,
          false
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterError(
          `Server error: ${message}`,
          ErrorType.SERVER_ERROR,
          statusCode,
          true
        );
      
      default:
        return new OpenRouterError(
          `HTTP ${statusCode}: ${message}`,
          ErrorType.UNKNOWN,
          statusCode,
          statusCode >= 500
        );
    }
  } catch (parseError) {
    return new OpenRouterError(
      `HTTP ${statusCode}: ${response.statusText}`,
      statusCode >= 500 ? ErrorType.SERVER_ERROR : ErrorType.UNKNOWN,
      statusCode,
      statusCode >= 500
    );
  }
}

/**
 * Calculate delay for retry with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  retryAfter?: number
): number {
  // Use retry-after header if provided
  if (retryAfter) {
    return Math.min(retryAfter, config.maxDelay);
  }
  
  // Calculate exponential backoff
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
  
  // Apply jitter to avoid thundering herd
  let delay = exponentialDelay;
  if (config.jitter) {
    delay = exponentialDelay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.min(delay, config.maxDelay);
}

/**
 * Enhanced retry function with sophisticated error handling
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: OpenRouterError;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Convert to OpenRouterError if needed
      if (!(error instanceof OpenRouterError)) {
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message.includes('timeout')) {
            lastError = new OpenRouterError(
              'Request timeout',
              ErrorType.TIMEOUT,
              undefined,
              true,
              undefined,
              error
            );
          } else if (error.message.includes('fetch')) {
            lastError = new OpenRouterError(
              'Network error',
              ErrorType.NETWORK,
              undefined,
              true,
              undefined,
              error
            );
          } else {
            lastError = new OpenRouterError(
              error.message,
              ErrorType.UNKNOWN,
              undefined,
              false,
              undefined,
              error
            );
          }
        } else {
          lastError = new OpenRouterError(
            'Unknown error',
            ErrorType.UNKNOWN,
            undefined,
            false
          );
        }
      } else {
        lastError = error;
      }
      
      // Don't retry if this is the last attempt or error is not retryable
      if (attempt > config.maxRetries || !lastError.retryable || !config.retryableErrors.includes(lastError.type)) {
        throw lastError;
      }
      
      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config, lastError.retryAfter);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new OpenRouterError(
          'Circuit breaker is open',
          ErrorType.SERVER_ERROR,
          undefined,
          false
        );
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}
