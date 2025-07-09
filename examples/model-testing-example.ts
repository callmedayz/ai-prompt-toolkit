import { 
  ModelTestingService,
  OpenRouterClient,
  SupportedModel
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating live model testing and validation
 * 
 * This example shows:
 * 1. Single model testing
 * 2. Multi-model comparison
 * 3. Model validation
 * 4. Finding the best model for a task
 * 5. Health check monitoring
 */

async function demonstrateModelTesting() {
  try {
    console.log('🧪 AI Prompt Toolkit - Live Model Testing Demo\n');

    // Initialize testing service
    const client = OpenRouterClient.fromEnv();
    const testingService = new ModelTestingService(client);
    
    console.log('✅ Model testing service initialized\n');

    // Example 1: Single model test
    console.log('🎯 Example 1: Single Model Test');
    const testPrompt = 'Explain quantum computing in simple terms.';
    const testModel: SupportedModel = 'openai/gpt-3.5-turbo';
    
    const singleResult = await testingService.testModel(testPrompt, testModel, {
      maxTokens: 100,
      temperature: 0.7
    });

    console.log(`Model: ${singleResult.model}`);
    console.log(`Success: ${singleResult.success}`);
    console.log(`Response: "${singleResult.response?.substring(0, 100)}${singleResult.response && singleResult.response.length > 100 ? '...' : ''}"`);
    console.log(`Latency: ${singleResult.latency}ms`);
    console.log(`Tokens used: ${singleResult.tokenUsage?.totalTokens || 'N/A'}`);
    console.log(`Cost: $${singleResult.cost?.toFixed(6) || 'N/A'}\n`);

    // Example 2: Multi-model comparison
    console.log('⚖️ Example 2: Multi-Model Comparison');
    const comparisonModels: SupportedModel[] = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];
    
    const comparisonPrompt = 'Write a haiku about artificial intelligence.';
    
    console.log(`Testing prompt: "${comparisonPrompt}"`);
    console.log('Models being tested:', comparisonModels.join(', '));
    
    const batchResult = await testingService.testMultipleModels(
      comparisonPrompt, 
      comparisonModels,
      { maxTokens: 50, concurrent: false }
    );

    console.log('\nResults:');
    batchResult.results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.model}:`);
      if (result.success) {
        console.log(`     ✅ Response: "${result.response}"`);
        console.log(`     ⏱️ Latency: ${result.latency}ms`);
        console.log(`     💰 Cost: $${result.cost?.toFixed(6) || 'Free'}`);
      } else {
        console.log(`     ❌ Error: ${result.error}`);
      }
    });

    console.log('\nSummary:');
    console.log(`  Total tests: ${batchResult.summary.totalTests}`);
    console.log(`  Successful: ${batchResult.summary.successful}`);
    console.log(`  Failed: ${batchResult.summary.failed}`);
    console.log(`  Average latency: ${batchResult.summary.averageLatency.toFixed(0)}ms`);
    console.log(`  Total cost: $${batchResult.summary.totalCost.toFixed(6)}\n`);

    // Example 3: Model validation
    console.log('✅ Example 3: Model Validation');
    const validationModels: SupportedModel[] = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'google/gemma-2-9b-it:free'
    ];

    console.log('Validating models:', validationModels.join(', '));
    
    const validationResults = await testingService.validateMultipleModels(validationModels);
    
    validationResults.forEach(result => {
      console.log(`  ${result.model}:`);
      console.log(`    Available: ${result.isAvailable ? '✅' : '❌'}`);
      console.log(`    Working: ${result.isWorking ? '✅' : '❌'}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      if (result.latency) {
        console.log(`    Response time: ${result.latency}ms`);
      }
    });
    console.log();

    // Example 4: Find best model for a task
    console.log('🏆 Example 4: Find Best Model');
    const taskPrompt = 'Summarize the benefits of renewable energy in 3 bullet points.';
    const candidateModels: SupportedModel[] = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    console.log(`Task: "${taskPrompt}"`);
    console.log('Candidate models:', candidateModels.join(', '));
    
    // Find best model prioritizing speed
    const bestForSpeed = await testingService.findBestModel(taskPrompt, candidateModels, {
      prioritizeSpeed: true,
      maxLatency: 5000
    });

    console.log('\nBest for speed:');
    console.log(`  Model: ${bestForSpeed.bestModel}`);
    console.log(`  Reason: ${bestForSpeed.reason}`);
    console.log(`  Response: "${bestForSpeed.testResult.response?.substring(0, 100)}..."`);

    // Find best model prioritizing cost
    const bestForCost = await testingService.findBestModel(taskPrompt, candidateModels, {
      prioritizeCost: true
    });

    console.log('\nBest for cost:');
    console.log(`  Model: ${bestForCost.bestModel}`);
    console.log(`  Reason: ${bestForCost.reason}`);
    console.log(`  Response: "${bestForCost.testResult.response?.substring(0, 100)}..."`);
    console.log();

    // Example 5: Health check
    console.log('🏥 Example 5: Model Health Check');
    const healthCheckModels: SupportedModel[] = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free'
    ];

    console.log('Running health check on models:', healthCheckModels.join(', '));
    
    const healthCheck = await testingService.runHealthCheck(healthCheckModels);
    
    console.log(`\nHealth Check Results (${healthCheck.timestamp}):`);
    console.log(`  Total models tested: ${healthCheck.totalModels}`);
    console.log(`  Healthy models: ${healthCheck.healthyModels} ✅`);
    console.log(`  Unhealthy models: ${healthCheck.unhealthyModels} ❌`);
    console.log(`  Health rate: ${((healthCheck.healthyModels / healthCheck.totalModels) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed results:');
    healthCheck.results.forEach(result => {
      const status = result.isWorking ? '✅ HEALTHY' : '❌ UNHEALTHY';
      console.log(`  ${result.model}: ${status}`);
      if (!result.isWorking && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    console.log('\n🎉 Live model testing demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('1. Get an API key from https://openrouter.ai/keys');
      console.log('2. Set environment variable: export OPENROUTER_API_KEY=your_key_here');
    }
  }
}

// Example of continuous monitoring
async function demonstrateContinuousMonitoring() {
  try {
    const testingService = ModelTestingService.fromEnv();
    const monitorModels: SupportedModel[] = [
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku'
    ];

    console.log('🔄 Starting continuous model monitoring...');
    
    // Run health checks every 5 minutes
    const interval = setInterval(async () => {
      try {
        const healthCheck = await testingService.runHealthCheck(monitorModels);
        console.log(`[${new Date().toISOString()}] Health: ${healthCheck.healthyModels}/${healthCheck.totalModels} models healthy`);
        
        // Alert if any models are down
        const unhealthyModels = healthCheck.results.filter(r => !r.isWorking);
        if (unhealthyModels.length > 0) {
          console.log('⚠️ ALERT: Unhealthy models detected:');
          unhealthyModels.forEach(model => {
            console.log(`  - ${model.model}: ${model.error}`);
          });
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Stop monitoring after 30 minutes (for demo purposes)
    setTimeout(() => {
      clearInterval(interval);
      console.log('Monitoring stopped.');
    }, 30 * 60 * 1000);
    
  } catch (error) {
    console.error('Monitoring setup error:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateModelTesting();
}

export { demonstrateModelTesting, demonstrateContinuousMonitoring };
