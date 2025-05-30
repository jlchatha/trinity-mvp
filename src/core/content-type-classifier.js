#!/usr/bin/env node

/**
 * Content Type Classifier
 * 
 * Classifies assistant responses into categories for better memory organization.
 * Critical for Trinity-Native Memory to enable content-specific searches.
 * 
 * Categories: poem, code, explanation, example, story, general
 */

class ContentTypeClassifier {
  constructor(options = {}) {
    this.logger = options.logger || console;
    
    // Pattern definitions for each content type
    this.classificationRules = {
      poem: {
        patterns: [
          /^[A-Z][^.!?]*[\n\r][A-Z][^.!?]*[\n\r]/m, // Multi-line with proper capitalization
          /\b(roses|love|heart|soul|dreams?|night|day|stars?|moon|sun)\b/i, // Common poetry words
          /\b(rhyme|rhythm|verse|stanza|melody)\b/i, // Poetry terminology
          /^.{10,60}[\n\r].{10,60}[\n\r].{10,60}/m // 3+ short lines
        ],
        antiPatterns: [
          /function\s*\(/,
          /class\s+\w+/,
          /const\s+\w+\s*=/,
          /import\s+.*from/,
          /console\.log/,
          /\w+\.\w+\(/,
          // Technical/factual content patterns
          /##?\s+[A-Z][^#]*$/m, // Markdown headers (##, ###)
          /\b(overview|characteristics|specifications|features|description|definition)\b/i,
          /\b(inches|pounds|feet|meters|kilograms|centimeters)\b/i, // Measurements
          /\b(originally|developed|bred|designed|built|manufactured)\b/i, // Technical language
          /\b\d+[-–]\d+\s+(inches|pounds|feet|years|century)\b/i, // Measurement ranges
          /\b(males?|females?|size|build|weight|height)\b/i // Physical characteristics
        ],
        scorer: (text) => {
          const lines = text.split(/[\n\r]+/).filter(line => line.trim());
          if (lines.length < 3) return 0;
          
          let score = 0;
          
          // Line count scoring (poems typically 3-20 lines)
          if (lines.length >= 3 && lines.length <= 20) score += 0.3;
          
          // Line length scoring (poems have varied but generally shorter lines)
          const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
          if (avgLineLength >= 20 && avgLineLength <= 70) score += 0.3;
          
          // Consistent line structure
          const lineLengthVariance = this.calculateLineVariance(lines);
          if (lineLengthVariance < 0.5) score += 0.2;
          
          // Poetic language indicators
          const poeticWords = ['love', 'heart', 'soul', 'dream', 'night', 'day', 'star', 'moon', 'sun', 'rose', 'beauty', 'gentle', 'soft', 'whisper'];
          const poeticCount = poeticWords.filter(word => new RegExp('\\b' + word + '\\b', 'i').test(text)).length;
          score += Math.min(poeticCount * 0.1, 0.4);
          
          return Math.min(score, 1.0);
        }
      },
      
      code: {
        patterns: [
          /function\s+\w+\s*\([^)]*\)\s*{/,
          /const\s+\w+\s*=\s*(?:require\(|function|\([^)]*\)\s*=>)/,
          /class\s+\w+\s*(?:extends\s+\w+)?\s*{/,
          /import\s+(?:{[^}]+}|\w+)\s+from\s+['"][^'"]+['"]/,
          /(?:if|for|while|switch)\s*\([^)]+\)\s*{/,
          /\w+\.\w+\([^)]*\);?/,
          /\/\/.*|\/\*[\s\S]*?\*\//,
          /```[\s\S]*?```/
        ],
        antiPatterns: [
          /this\s+(means|explains|shows|demonstrates)/i,
          /for\s+example/i,
          /in\s+other\s+words/i
        ],
        scorer: (text) => {
          let score = 0;
          
          // Count code-specific patterns
          const codePatterns = [
            /function\s+\w+/g,
            /const\s+\w+\s*=/g,
            /\w+\.\w+\(/g,
            /=>/g,
            /console\.log/g,
            /return\s+/g
          ];
          
          codePatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            score += matches.length * 0.15;
          });
          
          // Code block indicators
          if (/```/.test(text)) score += 0.4;
          if (/^\s*\/\/|^\s*\/\*/m.test(text)) score += 0.2;
          
          // Syntax highlighting keywords
          const keywords = ['function', 'const', 'let', 'var', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while'];
          const keywordCount = keywords.filter(keyword => new RegExp('\\b' + keyword + '\\b').test(text)).length;
          score += Math.min(keywordCount * 0.1, 0.5);
          
          return Math.min(score, 1.0);
        }
      },
      
      explanation: {
        patterns: [
          /this\s+(means|explains|shows|demonstrates|indicates)/i,
          /in\s+other\s+words/i,
          /for\s+example/i,
          /the\s+reason\s+(is|why|that)/i,
          /to\s+understand\s+(this|that|how|why)/i,
          /essentially[,\s]/i,
          /\b(because|therefore|thus|hence|consequently)\b/i
        ],
        antiPatterns: [
          /function\s*\(/,
          /^[A-Z][^.!?]*[\n\r][A-Z][^.!?]*[\n\r]/m // Poetry structure
        ],
        scorer: (text) => {
          let score = 0;
          
          // Length scoring (explanations tend to be longer)
          if (text.length > 200) score += 0.3;
          if (text.length > 500) score += 0.2;
          
          // Explanatory phrases
          const explanatoryPhrases = [
            'this means', 'in other words', 'for example', 'to understand',
            'the reason', 'because', 'therefore', 'essentially', 'specifically'
          ];
          
          explanatoryPhrases.forEach(phrase => {
            if (new RegExp('\\b' + phrase.replace(/\s+/g, '\\s+') + '\\b', 'i').test(text)) {
              score += 0.15;
            }
          });
          
          // Sentence structure (explanations have varied sentence lengths)
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
          if (sentences.length >= 3) score += 0.2;
          
          return Math.min(score, 1.0);
        }
      },
      
      example: {
        patterns: [
          /for\s+example/i,
          /here'?s\s+an?\s+example/i,
          /consider\s+(this|the following)/i,
          /imagine\s+(that|if)/i,
          /let'?s\s+say/i,
          /suppose\s+(that|you)/i
        ],
        antiPatterns: [],
        scorer: (text) => {
          let score = 0;
          
          // Example keywords
          const exampleWords = ['example', 'instance', 'case', 'scenario', 'situation', 'consider', 'imagine', 'suppose'];
          exampleWords.forEach(word => {
            if (new RegExp('\\b' + word + '\\b', 'i').test(text)) {
              score += 0.2;
            }
          });
          
          // Hypothetical language
          if (/\b(if|when|suppose|imagine|consider)\b/i.test(text)) score += 0.2;
          
          return Math.min(score, 1.0);
        }
      },
      
      story: {
        patterns: [
          /once\s+upon\s+a\s+time/i,
          /there\s+(was|were)\s+(a|an|once)/i,
          /long\s+ago/i,
          /in\s+a\s+(distant|far|small|large|magical)/i,
          /(he|she|they)\s+(walked|ran|said|thought|felt)/
        ],
        antiPatterns: [
          /function\s*\(/,
          /this\s+(means|explains)/i
        ],
        scorer: (text) => {
          let score = 0;
          
          // Narrative indicators
          const narrativeWords = ['once', 'there', 'then', 'suddenly', 'finally', 'meanwhile'];
          narrativeWords.forEach(word => {
            if (new RegExp('\\b' + word + '\\b', 'i').test(text)) {
              score += 0.15;
            }
          });
          
          // Past tense verbs (common in stories)
          const pastTensePatterns = /\b\w+ed\b/g;
          const pastTenseMatches = text.match(pastTensePatterns) || [];
          score += Math.min(pastTenseMatches.length * 0.05, 0.3);
          
          // Character pronouns
          if (/\b(he|she|they)\s+(was|were|said|walked|ran|thought|felt)\b/i.test(text)) {
            score += 0.3;
          }
          
          return Math.min(score, 1.0);
        }
      },
      
      general: {
        patterns: [],
        antiPatterns: [],
        scorer: () => 0.1 // Base score for general content
      }
    };
  }
  
  /**
   * Classify content into the most likely category
   */
  classify(text) {
    if (!text || typeof text !== 'string') {
      return {
        type: 'general',
        confidence: 0,
        scores: {},
        reasoning: 'No text provided'
      };
    }
    
    const scores = {};
    let bestType = 'general';
    let bestScore = 0;
    
    // Calculate scores for each content type
    Object.entries(this.classificationRules).forEach(([type, rules]) => {
      let score = 0;
      
      // Pattern matching
      rules.patterns.forEach(pattern => {
        if (pattern.test(text)) score += 0.2;
      });
      
      // Anti-pattern penalty
      rules.antiPatterns.forEach(pattern => {
        if (pattern.test(text)) score -= 0.3;
      });
      
      // Custom scoring function
      if (rules.scorer) {
        score += rules.scorer.call(this, text);
      }
      
      // Ensure score is non-negative
      score = Math.max(score, 0);
      
      scores[type] = score;
      
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    });
    
    // Confidence calculation
    const confidence = bestScore;
    const normalizedConfidence = Math.min(confidence, 1.0);
    
    // If no strong classification, default to general
    if (normalizedConfidence < 0.3) {
      bestType = 'general';
    }
    
    return {
      type: bestType,
      confidence: normalizedConfidence,
      scores,
      reasoning: this.generateReasoning(bestType, normalizedConfidence, scores)
    };
  }
  
  /**
   * Get all classifications with scores
   */
  classifyWithAlternatives(text) {
    const primary = this.classify(text);
    
    // Sort all scores to get alternatives
    const sortedScores = Object.entries(primary.scores)
      .sort(([,a], [,b]) => b - a)
      .map(([type, score]) => ({ type, score }));
    
    return {
      primary: primary.type,
      confidence: primary.confidence,
      alternatives: sortedScores,
      reasoning: primary.reasoning
    };
  }
  
  /**
   * Validate classification with additional context
   */
  validateClassification(text, suggestedType = null) {
    const classification = this.classify(text);
    
    if (suggestedType && suggestedType !== classification.type) {
      // Check if suggested type has reasonable score
      const suggestedScore = classification.scores[suggestedType] || 0;
      
      if (suggestedScore > 0.2) {
        return {
          accepted: suggestedType,
          confidence: suggestedScore,
          reason: `Accepted suggested type '${suggestedType}' with score ${suggestedScore.toFixed(2)}`
        };
      }
    }
    
    return {
      accepted: classification.type,
      confidence: classification.confidence,
      reason: `Auto-classified as '${classification.type}' with confidence ${classification.confidence.toFixed(2)}`
    };
  }
  
  /**
   * Helper method to calculate line variance for poetry detection
   */
  calculateLineVariance(lines) {
    if (lines.length < 2) return 1.0;
    
    const lengths = lines.map(line => line.length);
    const mean = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    
    return variance / mean; // Coefficient of variation
  }
  
  /**
   * Generate human-readable reasoning for classification
   */
  generateReasoning(type, confidence, scores) {
    const topScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([t, s]) => `${t}: ${s.toFixed(2)}`)
      .join(', ');
    
    let reasoning = `Classified as '${type}' with ${(confidence * 100).toFixed(0)}% confidence. `;
    reasoning += `Scores: ${topScores}. `;
    
    switch (type) {
      case 'poem':
        reasoning += 'Detected poetry patterns: line structure, poetic language, verse formatting.';
        break;
      case 'code':
        reasoning += 'Detected code patterns: functions, syntax, programming keywords.';
        break;
      case 'explanation':
        reasoning += 'Detected explanatory patterns: descriptive language, clarifying phrases.';
        break;
      case 'example':
        reasoning += 'Detected example patterns: demonstrative language, hypothetical scenarios.';
        break;
      case 'story':
        reasoning += 'Detected narrative patterns: storytelling language, character actions.';
        break;
      default:
        reasoning += 'No specific patterns detected, classified as general content.';
    }
    
    return reasoning;
  }
  
  /**
   * Get classifier statistics and configuration
   */
  getClassifierInfo() {
    const typeCount = Object.keys(this.classificationRules).length;
    const totalPatterns = Object.values(this.classificationRules)
      .reduce((sum, rules) => sum + rules.patterns.length, 0);
    
    return {
      supportedTypes: Object.keys(this.classificationRules),
      totalTypes: typeCount,
      totalPatterns,
      confidenceThreshold: 0.3,
      version: '1.0.0'
    };
  }
}

module.exports = ContentTypeClassifier;