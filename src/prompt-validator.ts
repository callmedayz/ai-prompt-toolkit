import { ValidationResult, SupportedModel } from './types';
import { TokenCounter } from './token-counter';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Prompt validation utility for AI applications
 */
export class PromptValidator {
  private static readonly COMMON_ISSUES = {
    TOO_LONG: 'Prompt exceeds recommended token limit',
    TOO_SHORT: 'Prompt may be too short to be effective',
    UNCLEAR_INSTRUCTIONS: 'Instructions may be unclear or ambiguous',
    MISSING_CONTEXT: 'Prompt may lack necessary context',
    REPETITIVE: 'Prompt contains repetitive content',
    POOR_FORMATTING: 'Prompt formatting could be improved',
    VAGUE_LANGUAGE: 'Language is too vague or imprecise',
    CONFLICTING_INSTRUCTIONS: 'Instructions may conflict with each other'
  };

  /**
   * Validate a prompt for quality and effectiveness
   */
  static validate(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check token count
    const tokenResult = TokenCounter.estimateTokens(prompt, model);
    const modelConfig = TokenCounter.getModelConfig(model);

    if (tokenResult.tokens > modelConfig.maxTokens * 0.9) {
      errors.push(`${this.COMMON_ISSUES.TOO_LONG}: ${tokenResult.tokens}/${modelConfig.maxTokens} tokens`);
    } else if (tokenResult.tokens > modelConfig.maxTokens * 0.7) {
      warnings.push(`Prompt uses ${Math.round((tokenResult.tokens / modelConfig.maxTokens) * 100)}% of token limit`);
    }

    if (tokenResult.tokens < 10) {
      warnings.push(this.COMMON_ISSUES.TOO_SHORT);
      suggestions.push('Consider adding more context or specific instructions');
    }

    // Check for clarity issues
    this.checkClarity(prompt, warnings, suggestions);
    
    // Check for formatting issues
    this.checkFormatting(prompt, warnings, suggestions);
    
    // Check for repetition
    this.checkRepetition(prompt, warnings, suggestions);
    
    // Check for conflicting instructions
    this.checkConflicts(prompt, warnings, suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Check prompt clarity
   */
  private static checkClarity(prompt: string, warnings: string[], suggestions: string[]): void {
    const vaguePhrases = [
      'somehow', 'maybe', 'perhaps', 'kind of', 'sort of', 
      'I think', 'probably', 'might be', 'could be'
    ];
    
    const foundVague = vaguePhrases.filter(phrase => 
      prompt.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (foundVague.length > 0) {
      warnings.push(`${this.COMMON_ISSUES.VAGUE_LANGUAGE}: Found vague phrases: ${foundVague.join(', ')}`);
      suggestions.push('Use more specific and direct language');
    }

    // Check for question marks (might indicate unclear instructions)
    const questionCount = (prompt.match(/\?/g) || []).length;
    if (questionCount > 3) {
      warnings.push('Multiple questions detected - consider consolidating or clarifying');
      suggestions.push('Restructure as clear statements or separate prompts');
    }
  }

  /**
   * Check prompt formatting
   */
  private static checkFormatting(prompt: string, warnings: string[], suggestions: string[]): void {
    // Check for very long lines
    const lines = prompt.split('\n');
    const longLines = lines.filter(line => line.length > 200);
    
    if (longLines.length > 0) {
      warnings.push(`${this.COMMON_ISSUES.POOR_FORMATTING}: ${longLines.length} very long lines detected`);
      suggestions.push('Break long lines into shorter, more readable segments');
    }

    // Check for lack of structure
    if (prompt.length > 500 && !prompt.includes('\n') && !prompt.includes('.')) {
      warnings.push('Long prompt lacks structure (no line breaks or sentences)');
      suggestions.push('Add line breaks, bullet points, or numbered lists for better structure');
    }

    // Check for excessive whitespace
    if (prompt.includes('  ') || prompt.includes('\n\n\n')) {
      warnings.push('Excessive whitespace detected');
      suggestions.push('Clean up extra spaces and line breaks');
    }
  }

  /**
   * Check for repetitive content
   */
  private static checkRepetition(prompt: string, warnings: string[], suggestions: string[]): void {
    const words = prompt.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3) { // Only check words longer than 3 characters
        wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
      }
    });

    const repetitiveWords = Object.entries(wordCount)
      .filter(([word, count]) => count > 3 && word.length > 4)
      .map(([word, count]) => `"${word}" (${count} times)`);

    if (repetitiveWords.length > 0) {
      warnings.push(`${this.COMMON_ISSUES.REPETITIVE}: ${repetitiveWords.join(', ')}`);
      suggestions.push('Vary your language and avoid excessive repetition');
    }
  }

  /**
   * Check for conflicting instructions
   */
  private static checkConflicts(prompt: string, warnings: string[], suggestions: string[]): void {
    const conflictPairs = [
      ['brief', 'detailed'],
      ['short', 'comprehensive'],
      ['simple', 'complex'],
      ['formal', 'casual'],
      ['technical', 'simple']
    ];

    const foundConflicts: string[] = [];
    
    conflictPairs.forEach(([word1, word2]) => {
      if (prompt.toLowerCase().includes(word1) && prompt.toLowerCase().includes(word2)) {
        foundConflicts.push(`${word1} vs ${word2}`);
      }
    });

    if (foundConflicts.length > 0) {
      warnings.push(`${this.COMMON_ISSUES.CONFLICTING_INSTRUCTIONS}: ${foundConflicts.join(', ')}`);
      suggestions.push('Clarify conflicting requirements or prioritize one approach');
    }
  }

  /**
   * Get prompt quality score (0-100)
   */
  static getQualityScore(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): number {
    const validation = this.validate(prompt, model);
    
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= validation.errors.length * 20;
    score -= validation.warnings.length * 5;
    
    // Bonus for good length
    const tokenResult = TokenCounter.estimateTokens(prompt, model);
    if (tokenResult.tokens >= 20 && tokenResult.tokens <= 1000) {
      score += 10;
    }
    
    // Bonus for good structure
    if (prompt.includes('\n') || prompt.includes('- ') || prompt.includes('1.')) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}
