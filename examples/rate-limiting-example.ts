import { 
  OpenRouterClient,
  OpenRouterCompletion,
  RateLimiter,
  QuotaManager,
  RateLimitConfig,
  QuotaConfig,
  DEFAULT_RATE_LIMITS
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating rate limiting and quota management
 * 
 * This example shows:
 * 1. Basic rate limiting configuration
 * 2. Quota management for cost control
 * 3. Usage monitoring and alerts
 * 4. Rate limit recovery
 * 5. Integration with OpenRouter client
 */

async function demonstrateRateLimiting() {
  try {
    console.log('⏱️ AI Prompt Toolkit - Rate Limiting & Quota Management Demo\n');

    // Example 1: Basic Rate Limiting
    console.log('🚦 Example 1: Basic Rate Limiting');
    
    const rateLimitConfig: RateLimitConfig = {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      tokensPerMinute: 1000,
      tokensPerHour: 10000,
      tokensPerDay: 100000
    };

    const rateLimiter = new RateLimiter(rateLimitConfig);
    
    console.log('Rate limit configuration:', rateLimitConfig);
    
    // Test rate limiting
    for (let i = 1; i <= 12; i++) {
      const status = rateLimiter.checkRequest(100, 0.01); // 100 tokens, $0.01 cost
      
      if (status.allowed) {
        rateLimiter.recordUsage(100, 0.01);
        console.log(`Request ${i}: ✅ Allowed`);
      } else {
        console.log(`Request ${i}: ❌ Blocked - ${status.reason}`);
        console.log(`  Retry after: ${status.retryAfter}ms`);
        console.log(`  Remaining requests: ${JSON.stringify(status.remaining.requests)}`);
        break;
      }
    }
    
    console.log('Current usage:', rateLimiter.getUsage());
    console.log();

    // Example 2: Quota Management
    console.log('💰 Example 2: Quota Management');
    
    const quotaConfig: QuotaConfig = {
      dailyBudget: 5.0,
      monthlyBudget: 100.0,
      alertThresholds: [50, 80, 95],
      autoStop: false
    };

    const quotaManager = new QuotaManager(quotaConfig);
    
    console.log('Quota configuration:', quotaConfig);
    
    // Simulate spending
    const spendingAmounts = [1.0, 1.5, 1.2, 0.8, 1.1];
    
    for (let i = 0; i < spendingAmounts.length; i++) {
      const amount = spendingAmounts[i];
      const status = quotaManager.checkQuota(amount);
      
      if (status.allowed) {
        quotaManager.recordSpending(amount);
        console.log(`Spending $${amount}: ✅ Allowed`);
        
        if (status.alert) {
          console.log(`  🚨 Alert: ${status.alert.message}`);
        }
      } else {
        console.log(`Spending $${amount}: ❌ Blocked - ${status.alert?.message}`);
        break;
      }
      
      const usage = quotaManager.getUsage();
      console.log(`  Daily: $${usage.daily.spent.toFixed(2)}/$${usage.daily.budget} (${usage.daily.percentage.toFixed(1)}%)`);
    }
    
    console.log('Final quota usage:', quotaManager.getUsage());
    console.log('Quota alerts:', quotaManager.getAlerts());
    console.log();

    // Example 3: Integrated Client with Rate Limiting and Quotas
    if (process.env.OPENROUTER_API_KEY) {
      console.log('🔗 Example 3: Integrated Client');
      
      const clientRateConfig: RateLimitConfig = {
        requestsPerMinute: 5,
        requestsPerHour: 50,
        requestsPerDay: 500,
        tokensPerMinute: 5000,
        tokensPerHour: 50000,
        tokensPerDay: 500000,
        costPerMinute: 0.50,
        costPerHour: 5.0,
        costPerDay: 50.0
      };

      const clientQuotaConfig: QuotaConfig = {
        dailyBudget: 2.0,
        monthlyBudget: 50.0,
        alertThresholds: [50, 80, 95],
        autoStop: true
      };

      const client = OpenRouterClient.fromEnv(
        undefined, // API config
        undefined, // Retry config
        clientRateConfig,
        clientQuotaConfig
      );

      const completion = new OpenRouterCompletion(client);
      
      console.log('Client with rate limiting and quotas initialized');
      
      // Make some requests
      const testPrompts = [
        'What is AI?',
        'Explain machine learning.',
        'What is deep learning?',
        'How does neural network work?',
        'What is natural language processing?'
      ];

      for (let i = 0; i < testPrompts.length; i++) {
        try {
          console.log(`\nRequest ${i + 1}: "${testPrompts[i]}"`);
          
          const result = await completion.complete(testPrompts[i], {
            model: 'openai/gpt-3.5-turbo',
            maxTokens: 50
          });
          
          console.log(`✅ Response: "${result.text.substring(0, 100)}..."`);
          
          // Check status after each request
          const rateStatus = client.getRateLimitStatus();
          const quotaStatus = client.getQuotaStatus();
          const alerts = client.getQuotaAlerts();
          
          if (rateStatus) {
            console.log(`Rate limit - Requests remaining: ${rateStatus.requests.minute}/min`);
          }
          
          if (quotaStatus) {
            console.log(`Quota - Daily spent: $${quotaStatus.daily.spent.toFixed(4)}/$${quotaStatus.daily.budget}`);
          }
          
          if (alerts.length > 0) {
            console.log(`🚨 Alerts: ${alerts.map(a => a.message).join(', ')}`);
          }
          
        } catch (error) {
          console.log(`❌ Request failed: ${error instanceof Error ? error.message : error}`);
          
          // Check if it's a rate limit or quota error
          if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
              console.log('  Reason: Rate limit exceeded');
            } else if (error.message.includes('quota')) {
              console.log('  Reason: Quota exceeded');
            }
          }
          
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log('🔗 Example 3: Skipped (no API key)');
    }

    // Example 4: Monitoring and Analytics
    console.log('\n📊 Example 4: Usage Monitoring');
    
    const monitoringRateLimiter = new RateLimiter({
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      tokensPerMinute: 10000,
      tokensPerHour: 100000,
      tokensPerDay: 1000000,
      costPerMinute: 1.0,
      costPerHour: 10.0,
      costPerDay: 100.0
    });

    // Simulate various usage patterns
    const usagePatterns = [
      { requests: 10, tokens: 1000, cost: 0.1, description: 'Light usage' },
      { requests: 50, tokens: 5000, cost: 0.5, description: 'Medium usage' },
      { requests: 20, tokens: 2000, cost: 0.2, description: 'Moderate usage' }
    ];

    for (const pattern of usagePatterns) {
      console.log(`\nSimulating ${pattern.description}:`);
      
      for (let i = 0; i < pattern.requests; i++) {
        const tokensPerRequest = pattern.tokens / pattern.requests;
        const costPerRequest = pattern.cost / pattern.requests;
        
        const status = monitoringRateLimiter.checkRequest(tokensPerRequest, costPerRequest);
        
        if (status.allowed) {
          monitoringRateLimiter.recordUsage(tokensPerRequest, costPerRequest);
        } else {
          console.log(`  Request ${i + 1} blocked: ${status.reason}`);
          break;
        }
      }
      
      const usage = monitoringRateLimiter.getUsage();
      console.log(`  Final usage - Requests: ${usage.requests.minute}, Tokens: ${usage.tokens.minute}, Cost: $${usage.cost.minute.toFixed(2)}`);
    }

    // Example 5: Dynamic Configuration Updates
    console.log('\n⚙️ Example 5: Dynamic Configuration Updates');
    
    const dynamicRateLimiter = new RateLimiter(DEFAULT_RATE_LIMITS);
    console.log('Initial config:', DEFAULT_RATE_LIMITS);
    
    // Update configuration
    const newConfig: Partial<RateLimitConfig> = {
      requestsPerMinute: 200,
      tokensPerMinute: 20000,
      costPerMinute: 2.0
    };
    
    dynamicRateLimiter.updateConfig(newConfig);
    console.log('Updated rate limits for higher throughput');
    
    // Test with new limits
    for (let i = 1; i <= 5; i++) {
      const status = dynamicRateLimiter.checkRequest(1000, 0.1);
      if (status.allowed) {
        dynamicRateLimiter.recordUsage(1000, 0.1);
        console.log(`High-throughput request ${i}: ✅ Allowed`);
      } else {
        console.log(`High-throughput request ${i}: ❌ Blocked`);
      }
    }

    console.log('\n🎉 Rate limiting and quota management demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo Error:', error instanceof Error ? error.message : error);
  }
}

// Example of building a cost-aware service
class CostAwareOpenRouterService {
  private client: OpenRouterClient;
  private completion: OpenRouterCompletion;

  constructor(apiKey: string, dailyBudget: number = 10.0) {
    const rateLimitConfig: RateLimitConfig = {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
      tokensPerMinute: 30000,
      tokensPerHour: 500000,
      tokensPerDay: 5000000,
      costPerMinute: dailyBudget / (24 * 60), // Spread daily budget across minutes
      costPerHour: dailyBudget / 24,
      costPerDay: dailyBudget
    };

    const quotaConfig: QuotaConfig = {
      dailyBudget,
      monthlyBudget: dailyBudget * 30,
      alertThresholds: [50, 75, 90, 95],
      autoStop: true
    };

    this.client = new OpenRouterClient(
      { apiKey },
      undefined,
      rateLimitConfig,
      quotaConfig
    );
    
    this.completion = new OpenRouterCompletion(this.client);
  }

  async generateText(prompt: string): Promise<{ text: string; cost: number; withinBudget: boolean }> {
    try {
      const result = await this.completion.complete(prompt, {
        model: 'openai/gpt-3.5-turbo',
        maxTokens: 100
      });

      const quotaStatus = this.client.getQuotaStatus();
      const cost = quotaStatus?.daily.spent || 0;
      const withinBudget = quotaStatus ? quotaStatus.daily.remaining > 0 : true;

      return {
        text: result.text,
        cost,
        withinBudget
      };
    } catch (error) {
      throw error;
    }
  }

  getUsageReport() {
    return {
      rateLimit: this.client.getRateLimitStatus(),
      quota: this.client.getQuotaStatus(),
      alerts: this.client.getQuotaAlerts()
    };
  }
}

// Run the demo
if (require.main === module) {
  demonstrateRateLimiting();
}

export { demonstrateRateLimiting, CostAwareOpenRouterService };
