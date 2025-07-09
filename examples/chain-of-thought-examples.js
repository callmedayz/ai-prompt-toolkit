const {
  ChainOfThoughtTemplate,
  createChainOfThought,
  estimateTokens
} = require('../dist/index.js');

console.log('🧠 Chain-of-Thought Prompt Engineering Examples\n');

// Example 1: Using Pre-built Patterns
console.log('=== Example 1: Pre-built Problem-Solving Pattern ===');

const problemSolver = ChainOfThoughtTemplate.createPattern('problem-solving');
const result1 = problemSolver.generate();

console.log('Problem-Solving Chain-of-Thought Template:');
console.log(result1.prompt.substring(0, 300) + '...');
console.log(`\nStep Count: ${result1.stepCount}`);
console.log(`Complexity: ${result1.complexity}`);
console.log(`Estimated Tokens: ${result1.estimatedTokens}\n`);

// Example 2: Custom Chain-of-Thought for Code Review
console.log('=== Example 2: Custom Code Review Chain ===');

const codeReviewChain = new ChainOfThoughtTemplate({
  problem: 'Review the following JavaScript function for bugs, performance issues, and best practices',
  context: 'This is a production code review for a web application',
  constraints: [
    'Focus on security vulnerabilities',
    'Consider performance implications',
    'Check for code maintainability'
  ],
  steps: [
    {
      id: 'syntax',
      title: 'Syntax and Structure Analysis',
      instruction: 'First, I\'ll examine the code syntax, structure, and basic functionality.',
      reasoning: 'Catching syntax errors and structural issues early prevents runtime problems.'
    },
    {
      id: 'security',
      title: 'Security Vulnerability Assessment',
      instruction: 'Next, I\'ll identify potential security vulnerabilities like injection attacks, XSS, or data exposure.',
      examples: ['SQL injection', 'XSS vulnerabilities', 'Authentication bypasses']
    },
    {
      id: 'performance',
      title: 'Performance Analysis',
      instruction: 'I\'ll analyze the code for performance bottlenecks and optimization opportunities.',
      reasoning: 'Performance issues can significantly impact user experience and system scalability.'
    },
    {
      id: 'maintainability',
      title: 'Code Quality and Maintainability',
      instruction: 'Finally, I\'ll evaluate code readability, documentation, and adherence to best practices.'
    }
  ],
  reasoningStyle: 'detailed',
  expectedOutput: 'A comprehensive code review with specific recommendations and priority levels'
});

const result2 = codeReviewChain.generate();
console.log('Code Review Chain-of-Thought:');
console.log(result2.prompt.substring(0, 400) + '...');
console.log(`\nComplexity: ${result2.complexity} (${result2.stepCount} steps)\n`);

// Example 3: Decision-Making Chain for Technology Selection
console.log('=== Example 3: Technology Decision Chain ===');

const techDecisionChain = ChainOfThoughtTemplate.createPattern('decision-making');
const result3 = techDecisionChain.generate();

console.log('Technology Decision Template:');
console.log(result3.prompt.substring(0, 350) + '...');
console.log(`\nStep Count: ${result3.stepCount}\n`);

// Example 4: Quick Chain-of-Thought Creation
console.log('=== Example 4: Quick Chain Creation ===');

const quickChain = createChainOfThought(
  'Optimize database query performance for a high-traffic e-commerce site',
  [
    'Analyze current query execution plans and identify bottlenecks',
    'Review indexing strategy and identify missing or inefficient indexes',
    'Examine query structure for optimization opportunities',
    'Consider caching strategies for frequently accessed data',
    'Implement and test optimizations with performance metrics'
  ],
  {
    context: 'E-commerce platform with 1M+ daily active users',
    constraints: ['Minimal downtime during implementation', 'Maintain data consistency'],
    reasoningStyle: 'step-by-step'
  }
);

console.log('Quick Database Optimization Chain:');
console.log(quickChain.prompt.substring(0, 400) + '...');
console.log(`\nTokens: ${quickChain.estimatedTokens}, Steps: ${quickChain.stepCount}\n`);

// Example 5: Creative Problem Solving
console.log('=== Example 5: Creative Chain for Innovation ===');

const creativeChain = ChainOfThoughtTemplate.createPattern('creative');
const result5 = creativeChain.generate();

console.log('Creative Problem-Solving Template:');
console.log(result5.prompt.substring(0, 300) + '...');
console.log(`\nComplexity: ${result5.complexity}\n`);

// Example 6: Modifying Existing Chains
console.log('=== Example 6: Chain Modification ===');

const baseChain = ChainOfThoughtTemplate.createPattern('analysis');

// Add a new step
const enhancedChain = baseChain.addStep({
  id: 'recommendations',
  title: 'Actionable Recommendations',
  instruction: 'Based on my analysis, I\'ll provide specific, actionable recommendations.',
  reasoning: 'Recommendations should be practical and implementable.'
});

// Update an existing step
const finalChain = enhancedChain.updateStep('observe', {
  title: 'Comprehensive Observation',
  instruction: 'I\'ll conduct a thorough observation, gathering both quantitative and qualitative data.',
  examples: ['Metrics and KPIs', 'User feedback', 'System logs']
});

const result6 = finalChain.generate();
console.log('Enhanced Analysis Chain:');
console.log(`Steps: ${result6.stepCount} (added recommendations step)`);
console.log(result6.prompt.substring(0, 350) + '...\n');

// Example 7: Comparing Chain Complexities
console.log('=== Example 7: Chain Complexity Comparison ===');

const chains = [
  { name: 'Simple Problem Solving', chain: ChainOfThoughtTemplate.createPattern('problem-solving') },
  { name: 'Complex Code Review', chain: codeReviewChain },
  { name: 'Enhanced Analysis', chain: finalChain }
];

chains.forEach(({ name, chain }) => {
  const result = chain.generate();
  console.log(`${name}: ${result.complexity} (${result.stepCount} steps, ~${result.estimatedTokens} tokens)`);
});

console.log('\n🎯 Chain-of-Thought templates help create structured, logical prompts that guide AI models through systematic reasoning processes!');
