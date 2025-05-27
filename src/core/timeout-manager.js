#!/usr/bin/env node

/**
 * Trinity MVP Timeout Manager
 * 
 * Resolves Claude Code CLI timeout issues through query-type based timeout optimization.
 * Addresses critical issue where file operations timeout at 30 seconds.
 * 
 * Solution: Progressive timeout strategy based on operation complexity.
 */

class TimeoutManager {
  constructor(options = {}) {
    this.logger = options.logger || console;
    
    // Timeout categories based on operation type
    this.timeoutCategories = {
      simple: {
        maxResponseTime: 30000,     // 30 seconds (current baseline)
        warningThreshold: 15000,    // 15 seconds
        description: 'Basic queries and simple operations'
      },
      memory: {
        maxResponseTime: 45000,     // 45 seconds (50% increase)
        warningThreshold: 20000,    // 20 seconds
        description: 'Memory recall and storage operations'
      },
      fileSystem: {
        maxResponseTime: 90000,     // 90 seconds (3x increase)
        warningThreshold: 30000,    // 30 seconds
        description: 'File system operations and directory scanning'
      },
      complex: {
        maxResponseTime: 60000,     // 60 seconds (2x increase)
        warningThreshold: 25000,    // 25 seconds
        description: 'Complex analytical and multi-step operations'
      }
    };
    
    // Performance tracking
    this.stats = {
      categorizations: new Map(),
      successRates: new Map(),
      averageDurations: new Map(),
      totalRequests: 0
    };
    
    this.logger.info('[TimeoutManager] Initialized with query-type based timeout optimization');
  }
  
  /**
   * Determine appropriate timeout configuration for a query
   * @param {string} prompt - The user prompt/query
   * @param {boolean} hasMemoryReference - Whether memory context is involved
   * @param {Object} complexityResult - Result from ComplexQueryProcessor
   * @returns {Object} Timeout configuration with category and timing
   */
  determineTimeout(prompt, hasMemoryReference, complexityResult) {
    const category = this.categorizeQuery(prompt, hasMemoryReference, complexityResult);
    const config = this.timeoutCategories[category];
    
    // Track categorization for accuracy measurement
    this.stats.categorizations.set(category, (this.stats.categorizations.get(category) || 0) + 1);
    this.stats.totalRequests++;
    
    this.logger.info(`[TimeoutManager] Query categorized as '${category}': ${config.maxResponseTime}ms timeout`);
    
    return {
      category,
      maxResponseTime: config.maxResponseTime,
      warningThreshold: config.warningThreshold,
      description: config.description
    };
  }
  
  /**
   * Categorize query based on content and complexity analysis
   * @param {string} prompt - The user prompt
   * @param {boolean} hasMemoryReference - Memory involvement flag
   * @param {Object} complexityResult - Complexity analysis result
   * @returns {string} Category name (simple, memory, fileSystem, complex)
   */
  categorizeQuery(prompt, hasMemoryReference, complexityResult) {
    // File system operations - highest priority for timeout extension
    if (this.isFileSystemOperation(prompt)) {
      return 'fileSystem';
    }
    
    // Memory operations - second priority
    if (hasMemoryReference || this.isMemoryOperation(prompt)) {
      return 'memory';
    }
    
    // Complex operations based on ComplexQueryProcessor
    if (complexityResult && complexityResult.isComplex) {
      return 'complex';
    }
    
    // Default to simple
    return 'simple';
  }
  
