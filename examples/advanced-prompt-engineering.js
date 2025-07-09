const { 
  ChainOfThoughtTemplate, 
  FewShotTemplate,
  createChainOfThought,
  createFewShot,
  PromptTemplate,
  estimateTokens 
} = require('../dist/index.js');

console.log('🚀 Advanced Prompt Engineering: Chain-of-Thought + Few-Shot Integration\n');

// Example 1: Combining Chain-of-Thought with Few-Shot for Code Review
console.log('=== Example 1: AI-Powered Code Review System ===');

// Step 1: Create a few-shot template for code issue classification
const issueClassifier = new FewShotTemplate({
  task: 'Classify code issues by severity and type',
  instructions: 'Analyze code issues and classify them with severity (low/medium/high) and type',
  examples: [
    {
      input: 'Variable name "x" is not descriptive',
      output: 'medium:readability',
      explanation: 'Poor naming affects code maintainability'
    },
    {
      input: 'SQL query vulnerable to injection attacks',
      output: 'high:security',
      explanation: 'Security vulnerabilities are critical'
    },
    {
      input: 'Missing semicolon at end of statement',
      output: 'low:syntax',
      explanation: 'Minor syntax issue, easily fixed'
    }
  ]
});

// Step 2: Create a chain-of-thought template for systematic code review
const codeReviewChain = new ChainOfThoughtTemplate({
  problem: 'Perform a comprehensive code review of the provided code',
  context: 'Production code review for a web application',
  constraints: [
    'Focus on security, performance, and maintainability',
    'Provide specific recommendations',
    'Classify issues by severity'
  ],
  steps: [
    {
      id: 'scan',
      title: 'Initial Code Scan',
      instruction: 'First, I\'ll scan the code for obvious syntax errors and structural issues.',
      reasoning: 'Catching basic issues early helps focus on more complex problems'
    },
    {
      id: 'security',
      title: 'Security Analysis',
      instruction: 'Next, I\'ll analyze the code for security vulnerabilities and potential attack vectors.',
      examples: ['SQL injection', 'XSS vulnerabilities', 'Authentication bypasses']
    },
    {
      id: 'performance',
      title: 'Performance Review',
      instruction: 'I\'ll examine the code for performance bottlenecks and optimization opportunities.',
      reasoning: 'Performance issues can significantly impact user experience'
    },
    {
      id: 'classify',
      title: 'Issue Classification',
      instruction: 'Finally, I\'ll classify each identified issue using the few-shot classification system.',
      reasoning: 'Consistent classification helps prioritize fixes'
    }
  ],
  reasoningStyle: 'detailed'
});

// Generate the combined prompt
const reviewPrompt = codeReviewChain.generate();
const classificationPrompt = issueClassifier.generate('Hardcoded API key in source code');

console.log('Code Review Chain-of-Thought:');
console.log(reviewPrompt.prompt.substring(0, 400) + '...\n');

console.log('Issue Classification Few-Shot:');
console.log(classificationPrompt.prompt.substring(0, 300) + '...\n');

// Example 2: AI Training Data Generation Pipeline
console.log('=== Example 2: AI Training Data Generation Pipeline ===');

// Create a chain-of-thought for data generation strategy
const dataGenChain = ChainOfThoughtTemplate.createPattern('creative');
const dataStrategy = dataGenChain.generate({
  creative_challenge: 'Generate diverse training data for sentiment analysis model'
});

// Create few-shot template for data generation
const dataGenerator = new FewShotTemplate({
  task: 'Generate training examples for sentiment analysis',
  instructions: 'Create realistic customer review examples with clear sentiment labels',
  examples: [
    {
      input: 'Product category: Electronics, Sentiment: Positive',
      output: 'This wireless headset has amazing sound quality and the battery lasts all day. Highly recommend!',
      explanation: 'Positive language with specific benefits mentioned'
    },
    {
      input: 'Product category: Clothing, Sentiment: Negative', 
      output: 'The fabric quality is poor and the sizing is completely off. Very disappointed with this purchase.',
      explanation: 'Clear negative sentiment with specific complaints'
    }
  ]
});

console.log('Data Generation Strategy:');
console.log(dataStrategy.prompt.substring(0, 300) + '...\n');

const generatedExample = dataGenerator.generate('Product category: Books, Sentiment: Neutral');
console.log('Training Data Generator:');
console.log(generatedExample.prompt.substring(0, 350) + '...\n');

// Example 3: Multi-Step Problem Solving with Examples
console.log('=== Example 3: Database Optimization Consultant ===');

// Create few-shot examples for database problem patterns
const dbProblemClassifier = new FewShotTemplate({
  task: 'Classify database performance problems',
  examples: [
    {
      input: 'Query takes 30 seconds to return 1000 rows from a table with 10M records',
      output: 'indexing:high',
      explanation: 'Likely missing indexes causing full table scans'
    },
    {
      input: 'Application timeouts during peak hours with high CPU usage',
      output: 'concurrency:medium',
      explanation: 'Connection pool or locking issues under load'
    },
    {
      input: 'Gradual performance degradation over months',
      output: 'maintenance:low',
      explanation: 'Likely needs routine maintenance like statistics updates'
    }
  ]
});

// Create chain-of-thought for systematic database optimization
const dbOptimizationChain = createChainOfThought(
  'Optimize database performance for high-traffic application',
  [
    'Analyze current performance metrics and identify bottlenecks',
    'Classify problems using pattern recognition',
    'Design optimization strategy based on problem classification',
    'Implement changes with minimal downtime',
    'Monitor and validate improvements'
  ],
  {
    context: 'E-commerce platform with 1M+ daily users',
    constraints: ['Zero downtime requirement', 'Budget constraints'],
    reasoningStyle: 'step-by-step'
  }
);

console.log('Database Optimization Chain:');
console.log(dbOptimizationChain.prompt.substring(0, 400) + '...\n');

const problemClassification = dbProblemClassifier.generate(
  'SELECT queries are fast but INSERT operations are very slow during business hours'
);
console.log('Problem Classification:');
console.log(problemClassification.prompt.substring(0, 300) + '...\n');

// Example 4: Token Efficiency Analysis
console.log('=== Example 4: Token Efficiency Analysis ===');

const prompts = [
  { name: 'Code Review Chain', prompt: reviewPrompt.prompt },
  { name: 'Data Generation Strategy', prompt: dataStrategy.prompt },
  { name: 'DB Optimization Chain', prompt: dbOptimizationChain.prompt }
];

console.log('Token Usage Analysis:');
prompts.forEach(({ name, prompt }) => {
  const tokenInfo = estimateTokens(prompt, 'tencent/hunyuan-a13b-instruct:free');
  console.log(`${name}: ${tokenInfo.tokens} tokens (~$${tokenInfo.estimatedCost?.toFixed(6) || '0.000000'})`);
});

console.log('\n🎯 Advanced prompt engineering combines structured reasoning (Chain-of-Thought) with example-based learning (Few-Shot) for powerful AI interactions!');
console.log('💡 This approach enables AI models to both follow logical processes AND learn from specific examples.');
console.log('🚀 Perfect for complex tasks like code review, data generation, and systematic problem-solving!');
