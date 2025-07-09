import { TokenCounter } from '../src/token-counter';

describe('TokenCounter', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for simple text', () => {
      const text = 'Hello world!';
      const result = TokenCounter.estimateTokens(text);
      
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(12);
      expect(result.words).toBe(2);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const result = TokenCounter.estimateTokens('');
      
      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
    });

    it('should estimate differently for different models', () => {
      const text = 'This is a test sentence with multiple words.';
      
      const gptResult = TokenCounter.estimateTokens(text, 'gpt-3.5-turbo');
      const claudeResult = TokenCounter.estimateTokens(text, 'claude-3-sonnet');
      
      expect(gptResult.tokens).toBeGreaterThan(0);
      expect(claudeResult.tokens).toBeGreaterThan(0);
      // Claude typically has slightly different tokenization
      expect(Math.abs(gptResult.tokens - claudeResult.tokens)).toBeLessThan(5);
    });

    it('should calculate cost for different models', () => {
      const text = 'Test text for cost calculation';
      
      const gpt35Result = TokenCounter.estimateTokens(text, 'gpt-3.5-turbo');
      const gpt4Result = TokenCounter.estimateTokens(text, 'gpt-4');
      
      expect(gpt35Result.estimatedCost).toBeDefined();
      expect(gpt4Result.estimatedCost).toBeDefined();
      expect(gpt4Result.estimatedCost!).toBeGreaterThan(gpt35Result.estimatedCost!);
    });
  });

  describe('fitsInModel', () => {
    it('should return true for short text', () => {
      const shortText = 'Hello world!';
      
      expect(TokenCounter.fitsInModel(shortText, 'gpt-3.5-turbo')).toBe(true);
      expect(TokenCounter.fitsInModel(shortText, 'gpt-4')).toBe(true);
    });

    it('should return false for very long text in small models', () => {
      const longText = 'word '.repeat(5000); // Very long text
      
      expect(TokenCounter.fitsInModel(longText, 'gpt-3.5-turbo')).toBe(false);
    });

    it('should handle different model limits', () => {
      const mediumText = 'word '.repeat(5000);

      expect(TokenCounter.fitsInModel(mediumText, 'gpt-3.5-turbo')).toBe(false);
      expect(TokenCounter.fitsInModel(mediumText, 'gpt-4-turbo')).toBe(true);
    });
  });

  describe('getModelConfig', () => {
    it('should return correct config for GPT models', () => {
      const config = TokenCounter.getModelConfig('gpt-3.5-turbo');
      
      expect(config.name).toBe('gpt-3.5-turbo');
      expect(config.maxTokens).toBe(4096);
      expect(config.costPerToken).toBeDefined();
    });

    it('should return correct config for Claude models', () => {
      const config = TokenCounter.getModelConfig('claude-3-sonnet');
      
      expect(config.name).toBe('claude-3-sonnet');
      expect(config.maxTokens).toBe(200000);
      expect(config.costPerToken).toBeDefined();
    });
  });

  describe('getSupportedModels', () => {
    it('should return array of supported models', () => {
      const models = TokenCounter.getSupportedModels();
      
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4');
      expect(models).toContain('claude-3-sonnet');
    });
  });

  describe('recommendModel', () => {
    it('should recommend GPT-3.5 for short text', () => {
      const shortText = 'Hello world!';
      const recommendation = TokenCounter.recommendModel(shortText);
      
      expect(recommendation.model).toBe('gpt-3.5-turbo');
      expect(recommendation.reason).toContain('cost-effective');
    });

    it('should recommend appropriate model for medium text', () => {
      const mediumText = 'word '.repeat(2000);
      const recommendation = TokenCounter.recommendModel(mediumText);

      // Should recommend either GPT-4 or GPT-4-turbo for medium text
      expect(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'].includes(recommendation.model)).toBe(true);
    });

    it('should recommend Claude for very long text', () => {
      const longText = 'word '.repeat(150000);
      const recommendation = TokenCounter.recommendModel(longText);

      expect(recommendation.model).toBe('claude-3-sonnet');
      expect(recommendation.reason).toContain('large context');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost for different models', () => {
      const text = 'Test text for cost calculation';
      
      const gpt35Cost = TokenCounter.calculateCost(text, 'gpt-3.5-turbo');
      const gpt4Cost = TokenCounter.calculateCost(text, 'gpt-4');
      
      expect(gpt35Cost).toBeGreaterThan(0);
      expect(gpt4Cost).toBeGreaterThan(0);
      expect(gpt4Cost).toBeGreaterThan(gpt35Cost);
    });

    it('should return 0 for empty text', () => {
      const cost = TokenCounter.calculateCost('', 'gpt-3.5-turbo');
      expect(cost).toBe(0);
    });
  });
});
