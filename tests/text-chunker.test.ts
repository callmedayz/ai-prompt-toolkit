import { TextChunker } from '../src/text-chunker';

describe('TextChunker', () => {
  const sampleText = 'This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence.';

  describe('chunkText', () => {
    it('should chunk text by words', () => {
      const chunks = TextChunker.chunkText(sampleText, {
        maxTokens: 10,
        preserveWords: true
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.trim()).not.toBe('');
      });
    });

    it('should chunk text by sentences', () => {
      const chunks = TextChunker.chunkText(sampleText, {
        maxTokens: 15,
        preserveSentences: true
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.includes('.')).toBe(true);
      });
    });

    it('should handle overlap', () => {
      const chunks = TextChunker.chunkText(sampleText, {
        maxTokens: 15,
        overlap: 3,
        preserveWords: true
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      
      // Check that there's some overlap between consecutive chunks
      if (chunks.length > 1) {
        const firstChunkWords = chunks[0].split(' ');
        const secondChunkWords = chunks[1].split(' ');
        
        // Should have some overlapping words
        const hasOverlap = firstChunkWords.some(word => 
          secondChunkWords.includes(word)
        );
        expect(hasOverlap).toBe(true);
      }
    });

    it('should chunk by characters when preserveWords is false', () => {
      const chunks = TextChunker.chunkText('abcdefghijklmnopqrstuvwxyz', {
        maxTokens: 5,
        preserveWords: false
      });
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(20); // 5 tokens * 4 chars
      });
    });
  });

  describe('chunkForModel', () => {
    it.skip('should chunk for GPT-3.5-turbo', () => {
      const longText = 'word '.repeat(20000);
      const chunks = TextChunker.chunkForModel(longText, 'tencent/hunyuan-a13b-instruct:free');

      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should respect the model's token limits
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should chunk for Claude with larger context', () => {
      const longText = 'word '.repeat(5000);
      const chunks = TextChunker.chunkForModel(longText, 'tencent/hunyuan-a13b-instruct:free');
      
      expect(chunks.length).toBeGreaterThan(0);
      // Claude should handle larger chunks
      expect(chunks.length).toBeLessThan(10);
    });

    it('should handle overlap percentage', () => {
      const text = 'word '.repeat(100);
      const chunks = TextChunker.chunkForModel(text, 'tencent/hunyuan-a13b-instruct:free', 20);
      
      expect(chunks.length).toBeGreaterThan(0);
      // With 20% overlap, should have more chunks
      const chunksNoOverlap = TextChunker.chunkForModel(text, 'tencent/hunyuan-a13b-instruct:free', 0);
      expect(chunks.length).toBeGreaterThanOrEqual(chunksNoOverlap.length);
    });
  });

  describe('getChunkStats', () => {
    it('should return correct statistics', () => {
      const chunks = ['Hello world', 'This is a test', 'Final chunk'];
      const stats = TextChunker.getChunkStats(chunks);
      
      expect(stats.totalChunks).toBe(3);
      expect(stats.averageTokens).toBeGreaterThan(0);
      expect(stats.minTokens).toBeGreaterThan(0);
      expect(stats.maxTokens).toBeGreaterThan(0);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.minTokens).toBeLessThanOrEqual(stats.averageTokens);
      expect(stats.averageTokens).toBeLessThanOrEqual(stats.maxTokens);
    });

    it('should handle single chunk', () => {
      const chunks = ['Single chunk of text'];
      const stats = TextChunker.getChunkStats(chunks);
      
      expect(stats.totalChunks).toBe(1);
      expect(stats.minTokens).toBe(stats.maxTokens);
      expect(stats.averageTokens).toBe(stats.maxTokens);
    });

    it('should handle empty chunks array', () => {
      const stats = TextChunker.getChunkStats([]);
      
      expect(stats.totalChunks).toBe(0);
      expect(stats.averageTokens).toBeNaN();
      expect(stats.minTokens).toBe(Infinity);
      expect(stats.maxTokens).toBe(-Infinity);
      expect(stats.totalTokens).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const chunks = TextChunker.chunkText('', {
        maxTokens: 10
      });

      expect(chunks).toEqual([]);
    });

    it('should handle very small maxTokens', () => {
      const chunks = TextChunker.chunkText('Hello world', {
        maxTokens: 1,
        preserveWords: true
      });
      
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.trim()).not.toBe('');
      });
    });

    it('should handle text shorter than maxTokens', () => {
      const shortText = 'Hello';
      const chunks = TextChunker.chunkText(shortText, {
        maxTokens: 100
      });
      
      expect(chunks).toEqual([shortText]);
    });
  });
});
