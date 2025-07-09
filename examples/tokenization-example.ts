import { 
  TokenCounter,
  TokenizationService,
  OpenRouterClient,
  getTokenCount,
  getDetailedTokenCount,
  compareTokenCounts,
  estimateTokens
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating advanced tokenization features
 * 
 * This example shows:
 * 1. Basic token estimation (offline)
 * 2. Real API tokenization
 * 3. Detailed tokenization with native counts
 * 4. Batch tokenization
 * 5. Accuracy comparison
 */

async function demonstrateTokenization() {
  try {
    console.log('🔢 AI Prompt Toolkit - Advanced Tokenization Demo\n');

    // Sample texts for testing
    const sampleTexts = [
      'Hello, world!',
      'Write a comprehensive analysis of artificial intelligence trends in 2024.',
      'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.',
      `Artificial intelligence (AI) is transforming industries across the globe. 
       From healthcare to finance, from transportation to entertainment, AI is 
       revolutionizing how we work, live, and interact with technology.`
    ];

    // Initialize OpenRouter client
    const client = OpenRouterClient.fromEnv();
    TokenCounter.setClient(client);
    
    console.log('✅ OpenRouter client initialized and TokenCounter configured\n');

    // Example 1: Basic estimation vs real tokenization
    console.log('📊 Example 1: Estimation vs Real Tokenization');
    const testText = sampleTexts[1];
    const model = 'openai/gpt-3.5-turbo';

    const estimated = estimateTokens(testText, model);
    const actual = await getTokenCount(testText, model);

    console.log(`Text: "${testText}"`);
    console.log(`Model: ${model}`);
    console.log(`Estimated tokens: ${estimated.tokens}`);
    console.log(`Actual tokens: ${actual.tokens}`);
    console.log(`Difference: ${Math.abs(actual.tokens - estimated.tokens)} tokens`);
    console.log(`Accuracy: ${(1 - Math.abs(actual.tokens - estimated.tokens) / actual.tokens * 100).toFixed(1)}%\n`);

    // Example 2: Detailed tokenization with native counts
    console.log('🔍 Example 2: Detailed Tokenization');
    const detailed = await getDetailedTokenCount(testText, model);
    
    console.log(`Normalized tokens: ${detailed.tokens}`);
    console.log(`Native tokens: ${detailed.nativeTokens || 'N/A'}`);
    console.log(`Generation ID: ${detailed.generationId || 'N/A'}`);
    console.log(`Characters: ${detailed.characters}`);
    console.log(`Words: ${detailed.words}`);
    console.log(`Estimated cost: $${detailed.estimatedCost?.toFixed(6) || 'N/A'}\n`);

    // Example 3: Accuracy comparison
    console.log('⚖️ Example 3: Accuracy Comparison');
    const comparison = await compareTokenCounts(testText, model);
    
    console.log(`Estimated: ${comparison.estimated.tokens} tokens`);
    console.log(`Actual: ${comparison.actual.tokens} tokens`);
    console.log(`Difference: ${comparison.difference} tokens`);
    console.log(`Accuracy: ${(comparison.accuracy * 100).toFixed(1)}%\n`);

    // Example 4: Batch tokenization
    console.log('📦 Example 4: Batch Tokenization');
    const tokenizationService = new TokenizationService(client);
    const batchResults = await tokenizationService.batchTokenize(sampleTexts, model);
    
    console.log('Batch tokenization results:');
    sampleTexts.forEach((text, index) => {
      const result = batchResults[index];
      console.log(`  ${index + 1}. "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      console.log(`     Tokens: ${result.tokens}, Cost: $${result.estimatedCost?.toFixed(6) || 'N/A'}`);
    });
    console.log();

    // Example 5: Multiple models comparison
    console.log('🔄 Example 5: Multi-Model Comparison');
    const models = ['openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku', 'meta-llama/llama-3.1-8b-instruct:free'];
    const comparisonText = sampleTexts[2];
    
    console.log(`Text: "${comparisonText}"`);
    console.log('Model comparison:');
    
    for (const testModel of models) {
      try {
        const result = await getTokenCount(comparisonText, testModel as any);
        console.log(`  ${testModel}: ${result.tokens} tokens, $${result.estimatedCost?.toFixed(6) || 'Free'}`);
      } catch (error) {
        console.log(`  ${testModel}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    console.log();

    // Example 6: Cache performance
    console.log('⚡ Example 6: Cache Performance');
    const cacheText = sampleTexts[0];
    
    console.log('First call (no cache):');
    const start1 = Date.now();
    await tokenizationService.getAccurateTokenCount(cacheText, model);
    const time1 = Date.now() - start1;
    console.log(`  Time: ${time1}ms`);
    
    console.log('Second call (cached):');
    const start2 = Date.now();
    await tokenizationService.getAccurateTokenCount(cacheText, model);
    const time2 = Date.now() - start2;
    console.log(`  Time: ${time2}ms`);
    console.log(`  Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    
    const cacheStats = tokenizationService.getCacheStats();
    console.log(`  Cache size: ${cacheStats.size} entries\n`);

    // Example 7: Error handling and fallback
    console.log('🛡️ Example 7: Error Handling');
    
    // Test with invalid model (should fall back to estimation)
    try {
      const fallbackResult = await getTokenCount(testText, 'invalid/model' as any);
      console.log(`Fallback result: ${fallbackResult.tokens} tokens (estimated)`);
    } catch (error) {
      console.log(`Error handled: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n🎉 Advanced tokenization demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('1. Get an API key from https://openrouter.ai/keys');
      console.log('2. Set environment variable: export OPENROUTER_API_KEY=your_key_here');
    }
  }
}

// Example of using TokenizationService directly
async function demonstrateTokenizationService() {
  try {
    const service = TokenizationService.fromEnv();
    
    const text = 'This is a test for direct tokenization service usage.';
    const result = await service.getAccurateTokenCount(text, 'openai/gpt-3.5-turbo');
    
    console.log('Direct service result:', result);
    
    // Clear cache when done
    service.clearCache();
  } catch (error) {
    console.error('Service error:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateTokenization();
}

export { demonstrateTokenization, demonstrateTokenizationService };
