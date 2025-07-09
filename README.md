# AI Prompt Toolkit

[![npm version](https://badge.fury.io/js/@callmedayz%2Fai-prompt-toolkit.svg)](https://badge.fury.io/js/@callmedayz%2Fai-prompt-toolkit)
[![CI](https://github.com/callmedayz/ai-prompt-toolkit/workflows/CI/badge.svg)](https://github.com/callmedayz/ai-prompt-toolkit/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive TypeScript/JavaScript toolkit for AI prompt engineering, token counting, and text processing. Built specifically for OpenRouter API integration, providing access to multiple AI models including GPT, Claude, Llama, Gemini, and many free-tier models through a single unified interface.

## Features

- 🎯 **Prompt Templating**: Dynamic prompt generation with variable substitution
- 🔢 **Token Counting**: Accurate token estimation for OpenRouter-supported models
- ✂️ **Text Chunking**: Smart text splitting for large documents
- ✅ **Prompt Validation**: Quality checks and optimization suggestions
- ⚡ **Prompt Optimization**: Automatic prompt compression and improvement
- 🌐 **OpenRouter Integration**: Access to 100+ AI models through a single API
- 🆓 **Free Tier Support**: Built-in support for free OpenRouter models
- 🖼️ **Multimodal Ready**: Support for text and image processing

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

// Estimate tokens for OpenRouter models
const tokenInfo = estimateTokens(prompt, 'openai/gpt-3.5-turbo');
console.log(`Tokens: ${tokenInfo.tokens}, Cost: $${tokenInfo.estimatedCost}`);

// Validate prompt quality
const validation = validatePrompt(prompt);
console.log(`Quality Score: ${validation.isValid ? 'Good' : 'Needs improvement'}`);
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

### Token Counting

Estimate tokens and costs for different AI models.

```typescript
import { TokenCounter, estimateTokens } from '@callmedayz/ai-prompt-toolkit';

// Quick estimation
const result = estimateTokens('Your text here', 'gpt-4');
console.log(result.tokens, result.estimatedCost);

// Check if text fits in model
const fits = TokenCounter.fitsInModel('Your text', 'gpt-3.5-turbo');

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

## Examples

See the `/examples` directory for complete usage examples:

- Basic prompt templating
- Token counting and cost estimation
- Text chunking for large documents
- Prompt validation and optimization
- Multi-model workflows

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see LICENSE file for details.

## Support

- 📖 [Documentation](https://github.com/callmedayz/ai-prompt-toolkit#readme)
- 🐛 [Issues](https://github.com/callmedayz/ai-prompt-toolkit/issues)
- 💬 [Discussions](https://github.com/callmedayz/ai-prompt-toolkit/discussions)
