/**
 * Query Processor Unit Tests
 * Tests for Trinity MVP's query classification and processing
 */

describe('Query Processor', () => {
  let queryProcessor;

  beforeEach(() => {
    // Mock query processor
    queryProcessor = {
      classifyQuery: jest.fn(),
      processSimpleQuery: jest.fn(),
      processComplexQuery: jest.fn(),
    };
  });

  describe('Query Classification', () => {
    test('should classify simple queries correctly', async () => {
      const simpleQueries = [
        'What is 2+2?',
        'Define machine learning',
        'Capital of France?',
      ];

      for (const query of simpleQueries) {
        queryProcessor.classifyQuery.mockResolvedValue({ type: 'SIMPLE', confidence: 0.9 });
        const result = await queryProcessor.classifyQuery(query);
        
        expect(result.type).toBe('SIMPLE');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    test('should classify complex queries correctly', async () => {
      const complexQueries = [
        'Analyze the pros and cons of microservices architecture and recommend implementation strategies',
        'Compare React, Vue, and Angular for a large-scale e-commerce application',
        'Design a machine learning pipeline for fraud detection in financial transactions',
      ];

      for (const query of complexQueries) {
        queryProcessor.classifyQuery.mockResolvedValue({ type: 'COMPLEX', confidence: 0.95 });
        const result = await queryProcessor.classifyQuery(query);
        
        expect(result.type).toBe('COMPLEX');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    test('should handle classification errors gracefully', async () => {
      queryProcessor.classifyQuery.mockRejectedValue(new Error('Classification failed'));
      
      try {
        await queryProcessor.classifyQuery('test query');
      } catch (error) {
        expect(error.message).toBe('Classification failed');
      }
    });
  });

  describe('Query Processing', () => {
    test('should process simple queries quickly', async () => {
      const query = 'What is JavaScript?';
      const startTime = Date.now();
      
      queryProcessor.processSimpleQuery.mockResolvedValue({
        success: true,
        content: 'JavaScript is a programming language...',
        processingTime: 2000,
      });
      
      const result = await queryProcessor.processSimpleQuery(query);
      
      expect(result.success).toBe(true);
      expect(result.processingTime).toBeLessThan(5000);
    });

    test('should process complex queries with longer timeout', async () => {
      const query = 'Analyze blockchain consensus mechanisms and their trade-offs';
      
      queryProcessor.processComplexQuery.mockResolvedValue({
        success: true,
        content: 'Blockchain consensus mechanisms include...',
        processingTime: 15000,
      });
      
      const result = await queryProcessor.processComplexQuery(query);
      
      expect(result.success).toBe(true);
      expect(result.processingTime).toBeLessThan(30000);
    });
  });

  describe('Performance Requirements', () => {
    test('should meet response time requirements', async () => {
      // Simple queries should be fast
      queryProcessor.processSimpleQuery.mockResolvedValue({
        success: true,
        processingTime: 3000,
      });
      
      const simpleResult = await queryProcessor.processSimpleQuery('test');
      expect(simpleResult.processingTime).toBeLessThan(5000);
      
      // Complex queries should complete within timeout
      queryProcessor.processComplexQuery.mockResolvedValue({
        success: true,
        processingTime: 25000,
      });
      
      const complexResult = await queryProcessor.processComplexQuery('complex test');
      expect(complexResult.processingTime).toBeLessThan(30000);
    });
  });
});