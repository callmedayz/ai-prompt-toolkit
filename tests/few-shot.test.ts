import { FewShotTemplate, createFewShot, createExamplesFromData } from '../src/few-shot';
import { FewShotExample } from '../src/types';

describe('FewShotTemplate', () => {
  describe('constructor', () => {
    it('should create a template with basic options', () => {
      const template = new FewShotTemplate({
        task: 'Test classification',
        examples: [
          { input: 'test input', output: 'test output' }
        ]
      });
      
      expect(template).toBeInstanceOf(FewShotTemplate);
    });

    it('should set default maxExamples to 5', () => {
      const examples = Array.from({ length: 10 }, (_, i) => ({
        input: `input ${i}`,
        output: `output ${i}`
      }));
      
      const template = new FewShotTemplate({
        task: 'Test task',
        examples
      });
      
      const result = template.generate('test input');
      expect(result.exampleCount).toBe(5);
    });
  });

  describe('generate', () => {
    it('should generate a few-shot prompt', () => {
      const template = new FewShotTemplate({
        task: 'Classify sentiment',
        examples: [
          { input: 'I love this!', output: 'positive' },
          { input: 'This is terrible', output: 'negative' }
        ]
      });
      
      const result = template.generate('This is okay');
      
      expect(result.prompt).toContain('Task: Classify sentiment');
      expect(result.prompt).toContain('Example 1:');
      expect(result.prompt).toContain('Input: I love this!');
      expect(result.prompt).toContain('Output: positive');
      expect(result.prompt).toContain('Input: This is okay');
      expect(result.exampleCount).toBe(2);
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('should include instructions when provided', () => {
      const template = new FewShotTemplate({
        task: 'Test task',
        instructions: 'Follow the pattern carefully',
        examples: [
          { input: 'test', output: 'result' }
        ]
      });
      
      const result = template.generate('input');
      expect(result.prompt).toContain('Instructions: Follow the pattern carefully');
    });

    it('should include input/output format when provided', () => {
      const template = new FewShotTemplate({
        task: 'Test task',
        inputFormat: 'Text string',
        outputFormat: 'Category label',
        examples: [
          { input: 'test', output: 'result' }
        ]
      });
      
      const result = template.generate('input');
      expect(result.prompt).toContain('Format:');
      expect(result.prompt).toContain('Input: Text string');
      expect(result.prompt).toContain('Output: Category label');
    });

    it('should include explanations when provided', () => {
      const template = new FewShotTemplate({
        task: 'Test task',
        examples: [
          {
            input: 'test input',
            output: 'test output',
            explanation: 'This is why this output is correct'
          }
        ]
      });
      
      const result = template.generate('input');
      expect(result.prompt).toContain('Explanation: This is why this output is correct');
    });

    it('should respect maxExamples limit', () => {
      const examples = Array.from({ length: 10 }, (_, i) => ({
        input: `input ${i}`,
        output: `output ${i}`
      }));
      
      const template = new FewShotTemplate({
        task: 'Test task',
        examples,
        maxExamples: 3
      });
      
      const result = template.generate('test');
      expect(result.exampleCount).toBe(3);
      expect(result.prompt).toContain('Example 1:');
      expect(result.prompt).toContain('Example 3:');
      expect(result.prompt).not.toContain('Example 4:');
    });
  });

  describe('example management', () => {
    let template: FewShotTemplate;

    beforeEach(() => {
      template = new FewShotTemplate({
        task: 'Test task',
        examples: [
          { input: 'input1', output: 'output1' },
          { input: 'input2', output: 'output2' }
        ]
      });
    });

    it('should add a new example', () => {
      const newExample: FewShotExample = {
        input: 'input3',
        output: 'output3',
        explanation: 'test explanation'
      };
      
      const newTemplate = template.addExample(newExample);
      const examples = newTemplate.getExamples();
      
      expect(examples).toHaveLength(3);
      expect(examples[2]).toEqual(newExample);
    });

    it('should remove an example by index', () => {
      const newTemplate = template.removeExample(0);
      const examples = newTemplate.getExamples();
      
      expect(examples).toHaveLength(1);
      expect(examples[0].input).toBe('input2');
    });

    it('should update an example by index', () => {
      const updatedExample: FewShotExample = {
        input: 'updated input',
        output: 'updated output'
      };
      
      const newTemplate = template.updateExample(0, updatedExample);
      const examples = newTemplate.getExamples();
      
      expect(examples[0]).toEqual(updatedExample);
      expect(examples[1].input).toBe('input2'); // Second example unchanged
    });

    it('should get all examples', () => {
      const examples = template.getExamples();
      
      expect(examples).toHaveLength(2);
      expect(examples[0].input).toBe('input1');
      expect(examples[1].input).toBe('input2');
    });

    it('should set max examples', () => {
      const newTemplate = template.setMaxExamples(1);
      const result = newTemplate.generate('test');
      
      expect(result.exampleCount).toBe(1);
    });
  });

  describe('createPattern', () => {
    it('should create a classification pattern', () => {
      const template = FewShotTemplate.createPattern('classification', 'documents');
      const result = template.generate('test document');
      
      expect(result.prompt).toContain('Classify the following documents');
      expect(result.exampleCount).toBeGreaterThan(0);
    });

    it('should create an extraction pattern', () => {
      const template = FewShotTemplate.createPattern('extraction', 'contact info');
      const result = template.generate('test text');
      
      expect(result.prompt).toContain('Extract contact info from the following text');
    });

    it('should create a transformation pattern', () => {
      const template = FewShotTemplate.createPattern('transformation', 'data format');
      const result = template.generate('test data');
      
      expect(result.prompt).toContain('Transform the following data format');
    });

    it('should create a QA pattern', () => {
      const template = FewShotTemplate.createPattern('qa', 'technical topics');
      const result = template.generate('test question');
      
      expect(result.prompt).toContain('Answer questions about technical topics');
    });

    it('should create a generation pattern', () => {
      const template = FewShotTemplate.createPattern('generation', 'creative content');
      const result = template.generate('test prompt');
      
      expect(result.prompt).toContain('Generate creative content');
    });
  });

  describe('createBalanced', () => {
    it('should create a balanced template', () => {
      const examples = [
        { input: 'positive1', output: 'positive' },
        { input: 'positive2', output: 'positive' },
        { input: 'negative1', output: 'negative' },
        { input: 'neutral1', output: 'neutral' }
      ];
      
      const template = FewShotTemplate.createBalanced('sentiment analysis', examples);
      const result = template.generate('test input');
      
      expect(result.prompt).toContain('sentiment analysis');
      expect(result.exampleCount).toBeGreaterThan(0);
    });
  });
});

describe('createFewShot utility', () => {
  it('should create a quick few-shot prompt', () => {
    const examples = [
      { input: 'happy text', output: 'positive' },
      { input: 'sad text', output: 'negative' }
    ];
    
    const result = createFewShot(
      'Analyze sentiment',
      examples,
      'neutral text',
      { instructions: 'Classify as positive, negative, or neutral' }
    );
    
    expect(result.prompt).toContain('Task: Analyze sentiment');
    expect(result.prompt).toContain('happy text');
    expect(result.prompt).toContain('neutral text');
    expect(result.exampleCount).toBe(2);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});

describe('createExamplesFromData utility', () => {
  it('should create examples from data array', () => {
    const data = [
      { input: 'text1', output: 'label1' },
      { input: 'text2', output: 'label2' },
      { input: 'text3', output: 'label3' }
    ];
    
    const examples = createExamplesFromData(data, 2);
    
    expect(examples).toHaveLength(2);
    expect(examples[0].input).toBe('text1');
    expect(examples[0].output).toBe('label1');
    expect(examples[1].input).toBe('text2');
    expect(examples[1].output).toBe('label2');
  });

  it('should handle object inputs and outputs', () => {
    const data = [
      { input: { text: 'hello' }, output: { sentiment: 'positive' } }
    ];
    
    const examples = createExamplesFromData(data);
    
    expect(examples).toHaveLength(1);
    expect(examples[0].input).toBe('{"text":"hello"}');
    expect(examples[0].output).toBe('{"sentiment":"positive"}');
  });

  it('should respect maxExamples parameter', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      input: `input${i}`,
      output: `output${i}`
    }));
    
    const examples = createExamplesFromData(data, 3);
    
    expect(examples).toHaveLength(3);
  });
});
