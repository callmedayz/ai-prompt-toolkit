import { PromptTemplate } from './prompt-template';
import { 
  ChainOfThoughtOptions, 
  ChainOfThoughtResult, 
  ChainOfThoughtStep 
} from './types';
import { estimateTokens } from './utils';

/**
 * Chain-of-Thought Prompt Template System
 * Creates structured prompts that guide AI models through step-by-step reasoning
 */
export class ChainOfThoughtTemplate {
  private options: ChainOfThoughtOptions;
  private template: PromptTemplate;

  constructor(options: ChainOfThoughtOptions) {
    this.options = options;
    this.template = this.buildTemplate();
  }

  /**
   * Generate the chain-of-thought prompt
   */
  generate(variables?: Record<string, any>): ChainOfThoughtResult {
    const prompt = this.template.render(variables);
    const tokenEstimate = estimateTokens(prompt, 'tencent/hunyuan-a13b-instruct:free').tokens;
    
    return {
      prompt,
      stepCount: this.options.steps.length,
      estimatedTokens: tokenEstimate,
      complexity: this.determineComplexity()
    };
  }

  /**
   * Add a new step to the chain
   */
  addStep(step: ChainOfThoughtStep): ChainOfThoughtTemplate {
    const newSteps = [...this.options.steps, step];
    return new ChainOfThoughtTemplate({
      ...this.options,
      steps: newSteps
    });
  }

  /**
   * Remove a step by ID
   */
  removeStep(stepId: string): ChainOfThoughtTemplate {
    const newSteps = this.options.steps.filter(step => step.id !== stepId);
    return new ChainOfThoughtTemplate({
      ...this.options,
      steps: newSteps
    });
  }

