#!/usr/bin/env node

/**
 * Memory Reference Detector
 * 
 * Detects when user messages contain references to previous conversations.
 * Used by Trinity-Native Memory to determine when to load context.
 * 
 * Examples:
 * - "What was the 2nd line of that poem?"
 * - "You mentioned a function earlier"
 * - "From our previous conversation about X"
 */

class MemoryReferenceDetector {
  constructor(options = {}) {
    this.logger = options.logger || console;
    
    // Pattern categories for different types of memory references
    this.patterns = {
      // Direct content references
      contentReferences: [
        /\b(that|the|last|previous) (poem|code|function|explanation|example|story|solution)\b/i,
        /\b(your|the) (poem|code|function|explanation|example|story|solution) (from|about|that)\b/i,
        /what was the (\w+) (line|part|section|function|variable|example)/i,
        /show me (that|the) (poem|code|function|explanation|example) again/i
      ],
      
      // Temporal references
      temporalReferences: [
        /\b(earlier|before|previously|yesterday|last time) you (said|wrote|mentioned|explained|showed|told)\b/i,
        /you (said|wrote|mentioned|explained|showed|told) (earlier|before|previously|yesterday)/i,
        /from (our|the) (previous|last|earlier) (conversation|discussion|chat|session)/i,
        /\b(remember|recall) when you (told|showed|explained|wrote|mentioned)\b/i,
        /(a while|some time) ago you (said|mentioned|wrote|explained)/i
      ],
      
      // Context continuity
      contextContinuity: [
        /you (said|wrote|mentioned|explained|told me) (that|about)/i,
        /as you (mentioned|explained|said|wrote) (before|earlier|previously)/i,
        /(continue|continuing) (from|with|our discussion) (about|on|regarding)/i,
        /back to (what|our discussion|the topic) (we|you) (discussed|mentioned|talked about)/i,
        /wouldn't that be/i,
        /actually that/i,
        /that doesn't seem right/i,
        /but wait/i,
        /how about (the|that) (poem|code|function) you/i,
        /(what about|how about) the (most recent|latest|recent)/i,
        /you (most recently|recently|just) (wrote|created|made)/i
      ],
      
      // Question clarification
      questionClarification: [
        /what did you mean (by|when you said)/i,
        /can you explain (that|what you meant|your previous)/i,
        /i don't understand (your|the) (previous|last) (response|explanation|answer)/i,
        /clarify (what|your previous|the) (you said|response|explanation)/i
      ],
      
      // Line-specific references (critical for poem example)
      lineReferences: [
        /what was the (\w+) line/i,
        /the (\w+) line (of|from) (that|the|your) (poem|verse|code|function)/i,
        /(first|second|third|last|final) line/i,
        /line (\d+) (of|from|in)/i,
        /show me the (\w+) line/i,
        /(\d+)(?:st|nd|rd|th) line/i,
        /wouldn't that be line (\d+)/i
      ]
    };
    
    // Content type hints for better matching
    this.contentTypeHints = {
      poem: /poem|verse|rhyme|stanza|poetry|lyric/i,
      code: /code|function|variable|class|method|algorithm|program|script/i,
      explanation: /explanation|description|definition|meaning|concept|theory/i,
      example: /example|demo|demonstration|illustration|sample/i,
      story: /story|tale|narrative|anecdote/i
    };
    
    // Stop words that reduce confidence
    this.stopWords = new Set([
      'that', 'this', 'what', 'how', 'when', 'where', 'why', 'who',
      'can', 'could', 'would', 'should', 'will', 'may', 'might',
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then'
    ]);
  }
  
  /**
   * Detect if a message contains memory references
   * Returns boolean for simple detection
   */
  detectsMemoryReference(message) {
    if (!message || typeof message !== 'string') return false;
    
    const result = this.analyzeMemoryReferences(message);
    return result.hasMemoryReference;
  }
  
