const { 
  PromptTemplate, 
  estimateTokens, 
  validatePrompt, 
  optimizePrompt,
  chunkText,
  analyzePrompt
} = require('@callmedayz/ai-prompt-toolkit');

// Example 1: Basic Prompt Templating
console.log('=== Basic Prompt Templating ===');

const template = new PromptTemplate({
  template: `
You are a {role} assistant. Please {task} the following {content_type}:

{content}

Requirements:
- Be {tone}
- Focus on {focus_area}
- Provide {output_format}
  `.trim(),
  variables: {
    role: 'helpful AI',
    tone: 'professional',
    output_format: 'clear explanations'
  }
});

const prompt = template.render({
  task: 'analyze',
  content_type: 'customer feedback',
  content: 'The product is great but shipping was slow.',
  focus_area: 'actionable insights'
});

console.log('Generated Prompt:');
console.log(prompt);
console.log();

// Example 2: Token Estimation and Cost Calculation
console.log('=== Token Estimation ===');

const tokenInfo = estimateTokens(prompt, 'gpt-3.5-turbo');
console.log(`Tokens: ${tokenInfo.tokens}`);
console.log(`Characters: ${tokenInfo.characters}`);
console.log(`Words: ${tokenInfo.words}`);
console.log(`Estimated Cost: $${tokenInfo.estimatedCost?.toFixed(6) || 'N/A'}`);
console.log();

// Example 3: Prompt Validation
console.log('=== Prompt Validation ===');

const validation = validatePrompt(prompt, 'gpt-3.5-turbo');
console.log(`Is Valid: ${validation.isValid}`);
console.log(`Errors: ${validation.errors.length}`);
console.log(`Warnings: ${validation.warnings.length}`);
console.log(`Suggestions: ${validation.suggestions.length}`);

if (validation.warnings.length > 0) {
  console.log('Warnings:');
  validation.warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (validation.suggestions.length > 0) {
  console.log('Suggestions:');
  validation.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
}
console.log();

// Example 4: Prompt Optimization
console.log('=== Prompt Optimization ===');

const verbosePrompt = 'Please kindly make sure to carefully analyze this data and provide very detailed comprehensive insights with thorough explanations.';
const optimization = optimizePrompt(verbosePrompt);

console.log('Original:', verbosePrompt);
console.log('Optimized:', optimization.optimizedPrompt);
console.log(`Tokens Saved: ${optimization.tokensSaved}`);
console.log('Optimizations Applied:');
optimization.optimizations.forEach(opt => console.log(`  - ${opt}`));
console.log();

// Example 5: Text Chunking
console.log('=== Text Chunking ===');

const longText = `
This is a very long document that needs to be processed by an AI model.
It contains multiple paragraphs and sections that might exceed the token limit.
We need to split it into manageable chunks while preserving context.
Each chunk should be small enough to fit within the model's limits.
But we also want some overlap between chunks to maintain continuity.
This is especially important for tasks like summarization or analysis.
`.repeat(10); // Make it longer

const chunks = chunkText(longText, {
  maxTokens: 100,
  overlap: 20,
  preserveWords: true,
  preserveSentences: true
});

console.log(`Original text length: ${longText.length} characters`);
console.log(`Number of chunks: ${chunks.length}`);
console.log(`First chunk preview: ${chunks[0].substring(0, 100)}...`);
console.log();

// Example 6: Comprehensive Analysis
console.log('=== Comprehensive Analysis ===');

const testPrompt = 'Analyze customer feedback and provide actionable insights for product improvement.';
const analysis = analyzePrompt(testPrompt, 'gpt-4');

console.log('Comprehensive Analysis:');
console.log(`Tokens: ${analysis.tokens.tokens}`);
console.log(`Quality Score: ${analysis.quality}/100`);
console.log(`Fits in Model: ${analysis.fitsInModel}`);
console.log(`Estimated Cost: $${analysis.cost.toFixed(6)}`);
console.log(`Recommended Model: ${analysis.recommendation.model}`);
console.log(`Reason: ${analysis.recommendation.reason}`);