  /**
   * Update a specific step
   */
  updateStep(stepId: string, updates: Partial<ChainOfThoughtStep>): ChainOfThoughtTemplate {
    const newSteps = this.options.steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    );
    return new ChainOfThoughtTemplate({
      ...this.options,
      steps: newSteps
    });
  }

  /**
   * Get all steps
   */
  getSteps(): ChainOfThoughtStep[] {
    return [...this.options.steps];
  }

  /**
   * Create a template for common reasoning patterns
   */
  static createPattern(pattern: 'problem-solving' | 'analysis' | 'decision-making' | 'creative'): ChainOfThoughtTemplate {
    const patterns = {
      'problem-solving': {
        problem: 'Solve the given problem systematically',
        steps: [
          {
            id: 'understand',
            title: 'Understanding the Problem',
            instruction: 'First, let me clearly understand what we\'re trying to solve. I\'ll identify the key components and constraints.'
          },
          {
            id: 'analyze',
            title: 'Analysis and Breakdown',
            instruction: 'Next, I\'ll break down the problem into smaller, manageable parts and identify the relationships between them.'
          },
          {
            id: 'approach',
            title: 'Solution Approach',
            instruction: 'Now I\'ll develop a systematic approach to solve each part of the problem.'
          },
          {
            id: 'implement',
            title: 'Implementation',
            instruction: 'I\'ll work through the solution step by step, showing my reasoning at each stage.'
          },
          {
            id: 'verify',
            title: 'Verification',
            instruction: 'Finally, I\'ll verify the solution and check if it addresses the original problem completely.'
          }
        ]
      },
      'analysis': {
        problem: 'Analyze the given subject thoroughly',
        steps: [
          {
            id: 'observe',
            title: 'Observation',
            instruction: 'I\'ll start by carefully observing and gathering all relevant information.'
          },
          {
            id: 'categorize',
            title: 'Categorization',
            instruction: 'Next, I\'ll organize the information into meaningful categories and patterns.'
          },
          {
            id: 'evaluate',
            title: 'Evaluation',
            instruction: 'I\'ll evaluate the significance and implications of each category.'
          },
          {
            id: 'synthesize',
            title: 'Synthesis',
            instruction: 'Finally, I\'ll synthesize my findings into a comprehensive analysis.'
          }
        ]
      },
      'decision-making': {
        problem: 'Make an informed decision based on available information',
        steps: [
          {
            id: 'define',
            title: 'Define the Decision',
            instruction: 'I\'ll clearly define what decision needs to be made and why it\'s important.'
          },
          {
            id: 'options',
            title: 'Identify Options',
            instruction: 'I\'ll identify all possible options and alternatives available.'
          },
          {
            id: 'criteria',
            title: 'Evaluation Criteria',
            instruction: 'I\'ll establish clear criteria for evaluating each option.'
          },
          {
            id: 'compare',
            title: 'Compare Options',
            instruction: 'I\'ll systematically compare each option against the criteria.'
          },
          {
            id: 'recommend',
            title: 'Recommendation',
            instruction: 'Based on my analysis, I\'ll make a recommendation with clear reasoning.'
          }
        ]
      },
      'creative': {
        problem: 'Approach the creative challenge with innovative thinking',
        steps: [
          {
            id: 'explore',
            title: 'Exploration',
            instruction: 'I\'ll explore the challenge from multiple angles and perspectives.'
          },
          {
            id: 'ideate',
            title: 'Ideation',
            instruction: 'I\'ll generate multiple creative ideas without judgment.'
          },
          {
            id: 'develop',
            title: 'Development',
            instruction: 'I\'ll develop the most promising ideas further.'
          },
          {
            id: 'refine',
            title: 'Refinement',
            instruction: 'I\'ll refine and improve the selected ideas.'
          }
        ]
      }
    };

    return new ChainOfThoughtTemplate(patterns[pattern]);
  }

  private buildTemplate(): PromptTemplate {
    const { reasoningStyle = 'step-by-step' } = this.options;
    
    let templateStr = '';
    
    // Add context if provided
    if (this.options.context) {
      templateStr += `Context: ${this.options.context}\n\n`;
    }
    
    // Add problem statement
    templateStr += `Problem: ${this.options.problem}\n\n`;
    
    // Add constraints if provided
    if (this.options.constraints && this.options.constraints.length > 0) {
      templateStr += `Constraints:\n${this.options.constraints.map(c => `- ${c}`).join('\n')}\n\n`;
    }
    
    // Add reasoning instruction based on style
    const reasoningInstructions = {
      'detailed': 'Let me work through this systematically with detailed reasoning at each step:',
      'concise': 'I\'ll solve this step by step with clear, concise reasoning:',
      'step-by-step': 'Let me break this down step by step:'
    };
    
    templateStr += `${reasoningInstructions[reasoningStyle]}\n\n`;
    
    // Add steps
    this.options.steps.forEach((step, index) => {
      templateStr += `**Step ${index + 1}: ${step.title}**\n`;
      templateStr += `${step.instruction}\n`;
      
      if (step.reasoning) {
        templateStr += `Reasoning: ${step.reasoning}\n`;
      }
      
      if (step.examples && step.examples.length > 0) {
        templateStr += `Examples: ${step.examples.join(', ')}\n`;
      }
      
      templateStr += '\n';
    });
    
    // Add expected output format if provided
    if (this.options.expectedOutput) {
      templateStr += `Expected Output Format: ${this.options.expectedOutput}\n\n`;
    }
    
    templateStr += 'Please work through each step carefully, showing your reasoning and thought process.';
    
    return new PromptTemplate({
      template: templateStr,
      preserveWhitespace: true
    });
  }

  private determineComplexity(): 'simple' | 'moderate' | 'complex' {
    const stepCount = this.options.steps.length;
    const hasConstraints = this.options.constraints && this.options.constraints.length > 0;
    const hasContext = !!this.options.context;
    
    if (stepCount <= 3 && !hasConstraints && !hasContext) {
      return 'simple';
    } else if (stepCount <= 5 && (!hasConstraints || !hasContext)) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }
}

/**
 * Utility function to create a quick chain-of-thought prompt
 */
export function createChainOfThought(
  problem: string, 
  steps: string[], 
  options?: Partial<ChainOfThoughtOptions>
): ChainOfThoughtResult {
  const chainSteps: ChainOfThoughtStep[] = steps.map((step, index) => ({
    id: `step_${index + 1}`,
    title: `Step ${index + 1}`,
    instruction: step
  }));
  
  const cot = new ChainOfThoughtTemplate({
    problem,
    steps: chainSteps,
    ...options
  });
  
  return cot.generate();
}
