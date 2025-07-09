/**
 * Rate limiting and quota management for OpenRouter API
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute?: number;
  tokensPerHour?: number;
  tokensPerDay?: number;
  costPerMinute?: number;
  costPerHour?: number;
  costPerDay?: number;
}

/**
 * Usage tracking data
 */
export interface UsageStats {
  requests: {
    minute: number;
    hour: number;
    day: number;
  };
  tokens: {
    minute: number;
    hour: number;
    day: number;
  };
  cost: {
    minute: number;
    hour: number;
    day: number;
  };
  lastReset: {
    minute: number;
    hour: number;
    day: number;
  };
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  remaining: {
    requests: { minute: number; hour: number; day: number };
    tokens?: { minute: number; hour: number; day: number };
    cost?: { minute: number; hour: number; day: number };
  };
}

/**
 * Default rate limits (conservative defaults)
 */
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  tokensPerMinute: 10000,
  tokensPerHour: 100000,
  tokensPerDay: 1000000,
  costPerMinute: 1.0,
  costPerHour: 10.0,
  costPerDay: 100.0
};

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private refillInterval: number = 1000 // milliseconds
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Rate limiter with multiple time windows
 */
export class RateLimiter {
  private usage: UsageStats;
  private buckets: {
    minute: TokenBucket;
    hour: TokenBucket;
    day: TokenBucket;
  };

  constructor(private config: RateLimitConfig) {
    this.usage = this.initializeUsage();
    this.buckets = {
      minute: new TokenBucket(config.requestsPerMinute, config.requestsPerMinute / 60),
      hour: new TokenBucket(config.requestsPerHour, config.requestsPerHour / 3600),
      day: new TokenBucket(config.requestsPerDay, config.requestsPerDay / 86400)
    };
  }

  /**
   * Check if a request is allowed
   */
  checkRequest(tokens: number = 0, cost: number = 0): RateLimitStatus {
    this.resetCountersIfNeeded();

    // Check request limits
    if (!this.buckets.minute.consume(1)) {
      return {
        allowed: false,
        reason: 'Minute request limit exceeded',
        retryAfter: 60000,
        remaining: this.getRemainingLimits()
      };
    }

    if (!this.buckets.hour.consume(1)) {
      return {
        allowed: false,
        reason: 'Hour request limit exceeded',
        retryAfter: 3600000,
        remaining: this.getRemainingLimits()
      };
    }

    if (!this.buckets.day.consume(1)) {
      return {
        allowed: false,
        reason: 'Day request limit exceeded',
        retryAfter: 86400000,
        remaining: this.getRemainingLimits()
      };
    }

    // Check token limits
    if (tokens > 0 && this.config.tokensPerMinute) {
      if (this.usage.tokens.minute + tokens > this.config.tokensPerMinute) {
        return {
          allowed: false,
          reason: 'Minute token limit exceeded',
          retryAfter: 60000,
          remaining: this.getRemainingLimits()
        };
      }
    }

    // Check cost limits
    if (cost > 0 && this.config.costPerMinute) {
      if (this.usage.cost.minute + cost > this.config.costPerMinute) {
        return {
          allowed: false,
          reason: 'Minute cost limit exceeded',
          retryAfter: 60000,
          remaining: this.getRemainingLimits()
        };
      }
    }

    return {
      allowed: true,
      remaining: this.getRemainingLimits()
    };
  }

  /**
   * Record usage after a successful request
   */
  recordUsage(tokens: number = 0, cost: number = 0): void {
    this.resetCountersIfNeeded();
    
    this.usage.requests.minute++;
    this.usage.requests.hour++;
    this.usage.requests.day++;
    
    this.usage.tokens.minute += tokens;
    this.usage.tokens.hour += tokens;
    this.usage.tokens.day += tokens;
    
    this.usage.cost.minute += cost;
    this.usage.cost.hour += cost;
    this.usage.cost.day += cost;
  }

  /**
   * Get current usage statistics
   */
  getUsage(): UsageStats {
    this.resetCountersIfNeeded();
    return { ...this.usage };
  }