  /**
   * Detect file system operations that require extended timeouts
   * @param {string} prompt - The user prompt
   * @returns {boolean} True if file system operation detected
   */
  isFileSystemOperation(prompt) {
    const fileSystemPatterns = [
      // File listing and scanning
      /\b(list|find|search|scan|show)\s+.*\b(files?|folders?|directories?)\b/i,
      /\b(largest|biggest|smallest)\s+.*\b(files?|folders?)\b/i,
      
      // Directory operations
      /\b(in|from|within)\s+.*\b(downloads?|documents?|desktop|folder|directory)\b/i,
      /\b(browse|explore|check)\s+.*\b(directory|folder|path)\b/i,
      
      // File system commands
      /\b(ls|dir|find|locate|grep)\b.*\b(files?|directories?)\b/i,
      
      // File analysis operations
      /\b(analyze|examine|review)\s+.*\b(file\s+system|directory\s+structure)\b/i
    ];
    
    return fileSystemPatterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Detect memory operations
   * @param {string} prompt - The user prompt  
   * @returns {boolean} True if memory operation detected
   */
  isMemoryOperation(prompt) {
    const memoryPatterns = [
      // Memory recall - enhanced patterns
      /\b(remember|recall|what.*tell|what.*say|what.*mention)\b/i,
      /\b(my\s+favorite|I\s+told\s+you|we\s+discussed|earlier\s+conversation)\b/i,
      /what\s+(was|did)\s+.*\b(that|you|we|I)\b/i,
      /that\s+(poem|code|story|idea|thing)/i,
      
      // Memory storage
      /\b(remember\s+that|store\s+this|save\s+this|note\s+that)\b/i,
      
      // Context references - enhanced
      /\b(based\s+on|from|according\s+to)\s+.*\b(earlier|previous|last|before)\b/i,
      /\b(in\s+our|from\s+our)\s+.*\b(conversation|discussion|chat)\b/i,
      /what\s+did\s+we\s+(talk|discuss|chat)\s+about/i,
      /you\s+(wrote|created|made|said)\s+(earlier|before)/i
    ];
    
    return memoryPatterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Record the result of a request for performance tracking
   * @param {string} category - The timeout category used
   * @param {number} duration - Actual execution time in milliseconds  
   * @param {boolean} success - Whether the request succeeded
   */
  recordResult(category, duration, success) {
    // Track success rates by category
    const categoryStats = this.stats.successRates.get(category) || { total: 0, successful: 0 };
    categoryStats.total++;
    if (success) categoryStats.successful++;
    this.stats.successRates.set(category, categoryStats);
    
    // Track average durations
    const durations = this.stats.averageDurations.get(category) || [];
    durations.push(duration);
    this.stats.averageDurations.set(category, durations);
    
    // Log performance insight
    const successRate = (categoryStats.successful / categoryStats.total * 100).toFixed(1);
    this.logger.info(`[TimeoutManager] ${category} success rate: ${successRate}% (${duration}ms)`);
  }
  
  /**
   * Get performance statistics for monitoring and optimization
   * @returns {Object} Performance statistics and success rates
   */
  getPerformanceStats() {
    const stats = {
      totalRequests: this.stats.totalRequests,
      categorizations: {},
      successRates: {},
      averageDurations: {},
      overall: {
        successRate: 0,
        avgDuration: 0
      }
    };
    
    // Calculate categorization distribution
    for (const [category, count] of this.stats.categorizations) {
      stats.categorizations[category] = {
        count,
        percentage: (count / this.stats.totalRequests * 100).toFixed(1)
      };
    }
    
    // Calculate success rates
    let totalSuccessful = 0;
    let totalRequests = 0;
    
    for (const [category, data] of this.stats.successRates) {
      stats.successRates[category] = {
        total: data.total,
        successful: data.successful,
        rate: (data.successful / data.total * 100).toFixed(1)
      };
      totalSuccessful += data.successful;
      totalRequests += data.total;
    }
    
    // Calculate average durations
    let overallDurationSum = 0;
    let overallDurationCount = 0;
    
    for (const [category, durations] of this.stats.averageDurations) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      stats.averageDurations[category] = Math.round(avgDuration);
      overallDurationSum += durations.reduce((a, b) => a + b, 0);
      overallDurationCount += durations.length;
    }
    
    // Overall statistics
    stats.overall.successRate = totalRequests > 0 ? (totalSuccessful / totalRequests * 100).toFixed(1) : 0;
    stats.overall.avgDuration = overallDurationCount > 0 ? Math.round(overallDurationSum / overallDurationCount) : 0;
    
    return stats;
  }
  
  /**
   * Validate categorization accuracy by manually checking a sample
   * @param {Array} testCases - Array of {prompt, expectedCategory} objects
   * @returns {Object} Accuracy results
   */
  validateCategorization(testCases) {
    let correct = 0;
    const results = [];
    
    for (const testCase of testCases) {
      const actualCategory = this.categorizeQuery(testCase.prompt, testCase.hasMemoryReference, testCase.complexityResult);
      const isCorrect = actualCategory === testCase.expectedCategory;
      
      if (isCorrect) correct++;
      
      results.push({
        prompt: testCase.prompt,
        expected: testCase.expectedCategory,
        actual: actualCategory,
        correct: isCorrect
      });
    }
    
    const accuracy = (correct / testCases.length * 100).toFixed(1);
    
    this.logger.info(`[TimeoutManager] Categorization accuracy: ${accuracy}% (${correct}/${testCases.length})`);
    
    return {
      accuracy: parseFloat(accuracy),
      correct,
      total: testCases.length,
      results
    };
  }
}

module.exports = TimeoutManager;