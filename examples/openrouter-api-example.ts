import { 
  OpenRouterClient,
  OpenRouterCompletion,
  TokenCounter,
  PromptTemplate,
  getTokenCount,
  estimateTokens
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating real OpenRouter API integration
 * 
 * Before running this example:
 * 1. Get an API key from https://openrouter.ai/keys
 * 2. Set OPENROUTER_API_KEY environment variable
 * 3. Install the package: npm install @callmedayz/ai-prompt-toolkit
 */

async function demonstrateRealAPIIntegration() {
  try {
    console.log('🚀 AI Prompt Toolkit - Real OpenRouter API Integration Demo\n');

    // Initialize OpenRouter client
    const client = OpenRouterClient.fromEnv();
    console.log('✅ OpenRouter client initialized');

    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to OpenRouter API');
    }
    console.log('✅ OpenRouter API connection verified\n');

    // Set up TokenCounter to use real API
    TokenCounter.setClient(client);
    console.log('✅ TokenCounter configured for real API calls\n');

    // Example 1: Real token counting
    console.log('📊 Example 1: Real Token Counting');
    const sampleText = 'Analyze the sentiment of this customer review: "Great product, fast shipping!"';
    
    // Compare estimation vs real count
    const estimated = estimateTokens(sampleText, 'openai/gpt-3.5-turbo');
    const actual = await getTokenCount(sampleText, 'openai/gpt-3.5-turbo');
    
    console.log(`Text: "${sampleText}"`);
    console.log(`Estimated tokens: ${estimated.tokens}`);
    console.log(`Actual tokens: ${actual.tokens}`);
    console.log(`Difference: ${Math.abs(actual.tokens - estimated.tokens)} tokens\n`);

    // Example 2: Real text completion
    console.log('💬 Example 2: Real Text Completion');
    const completion = new OpenRouterCompletion(client);
    
    const prompt = 'Write a haiku about artificial intelligence:';
    const result = await completion.complete(prompt, {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log(`Prompt: "${prompt}"`);
    console.log(`Response: "${result.text}"`);
    console.log(`Model used: ${result.model}`);
    console.log(`Tokens used: ${result.usage.totalTokens} (${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion)\n`);

    // Example 3: Prompt template with real API
    console.log('🎯 Example 3: Prompt Template with Real API');
    const template = new PromptTemplate({
      template: `You are a {role} assistant. Please {task} the following {content_type}:

{content}

Requirements:
- Be {tone}
- Provide {output_format}`,
      variables: {
        role: 'helpful AI',
        tone: 'professional and concise'
      }
    });

    const renderedPrompt = template.render({
      task: 'summarize',
      content_type: 'article excerpt',
      content: 'Artificial intelligence is transforming industries by automating complex tasks, improving decision-making, and enabling new forms of human-computer interaction.',
      output_format: 'bullet points'
    });

    const summaryResult = await completion.complete(renderedPrompt, {
      model: 'anthropic/claude-3-haiku',
      maxTokens: 150
    });

    console.log(`Generated prompt: "${renderedPrompt}"`);
    console.log(`AI Summary: "${summaryResult.text}"`);
    console.log(`Model: ${summaryResult.model}\n`);

    // Example 4: Model validation
    console.log('✅ Example 4: Live Model Validation');
    const testPrompt = 'What is the capital of France?';
    const validation = await completion.validatePrompt(testPrompt, 'openai/gpt-3.5-turbo');
    
    console.log(`Test prompt: "${testPrompt}"`);
    console.log(`Validation result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (validation.result) {
      console.log(`Response: "${validation.result.text}"`);
    }
    if (validation.error) {
      console.log(`Error: ${validation.error}`);
    }

    console.log('\n🎉 Real OpenRouter API integration demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('1. Get an API key from https://openrouter.ai/keys');
      console.log('2. Set environment variable: export OPENROUTER_API_KEY=your_key_here');
      console.log('3. Or create a .env file with: OPENROUTER_API_KEY=your_key_here');
    }
  }
}

// Example of using with custom API key (not from environment)
async function demonstrateWithCustomApiKey() {
  const apiKey = 'your-api-key-here'; // Replace with actual key
  
  try {
    const client = new OpenRouterClient({ apiKey });
    const completion = new OpenRouterCompletion(client);
    
    const result = await completion.complete('Hello, world!', {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 50
    });
    
    console.log('Custom API key result:', result.text);
  } catch (error) {
    console.error('Custom API key error:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateRealAPIIntegration();
}

export { demonstrateRealAPIIntegration, demonstrateWithCustomApiKey };