  /**
   * Get remaining limits
   */
  private getRemainingLimits() {
    return {
      requests: {
        minute: Math.max(0, this.config.requestsPerMinute - this.usage.requests.minute),
        hour: Math.max(0, this.config.requestsPerHour - this.usage.requests.hour),
        day: Math.max(0, this.config.requestsPerDay - this.usage.requests.day)
      },
      tokens: this.config.tokensPerMinute ? {
        minute: Math.max(0, this.config.tokensPerMinute - this.usage.tokens.minute),
        hour: Math.max(0, (this.config.tokensPerHour || 0) - this.usage.tokens.hour),
        day: Math.max(0, (this.config.tokensPerDay || 0) - this.usage.tokens.day)
      } : undefined,
      cost: this.config.costPerMinute ? {
        minute: Math.max(0, this.config.costPerMinute - this.usage.cost.minute),
        hour: Math.max(0, (this.config.costPerHour || 0) - this.usage.cost.hour),
        day: Math.max(0, (this.config.costPerDay || 0) - this.usage.cost.day)
      } : undefined
    };
  }

  /**
   * Reset counters when time windows expire
   */
  private resetCountersIfNeeded(): void {
    const now = Date.now();
    
    // Reset minute counter
    if (now - this.usage.lastReset.minute >= 60000) {
      this.usage.requests.minute = 0;
      this.usage.tokens.minute = 0;
      this.usage.cost.minute = 0;
      this.usage.lastReset.minute = now;
    }
    
    // Reset hour counter
    if (now - this.usage.lastReset.hour >= 3600000) {
      this.usage.requests.hour = 0;
      this.usage.tokens.hour = 0;
      this.usage.cost.hour = 0;
      this.usage.lastReset.hour = now;
    }
    
    // Reset day counter
    if (now - this.usage.lastReset.day >= 86400000) {
      this.usage.requests.day = 0;
      this.usage.tokens.day = 0;
      this.usage.cost.day = 0;
      this.usage.lastReset.day = now;
    }
  }

  /**
   * Initialize usage tracking
   */
  private initializeUsage(): UsageStats {
    const now = Date.now();
    return {
      requests: { minute: 0, hour: 0, day: 0 },
      tokens: { minute: 0, hour: 0, day: 0 },
      cost: { minute: 0, hour: 0, day: 0 },
      lastReset: { minute: now, hour: now, day: now }
    };
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };

    // Update token buckets
    this.buckets.minute = new TokenBucket(this.config.requestsPerMinute, this.config.requestsPerMinute / 60);
    this.buckets.hour = new TokenBucket(this.config.requestsPerHour, this.config.requestsPerHour / 3600);
    this.buckets.day = new TokenBucket(this.config.requestsPerDay, this.config.requestsPerDay / 86400);
  }
}

/**
 * Quota management for cost control
 */
export interface QuotaConfig {
  dailyBudget: number;
  monthlyBudget: number;
  alertThresholds: number[]; // Percentages (e.g., [50, 80, 95])
  autoStop: boolean; // Stop requests when budget is exceeded
}

/**
 * Quota usage tracking
 */
export interface QuotaUsage {
  daily: {
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
  };
  lastReset: {
    daily: number;
    monthly: number;
  };
}

/**
 * Quota alert
 */
export interface QuotaAlert {
  type: 'warning' | 'critical' | 'exceeded';
  period: 'daily' | 'monthly';
  threshold: number;
  current: number;
  budget: number;
  message: string;
}

/**
 * Quota manager for cost control
 */
export class QuotaManager {
  private usage: QuotaUsage;
  private alerts: QuotaAlert[] = [];

  constructor(private config: QuotaConfig) {
    this.usage = this.initializeUsage();
  }

  /**
   * Check if a request is within quota
   */
  checkQuota(estimatedCost: number): { allowed: boolean; alert?: QuotaAlert } {
    this.resetQuotasIfNeeded();

    // Check daily quota
    if (this.usage.daily.spent + estimatedCost > this.config.dailyBudget) {
      const alert: QuotaAlert = {
        type: 'exceeded',
        period: 'daily',
        threshold: 100,
        current: this.usage.daily.spent + estimatedCost,
        budget: this.config.dailyBudget,
        message: `Daily budget of $${this.config.dailyBudget} would be exceeded`
      };

      return { allowed: !this.config.autoStop, alert };
    }

    // Check monthly quota
    if (this.usage.monthly.spent + estimatedCost > this.config.monthlyBudget) {
      const alert: QuotaAlert = {
        type: 'exceeded',
        period: 'monthly',
        threshold: 100,
        current: this.usage.monthly.spent + estimatedCost,
        budget: this.config.monthlyBudget,
        message: `Monthly budget of $${this.config.monthlyBudget} would be exceeded`
      };

      return { allowed: !this.config.autoStop, alert };
    }

    // Check for threshold alerts
    const alert = this.checkThresholds(estimatedCost);
    return { allowed: true, alert };
  }

