# AI Prompt Toolkit

[![npm version](https://badge.fury.io/js/@callmedayz%2Fai-prompt-toolkit.svg)](https://badge.fury.io/js/@callmedayz%2Fai-prompt-toolkit)
[![CI](https://github.com/callmedayz/ai-prompt-toolkit/workflows/CI/badge.svg)](https://github.com/callmedayz/ai-prompt-toolkit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive TypeScript/JavaScript toolkit for AI prompt engineering, token counting, and text processing. Built specifically for OpenRouter API integration, providing access to multiple AI models including GPT, Claude, Llama, Gemini, and many free-tier models through a single unified interface.

## Features

### Core Features
- 🎯 **Prompt Templating**: Dynamic prompt generation with variable substitution
- 🔢 **Token Counting**: Accurate token estimation for OpenRouter-supported models
- ✂️ **Text Chunking**: Smart text splitting for large documents
- ✅ **Prompt Validation**: Quality checks and optimization suggestions
- ⚡ **Prompt Optimization**: Automatic prompt compression and improvement
- 🌐 **OpenRouter Integration**: Access to 100+ AI models through a single API
- 🆓 **Free Tier Support**: Built-in support for free OpenRouter models

### Advanced Features (v2.4.0)
- 📊 **Prompt Versioning & A/B Testing**: Manage prompt versions and run statistical A/B tests
- 📈 **Performance Analytics**: Real-time monitoring, insights, and trend analysis
- 🤖 **Auto-Optimization**: AI-powered prompt improvement using OpenRouter models
- 🖼️ **Multimodal Support**: Text + image prompts for vision-capable models

### 🚀 NEW! Advanced Template Features (v2.5.0)
- 🔀 **Conditional Logic**: If/else statements and branching in templates
- 🔄 **Loop Processing**: Iterate over arrays with #each syntax
- 🏗️ **Template Inheritance**: Base templates with child overrides and composition
- 🎯 **Dynamic Composition**: Rule-based template selection based on context
- ⚡ **Smart Functions**: Built-in and custom functions for template processing

### 📊 NEW! Enhanced Analytics & Dashboards (v2.6.0)
- 📈 **Real-time Dashboards**: Live performance monitoring with customizable widgets
- 🔔 **Live Monitoring**: Event-driven updates with anomaly detection
- 📋 **Custom Metrics**: Configurable KPIs and business intelligence
- 🚨 **Alert System**: Threshold-based alerting with severity levels
- 📤 **Dashboard Export**: Save and share dashboard configurations

### ✅ **Fully Tested & Production Ready**
- 🧪 **Comprehensive Testing**: 60+ test cases covering all features
- 🌐 **Web Demo**: Interactive application demonstrating real-world usage
- 🤖 **AI Validated**: Tested with Google Gemini 2.0 Flash and other models
- 📊 **Performance Verified**: Real-time analytics and monitoring validated
- 🐛 **Bug Tracked**: Professional bug tracking and resolution documentation

## Installation

```bash
npm install @callmedayz/ai-prompt-toolkit
```

## Setup

To use this toolkit, you'll need an OpenRouter API key:

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Set it as an environment variable:

```bash
# .env file
OPENROUTER_API_KEY=your_api_key_here
```

Or pass it directly to the functions that need it.

## Quick Start

### Basic Usage (Offline)
```typescript
import {
  PromptTemplate,
  estimateTokens,
  validatePrompt,
  chunkText
} from '@callmedayz/ai-prompt-toolkit';

// Create a prompt template
const template = new PromptTemplate({
  template: 'Analyze the following {type}: {content}',
  variables: { type: 'text' }
});

const prompt = template.render({ content: 'Hello world!' });
console.log(prompt); // "Analyze the following text: Hello world!"

// Estimate tokens for OpenRouter models (offline estimation)
const tokenInfo = estimateTokens(prompt, 'openai/gpt-3.5-turbo');
console.log(`Estimated tokens: ${tokenInfo.tokens}, Cost: $${tokenInfo.estimatedCost}`);

// Validate prompt quality
const validation = validatePrompt(prompt);
console.log(`Quality Score: ${validation.isValid ? 'Good' : 'Needs improvement'}`);
```

### Enhanced Prompt Engineering (v2.3.0+)
```typescript
import {
  ChainOfThoughtTemplate,
  FewShotTemplate,
  createChainOfThought,
  createFewShot
} from '@callmedayz/ai-prompt-toolkit';

// Chain-of-Thought Reasoning
const problemSolver = ChainOfThoughtTemplate.createPattern('problem-solving');
const result = problemSolver.generate({ problem: 'Optimize database performance' });
console.log(result.prompt);

// Few-Shot Learning
const classifier = new FewShotTemplate({
  task: 'Classify customer sentiment',
  examples: [
    { input: 'Love this product!', output: 'positive' },
    { input: 'Terrible experience', output: 'negative' }
  ]
});
const classification = classifier.generate('This is okay');
```

### Real API Integration (v2.1.0+)
```typescript
import {
  OpenRouterClient,
  OpenRouterCompletion,
  TokenCounter,
  getTokenCount
} from '@callmedayz/ai-prompt-toolkit';

// Initialize OpenRouter client
const client = OpenRouterClient.fromEnv(); // Uses OPENROUTER_API_KEY env var
// or: const client = new OpenRouterClient({ apiKey: 'your-key' });

// Set up real tokenization
TokenCounter.setClient(client);

// Get accurate token count using OpenRouter API
const realTokens = await getTokenCount('Your text here', 'openai/gpt-3.5-turbo');
console.log(`Actual tokens: ${realTokens.tokens}`);

// Generate real completions
const completion = new OpenRouterCompletion(client);
const result = await completion.complete('Write a haiku about AI', {
  model: 'openai/gpt-3.5-turbo',
  maxTokens: 100
});

console.log(`Response: ${result.text}`);
console.log(`Tokens used: ${result.usage.totalTokens}`);
```

## API Reference

### PromptTemplate

Create dynamic prompts with variable substitution.

```typescript
const template = new PromptTemplate({
  template: 'Hello {name}, you are {age} years old!',
  variables: { name: 'World' },
  escapeHtml: false,
  preserveWhitespace: true
});

// Render with variables
const result = template.render({ age: 25 });

// Get required variables
const vars = template.getVariables(); // ['name', 'age']

// Validate variables
const validation = template.validate({ name: 'Alice', age: 30 });
```

### Chain-of-Thought Templates

Create structured prompts that guide AI models through step-by-step reasoning:

```typescript
import { ChainOfThoughtTemplate, createChainOfThought } from '@callmedayz/ai-prompt-toolkit';

// Use pre-built patterns
const problemSolver = ChainOfThoughtTemplate.createPattern('problem-solving');
const analysisChain = ChainOfThoughtTemplate.createPattern('analysis');
const decisionMaker = ChainOfThoughtTemplate.createPattern('decision-making');
const creativeChain = ChainOfThoughtTemplate.createPattern('creative');

// Generate structured reasoning prompt
const result = problemSolver.generate({
  problem: 'Optimize database query performance for high-traffic application'
});

console.log(`Steps: ${result.stepCount}, Complexity: ${result.complexity}`);
console.log(result.prompt);

// Create custom chain-of-thought
const customChain = new ChainOfThoughtTemplate({
  problem: 'Design a scalable microservices architecture',
  context: 'E-commerce platform with 1M+ users',
  constraints: ['High availability', 'Cost-effective', 'Easy to maintain'],
  steps: [
    {
      id: 'requirements',
      title: 'Requirements Analysis',
      instruction: 'Identify functional and non-functional requirements',
      reasoning: 'Clear requirements guide architectural decisions'
    },
    {
      id: 'design',
      title: 'Architecture Design',
      instruction: 'Design service boundaries and communication patterns'
    }
  ],
  reasoningStyle: 'detailed'
});

// Quick chain creation
const quickChain = createChainOfThought(
  'Implement CI/CD pipeline',
  ['Plan pipeline stages', 'Configure tools', 'Test and deploy'],
  { reasoningStyle: 'step-by-step' }
);
```

### Few-Shot Learning Templates

Enable AI models to learn from examples and apply patterns to new inputs:

```typescript
import { FewShotTemplate, createFewShot, createExamplesFromData } from '@callmedayz/ai-prompt-toolkit';

// Create classification template
const sentimentClassifier = new FewShotTemplate({
  task: 'Classify customer review sentiment',
  instructions: 'Analyze the sentiment as positive, negative, or neutral',
  examples: [
    {
      input: 'This product exceeded my expectations! Amazing quality.',
      output: 'positive',
      explanation: 'Enthusiastic language and positive descriptors'
    },
    {
      input: 'Terrible customer service, very disappointed.',
      output: 'negative',
      explanation: 'Clear negative sentiment and dissatisfaction'
    },
    {
      input: 'The product works as described, nothing special.',
      output: 'neutral',
      explanation: 'Factual statement without strong emotional indicators'
    }
  ]
});

const result = sentimentClassifier.generate('The delivery was fast but packaging was damaged');
console.log(result.prompt);

// Use pre-built patterns
const dataExtractor = FewShotTemplate.createPattern('extraction', 'contact information');
const codeGenerator = FewShotTemplate.createPattern('generation', 'SQL queries');
const documentClassifier = FewShotTemplate.createPattern('classification', 'document types');

// Quick few-shot creation
const quickClassifier = createFewShot(
  'Categorize support tickets',
  [
    { input: 'Login not working', output: 'technical' },
    { input: 'Billing question', output: 'financial' },
    { input: 'Feature request', output: 'product' }
  ],
  'Password reset email not received',
  { instructions: 'Categorize based on the type of issue' }
);

// Create examples from dataset
const trainingData = [
  { input: { age: 25, purchases: 12 }, output: 'regular' },
  { input: { age: 45, purchases: 50 }, output: 'premium' }
];
const examples = createExamplesFromData(trainingData, 5);
```

### Token Counting

#### Offline Estimation
```typescript
import { TokenCounter, estimateTokens } from '@callmedayz/ai-prompt-toolkit';

// Quick estimation (offline)
const result = estimateTokens('Your text here', 'tencent/hunyuan-a13b-instruct:free');
console.log(result.tokens, result.estimatedCost);

// Check if text fits in model
const fits = TokenCounter.fitsInModel('Your text', 'tencent/hunyuan-a13b-instruct:free');
```

#### Real API Token Counting (v2.1.0+)
```typescript
import { OpenRouterClient, TokenCounter, getTokenCount } from '@callmedayz/ai-prompt-toolkit';

// Set up real API tokenization
const client = OpenRouterClient.fromEnv();
TokenCounter.setClient(client);

// Get accurate token count from OpenRouter
const realCount = await getTokenCount('Your text here', 'openai/gpt-4');
console.log(`Actual tokens: ${realCount.tokens}`);

// Automatically falls back to estimation if API fails
const safeCount = await getTokenCount('Text', 'anthropic/claude-3-sonnet');
```

// Get model recommendation
const recommendation = TokenCounter.recommendModel('Very long text...');
console.log(recommendation.model, recommendation.reason);
```

### Text Chunking

Split large texts into manageable chunks.

```typescript
import { TextChunker, chunkText } from '@callmedayz/ai-prompt-toolkit';

// Basic chunking
const chunks = chunkText('Long text...', {
  maxTokens: 1000,
  overlap: 50,
  preserveWords: true,
  preserveSentences: true
});

// Model-specific chunking
const modelChunks = TextChunker.chunkForModel(
  'Very long document...', 
  'gpt-3.5-turbo',
  10 // 10% overlap
);

// Get chunk statistics
const stats = TextChunker.getChunkStats(chunks);
```

### Prompt Validation

Validate and improve prompt quality.

```typescript
import { PromptValidator, validatePrompt } from '@callmedayz/ai-prompt-toolkit';

const validation = validatePrompt('Your prompt here', 'gpt-4');

console.log(validation.isValid);
console.log(validation.errors);
console.log(validation.warnings);
console.log(validation.suggestions);

// Get quality score (0-100)
const score = PromptValidator.getQualityScore('Your prompt');
```

### Prompt Optimization

Optimize prompts to reduce token usage.

```typescript
import { PromptOptimizer, optimizePrompt } from '@callmedayz/ai-prompt-toolkit';

const result = optimizePrompt('Please kindly analyze this data carefully');

console.log(result.originalPrompt);
console.log(result.optimizedPrompt);
console.log(result.tokensSaved);
console.log(result.optimizations);

// Optimize to specific token target
const targeted = PromptOptimizer.optimizeToTarget(
  'Long prompt...', 
  100, // target tokens
  'gpt-3.5-turbo'
);
```

### OpenRouter Completion API (v2.1.0+)

Generate real AI responses using OpenRouter's API.

```typescript
import { OpenRouterClient, OpenRouterCompletion } from '@callmedayz/ai-prompt-toolkit';

// Initialize completion service
const client = OpenRouterClient.fromEnv();
const completion = new OpenRouterCompletion(client);

// Simple completion
const result = await completion.complete('Write a haiku about programming', {
  model: 'openai/gpt-3.5-turbo',
  maxTokens: 100,
  temperature: 0.7
});

console.log(result.text);
console.log(`Used ${result.usage.totalTokens} tokens`);

// Chat-style completion
const chatResult = await completion.chat([
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Explain async/await in JavaScript' }
], { model: 'anthropic/claude-3-haiku' });

// Test prompt against a model
const validation = await completion.validatePrompt(
  'What is 2+2?',
  'openai/gpt-3.5-turbo'
);

if (validation.isValid) {
  console.log('Prompt works!', validation.result?.text);
} else {
  console.log('Prompt failed:', validation.error);
}
```

### Streaming Responses (v2.1.0+)

Get real-time streaming responses from AI models.

```typescript
import { OpenRouterCompletion, StreamingCallback } from '@callmedayz/ai-prompt-toolkit';

const completion = OpenRouterCompletion.fromEnv();

// Stream with callback
const streamCallback: StreamingCallback = (chunk) => {
  if (chunk.isComplete) {
    console.log('\n✅ Stream completed!');
  } else {
    process.stdout.write(chunk.content);
  }
};

await completion.completeStream('Write a story about AI', streamCallback, {
  model: 'openai/gpt-3.5-turbo',
  maxTokens: 200
});

// Collect streaming results
const collected = await completion.completeStreamCollected('Explain quantum computing');
console.log('Full response:', collected.text);
console.log('Received in chunks:', collected.chunks.length);
```

### Enhanced Error Handling (v2.1.0+)

Robust error handling with retry logic and circuit breakers.

```typescript
import {
  OpenRouterClient,
  OpenRouterError,
  ErrorType,
  CircuitBreaker
} from '@callmedayz/ai-prompt-toolkit';

// Custom retry configuration
const client = new OpenRouterClient(
  { apiKey: 'your-key' },
  {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
    retryableErrors: [ErrorType.NETWORK, ErrorType.RATE_LIMIT]
  }
);

try {
  const result = await client.completion(request);
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.log(`Error type: ${error.type}`);
    console.log(`Retryable: ${error.retryable}`);
    console.log(`Retry after: ${error.retryAfter}ms`);
  }
}

// Circuit breaker status
console.log('Circuit breaker:', client.getCircuitBreakerStatus());
```

### Rate Limiting & Quota Management (v2.1.0+)

Control API usage and costs with built-in rate limiting and quotas.

```typescript
import {
  OpenRouterClient,
  RateLimitConfig,
  QuotaConfig
} from '@callmedayz/ai-prompt-toolkit';

// Configure rate limits
const rateLimitConfig: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  tokensPerMinute: 10000,
  costPerMinute: 1.0
};

// Configure quotas
const quotaConfig: QuotaConfig = {
  dailyBudget: 10.0,
  monthlyBudget: 200.0,
  alertThresholds: [50, 80, 95],
  autoStop: true
};

const client = OpenRouterClient.fromEnv(
  undefined, // API config
  undefined, // Retry config
  rateLimitConfig,
  quotaConfig
);

// Monitor usage
console.log('Rate limit status:', client.getRateLimitStatus());
console.log('Quota status:', client.getQuotaStatus());
console.log('Quota alerts:', client.getQuotaAlerts());
```

## Supported Models (via OpenRouter)

### Free Tier Models
- **OpenAI GPT-3.5-turbo**: `openai/gpt-3.5-turbo`
- **Meta Llama 3.1 8B**: `meta-llama/llama-3.1-8b-instruct:free`
- **Google Gemma 2 9B**: `google/gemma-2-9b-it:free`
- **Microsoft Phi-3**: `microsoft/phi-3-medium-128k-instruct:free`
- **Mistral 7B**: `mistralai/mistral-7b-instruct:free`

### Premium Models
- **GPT-4**: `openai/gpt-4`
- **GPT-4 Turbo**: `openai/gpt-4-turbo`
- **Claude-3.5 Sonnet**: `anthropic/claude-3.5-sonnet`
- **Claude-3 Opus**: `anthropic/claude-3-opus`
- **Gemini Pro**: `google/gemini-pro`

*See [OpenRouter Models](https://openrouter.ai/models) for the complete list*

## Model Management Scripts

This toolkit includes scripts to keep OpenRouter model data up-to-date:

### Fetch Latest Models
```bash
npm run fetch-models
```
Fetches the latest model list from OpenRouter API and saves to `data/` directory.

### Generate Model Configurations
```bash
npm run generate-config
```
Generates TypeScript types and configurations from fetched model data.

### Update Everything
```bash
npm run update-models
```
Runs both scripts above and rebuilds the package.

## Utility Functions

```typescript
import { 
  analyzePrompt,
  fitsInModel,
  recommendModel,
  calculateCost,
  getPromptQuality
} from '@callmedayz/ai-prompt-toolkit';

// Comprehensive prompt analysis
const analysis = analyzePrompt('Your prompt', 'gpt-4');
console.log(analysis.tokens, analysis.validation, analysis.quality);

// Quick utilities
const fits = fitsInModel('Text', 'gpt-3.5-turbo');
const rec = recommendModel('Long text');
const cost = calculateCost('Text', 'gpt-4');
const quality = getPromptQuality('Your prompt');
```

## Advanced Features (v2.4.0)

### Prompt Versioning and A/B Testing

```typescript
import { PromptVersionManager, createQuickABTest } from '@callmedayz/ai-prompt-toolkit';

// Create version manager
const manager = new PromptVersionManager();

// Create prompt versions
const v1 = manager.createVersion('customer-support', 'Help the customer: {issue}');
const v2 = manager.createVersion('customer-support', 'As a helpful assistant, please address: {issue}');

// Quick A/B test setup
const { manager: testManager, testConfig } = createQuickABTest(
  'support-test',
  'Template A: {input}',
  'Template B: {input}',
  { input: 'test' }
);

// Start A/B test
const testResult = await manager.startABTest({
  name: 'Support Prompt Test',
  variants: [v1, v2],
  trafficSplit: [50, 50],
  successCriteria: [
    { metric: 'success_rate', target: 90, operator: 'greater_than' }
  ]
});
```

### Performance Analytics

```typescript
import { PromptAnalytics } from '@callmedayz/ai-prompt-toolkit';

// Initialize analytics
const analytics = new PromptAnalytics({
  enableRealTimeMonitoring: true,
  alertThresholds: {
    successRate: { warning: 85, critical: 70 },
    responseTime: { warning: 3000, critical: 5000 }
  }
});

// Record test execution
analytics.recordExecution(execution, 'openai/gpt-4.5-preview');

// Generate insights
const insights = analytics.generateInsights(promptVersionId);
console.log('Performance insights:', insights);

// Get aggregated metrics
const dailyMetrics = analytics.generateAggregation(promptVersionId, 'day');
```

### Auto-Prompt Optimization

```typescript
import { AutoPromptOptimizer } from '@callmedayz/ai-prompt-toolkit';

// Initialize optimizer
const optimizer = new AutoPromptOptimizer(versionManager, analytics, {
  optimizationModel: 'openai/gpt-4.5-preview',
  targetMetrics: {
    successRate: { target: 95, weight: 0.4 },
    responseTime: { target: 2000, weight: 0.3 }
  }
});

// Get optimization recommendations
const recommendations = await optimizer.analyzeForOptimization(promptVersionId);

// Apply AI-powered optimization
const optimizationResult = await optimizer.optimizePrompt(
  promptVersionId,
  'conciseness_optimization'
);
```

### Multimodal Prompts

```typescript
import { MultimodalPromptTemplate, createImageInput } from '@callmedayz/ai-prompt-toolkit';

// Create image inputs
const productImage = await createImageInput(
  'https://example.com/product.jpg',
  'Product photo'
);

// Create multimodal prompt
const multimodalPrompt = new MultimodalPromptTemplate({
  template: 'Analyze this product image and provide insights: {analysis_focus}',
  variables: { analysis_focus: 'market positioning' },
  imageVariables: { product: [productImage] },
  maxImages: 5
});

// Render prompt with images
const result = multimodalPrompt.render();
console.log('Text:', result.text);
console.log('Images:', result.images.length);
console.log('Supported models:', result.metadata.supportedModels);
```

### 🚀 NEW! Advanced Template Features (v2.5.0)

```typescript
import { AdvancedPromptTemplate, TemplateComposer, TemplateInheritanceManager } from '@callmedayz/ai-prompt-toolkit';

// Advanced templates with conditional logic and loops
const advancedTemplate = new AdvancedPromptTemplate({
  template: `
You are a {{#if user_level == "expert"}}senior{{#else}}helpful{{/if}} AI assistant.

{{#if task_complexity > 5}}
This is a complex task. Please break it down:
{{#each steps as step}}
{step_index}. {{capitalize(step)}}
{{/each}}
{{#else}}
This is a straightforward task.
{{/if}}

{{#if length(examples) > 0}}
Examples: {{join(examples, ", ")}}
{{/if}}
  `,
  variables: {
    user_level: 'expert',
    task_complexity: 7,
    steps: ['analyze requirements', 'design solution', 'implement'],
    examples: ['example 1', 'example 2']
  }
});

const result = advancedTemplate.render();
console.log(result);

// Dynamic template composition
const composer = new TemplateComposer();

composer.registerTemplate('simple', new AdvancedPromptTemplate({
  template: 'Simple task: {task}'
}));

composer.registerTemplate('complex', new AdvancedPromptTemplate({
  template: 'Complex analysis required for: {task}'
}));

// Add composition rules
composer.addCompositionRule({
  name: 'complexity_rule',
  conditions: [{ field: 'complexity', operator: 'greater_than', value: 5 }],
  templatePattern: 'complex',
  priority: 10
});

const composedResult = composer.compose({
  complexity: 8,
  task: 'Market analysis'
});

console.log('Selected template:', composedResult.templateName);
console.log('Generated prompt:', composedResult.prompt);
```

### 📊 NEW! Real-time Analytics & Dashboards (v2.6.0)

```typescript
import { EnhancedAnalytics, RealTimeDashboard } from '@callmedayz/ai-prompt-toolkit';

// Initialize enhanced analytics with real-time monitoring
const analytics = new EnhancedAnalytics({
  enableRealTimeMonitoring: true,
  alertThresholds: {
    successRate: { warning: 90, critical: 80 },
    responseTime: { warning: 2000, critical: 5000 }
  }
});

// Enable real-time monitoring
analytics.enableRealTimeMonitoring();

// Get dashboard instance
const dashboard = analytics.getDashboard();

// Create custom dashboard layout
const layoutId = dashboard.createLayout({
  name: 'AI Performance Monitor',
  autoRefresh: true,
  refreshInterval: 15,
  widgets: [
    {
      id: 'success_rate',
      type: 'metric',
      title: 'Success Rate',
      position: { x: 0, y: 0, width: 3, height: 2 },
      config: { metric: 'successRate', format: 'percentage' }
    },
    {
      id: 'response_time',
      type: 'metric',
      title: 'Response Time',
      position: { x: 3, y: 0, width: 3, height: 2 },
      config: { metric: 'averageResponseTime', format: 'duration' }
    }
  ]
});

// Subscribe to real-time updates
dashboard.subscribe('metric:success_rate', (metric) => {
  console.log(`Success Rate: ${metric.value.toFixed(1)}% (${metric.trend})`);
});

dashboard.subscribe('alerts', (alert) => {
  console.log(`🚨 ALERT: ${alert.title}`);
});

// Record executions (triggers real-time updates)
analytics.recordExecution({
  id: 'exec_1',
  promptVersionId: 'prompt_v1',
  responseTime: 1500,
  success: true,
  cost: 0.005,
  timestamp: new Date()
}, 'openai/gpt-3.5-turbo');

// Get real-time metrics
const metrics = analytics.getRealTimeMetrics();
console.log('Current metrics:', metrics);

// Export dashboard configuration
const config = dashboard.exportDashboard();
console.log('Dashboard exported:', config.length, 'bytes');
```

## 🌐 Web Demo Application

Experience all v2.6.0 features in an interactive web interface:

**Location**: `web-app-demo/` directory (excluded from git)

### Features Demonstrated
- **Advanced Template Builder**: Create templates with conditionals, loops, and functions
- **Smart Template Composition**: Automatic template selection based on context
- **Real-time Analytics Dashboard**: Live performance monitoring and metrics
- **AI Integration**: Google Gemini 2.0 Flash completions with tracking
- **Interactive UI**: Professional web interface with Bootstrap 5

### Quick Start
```bash
cd web-app-demo
npm install
npm start
# Visit http://localhost:3000
```

**Note**: The web demo uses the published `@callmedayz/ai-prompt-toolkit@2.6.0` package and demonstrates real-world usage patterns.

## Examples

See the `/examples` directory for complete usage examples:

- Basic prompt templating and token counting
- Advanced template features with conditionals and loops
- Real-time dashboard monitoring
- Prompt versioning and A/B testing
- Performance analytics and optimization
- Multimodal prompts with images
- Multi-model workflows with OpenRouter

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/callmedayz/ai-prompt-toolkit#readme)
- 🐛 [Issues](https://github.com/callmedayz/ai-prompt-toolkit/issues)
- 💬 [Discussions](https://github.com/callmedayz/ai-prompt-toolkit/discussions)
