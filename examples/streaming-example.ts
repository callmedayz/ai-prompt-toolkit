import { 
  OpenRouterClient,
  OpenRouterCompletion,
  StreamingChunk,
  StreamingCallback
} from '@callmedayz/ai-prompt-toolkit';

/**
 * Example demonstrating streaming responses from OpenRouter
 * 
 * This example shows:
 * 1. Basic streaming completion
 * 2. Real-time streaming with callbacks
 * 3. Collecting streaming results
 * 4. Chat-style streaming
 * 5. Error handling in streams
 */

async function demonstrateStreaming() {
  try {
    console.log('🌊 AI Prompt Toolkit - Streaming Responses Demo\n');

    // Initialize streaming service
    const client = OpenRouterClient.fromEnv();
    const completion = new OpenRouterCompletion(client);
    
    console.log('✅ Streaming service initialized\n');

    // Example 1: Basic streaming with real-time output
    console.log('📡 Example 1: Real-time Streaming');
    const prompt1 = 'Write a short story about a robot learning to paint.';
    
    console.log(`Prompt: "${prompt1}"`);
    console.log('Streaming response:');
    console.log('---');
    
    let wordCount = 0;
    const streamCallback: StreamingCallback = (chunk: StreamingChunk) => {
      if (chunk.isComplete) {
        console.log('\n---');
        console.log(`✅ Stream completed! Total words: ~${wordCount}`);
      } else if (chunk.content) {
        process.stdout.write(chunk.content);
        wordCount += chunk.content.split(' ').length;
      }
    };

    await completion.completeStream(prompt1, streamCallback, {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 200,
      temperature: 0.8
    });
    
    console.log('\n');

    // Example 2: Collecting streaming results
    console.log('📦 Example 2: Collecting Streaming Results');
    const prompt2 = 'Explain quantum computing in 3 bullet points.';
    
    console.log(`Prompt: "${prompt2}"`);
    console.log('Collecting stream...');
    
    const collected = await completion.completeStreamCollected(prompt2, {
      model: 'anthropic/claude-3-haiku',
      maxTokens: 150
    });
    
    console.log('Complete response:');
    console.log(`"${collected.text}"`);
    console.log(`Received in ${collected.chunks.length} chunks`);
    console.log('Chunks:', collected.chunks.map(c => `"${c.substring(0, 10)}..."`).join(', '));
    console.log();

    // Example 3: Chat-style streaming
    console.log('💬 Example 3: Chat-style Streaming');
    
    console.log('Starting a conversation...');
    console.log('User: Hello! Can you help me understand machine learning?');
    console.log('Assistant: ');
    
    await completion.chatStream([
      { role: 'system', content: 'You are a helpful AI tutor. Explain concepts clearly and concisely.' },
      { role: 'user', content: 'Hello! Can you help me understand machine learning?' }
    ], (chunk) => {
      if (chunk.isComplete) {
        console.log('\n');
      } else if (chunk.content) {
        process.stdout.write(chunk.content);
      }
    }, {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 150,
      temperature: 0.7
    });

    // Example 4: Streaming with progress tracking
    console.log('📊 Example 4: Streaming with Progress Tracking');
    const prompt4 = 'Write a haiku about artificial intelligence.';
    
    console.log(`Prompt: "${prompt4}"`);
    
    let totalChunks = 0;
    let totalCharacters = 0;
    const startTime = Date.now();
    
    const progressCallback: StreamingCallback = (chunk: StreamingChunk) => {
      if (chunk.isComplete) {
        const duration = Date.now() - startTime;
        console.log('\n📈 Streaming Statistics:');
        console.log(`  Total chunks: ${totalChunks}`);
        console.log(`  Total characters: ${totalCharacters}`);
        console.log(`  Duration: ${duration}ms`);
        console.log(`  Average chunk size: ${(totalCharacters / totalChunks).toFixed(1)} chars`);
        console.log(`  Characters per second: ${(totalCharacters / (duration / 1000)).toFixed(1)}`);
      } else if (chunk.content) {
        totalChunks++;
        totalCharacters += chunk.content.length;
        process.stdout.write(chunk.content);
      }
    };

    await completion.completeStream(prompt4, progressCallback, {
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      maxTokens: 50
    });
    
    console.log('\n');

    // Example 5: Multiple concurrent streams
    console.log('🔄 Example 5: Multiple Concurrent Streams');
    
    const prompts = [
      'Write a limerick about coding.',
      'Explain photosynthesis in one sentence.',
      'What is the capital of Mars?'
    ];
    
    console.log('Starting 3 concurrent streams...\n');
    
    const streamPromises = prompts.map(async (prompt, index) => {
      console.log(`Stream ${index + 1}: "${prompt}"`);
      console.log(`Response ${index + 1}: `);
      
      await completion.completeStream(prompt, (chunk) => {
        if (chunk.isComplete) {
          console.log(`\n✅ Stream ${index + 1} completed\n`);
        } else if (chunk.content) {
          process.stdout.write(chunk.content);
        }
      }, {
        model: 'openai/gpt-3.5-turbo',
        maxTokens: 100
      });
    });
    
    await Promise.all(streamPromises);

    // Example 6: Error handling in streaming
    console.log('🛡️ Example 6: Error Handling in Streaming');
    
    try {
      console.log('Testing error handling with invalid model...');
      
      await completion.completeStream('Test prompt', (chunk) => {
        console.log('Received chunk:', chunk.content);
      }, {
        model: 'invalid/model' as any,
        maxTokens: 50
      });
    } catch (error) {
      console.log(`✅ Error properly caught: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n🎉 Streaming responses demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('1. Get an API key from https://openrouter.ai/keys');
      console.log('2. Set environment variable: export OPENROUTER_API_KEY=your_key_here');
    }
  }
}

// Example of building a simple chat interface with streaming
async function demonstrateStreamingChat() {
  try {
    const completion = OpenRouterCompletion.fromEnv();
    
    console.log('🤖 Simple Streaming Chat Interface');
    console.log('Type your messages and see real-time responses!\n');
    
    const conversation = [
      { role: 'system' as const, content: 'You are a helpful assistant. Keep responses concise.' }
    ];
    
    // Simulate a few chat exchanges
    const userMessages = [
      'Hello! How are you?',
      'Can you explain what streaming is?',
      'Thanks for the explanation!'
    ];
    
    for (const userMessage of userMessages) {
      console.log(`👤 User: ${userMessage}`);
      console.log('🤖 Assistant: ');
      
      conversation.push({ role: 'user', content: userMessage });
      
      let assistantResponse = '';
      
      await completion.chatStream(conversation, (chunk) => {
        if (chunk.isComplete) {
          console.log('\n');
          conversation.push({ role: 'assistant', content: assistantResponse });
        } else if (chunk.content) {
          assistantResponse += chunk.content;
          process.stdout.write(chunk.content);
        }
      }, {
        model: 'openai/gpt-3.5-turbo',
        maxTokens: 100
      });
    }
    
    console.log('Chat session completed!');
    
  } catch (error) {
    console.error('Chat error:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateStreaming();
}

export { demonstrateStreaming, demonstrateStreamingChat };