  /**
   * Record actual spending
   */
  recordSpending(actualCost: number): void {
    this.resetQuotasIfNeeded();

    this.usage.daily.spent += actualCost;
    this.usage.monthly.spent += actualCost;

    this.updateUsageCalculations();
  }

  /**
   * Get current quota usage
   */
  getUsage(): QuotaUsage {
    this.resetQuotasIfNeeded();
    this.updateUsageCalculations();
    return { ...this.usage };
  }

  /**
   * Get recent alerts
   */
  getAlerts(): QuotaAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Update quota configuration
   */
  updateConfig(config: Partial<QuotaConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateUsageCalculations();
  }

  private initializeUsage(): QuotaUsage {
    const now = Date.now();
    return {
      daily: { spent: 0, budget: this.config.dailyBudget, remaining: this.config.dailyBudget, percentage: 0 },
      monthly: { spent: 0, budget: this.config.monthlyBudget, remaining: this.config.monthlyBudget, percentage: 0 },
      lastReset: { daily: now, monthly: now }
    };
  }

  private updateUsageCalculations(): void {
    // Daily calculations
    this.usage.daily.budget = this.config.dailyBudget;
    this.usage.daily.remaining = Math.max(0, this.config.dailyBudget - this.usage.daily.spent);
    this.usage.daily.percentage = (this.usage.daily.spent / this.config.dailyBudget) * 100;

    // Monthly calculations
    this.usage.monthly.budget = this.config.monthlyBudget;
    this.usage.monthly.remaining = Math.max(0, this.config.monthlyBudget - this.usage.monthly.spent);
    this.usage.monthly.percentage = (this.usage.monthly.spent / this.config.monthlyBudget) * 100;
  }

  private resetQuotasIfNeeded(): void {
    const now = Date.now();
    const today = new Date(now);
    const lastDaily = new Date(this.usage.lastReset.daily);
    const lastMonthly = new Date(this.usage.lastReset.monthly);

    // Reset daily quota (new day)
    if (today.getDate() !== lastDaily.getDate() || today.getMonth() !== lastDaily.getMonth()) {
      this.usage.daily.spent = 0;
      this.usage.lastReset.daily = now;
    }

    // Reset monthly quota (new month)
    if (today.getMonth() !== lastMonthly.getMonth() || today.getFullYear() !== lastMonthly.getFullYear()) {
      this.usage.monthly.spent = 0;
      this.usage.lastReset.monthly = now;
    }
  }

  private checkThresholds(estimatedCost: number): QuotaAlert | undefined {
    for (const threshold of this.config.alertThresholds.sort((a, b) => b - a)) {
      // Check daily threshold
      const dailyProjected = this.usage.daily.spent + estimatedCost;
      const dailyPercentage = (dailyProjected / this.config.dailyBudget) * 100;

      if (dailyPercentage >= threshold && this.usage.daily.percentage < threshold) {
        const alert: QuotaAlert = {
          type: threshold >= 95 ? 'critical' : 'warning',
          period: 'daily',
          threshold,
          current: dailyProjected,
          budget: this.config.dailyBudget,
          message: `Daily spending has reached ${threshold}% of budget ($${dailyProjected.toFixed(4)} / $${this.config.dailyBudget})`
        };

        this.alerts.push(alert);
        return alert;
      }

      // Check monthly threshold
      const monthlyProjected = this.usage.monthly.spent + estimatedCost;
      const monthlyPercentage = (monthlyProjected / this.config.monthlyBudget) * 100;

      if (monthlyPercentage >= threshold && this.usage.monthly.percentage < threshold) {
        const alert: QuotaAlert = {
          type: threshold >= 95 ? 'critical' : 'warning',
          period: 'monthly',
          threshold,
          current: monthlyProjected,
          budget: this.config.monthlyBudget,
          message: `Monthly spending has reached ${threshold}% of budget ($${monthlyProjected.toFixed(4)} / $${this.config.monthlyBudget})`
        };

        this.alerts.push(alert);
        return alert;
      }
    }

    return undefined;
  }
}
