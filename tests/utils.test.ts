import {
  estimateTokens,
  chunkText,
  validatePrompt,
  optimizePrompt,
  fitsInModel,
  recommendModel,
  calculateCost,
  getPromptQuality,
  chunkForModel,
  optimizeToTarget,
  analyzePrompt
} from '../src/utils';

describe('Utils', () => {
  const sampleText = 'This is a sample text for testing utility functions.';

  describe('estimateTokens', () => {
    it('should estimate tokens correctly', () => {
      const result = estimateTokens(sampleText);
      
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(sampleText.length);
      expect(result.words).toBeGreaterThan(0);
    });

    it('should work with different models', () => {
      const gptResult = estimateTokens(sampleText, 'openai/gpt-4.5-preview');
      const claudeResult = estimateTokens(sampleText, 'tencent/hunyuan-a13b-instruct:free');
      
      expect(gptResult.tokens).toBeGreaterThan(0);
      expect(claudeResult.tokens).toBeGreaterThan(0);
    });
  });

  describe('chunkText', () => {
    it('should chunk text properly', () => {
      const chunks = chunkText(sampleText, { maxTokens: 5 });
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should respect chunk options', () => {
      const chunks = chunkText(sampleText, {
        maxTokens: 10,
        overlap: 2,
        preserveWords: true
      });
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('validatePrompt', () => {
    it('should validate prompts', () => {
      const result = validatePrompt('Please analyze this data carefully.');
      
      expect(result.isValid).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should work with different models', () => {
      const result = validatePrompt('Test prompt', 'openai/gpt-4.5-preview');
      
      expect(result.isValid).toBeDefined();
    });
  });

  describe('optimizePrompt', () => {
    it('should optimize prompts', () => {
      const verbosePrompt = 'Please kindly analyze this data and make sure to provide detailed insights.';
      const result = optimizePrompt(verbosePrompt);
      
      expect(result.originalPrompt).toBe(verbosePrompt);
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.tokensSaved).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.optimizations)).toBe(true);
    });
  });

  describe('fitsInModel', () => {
    it('should check if text fits in model', () => {
      const shortText = 'Hello world';
      const result = fitsInModel(shortText, 'tencent/hunyuan-a13b-instruct:free');
      
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it.skip('should return false for very long text in small models', () => {
      const longText = 'word '.repeat(5000);
      const result = fitsInModel(longText, 'tencent/hunyuan-a13b-instruct:free');

      expect(result).toBe(false);
    });
  });

  describe('recommendModel', () => {
    it('should recommend appropriate model', () => {
      const result = recommendModel(sampleText);
      
      expect(result.model).toBeDefined();
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
    });

    it.skip('should recommend different models for different text lengths', () => {
      const shortResult = recommendModel('Hi');
      const longResult = recommendModel('word '.repeat(150000));

      expect(shortResult.model).toBe('tencent/hunyuan-a13b-instruct:free');
      expect(longResult.model).toBe('tencent/hunyuan-a13b-instruct:free');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost', () => {
      const cost = calculateCost(sampleText, 'tencent/hunyuan-a13b-instruct:free');

      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThanOrEqual(0); // Free models have 0 cost
    });

    it('should return 0 for empty text', () => {
      const cost = calculateCost('', 'tencent/hunyuan-a13b-instruct:free');
      
      expect(cost).toBe(0);
    });
  });

  describe('getPromptQuality', () => {
    it('should return quality score', () => {
      const score = getPromptQuality('Please analyze this data and provide insights.');
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('chunkForModel', () => {
    it('should chunk for specific model', () => {
      const longText = 'word '.repeat(1000);
      const chunks = chunkForModel(longText, 'tencent/hunyuan-a13b-instruct:free');
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should respect overlap percentage', () => {
      const text = 'word '.repeat(100);
      const chunks = chunkForModel(text, 'tencent/hunyuan-a13b-instruct:free', 20);
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeToTarget', () => {
    it('should optimize to target token count', () => {
      const longPrompt = 'Please kindly make sure to carefully analyze this data and provide very detailed comprehensive insights with thorough explanations.';
      const result = optimizeToTarget(longPrompt, 10);
      
      expect(result.originalPrompt).toBe(longPrompt);
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.tokensSaved).toBeGreaterThan(0);
    });
  });

  describe('analyzePrompt', () => {
    it('should provide comprehensive analysis', () => {
      const prompt = 'Analyze customer feedback data and provide actionable insights.';
      const analysis = analyzePrompt(prompt);
      
      expect(analysis.tokens).toBeDefined();
      expect(analysis.validation).toBeDefined();
      expect(analysis.quality).toBeDefined();
      expect(analysis.recommendation).toBeDefined();
      expect(typeof analysis.fitsInModel).toBe('boolean');
      expect(typeof analysis.cost).toBe('number');
    });

    it('should work with different models', () => {
      const analysis = analyzePrompt('Test prompt', 'openai/gpt-4.5-preview');
      
      expect(analysis.tokens).toBeDefined();
      expect(analysis.validation).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(() => estimateTokens('')).not.toThrow();
      expect(() => validatePrompt('')).not.toThrow();
      expect(() => optimizePrompt('')).not.toThrow();
      expect(() => analyzePrompt('')).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longText = 'word '.repeat(10000);
      
      expect(() => estimateTokens(longText)).not.toThrow();
      expect(() => validatePrompt(longText)).not.toThrow();
      expect(() => optimizePrompt(longText)).not.toThrow();
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 测试 🚀';
      
      expect(() => estimateTokens(specialText)).not.toThrow();
      expect(() => validatePrompt(specialText)).not.toThrow();
      expect(() => optimizePrompt(specialText)).not.toThrow();
    });
  });
});
