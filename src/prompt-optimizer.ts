import { OptimizationResult, SupportedModel } from './types';
import { TokenCounter } from './token-counter';
import { DEFAULT_FREE_MODEL } from './openrouter-types';

/**
 * Prompt optimization utility for reducing token usage while maintaining effectiveness
 */
export class PromptOptimizer {
  /**
   * Optimize a prompt to reduce token usage
   */
  static optimize(prompt: string, model: SupportedModel = DEFAULT_FREE_MODEL): OptimizationResult {
    const originalTokens = TokenCounter.estimateTokens(prompt, model).tokens;
    let optimizedPrompt = prompt;
    const optimizations: string[] = [];

    // Apply various optimization techniques
    optimizedPrompt = this.removeRedundantWords(optimizedPrompt, optimizations);
    optimizedPrompt = this.simplifyLanguage(optimizedPrompt, optimizations);
    optimizedPrompt = this.compressWhitespace(optimizedPrompt, optimizations);
    optimizedPrompt = this.abbreviateCommonPhrases(optimizedPrompt, optimizations);
    optimizedPrompt = this.removeFillerWords(optimizedPrompt, optimizations);

    const optimizedTokens = TokenCounter.estimateTokens(optimizedPrompt, model).tokens;
    const tokensSaved = originalTokens - optimizedTokens;

    return {
      originalPrompt: prompt,
      optimizedPrompt,
      tokensSaved,
      optimizations
    };
  }

  /**
   * Remove redundant words and phrases
   */
  private static removeRedundantWords(prompt: string, optimizations: string[]): string {
    const redundantPhrases = [
      { pattern: /please\s+/gi, replacement: '' },
      { pattern: /kindly\s+/gi, replacement: '' },
      { pattern: /I would like you to\s+/gi, replacement: '' },
      { pattern: /Could you\s+/gi, replacement: '' },
      { pattern: /Can you\s+/gi, replacement: '' },
      { pattern: /I need you to\s+/gi, replacement: '' },
      { pattern: /Make sure to\s+/gi, replacement: '' },
      { pattern: /Be sure to\s+/gi, replacement: '' }
    ];

    let result = prompt;
    let changed = false;

    redundantPhrases.forEach(({ pattern, replacement }) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
        changed = true;
      }
    });

    if (changed) {
      optimizations.push('Removed redundant politeness phrases');
    }

    return result;
  }

  /**
   * Simplify complex language constructions
   */
  private static simplifyLanguage(prompt: string, optimizations: string[]): string {
    const simplifications = [
      { pattern: /in order to/gi, replacement: 'to' },
      { pattern: /due to the fact that/gi, replacement: 'because' },
      { pattern: /for the purpose of/gi, replacement: 'to' },
      { pattern: /with regard to/gi, replacement: 'about' },
      { pattern: /in the event that/gi, replacement: 'if' },
      { pattern: /at this point in time/gi, replacement: 'now' },
      { pattern: /it is important to note that/gi, replacement: 'note:' },
      { pattern: /it should be mentioned that/gi, replacement: '' }
    ];

    let result = prompt;
    let changed = false;

    simplifications.forEach(({ pattern, replacement }) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
        changed = true;
      }
    });

    if (changed) {
      optimizations.push('Simplified complex language constructions');
    }

    return result;
  }

  /**
   * Compress whitespace and formatting
   */
  private static compressWhitespace(prompt: string, optimizations: string[]): string {
    const original = prompt;
    
    // Remove extra spaces
    let result = prompt.replace(/\s+/g, ' ');
    
    // Remove extra line breaks
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Trim
    result = result.trim();

    if (result !== original) {
      optimizations.push('Compressed whitespace');
    }

    return result;
  }

  /**
   * Abbreviate common phrases
   */
  private static abbreviateCommonPhrases(prompt: string, optimizations: string[]): string {
    const abbreviations = [
      { pattern: /for example/gi, replacement: 'e.g.' },
      { pattern: /that is/gi, replacement: 'i.e.' },
      { pattern: /and so on/gi, replacement: 'etc.' },
      { pattern: /as soon as possible/gi, replacement: 'ASAP' },
      { pattern: /frequently asked questions/gi, replacement: 'FAQ' },
      { pattern: /application programming interface/gi, replacement: 'API' }
    ];

    let result = prompt;
    let changed = false;

    abbreviations.forEach(({ pattern, replacement }) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
        changed = true;
      }
    });

    if (changed) {
      optimizations.push('Used abbreviations for common phrases');
    }

    return result;
  }

  /**
   * Remove filler words
   */
  private static removeFillerWords(prompt: string, optimizations: string[]): string {
    const fillerWords = [
      /\b(actually|basically|literally|obviously|clearly|simply|just|really|very|quite|rather|somewhat|fairly|pretty|kind of|sort of)\s+/gi
    ];

    let result = prompt;
    let changed = false;

    fillerWords.forEach(pattern => {
      if (pattern.test(result)) {
        result = result.replace(pattern, ' ');
        changed = true;
      }
    });

    // Clean up any double spaces created
    result = result.replace(/\s+/g, ' ');

    if (changed) {
      optimizations.push('Removed filler words');
    }

    return result;
  }

  /**
   * Optimize for specific token target
   */
  static optimizeToTarget(
    prompt: string, 
    targetTokens: number, 
    model: SupportedModel = DEFAULT_FREE_MODEL
  ): OptimizationResult {
    let result = this.optimize(prompt, model);
    
    // If still too long, apply more aggressive optimizations
    let currentTokens = TokenCounter.estimateTokens(result.optimizedPrompt, model).tokens;
    
    if (currentTokens > targetTokens) {
      // More aggressive optimization
      result.optimizedPrompt = this.aggressiveOptimization(result.optimizedPrompt, targetTokens, model);
      result.optimizations.push('Applied aggressive optimization to meet token target');
      
      const finalTokens = TokenCounter.estimateTokens(result.optimizedPrompt, model).tokens;
      result.tokensSaved = TokenCounter.estimateTokens(result.originalPrompt, model).tokens - finalTokens;
    }

    return result;
  }

  /**
   * Apply aggressive optimization techniques
   */
  private static aggressiveOptimization(prompt: string, targetTokens: number, model: SupportedModel): string {
    let result = prompt;
    let currentTokens = TokenCounter.estimateTokens(result, model).tokens;

    // Remove examples if present
    if (currentTokens > targetTokens) {
      result = result.replace(/example[s]?:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
      currentTokens = TokenCounter.estimateTokens(result, model).tokens;
    }

    // Shorten sentences
    if (currentTokens > targetTokens) {
      const sentences = result.split(/[.!?]+/).filter(s => s.trim());
      const shortened = sentences.map(sentence => {
        return sentence.trim().split(' ').slice(0, 15).join(' ');
      });
      result = shortened.join('. ') + '.';
      currentTokens = TokenCounter.estimateTokens(result, model).tokens;
    }

    // Last resort: truncate
    if (currentTokens > targetTokens) {
      const words = result.split(' ');
      const targetWords = Math.floor(targetTokens * 0.75); // Rough estimation
      result = words.slice(0, targetWords).join(' ') + '...';
    }

    return result;
  }
}
