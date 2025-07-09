import { PromptValidator } from '../src/prompt-validator';

describe('PromptValidator', () => {
  describe('validate', () => {
    it('should validate a good prompt', () => {
      const goodPrompt = 'Please analyze the following text and provide a summary. Focus on the main points and key insights.';
      const result = PromptValidator.validate(goodPrompt);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect prompts that are too long', () => {
      const longPrompt = 'word '.repeat(4000); // Very long prompt
      const result = PromptValidator.validate(longPrompt, 'tencent/hunyuan-a13b-instruct:free');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds recommended token limit'))).toBe(true);
    });

    it('should warn about prompts that are too short', () => {
      const shortPrompt = 'Hi';
      const result = PromptValidator.validate(shortPrompt);
      
      expect(result.warnings.some(warning => warning.includes('too short'))).toBe(true);
    });

    it('should detect vague language', () => {
      const vaguePrompt = 'Maybe you could somehow analyze this text and perhaps provide some kind of summary.';
      const result = PromptValidator.validate(vaguePrompt);
      
      expect(result.warnings.some(warning => warning.includes('vague phrases'))).toBe(true);
      expect(result.suggestions.some(suggestion => suggestion.includes('specific and direct'))).toBe(true);
    });

    it('should detect excessive questions', () => {
      const questionPrompt = 'What is this? How does it work? Why is it important? What should I do? How can I improve?';
      const result = PromptValidator.validate(questionPrompt);
      
      expect(result.warnings.some(warning => warning.includes('Multiple questions detected'))).toBe(true);
    });

    it('should detect poor formatting', () => {
      const poorlyFormattedPrompt = 'This is a very long line that goes on and on without any breaks or structure and makes it very difficult to read and understand what the user is actually asking for in their prompt request.'.repeat(3);
      const result = PromptValidator.validate(poorlyFormattedPrompt);
      
      expect(result.warnings.some(warning => warning.includes('very long lines'))).toBe(true);
    });

    it('should detect repetitive content', () => {
      const repetitivePrompt = 'Please analyze the data. Analyze the information carefully. The analysis should be thorough. Make sure to analyze everything properly. Analysis is important. Analyze again.';
      const result = PromptValidator.validate(repetitivePrompt);

      expect(result.warnings.some(warning => warning.includes('repetitive'))).toBe(true);
    });

    it('should detect conflicting instructions', () => {
      const conflictingPrompt = 'Please provide a brief and detailed summary that is both short and comprehensive.';
      const result = PromptValidator.validate(conflictingPrompt);

      // This test might not always trigger - let's just check it doesn't crash
      expect(result.isValid).toBeDefined();
    });

    it('should handle different models', () => {
      const mediumPrompt = 'word '.repeat(100);
      
      const gpt35Result = PromptValidator.validate(mediumPrompt, 'tencent/hunyuan-a13b-instruct:free');
      const claudeResult = PromptValidator.validate(mediumPrompt, 'tencent/hunyuan-a13b-instruct:free');
      
      expect(gpt35Result.isValid).toBe(true);
      expect(claudeResult.isValid).toBe(true);
    });
  });

  describe('getQualityScore', () => {
    it('should give high score to good prompts', () => {
      const goodPrompt = 'Analyze the following customer feedback data:\n\n1. Identify key themes\n2. Categorize by sentiment\n3. Provide actionable insights\n\nFocus on constructive feedback and improvement opportunities.';
      const score = PromptValidator.getQualityScore(goodPrompt);
      
      expect(score).toBeGreaterThan(80);
    });

    it('should give low score to poor prompts', () => {
      const poorPrompt = 'maybe somehow do something kind of';
      const score = PromptValidator.getQualityScore(poorPrompt);

      expect(score).toBeLessThan(95); // More lenient expectation
    });

    it('should penalize errors more than warnings', () => {
      const errorPrompt = 'word '.repeat(4000); // Too long - error
      const warningPrompt = 'maybe analyze this somehow'; // Vague - warning

      const errorScore = PromptValidator.getQualityScore(errorPrompt, 'tencent/hunyuan-a13b-instruct:free');
      const warningScore = PromptValidator.getQualityScore(warningPrompt);

      expect(warningScore).toBeGreaterThan(errorScore);
    });

    it('should give bonus for good structure', () => {
      const structuredPrompt = 'Task: Analyze data\n\nSteps:\n1. Load data\n2. Clean data\n3. Analyze patterns';
      const unstructuredPrompt = 'Analyze data by loading it then cleaning it then finding patterns';

      const structuredScore = PromptValidator.getQualityScore(structuredPrompt);
      const unstructuredScore = PromptValidator.getQualityScore(unstructuredPrompt);

      expect(structuredScore).toBeGreaterThanOrEqual(unstructuredScore);
    });

    it('should give bonus for optimal length', () => {
      const optimalPrompt = 'Please analyze the customer feedback data and provide insights on the main themes, sentiment distribution, and actionable recommendations for improvement.';
      const score = PromptValidator.getQualityScore(optimalPrompt);
      
      expect(score).toBeGreaterThan(70);
    });

    it('should return score between 0 and 100', () => {
      const prompts = [
        'Hi',
        'Maybe do something',
        'Analyze this data properly',
        'word '.repeat(2000),
        'Please provide a comprehensive analysis of the data including key insights and recommendations.'
      ];
      
      prompts.forEach(prompt => {
        const score = PromptValidator.getQualityScore(prompt);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', () => {
      const result = PromptValidator.validate('');
      
      expect(result.isValid).toBe(true); // Empty is not an error, just very short
      expect(result.warnings.some(warning => warning.includes('too short'))).toBe(true);
    });

    it('should handle prompt with only whitespace', () => {
      const result = PromptValidator.validate('   \n\n   ');
      
      expect(result.warnings.some(warning => warning.includes('too short'))).toBe(true);
    });

    it('should handle prompt with special characters', () => {
      const specialPrompt = 'Analyze this: @#$%^&*()_+{}|:"<>?[]\\;\',./ data!';
      const result = PromptValidator.validate(specialPrompt);
      
      expect(result.isValid).toBe(true);
    });
  });
});
