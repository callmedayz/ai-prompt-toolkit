import { PromptTemplate } from './prompt-template';
import { 
  FewShotOptions, 
  FewShotResult, 
  FewShotExample 
} from './types';
import { estimateTokens } from './utils';

/**
 * Few-Shot Learning Prompt Template System
 * Creates prompts with examples to guide AI model behavior through demonstration
 */
export class FewShotTemplate {
  private options: FewShotOptions;
  private template: PromptTemplate;

  constructor(options: FewShotOptions) {
    this.options = {
      maxExamples: 5,
      ...options
    };
    this.template = this.buildTemplate();
  }

  /**
   * Generate the few-shot learning prompt
   */
  generate(input: string): FewShotResult {
    const prompt = this.template.render({ input });
    const tokenEstimate = estimateTokens(prompt, 'tencent/hunyuan-a13b-instruct:free').tokens;
    
    return {
      prompt,
      exampleCount: Math.min(this.options.examples.length, this.options.maxExamples || 5),
      estimatedTokens: tokenEstimate
    };
  }

  /**
   * Add a new example
   */
  addExample(example: FewShotExample): FewShotTemplate {
    const newExamples = [...this.options.examples, example];
    return new FewShotTemplate({
      ...this.options,
      examples: newExamples
    });
  }

  /**
   * Remove an example by index
   */
  removeExample(index: number): FewShotTemplate {
    const newExamples = this.options.examples.filter((_, i) => i !== index);
    return new FewShotTemplate({
      ...this.options,
      examples: newExamples
    });
  }

  /**
   * Update an example by index
   */
  updateExample(index: number, example: FewShotExample): FewShotTemplate {
    const newExamples = [...this.options.examples];
    newExamples[index] = example;
    return new FewShotTemplate({
      ...this.options,
      examples: newExamples
    });
  }

  /**
   * Get all examples
   */
  getExamples(): FewShotExample[] {
    return [...this.options.examples];
  }

  /**
   * Set maximum number of examples to include
   */
  setMaxExamples(max: number): FewShotTemplate {
    return new FewShotTemplate({
      ...this.options,
      maxExamples: max
    });
  }

  /**
   * Create a template for common few-shot patterns
   */
  static createPattern(
    pattern: 'classification' | 'extraction' | 'transformation' | 'qa' | 'generation',
    task: string
  ): FewShotTemplate {
    const patterns = {
      classification: {
        task: `Classify the following ${task}`,
        examples: [
          {
            input: 'Example input 1',
            output: 'Category A',
            explanation: 'This belongs to Category A because...'
          },
          {
            input: 'Example input 2',
            output: 'Category B',
            explanation: 'This belongs to Category B because...'
          }
        ],
        inputFormat: 'Text to classify',
        outputFormat: 'Category name',
        instructions: 'Classify the input into the appropriate category based on the examples.'
      },
      extraction: {
        task: `Extract ${task} from the following text`,
        examples: [
          {
            input: 'Sample text with information to extract',
            output: 'Extracted information',
            explanation: 'The key information is...'
          }
        ],
        inputFormat: 'Text containing information',
        outputFormat: 'Extracted data',
        instructions: 'Extract the relevant information following the pattern shown in the examples.'
      },
      transformation: {
        task: `Transform the following ${task}`,
        examples: [
          {
            input: 'Original format',
            output: 'Transformed format',
            explanation: 'The transformation follows this pattern...'
          }
        ],
        inputFormat: 'Original format',
        outputFormat: 'Transformed format',
        instructions: 'Transform the input following the pattern demonstrated in the examples.'
      },
      qa: {
        task: `Answer questions about ${task}`,
        examples: [
          {
            input: 'Question about the topic',
            output: 'Detailed answer',
            explanation: 'This answer is correct because...'
          }
        ],
        inputFormat: 'Question',
        outputFormat: 'Answer',
        instructions: 'Answer the question following the style and depth shown in the examples.'
      },
      generation: {
        task: `Generate ${task}`,
        examples: [
          {
            input: 'Generation prompt or context',
            output: 'Generated content',
            explanation: 'This follows the required style and format...'
          }
        ],
        inputFormat: 'Generation context',
        outputFormat: 'Generated content',
        instructions: 'Generate content following the style and format shown in the examples.'
      }
    };

    return new FewShotTemplate(patterns[pattern]);
  }

  /**
   * Create a balanced few-shot template with diverse examples
   */
  static createBalanced(
    task: string,
    examples: FewShotExample[],
    options?: Partial<FewShotOptions>
  ): FewShotTemplate {
    // Ensure examples are diverse and balanced
    const balancedExamples = this.balanceExamples(examples);
    
    return new FewShotTemplate({
      task,
      examples: balancedExamples,
      instructions: 'Follow the pattern demonstrated in the examples, maintaining consistency in style and format.',
      ...options
    });
  }

  private static balanceExamples(examples: FewShotExample[]): FewShotExample[] {
    // Simple balancing - could be enhanced with more sophisticated logic
    // For now, just ensure we don't have too many similar examples
    const balanced: FewShotExample[] = [];
    const seen = new Set<string>();
    
    for (const example of examples) {
      const key = example.output.toLowerCase().trim();
      if (!seen.has(key) || balanced.length < 2) {
        balanced.push(example);
        seen.add(key);
      }
    }
    
    return balanced;
  }

  private buildTemplate(): PromptTemplate {
    let templateStr = '';
    
    // Add task description
    templateStr += `Task: ${this.options.task}\n\n`;
    
    // Add instructions if provided
    if (this.options.instructions) {
      templateStr += `Instructions: ${this.options.instructions}\n\n`;
    }
    
    // Add input/output format if provided
    if (this.options.inputFormat || this.options.outputFormat) {
      templateStr += 'Format:\n';
      if (this.options.inputFormat) {
        templateStr += `Input: ${this.options.inputFormat}\n`;
      }
      if (this.options.outputFormat) {
        templateStr += `Output: ${this.options.outputFormat}\n`;
      }
      templateStr += '\n';
    }
    
    // Add examples
    templateStr += 'Examples:\n\n';
    
    const maxExamples = this.options.maxExamples || 5;
    const examplestoShow = this.options.examples.slice(0, maxExamples);
    
    examplestoShow.forEach((example, index) => {
      templateStr += `Example ${index + 1}:\n`;
      templateStr += `Input: ${example.input}\n`;
      templateStr += `Output: ${example.output}\n`;
      
      if (example.explanation) {
        templateStr += `Explanation: ${example.explanation}\n`;
      }
      
      templateStr += '\n';
    });
    
    // Add the actual input to process
    templateStr += 'Now apply the same pattern to:\n';
    templateStr += 'Input: {input}\n';
    templateStr += 'Output:';
    
    return new PromptTemplate({
      template: templateStr,
      preserveWhitespace: true
    });
  }
}

/**
 * Utility function to create a quick few-shot prompt
 */
export function createFewShot(
  task: string,
  examples: Array<{ input: string; output: string; explanation?: string }>,
  input: string,
  options?: Partial<FewShotOptions>
): FewShotResult {
  const fewShot = new FewShotTemplate({
    task,
    examples,
    ...options
  });
  
  return fewShot.generate(input);
}

/**
 * Create few-shot examples from a dataset
 */
export function createExamplesFromData(
  data: Array<{ input: any; output: any }>,
  maxExamples: number = 5
): FewShotExample[] {
  return data.slice(0, maxExamples).map(item => ({
    input: typeof item.input === 'string' ? item.input : JSON.stringify(item.input),
    output: typeof item.output === 'string' ? item.output : JSON.stringify(item.output)
  }));
}
