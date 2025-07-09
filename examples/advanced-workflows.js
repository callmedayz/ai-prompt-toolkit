const { 
  PromptTemplate,
  TextChunker,
  TokenCounter,
  PromptValidator,
  PromptOptimizer,
  analyzePrompt
} = require('@callmedayz/ai-prompt-toolkit');

// Advanced Example 1: Multi-Model Document Processing Pipeline
console.log('=== Multi-Model Document Processing Pipeline ===');

async function processLargeDocument(document, task = 'summarize') {
  console.log(`Processing document (${document.length} chars) for task: ${task}`);
  
  // Step 1: Analyze the document to recommend the best model
  const recommendation = TokenCounter.recommendModel(document);
  console.log(`Recommended model: ${recommendation.model} (${recommendation.reason})`);
  
  // Step 2: Create a task-specific prompt template
  const template = new PromptTemplate({
    template: `
Task: {task}
Document Section: {section_number}/{total_sections}

Content:
{content}

Instructions:
- {task_instruction}
- Maintain consistency with previous sections
- Focus on key insights and actionable information
    `.trim(),
    variables: {
      task_instruction: task === 'summarize' 
        ? 'Provide a concise summary highlighting main points'
        : 'Analyze thoroughly and provide detailed insights'
    }
  });
  
  // Step 3: Chunk the document for the recommended model
  const chunks = TextChunker.chunkForModel(document, recommendation.model, 15);
  console.log(`Document split into ${chunks.length} chunks`);
  
  // Step 4: Process each chunk
  const results = [];
  let totalCost = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const prompt = template.render({
      task,
      section_number: i + 1,
      total_sections: chunks.length,
      content: chunks[i]
    });
    
    // Validate and optimize each prompt
    const validation = PromptValidator.validate(prompt, recommendation.model);
    if (!validation.isValid) {
      console.log(`Warning: Chunk ${i + 1} has validation issues:`, validation.errors);
    }
    
    const optimization = PromptOptimizer.optimize(prompt, recommendation.model);
    const cost = TokenCounter.calculateCost(optimization.optimizedPrompt, recommendation.model);
    totalCost += cost;
    
    results.push({
      chunkIndex: i,
      originalPrompt: prompt,
      optimizedPrompt: optimization.optimizedPrompt,
      tokensSaved: optimization.tokensSaved,
      cost: cost
    });
    
    console.log(`Chunk ${i + 1}: ${optimization.tokensSaved} tokens saved, $${cost.toFixed(6)} cost`);
  }
  
  console.log(`Total estimated cost: $${totalCost.toFixed(4)}`);
  return results;
}

// Example document
const sampleDocument = `
Artificial Intelligence has revolutionized numerous industries in recent years. From healthcare to finance, AI applications are transforming how businesses operate and deliver value to customers.

In healthcare, AI-powered diagnostic tools are helping doctors identify diseases earlier and more accurately. Machine learning algorithms can analyze medical images, predict patient outcomes, and even assist in drug discovery processes.

The financial sector has embraced AI for fraud detection, algorithmic trading, and risk assessment. Banks use AI to analyze transaction patterns, detect suspicious activities, and provide personalized financial advice to customers.

Manufacturing industries leverage AI for predictive maintenance, quality control, and supply chain optimization. Smart factories use AI to monitor equipment performance, predict failures, and optimize production schedules.

However, the adoption of AI also brings challenges. Privacy concerns, ethical considerations, and the need for skilled professionals are significant hurdles that organizations must address.

Looking forward, the integration of AI with emerging technologies like 5G, IoT, and quantum computing promises even more transformative applications. The future of AI looks bright, but it requires careful planning and responsible implementation.
`.repeat(5); // Make it longer for demonstration

// Run the pipeline
processLargeDocument(sampleDocument, 'analyze').then(() => {
  console.log('\n=== Advanced Prompt Engineering Patterns ===');
  
  // Advanced Example 2: Dynamic Prompt Engineering Patterns
  
  // Chain-of-Thought Prompting
  const cotTemplate = new PromptTemplate({
    template: `
Let's solve this step by step:

Problem: {problem}

Step 1: Understanding the problem
{step1_instruction}

Step 2: Breaking down the approach
{step2_instruction}

Step 3: Implementation
{step3_instruction}

Step 4: Verification
{step4_instruction}

Please work through each step carefully and show your reasoning.
    `.trim()
  });
  
  const cotPrompt = cotTemplate.render({
    problem: 'How to optimize database query performance?',
    step1_instruction: 'Identify the current performance bottlenecks',
    step2_instruction: 'Analyze query execution plans and indexing strategies',
    step3_instruction: 'Apply optimization techniques',
    step4_instruction: 'Measure and validate improvements'
  });
  
  console.log('Chain-of-Thought Prompt:');
  console.log(cotPrompt.substring(0, 200) + '...');
  
  const cotAnalysis = analyzePrompt(cotPrompt, 'gpt-4');
  console.log(`CoT Quality Score: ${cotAnalysis.quality}/100`);
  
  // Few-Shot Learning Template
  const fewShotTemplate = new PromptTemplate({
    template: `
Task: {task}

Examples:
{examples}

Now apply the same pattern to:
Input: {input}
Output:
    `.trim()
  });
  
  const fewShotPrompt = fewShotTemplate.render({
    task: 'Classify customer sentiment',
    examples: `
Input: "The product is amazing, I love it!"
Output: Positive

Input: "Terrible quality, waste of money"
Output: Negative

Input: "It's okay, nothing special"
Output: Neutral
    `.trim(),
    input: "Great customer service, but the product could be better"
  });
  
  console.log('\nFew-Shot Learning Prompt:');
  console.log(fewShotPrompt);
  
  const fewShotAnalysis = analyzePrompt(fewShotPrompt, 'gpt-3.5-turbo');
  console.log(`Few-Shot Quality Score: ${fewShotAnalysis.quality}/100`);
  
  console.log('\n=== Prompt Optimization Strategies ===');
  
  // Demonstrate different optimization strategies
  const strategies = [
    'Please kindly make sure to carefully and thoroughly analyze this important data',
    'I would like you to please examine this information very carefully',
    'Could you possibly help me understand this complex topic in detail?'
  ];
  
  strategies.forEach((prompt, index) => {
    const optimization = PromptOptimizer.optimize(prompt);
    console.log(`\nStrategy ${index + 1}:`);
    console.log(`Original: "${prompt}"`);
    console.log(`Optimized: "${optimization.optimizedPrompt}"`);
    console.log(`Tokens saved: ${optimization.tokensSaved}`);
    console.log(`Optimizations: ${optimization.optimizations.join(', ')}`);
  });
});
