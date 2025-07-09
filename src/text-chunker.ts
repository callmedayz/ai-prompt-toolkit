import { ChunkOptions, SupportedModel } from './types';
import { TokenCounter } from './token-counter';

/**
 * Text chunking utility for processing large texts with AI models
 */
export class TextChunker {
  /**
   * Split text into chunks that fit within token limits
   */
  static chunkText(text: string, options: ChunkOptions): string[] {
    const { maxTokens, overlap = 0, preserveWords = true, preserveSentences = false } = options;

    // Handle empty text
    if (!text || text.trim().length === 0) {
      return text ? [text] : [];
    }

    if (preserveSentences) {
      return this.chunkBySentences(text, maxTokens, overlap);
    } else if (preserveWords) {
      return this.chunkByWords(text, maxTokens, overlap);
    } else {
      return this.chunkByCharacters(text, maxTokens, overlap);
    }
  }

  /**
   * Chunk text by sentences, preserving sentence boundaries
   */
  private static chunkBySentences(text: string, maxTokens: number, overlap: number): string[] {
    const sentences = this.splitIntoSentences(text);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = TokenCounter.estimateTokens(sentence).tokens;
      
      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        // Finalize current chunk
        chunks.push(currentChunk.join(' '));
        
        // Start new chunk with overlap
        if (overlap > 0) {
          currentChunk = this.getOverlapSentences(currentChunk, overlap);
          currentTokens = TokenCounter.estimateTokens(currentChunk.join(' ')).tokens;
        } else {
          currentChunk = [];
          currentTokens = 0;
        }
      }
      
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Chunk text by words, preserving word boundaries
   */
  private static chunkByWords(text: string, maxTokens: number, overlap: number): string[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const word of words) {
      const wordTokens = TokenCounter.estimateTokens(word).tokens;
      
      if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
        // Finalize current chunk
        chunks.push(currentChunk.join(' '));
        
        // Start new chunk with overlap
        if (overlap > 0) {
          const overlapWords = Math.min(overlap, currentChunk.length);
          currentChunk = currentChunk.slice(-overlapWords);
          currentTokens = TokenCounter.estimateTokens(currentChunk.join(' ')).tokens;
        } else {
          currentChunk = [];
          currentTokens = 0;
        }
      }
      
      currentChunk.push(word);
      currentTokens += wordTokens;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Chunk text by characters (least precise but fastest)
   */
  private static chunkByCharacters(text: string, maxTokens: number, overlap: number): string[] {
    const maxChars = maxTokens * 4; // Rough estimation: 1 token ≈ 4 characters
    const overlapChars = overlap * 4;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += maxChars - overlapChars) {
      const chunk = text.slice(i, i + maxChars);
      chunks.push(chunk);
      
      if (i + maxChars >= text.length) break;
    }

    return chunks;
  }

  /**
   * Split text into sentences using common sentence endings
   */
  private static splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - could be enhanced with more sophisticated NLP
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map(sentence => sentence + '.');
  }

  /**
   * Get overlap sentences for chunking
   */
  private static getOverlapSentences(sentences: string[], overlapTokens: number): string[] {
    let tokens = 0;
    const overlap: string[] = [];
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = TokenCounter.estimateTokens(sentences[i]).tokens;
      if (tokens + sentenceTokens > overlapTokens) break;
      
      overlap.unshift(sentences[i]);
      tokens += sentenceTokens;
    }
    
    return overlap;
  }

  /**
   * Chunk text for a specific model
   */
  static chunkForModel(text: string, model: SupportedModel, overlapPercent: number = 10): string[] {
    const config = TokenCounter.getModelConfig(model);
    const maxTokens = Math.floor(config.maxTokens * 0.9); // Leave 10% buffer
    const overlap = Math.floor(maxTokens * (overlapPercent / 100));

    return this.chunkText(text, {
      maxTokens,
      overlap,
      preserveWords: true,
      preserveSentences: true
    });
  }

  /**
   * Get chunk statistics
   */
  static getChunkStats(chunks: string[]): {
    totalChunks: number;
    averageTokens: number;
    minTokens: number;
    maxTokens: number;
    totalTokens: number;
  } {
    const tokenCounts = chunks.map(chunk => TokenCounter.estimateTokens(chunk).tokens);
    
    return {
      totalChunks: chunks.length,
      averageTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
      totalTokens: tokenCounts.reduce((a, b) => a + b, 0)
    };
  }
}
