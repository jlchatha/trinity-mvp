#!/usr/bin/env node

/**
 * Trinity MVP Complex Query Processor
 * 
 * Solves the critical professional functionality gap where Trinity defaults to
 * generic responses for complex analytical requests.
 * 
 * Architecture: Query Classification + Analytical Processing Pipeline
 * Performance: Adds 100-500ms to complex query processing for professional capabilities
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ComplexQueryProcessor {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.baseDir = options.baseDir || path.join(os.homedir(), '.trinity-mvp');
    
    // Query classification patterns
    this.analyticalPatterns = {
      codebaseAnalysis: /\b(review|analyze|assess|examine|evaluate|study)\b.*\b(codebase|code|project|system|repository|repo)\b/i,
      comparativeAnalysis: /\b(compare|contrast|vs|versus|against)\b.*\b(deliver|promise|claim|feature|capabilit)\b/i,
      gapAssessment: /\b(gap|missing|lack|need|require|deficit)\b.*\b(feature|function|capabilit|implement)\b/i,
      strategicAnalysis: /\b(strategy|strategic|position|competitive|market|advantage)\b/i,
      multiStepOperation: /\b(review|analyze|assess)\b.*\band\s+(assess|compare|recommend|identify|suggest|provide)\b/i,
      professionalWorkflow: /\b(workflow|process|procedure|methodology|approach|framework)\b/i,
      architecturalAnalysis: /\b(architecture|architectural|structure|design|component|module)\b.*\b(analysis|review|assessment)\b/i
    };
    
    // Complexity indicators
    this.complexityIndicators = [
      'delivery vs promises',
      'promises vs delivery', 
      'what we are delivering vs what we are promising',
      'assess what',
      'review and',
      'analyze and',
      'compare and',
      'identify and',
      'examine the'
    ];
    
    this.logger.info('[ComplexQueryProcessor] Initialized with analytical processing capabilities');
  }

  /**
   * Main entry point: Determine if query needs complex processing
   */
  needsComplexProcessing(message) {
    const classification = this.classifyQuery(message);
    const isComplex = classification.isComplex;
    
    this.logger.info(`[ComplexQueryProcessor] Query complexity: ${isComplex ? 'COMPLEX' : 'SIMPLE'}`);
    this.logger.info(`[ComplexQueryProcessor] Classification: ${JSON.stringify(classification)}`);
    
    return isComplex;
  }

  /**
   * Classify query complexity and type
   */
  classifyQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit complexity indicators
    const hasComplexityIndicator = this.complexityIndicators.some(indicator => 
      lowerMessage.includes(indicator.toLowerCase())
    );
    
    if (hasComplexityIndicator) {
      return {
        isComplex: true,
        type: 'explicit_complex',
        reason: 'Contains explicit complexity indicators',
        operations: this.identifyOperations(message)
      };
    }
    
    // Check against analytical patterns
    const matchedPatterns = [];
    for (const [patternName, pattern] of Object.entries(this.analyticalPatterns)) {
      if (pattern.test(message)) {
        matchedPatterns.push(patternName);
      }
    }
    
    if (matchedPatterns.length > 0) {
      return {
        isComplex: true,
        type: 'analytical',
        patterns: matchedPatterns,
        reason: `Matches analytical patterns: ${matchedPatterns.join(', ')}`,
        operations: this.identifyOperations(message)
      };
    }
    
    // Check for multi-step operations
    const hasMultipleVerbs = this.countActionVerbs(message) >= 2;
    const hasConjunctions = /\band\s+|\,\s*and\s+|\,\s*then\s+|\;\s*/.test(lowerMessage);
    
    if (hasMultipleVerbs && hasConjunctions) {
      return {
        isComplex: true,
        type: 'multi_step',
        reason: 'Multiple action verbs with conjunctions',
        operations: this.identifyOperations(message)
      };
    }
    
    // Default to simple
    return {
      isComplex: false,
      type: 'simple',
      reason: 'No complexity indicators found'
    };
  }

  /**
   * Count action verbs in message
   */
  countActionVerbs(message) {
    const actionVerbs = [
      'review', 'analyze', 'assess', 'evaluate', 'examine', 'study',
      'compare', 'contrast', 'identify', 'determine', 'find',
      'recommend', 'suggest', 'propose', 'advise',
      'create', 'build', 'implement', 'develop',
      'optimize', 'improve', 'enhance', 'fix'
    ];
    
    const lowerMessage = message.toLowerCase();
    return actionVerbs.filter(verb => 
      new RegExp(`\\b${verb}\\b`).test(lowerMessage)
    ).length;
  }

  /**
   * Identify specific operations in the query
   */
  identifyOperations(message) {
    const operations = [];
    const lowerMessage = message.toLowerCase();
    
    // Codebase operations
    if (this.analyticalPatterns.codebaseAnalysis.test(message)) {
      operations.push({
        type: 'codebase_analysis',
        description: 'Analyze project structure and codebase',
        priority: 'high'
      });
    }
    
    // Comparative operations
    if (this.analyticalPatterns.comparativeAnalysis.test(message)) {
      operations.push({
        type: 'comparative_analysis',
        description: 'Compare current delivery vs promises',
        priority: 'high'
      });
    }
    
    // Gap assessment
    if (this.analyticalPatterns.gapAssessment.test(message)) {
      operations.push({
        type: 'gap_assessment',
        description: 'Identify implementation gaps and missing features',
        priority: 'medium'
      });
    }
    
    // Strategic analysis
    if (this.analyticalPatterns.strategicAnalysis.test(message)) {
      operations.push({
        type: 'strategic_analysis',
        description: 'Provide strategic recommendations and positioning',
        priority: 'medium'
      });
    }
    
    // README/documentation analysis
    if (/\b(readme|documentation|docs|promises?|claims?)\b/i.test(message)) {
      operations.push({
        type: 'documentation_analysis',
        description: 'Analyze README and documentation for promises vs delivery',
        priority: 'high'
      });
    }
    
    return operations;
  }

  /**
   * Enhance prompt for complex processing
   */
  enhancePromptForComplexProcessing(originalPrompt, classification) {
    const operations = classification.operations || [];
    
    let enhancedPrompt = originalPrompt;
    
    // Add analytical context
    enhancedPrompt += '\n\n--- ANALYTICAL PROCESSING REQUEST ---';
    enhancedPrompt += '\nThis is a complex analytical request requiring professional-level analysis.';
    
    if (operations.length > 0) {
      enhancedPrompt += '\n\nIdentified Operations:';
      operations.forEach((op, index) => {
        enhancedPrompt += `\n${index + 1}. ${op.description} (${op.type})`;
      });
    }
    
    enhancedPrompt += '\n\nPlease provide a comprehensive analytical response with:';
    enhancedPrompt += '\n- Detailed findings and analysis';
    enhancedPrompt += '\n- Structured presentation of results';
    enhancedPrompt += '\n- Specific examples and evidence';
    enhancedPrompt += '\n- Professional recommendations where appropriate';
    
    // Add specific guidance based on operation types
    if (operations.some(op => op.type === 'codebase_analysis')) {
      enhancedPrompt += '\n\nFor codebase analysis: Review actual files, directory structure, and implementation status.';
    }
    
    if (operations.some(op => op.type === 'comparative_analysis')) {
      enhancedPrompt += '\n\nFor comparative analysis: Compare documented promises with actual implementation status.';
    }
    
    if (operations.some(op => op.type === 'documentation_analysis')) {
      enhancedPrompt += '\n\nFor documentation analysis: Review README.md, package.json, and other documentation files.';
    }
    
    enhancedPrompt += '\n\nRespond with professional analytical content, not generic assistance offers.';
    enhancedPrompt += '\n--- END ANALYTICAL PROCESSING REQUEST ---\n';
    
    return enhancedPrompt;
  }

  /**
   * Generate structured analytical response template
   */
  generateAnalyticalResponseTemplate(classification) {
    const operations = classification.operations || [];
    
    let template = '\n\n# Professional Analysis Request Processing\n';
    template += `Query Type: ${classification.type}\n`;
    template += `Complexity: ${classification.isComplex ? 'High' : 'Low'}\n\n`;
    
    if (operations.length > 0) {
      template += '## Analysis Framework:\n';
      operations.forEach((op, index) => {
        template += `${index + 1}. **${op.description}**\n`;
        template += `   - Type: ${op.type}\n`;
        template += `   - Priority: ${op.priority}\n\n`;
      });
    }
    
    template += '## Please provide structured analysis addressing the above framework.\n';
    
    return template;
  }

  /**
   * Validate if response is actually analytical (not generic)
   */
  validateAnalyticalResponse(response, originalQuery) {
    const genericPhrases = [
      'I\'m here to help you with professional tasks',
      'Could you please be more specific',
      'What would you like assistance with',
      'I can help you with',
      'Please provide more details'
    ];
    
    const responseLower = response.toLowerCase();
    
    // Check for generic phrases
    for (const phrase of genericPhrases) {
      if (responseLower.includes(phrase.toLowerCase())) {
        return {
          isAnalytical: false,
          reason: `Contains generic phrase: "${phrase}"`
        };
      }
    }
    
    // Check response length
    if (response.length < 100) {
      return {
        isAnalytical: false,
        reason: 'Response too short for analytical query'
      };
    }
    
    // Check for analytical content
    const analyticalIndicators = [
      'analysis', 'assessment', 'evaluation', 'review',
      'findings', 'conclusions', 'recommendations', 
      'comparison', 'gaps', 'structure', 'implementation'
    ];
    
    const foundIndicators = analyticalIndicators.filter(indicator =>
      responseLower.includes(indicator)
    ).length;
    
    if (foundIndicators < 2) {
      return {
        isAnalytical: false,
        reason: `Lacks analytical content (${foundIndicators}/${analyticalIndicators.length} indicators found)`
      };
    }
    
    return {
      isAnalytical: true,
      reason: `Contains analytical content (${foundIndicators}/${analyticalIndicators.length} indicators found)`
    };
  }

  /**
   * Process complex query end-to-end
   */
  async processComplexQuery(message, options = {}) {
    this.logger.info(`[ComplexQueryProcessor] Processing complex query: "${message}"`);
    
    try {
      // Classify the query
      const classification = this.classifyQuery(message);
      
      if (!classification.isComplex) {
        this.logger.info('[ComplexQueryProcessor] Query classified as simple, no enhancement needed');
        return {
          enhanced: false,
          originalPrompt: message,
          enhancedPrompt: message,
          classification: classification
        };
      }
      
      // Enhance prompt for analytical processing
      const enhancedPrompt = this.enhancePromptForComplexProcessing(message, classification);
      
      this.logger.info('[ComplexQueryProcessor] Query enhanced for analytical processing');
      this.logger.info(`[ComplexQueryProcessor] Enhanced prompt length: ${enhancedPrompt.length} chars`);
      
      return {
        enhanced: true,
        originalPrompt: message,
        enhancedPrompt: enhancedPrompt,
        classification: classification,
        operations: classification.operations,
        responseTemplate: this.generateAnalyticalResponseTemplate(classification)
      };
      
    } catch (error) {
      this.logger.error(`[ComplexQueryProcessor] Error processing complex query: ${error.message}`);
      
      return {
        enhanced: false,
        originalPrompt: message,
        enhancedPrompt: message,
        error: error.message
      };
    }
  }
}

module.exports = ComplexQueryProcessor;