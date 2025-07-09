import { 
  PromptTemplate,
  TokenCounter,
  TextChunker,
  PromptValidator,
  PromptOptimizer,
  estimateTokens,
  validatePrompt,
  optimizePrompt,
  analyzePrompt,
  SupportedModel,
  PromptTemplateOptions,
  ValidationResult,
  OptimizationResult
} from '@callmedayz/ai-prompt-toolkit';

// TypeScript Example: Type-Safe AI Prompt Engineering

interface AITask {
  id: string;
  name: string;
  description: string;
  model: SupportedModel;
  template: string;
  variables: Record<string, any>;
  maxTokens?: number;
}

interface ProcessingResult {
  taskId: string;
  prompt: string;
  optimizedPrompt: string;
  validation: ValidationResult;
  optimization: OptimizationResult;
  tokenInfo: {
    original: number;
    optimized: number;
    saved: number;
  };
  estimatedCost: number;
  qualityScore: number;
}

class AIPromptProcessor {
  private tasks: Map<string, AITask> = new Map();

  addTask(task: AITask): void {
    this.tasks.set(task.id, task);
  }

  async processTask(taskId: string, inputData: Record<string, any>): Promise<ProcessingResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Create prompt template
    const templateOptions: PromptTemplateOptions = {
      template: task.template,
      variables: { ...task.variables, ...inputData },
      preserveWhitespace: true
    };

    const template = new PromptTemplate(templateOptions);
    const prompt = template.render();

    // Validate prompt
    const validation = validatePrompt(prompt, task.model);
    
    // Optimize prompt
    const optimization = task.maxTokens 
      ? PromptOptimizer.optimizeToTarget(prompt, task.maxTokens, task.model)
      : optimizePrompt(prompt, task.model);

    // Calculate token information
    const originalTokens = estimateTokens(prompt, task.model);
    const optimizedTokens = estimateTokens(optimization.optimizedPrompt, task.model);

    // Get quality score
    const qualityScore = PromptValidator.getQualityScore(optimization.optimizedPrompt, task.model);

    return {
      taskId,
      prompt,
      optimizedPrompt: optimization.optimizedPrompt,
      validation,
      optimization,
      tokenInfo: {
        original: originalTokens.tokens,
        optimized: optimizedTokens.tokens,
        saved: optimization.tokensSaved
      },
      estimatedCost: optimizedTokens.estimatedCost || 0,
      qualityScore
    };
  }

  getModelRecommendation(text: string): { model: SupportedModel; reason: string } {
    return TokenCounter.recommendModel(text);
  }

  chunkDocument(text: string, model: SupportedModel, overlapPercent: number = 10): string[] {
    return TextChunker.chunkForModel(text, model, overlapPercent);
  }

  analyzePrompt(prompt: string, model: SupportedModel) {
    return analyzePrompt(prompt, model);
  }
}

// Example usage
async function demonstrateTypeScriptUsage() {
  const processor = new AIPromptProcessor();

  // Define tasks
  const tasks: AITask[] = [
    {
      id: 'code-review',
      name: 'Code Review Assistant',
      description: 'Reviews code and provides feedback',
      model: 'gpt-4',
      template: `
You are an expert {language} developer. Please review the following code:

\`\`\`{language}
{code}
\`\`\`

Focus on:
- Code quality and best practices
- Performance considerations
- Security issues
- Maintainability

Provide specific, actionable feedback.
      `.trim(),
      variables: {
        language: 'TypeScript'
      },
      maxTokens: 1000
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis Assistant',
      description: 'Analyzes data and provides insights',
      model: 'gpt-3.5-turbo',
      template: `
Analyze the following {data_type} data and provide insights:

Data: {data}

Please provide:
1. Key findings
2. Trends and patterns
3. Actionable recommendations
4. Statistical summary

Format: {output_format}
      `.trim(),
      variables: {
        data_type: 'sales',
        output_format: 'structured report'
      }
    },
    {
      id: 'content-generation',
      name: 'Content Generator',
      description: 'Generates content based on requirements',
      model: 'claude-3-sonnet',
      template: `
Create {content_type} content with the following specifications:

Topic: {topic}
Audience: {audience}
Tone: {tone}
Length: {length}
Key points to cover: {key_points}

Requirements:
- Engaging and informative
- SEO-friendly
- Include call-to-action
      `.trim(),
      variables: {
        content_type: 'blog post',
        tone: 'professional',
        length: '800-1000 words'
      }
    }
  ];

  // Add tasks to processor
  tasks.forEach(task => processor.addTask(task));

  // Process code review task
  console.log('=== Processing Code Review Task ===');
  const codeReviewResult = await processor.processTask('code-review', {
    code: `
function calculateTotal(items: Item[]): number {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
    `.trim()
  });

  console.log(`Task: ${codeReviewResult.taskId}`);
  console.log(`Quality Score: ${codeReviewResult.qualityScore}/100`);
  console.log(`Tokens: ${codeReviewResult.tokenInfo.original} → ${codeReviewResult.tokenInfo.optimized} (saved ${codeReviewResult.tokenInfo.saved})`);
  console.log(`Estimated Cost: $${codeReviewResult.estimatedCost.toFixed(6)}`);
  console.log(`Validation: ${codeReviewResult.validation.isValid ? 'PASS' : 'FAIL'}`);
  
  if (codeReviewResult.validation.warnings.length > 0) {
    console.log('Warnings:', codeReviewResult.validation.warnings);
  }

  // Process data analysis task
  console.log('\n=== Processing Data Analysis Task ===');
  const dataAnalysisResult = await processor.processTask('data-analysis', {
    data: 'Q1: $50k, Q2: $75k, Q3: $60k, Q4: $90k'
  });

  console.log(`Task: ${dataAnalysisResult.taskId}`);
  console.log(`Quality Score: ${dataAnalysisResult.qualityScore}/100`);
  console.log(`Optimizations Applied: ${dataAnalysisResult.optimization.optimizations.join(', ')}`);

  // Demonstrate document chunking
  console.log('\n=== Document Chunking Example ===');
  const longDocument = `
This is a comprehensive guide to AI prompt engineering best practices.
It covers various techniques, strategies, and real-world applications.
The document is quite lengthy and needs to be processed in chunks.
  `.repeat(100);

  const recommendation = processor.getModelRecommendation(longDocument);
  console.log(`Recommended model: ${recommendation.model} (${recommendation.reason})`);

  const chunks = processor.chunkDocument(longDocument, recommendation.model, 15);
  console.log(`Document chunked into ${chunks.length} parts`);

  const chunkStats = TextChunker.getChunkStats(chunks);
  console.log(`Chunk statistics:`, chunkStats);

  // Comprehensive analysis
  console.log('\n=== Comprehensive Analysis ===');
  const samplePrompt = 'Analyze customer feedback data and provide actionable business insights for product improvement and customer satisfaction enhancement.';
  const analysis = processor.analyzePrompt(samplePrompt, 'gpt-4');
  
  console.log('Analysis Results:');
  console.log(`- Tokens: ${analysis.tokens.tokens}`);
  console.log(`- Quality: ${analysis.quality}/100`);
  console.log(`- Fits in model: ${analysis.fitsInModel}`);
  console.log(`- Cost: $${analysis.cost.toFixed(6)}`);
  console.log(`- Recommended model: ${analysis.recommendation.model}`);
  console.log(`- Validation errors: ${analysis.validation.errors.length}`);
  console.log(`- Validation warnings: ${analysis.validation.warnings.length}`);
}

// Run the demonstration
demonstrateTypeScriptUsage().catch(console.error);
