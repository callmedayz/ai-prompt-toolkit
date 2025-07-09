import { ChainOfThoughtTemplate, createChainOfThought } from '../src/chain-of-thought';
import { ChainOfThoughtStep } from '../src/types';

describe('ChainOfThoughtTemplate', () => {
  describe('constructor', () => {
    it('should create a template with basic options', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      expect(template).toBeInstanceOf(ChainOfThoughtTemplate);
    });
  });

  describe('generate', () => {
    it('should generate a chain-of-thought prompt', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Solve a math problem',
        steps: [
          { id: 'understand', title: 'Understand', instruction: 'Read the problem carefully' },
          { id: 'solve', title: 'Solve', instruction: 'Apply mathematical operations' }
        ]
      });
      
      const result = template.generate();
      
      expect(result.prompt).toContain('Problem: Solve a math problem');
      expect(result.prompt).toContain('Step 1: Understand');
      expect(result.prompt).toContain('Step 2: Solve');
      expect(result.stepCount).toBe(2);
      expect(result.complexity).toBe('simple');
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('should include context when provided', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        context: 'This is a test context',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      const result = template.generate();
      expect(result.prompt).toContain('Context: This is a test context');
    });

    it('should include constraints when provided', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        constraints: ['Constraint 1', 'Constraint 2'],
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      const result = template.generate();
      expect(result.prompt).toContain('Constraints:');
      expect(result.prompt).toContain('- Constraint 1');
      expect(result.prompt).toContain('- Constraint 2');
    });

    it('should include step reasoning and examples', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            instruction: 'Do something',
            reasoning: 'This is why we do this',
            examples: ['Example 1', 'Example 2']
          }
        ]
      });
      
      const result = template.generate();
      expect(result.prompt).toContain('Reasoning: This is why we do this');
      expect(result.prompt).toContain('Examples: Example 1, Example 2');
    });
  });

  describe('step management', () => {
    let template: ChainOfThoughtTemplate;

    beforeEach(() => {
      template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'First step' },
          { id: 'step2', title: 'Step 2', instruction: 'Second step' }
        ]
      });
    });

    it('should add a new step', () => {
      const newStep: ChainOfThoughtStep = {
        id: 'step3',
        title: 'Step 3',
        instruction: 'Third step'
      };
      
      const newTemplate = template.addStep(newStep);
      const steps = newTemplate.getSteps();
      
      expect(steps).toHaveLength(3);
      expect(steps[2]).toEqual(newStep);
    });

    it('should remove a step by ID', () => {
      const newTemplate = template.removeStep('step1');
      const steps = newTemplate.getSteps();
      
      expect(steps).toHaveLength(1);
      expect(steps[0].id).toBe('step2');
    });

    it('should update a step', () => {
      const newTemplate = template.updateStep('step1', {
        title: 'Updated Step 1',
        instruction: 'Updated instruction'
      });
      
      const steps = newTemplate.getSteps();
      expect(steps[0].title).toBe('Updated Step 1');
      expect(steps[0].instruction).toBe('Updated instruction');
      expect(steps[0].id).toBe('step1'); // ID should remain unchanged
    });

    it('should get all steps', () => {
      const steps = template.getSteps();
      
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe('step1');
      expect(steps[1].id).toBe('step2');
    });
  });

  describe('createPattern', () => {
    it('should create a problem-solving pattern', () => {
      const template = ChainOfThoughtTemplate.createPattern('problem-solving');
      const result = template.generate();
      
      expect(result.stepCount).toBe(5);
      expect(result.prompt).toContain('Understanding the Problem');
      expect(result.prompt).toContain('Verification');
    });

    it('should create an analysis pattern', () => {
      const template = ChainOfThoughtTemplate.createPattern('analysis');
      const result = template.generate();
      
      expect(result.stepCount).toBe(4);
      expect(result.prompt).toContain('Observation');
      expect(result.prompt).toContain('Synthesis');
    });

    it('should create a decision-making pattern', () => {
      const template = ChainOfThoughtTemplate.createPattern('decision-making');
      const result = template.generate();
      
      expect(result.stepCount).toBe(5);
      expect(result.prompt).toContain('Define the Decision');
      expect(result.prompt).toContain('Recommendation');
    });

    it('should create a creative pattern', () => {
      const template = ChainOfThoughtTemplate.createPattern('creative');
      const result = template.generate();
      
      expect(result.stepCount).toBe(4);
      expect(result.prompt).toContain('Exploration');
      expect(result.prompt).toContain('Refinement');
    });
  });

  describe('complexity determination', () => {
    it('should determine simple complexity', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Simple problem',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      const result = template.generate();
      expect(result.complexity).toBe('simple');
    });

    it('should determine moderate complexity', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Moderate problem',
        context: 'Some context',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' },
          { id: 'step2', title: 'Step 2', instruction: 'Do something else' },
          { id: 'step3', title: 'Step 3', instruction: 'Do another thing' },
          { id: 'step4', title: 'Step 4', instruction: 'Final step' }
        ]
      });
      
      const result = template.generate();
      expect(result.complexity).toBe('moderate');
    });

    it('should determine complex complexity', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Complex problem',
        context: 'Detailed context',
        constraints: ['Constraint 1', 'Constraint 2'],
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' },
          { id: 'step2', title: 'Step 2', instruction: 'Do something else' },
          { id: 'step3', title: 'Step 3', instruction: 'Do another thing' },
          { id: 'step4', title: 'Step 4', instruction: 'Do more' },
          { id: 'step5', title: 'Step 5', instruction: 'Do even more' },
          { id: 'step6', title: 'Step 6', instruction: 'Final step' }
        ]
      });
      
      const result = template.generate();
      expect(result.complexity).toBe('complex');
    });
  });

  describe('reasoning styles', () => {
    it('should use detailed reasoning style', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        reasoningStyle: 'detailed',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      const result = template.generate();
      expect(result.prompt).toContain('systematically with detailed reasoning');
    });

    it('should use concise reasoning style', () => {
      const template = new ChainOfThoughtTemplate({
        problem: 'Test problem',
        reasoningStyle: 'concise',
        steps: [
          { id: 'step1', title: 'Step 1', instruction: 'Do something' }
        ]
      });
      
      const result = template.generate();
      expect(result.prompt).toContain('clear, concise reasoning');
    });
  });
});

describe('createChainOfThought utility', () => {
  it('should create a quick chain-of-thought prompt', () => {
    const result = createChainOfThought(
      'Solve a puzzle',
      ['Understand the puzzle', 'Find patterns', 'Apply logic'],
      { reasoningStyle: 'step-by-step' }
    );
    
    expect(result.prompt).toContain('Problem: Solve a puzzle');
    expect(result.prompt).toContain('Step 1: Step 1');
    expect(result.prompt).toContain('Understand the puzzle');
    expect(result.stepCount).toBe(3);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});
