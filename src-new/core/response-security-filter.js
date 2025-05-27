#!/usr/bin/env node

/**
 * Response Security Filter for Trinity MVP
 * 
 * Filters sensitive system information from responses to prevent information leakage.
 * Critical for production security - prevents exposure of file paths, PIDs, and internal details.
 */

class ResponseSecurityFilter {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.strictMode = options.strictMode || false; // Extra paranoid filtering
    
    // Sensitive patterns that should be filtered from responses
    this.sensitivePatterns = {
      // File path patterns
      filePaths: [
        /\/home\/[^\/\s]+\/[^\s]*/g,           // Linux home paths
        /\/Users\/[^\/\s]+\/[^\s]*/g,          // macOS home paths  
        /C:\\Users\\[^\\\/\s]+\\[^\s]*/g,      // Windows user paths
        /~\/\.trinity-mvp[^\s]*/g,             // Trinity config paths
        /\.trinity-mvp\/[^\s]*/g,              // Relative trinity paths
        /\/tmp\/[^\s]*/g,                      // Temp directories
        /\/var\/[^\s]*/g,                      // System var directories
      ],
      
      // Process and system information
      processInfo: [
        /PID:\s*\d+/g,                         // Process IDs
        /process\.pid/g,                       // Process PID references
        /pid\s*=\s*\d+/g,                      // PID assignments
        /\bpid\b\s*\d+/gi,                     // PID numbers
      ],
      
      // Internal component names and paths
      internalComponents: [
        /trinity-mvp-public[^\s]*/g,           // Project directory names
        /claude-watcher[^\s]*/g,               // Component names
        /git\/trinity-system[^\s]*/g,          // Git repository paths
        /agents\/[^\/\s]+\/config[^\s]*/g,     // Agent config paths
        /\.git\/[^\s]*/g,                      // Git internal paths
      ],
      
      // Development and debugging info
      developmentInfo: [
        /alreadyinuse/g,                       // Development username
        /domain\s+users/g,                     // System group info
        /node_modules\/[^\s]*/g,               // Node modules paths
        /package\.json/g,                      // Config file references
        /\.env/g,                              // Environment file references
      ],
      
      // Network and system details
      systemDetails: [
        /localhost:\d+/g,                      // Local ports
        /127\.0\.0\.1:\d+/g,                  // Localhost IPs
        /:\d{4,5}/g,                          // Port numbers
      ]
    };
    
    // Replacement patterns for filtered content
    this.replacements = {
      filePaths: '[SYSTEM_PATH]',
      processInfo: '[PID]',
      internalComponents: '[SYSTEM_COMPONENT]',
      developmentInfo: '[SYSTEM_INFO]',
      systemDetails: '[SYSTEM_ENDPOINT]'
    };
    
    this.logger.info('[ResponseSecurityFilter] Initialized with security filtering');
  }
  
  /**
   * Filter sensitive information from response content
   * @param {string} content - The response content to filter
   * @returns {string} - Filtered content with sensitive information removed
   */
  filterResponse(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }
    
    let filteredContent = content;
    let filterCount = 0;
    const appliedFilters = [];
    
    // Apply each category of filters
    Object.entries(this.sensitivePatterns).forEach(([category, patterns]) => {
      patterns.forEach((pattern, index) => {
        const matches = filteredContent.match(pattern);
        if (matches) {
          const replacement = this.replacements[category] || '[FILTERED]';
          filteredContent = filteredContent.replace(pattern, replacement);
          filterCount += matches.length;
          appliedFilters.push(`${category}:${matches.length}`);
        }
      });
    });
    
    // Log filtering activity if any filters were applied
    if (filterCount > 0) {
      this.logger.info(`[ResponseSecurityFilter] Applied ${filterCount} filters: ${appliedFilters.join(', ')}`);
      
      if (this.strictMode) {
        this.logger.info(`[ResponseSecurityFilter] Original length: ${content.length}, Filtered length: ${filteredContent.length}`);
      }
    }
    
    return filteredContent;
  }
  
  /**
   * Check if content contains sensitive information without filtering
   * Useful for validation and testing
   * @param {string} content - Content to check
   * @returns {Object} - Analysis of sensitive content found
   */
  analyzeContent(content) {
    if (!content || typeof content !== 'string') {
      return { hasSensitiveContent: false, findings: [] };
    }
    
    const findings = [];
    let totalMatches = 0;
    
    Object.entries(this.sensitivePatterns).forEach(([category, patterns]) => {
      patterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          findings.push({
            category,
            pattern: pattern.source,
            matches: matches.length,
            examples: matches.slice(0, 3) // First 3 examples
          });
          totalMatches += matches.length;
        }
      });
    });
    
    return {
      hasSensitiveContent: totalMatches > 0,
      totalMatches,
      findings,
      riskLevel: this.assessRiskLevel(totalMatches, findings)
    };
  }
  
  /**
   * Assess risk level based on sensitive content found
   * @private
   */
  assessRiskLevel(totalMatches, findings) {
    if (totalMatches === 0) return 'none';
    if (totalMatches <= 2) return 'low';
    if (totalMatches <= 5) return 'medium';
    return 'high';
  }
  
  /**
   * Validate that filtering is working correctly
   * @param {string} originalContent - Original content
   * @param {string} filteredContent - Filtered content
   * @returns {Object} - Validation results
   */
  validateFiltering(originalContent, filteredContent) {
    const originalAnalysis = this.analyzeContent(originalContent);
    const filteredAnalysis = this.analyzeContent(filteredContent);
    
    const isEffective = filteredAnalysis.totalMatches === 0;
    const reductionPercentage = originalAnalysis.totalMatches > 0 ? 
      Math.round((1 - filteredAnalysis.totalMatches / originalAnalysis.totalMatches) * 100) : 100;
    
    return {
      isEffective,
      originalMatches: originalAnalysis.totalMatches,
      filteredMatches: filteredAnalysis.totalMatches,
      reductionPercentage,
      originalRisk: originalAnalysis.riskLevel,
      filteredRisk: filteredAnalysis.riskLevel,
      remainingFindings: filteredAnalysis.findings
    };
  }
  
  /**
   * Get statistics about filtering patterns
   */
  getFilterStats() {
    const totalPatterns = Object.values(this.sensitivePatterns)
      .reduce((sum, patterns) => sum + patterns.length, 0);
    
    return {
      totalPatterns,
      categories: Object.keys(this.sensitivePatterns),
      strictMode: this.strictMode
    };
  }
}

module.exports = ResponseSecurityFilter;