  /**
   * Comprehensive analysis of memory references in a message
   * Returns detailed analysis for advanced use cases
   */
  analyzeMemoryReferences(message) {
    if (!message || typeof message !== 'string') {
      return {
        hasMemoryReference: false,
        confidence: 0,
        categories: [],
        contentTypes: [],
        specificReferences: [],
        reasoning: 'No message provided'
      };
    }
    
    const analysis = {
      hasMemoryReference: false,
      confidence: 0,
      categories: [],
      contentTypes: [],
      specificReferences: [],
      reasoning: ''
    };
    
    let totalMatches = 0;
    let confidenceScore = 0;
    
    // Check each pattern category
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        const match = message.match(pattern);
        if (match) {
          totalMatches++;
          analysis.categories.push(category);
          analysis.specificReferences.push({
            category,
            match: match[0],
            pattern: pattern.source
          });
          
          // Weight different categories
          switch (category) {
            case 'lineReferences':
              confidenceScore += 0.9; // Very high confidence for line references
              break;
            case 'contentReferences':
              confidenceScore += 0.8;
              break;
            case 'temporalReferences':
              confidenceScore += 0.7;
              break;
            case 'contextContinuity':
              confidenceScore += 0.6;
              break;
            case 'questionClarification':
              confidenceScore += 0.5;
              break;
          }
        }
      });
    });
    
    // Check for content type hints
    Object.entries(this.contentTypeHints).forEach(([type, pattern]) => {
      if (pattern.test(message)) {
        analysis.contentTypes.push(type);
        confidenceScore += 0.2; // Boost confidence when content type is mentioned
      }
    });
    
    // Calculate final confidence (0-1 scale)
    analysis.confidence = Math.min(confidenceScore, 1.0);
    analysis.hasMemoryReference = analysis.confidence > 0.3; // Threshold for detection
    
    // Generate reasoning
    if (analysis.hasMemoryReference) {
      const categoryList = [...new Set(analysis.categories)].join(', ');
      const contentList = analysis.contentTypes.join(', ');
      analysis.reasoning = `Detected ${totalMatches} memory reference pattern(s) in categories: ${categoryList}`;
      if (contentList) {
        analysis.reasoning += `. Content types mentioned: ${contentList}`;
      }
    } else {
      analysis.reasoning = 'No strong memory reference patterns detected';
    }
    
    return analysis;
  }
  
  /**
   * Extract specific content being referenced
   * Returns structured information about what the user is asking for
   * Enhanced with transparent reasoning and context persistence
   */
  extractContentQuery(message, previousContext = null) {
    const analysis = this.analyzeMemoryReferences(message);
    
    if (!analysis.hasMemoryReference) {
      return null;
    }
    
    const query = {
      requestType: 'general',
      contentType: 'any',
      specificRequest: null,
      lineNumber: null,
      linePosition: null,
      temporalHint: null,
      isFollowUp: false,
      reasoning: {
        steps: [],
        calculation: null,
        transparentDisplay: null
      },
      contextPersistence: {
        maintainPreviousContent: false,
        previousContentId: null,
        previousContentType: null
      }
    };
    
    // Check for line-specific requests with enhanced parsing
    const linePatterns = [
      /what was the (\w+) line/i,
      /the (\w+) line/i,
      /line (\d+)/i,
      /(\d+)(?:st|nd|rd|th) line/i,
      /(\w+) to last line/i,
      /(\w+) from the end/i
    ];
    
    let lineMatch = null;
    for (const pattern of linePatterns) {
      lineMatch = message.match(pattern);
      if (lineMatch) break;
    }
    
    if (lineMatch) {
      query.requestType = 'line-specific';
      query.specificRequest = lineMatch[0];
      query.reasoning.steps.push(`Line-specific query detected: "${lineMatch[0]}"`);
      
      if (lineMatch[1]) {
        const lineRef = lineMatch[1].toLowerCase();
        query.reasoning.steps.push(`Parsing line reference: "${lineRef}"`);
        
        // Handle "Nth to last" patterns with transparent reasoning
        if (message.includes('to last') || message.includes('from the end')) {
          const ordinalMap = {
            'first': 1, '1st': 1, 'second': 2, '2nd': 2, 'third': 3, '3rd': 3,
            'fourth': 4, '4th': 4, 'fifth': 5, '5th': 5, 'sixth': 6, '6th': 6,
            'seventh': 7, '7th': 7, 'eighth': 8, '8th': 8, 'ninth': 9, '9th': 9,
            'tenth': 10, '10th': 10
          };
          query.lineNumber = ordinalMap[lineRef] || parseInt(lineRef) || null;
          query.linePosition = 'from-end';
          
          // Transparent reasoning for line counting
          query.reasoning.steps.push(`Counting from end detected`);
          query.reasoning.steps.push(`Position: ${query.lineNumber}${this.getOrdinalSuffix(query.lineNumber)} from last`);
          query.reasoning.calculation = {
            method: 'from-end',
            targetPosition: query.lineNumber,
            explanation: `Will count ${query.lineNumber} lines back from the end`
          };
          query.reasoning.transparentDisplay = `Line counting: Will find the ${query.lineNumber}${this.getOrdinalSuffix(query.lineNumber)} line from the end`;
          
        } else {
          // Handle regular line positions with transparent reasoning
          const ordinalMap = {
            'first': 1, '1st': 1, 'second': 2, '2nd': 2, 'third': 3, '3rd': 3,
            'fourth': 4, '4th': 4, 'fifth': 5, '5th': 5, 'sixth': 6, '6th': 6,
            'seventh': 7, '7th': 7, 'eighth': 8, '8th': 8, 'ninth': 9, '9th': 9,
            'tenth': 10, '10th': 10, 'last': -1, 'final': -1
          };
          query.lineNumber = ordinalMap[lineRef] || parseInt(lineRef) || null;
          query.linePosition = 'from-start';
          
          // Handle special cases
          if (query.lineNumber === -1) {
            query.linePosition = 'from-end';
            query.lineNumber = 1;
            query.reasoning.steps.push(`"Last line" detected - treating as 1st from end`);
            query.reasoning.transparentDisplay = `Line counting: Will find the last line (1st from end)`;
            query.reasoning.calculation = {
              method: 'from-end',
              targetPosition: 1,
              explanation: `Will find the last line (1st from end)`
            };
          } else {
            query.reasoning.steps.push(`Standard line position from start`);
            query.reasoning.steps.push(`Target: Line ${query.lineNumber}`);
            query.reasoning.transparentDisplay = `Line counting: Will find line ${query.lineNumber} from the start`;
            query.reasoning.calculation = {
              method: 'from-start',
              targetPosition: query.lineNumber,
              explanation: `Will find line ${query.lineNumber} counting from the beginning`
            };
          }
        }
      }
    }
    
    // Enhanced follow-up detection with context persistence
    const followUpPatterns = [
      /wouldn't that be/i,
      /isn't that/i,
      /but that's/i,
      /actually that's/i,
      /so that would be/i,
      /that doesn't seem right/i,
      /but wait/i,
      /actually/i,
      /hold on/i,
      /hmm/i
    ];
    
    query.isFollowUp = followUpPatterns.some(pattern => pattern.test(message));
    
    // Context persistence for follow-up questions
    if (query.isFollowUp && previousContext) {
      query.contextPersistence.maintainPreviousContent = true;
      query.contextPersistence.previousContentId = previousContext.contentId;
      query.contextPersistence.previousContentType = previousContext.contentType;
      query.reasoning.steps.push(`Follow-up detected - maintaining context from previous query`);
      query.reasoning.steps.push(`Previous content: ${previousContext.contentType} (ID: ${previousContext.contentId})`);
    }
    
    // Determine content type
    if (analysis.contentTypes.length > 0) {
      query.contentType = analysis.contentTypes[0]; // Use first detected type
    }
    
    // Extract temporal hints
    const temporalMatch = message.match(/(earlier|before|previously|yesterday|last time|a while ago)/i);
    if (temporalMatch) {
      query.temporalHint = temporalMatch[1].toLowerCase();
    }
    
    return query;
  }
  
  /**
   * Get recommended search strategy based on the detected references
   */
  getSearchStrategy(message) {
    const analysis = this.analyzeMemoryReferences(message);
    const contentQuery = this.extractContentQuery(message);
    
    if (!analysis.hasMemoryReference) {
      return null;
    }
    
    const strategy = {
      searchType: 'general',
      filters: [],
      sortBy: 'relevance',
      maxResults: 5,
      contextTypes: []
    };
    
    // Line-specific requests need exact content matching
    if (contentQuery && contentQuery.requestType === 'line-specific') {
      strategy.searchType = 'exact-content';
      strategy.sortBy = 'recency';
      strategy.maxResults = 3; // Fewer results for specific requests
    }
    
    // Add content type filters
    if (contentQuery && contentQuery.contentType !== 'any') {
      strategy.filters.push({
        type: 'contentType',
        value: contentQuery.contentType
      });
    }
    
    // Add temporal filters
    if (contentQuery && contentQuery.temporalHint) {
      const temporalMap = {
        'yesterday': { hours: 48 },
        'earlier': { hours: 24 },
        'recently': { hours: 12 },
        'last time': { hours: 72 }
      };
      
      const timeFilter = temporalMap[contentQuery.temporalHint];
      if (timeFilter) {
        strategy.filters.push({
          type: 'timeRange',
          value: timeFilter
        });
      }
    }
    
    return strategy;
  }
  
  /**
   * Validate that a memory reference is reasonable
   * Helps prevent false positives
   */
  validateMemoryReference(message, conversationHistory = []) {
    const analysis = this.analyzeMemoryReferences(message);
    
    if (!analysis.hasMemoryReference) {
      return { isValid: false, reason: 'No memory reference detected' };
    }
    
    // High confidence references are usually valid
    if (analysis.confidence > 0.8) {
      return { isValid: true, reason: 'High confidence memory reference' };
    }
    
    // Check if there's actually something to reference
    if (conversationHistory.length === 0) {
      return { isValid: false, reason: 'No conversation history available' };
    }
    
    // Check for very generic references that might be false positives
    const genericPatterns = [
      /^(what|how|when|where|why|who)\s+(is|are|was|were|do|does|did|can|could|would|should)\b/i
    ];
    
    if (genericPatterns.some(pattern => pattern.test(message.trim()))) {
      return { 
        isValid: analysis.confidence > 0.6, 
        reason: analysis.confidence > 0.6 ? 'Generic but with context clues' : 'Too generic without strong context'
      };
    }
    
    return { isValid: true, reason: 'Valid memory reference' };
  }
  
  /**
   * Get ordinal suffix for numbers (1st, 2nd, 3rd, 4th, etc.)
   */
  getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
  
  /**
   * Create detailed calculation display for line counting
   * This will be used in the context file for Claude Code to show transparent reasoning
   */
  createCalculationDisplay(query, totalLines) {
    if (!query.reasoning || !query.reasoning.calculation) {
      return null;
    }
    
    const calc = query.reasoning.calculation;
    const pos = calc.targetPosition;
    
    if (calc.method === 'from-end') {
      const actualLine = totalLines - pos + 1;
      return {
        method: 'from-end',
        display: `Line counting: ${totalLines} - ${pos} + 1 = ${actualLine}`,
        explanation: `Total lines (${totalLines}) minus position from end (${pos}) plus 1 = line ${actualLine}`,
        actualLineNumber: actualLine,
        validation: actualLine > 0 && actualLine <= totalLines
      };
    } else {
      const actualLine = pos;
      return {
        method: 'from-start',
        display: `Line counting: Line ${actualLine} from start`,
        explanation: `Direct line number: ${actualLine}`,
        actualLineNumber: actualLine,
        validation: actualLine > 0 && actualLine <= totalLines
      };
    }
  }
  
  /**
   * Get statistics about reference detection
   */
  getDetectionStats() {
    return {
      totalPatterns: Object.values(this.patterns).reduce((sum, patterns) => sum + patterns.length, 0),
      patternCategories: Object.keys(this.patterns),
      contentTypes: Object.keys(this.contentTypeHints),
      confidenceThreshold: 0.3
    };
  }
}

module.exports = MemoryReferenceDetector;