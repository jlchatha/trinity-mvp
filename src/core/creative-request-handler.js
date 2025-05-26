/**
 * Creative Request Handler
 * 
 * Specialized handler for recognizing and processing creative, technical,
 * and complex requests that Trinity should engage with enthusiastically
 * rather than deflecting with generic corporate responses.
 */

class CreativeRequestHandler {
  constructor(options = {}) {
    this.options = {
      enableCreativeRecognition: options.enableCreativeRecognition !== false,
      enableTechnicalRecognition: options.enableTechnicalRecognition !== false,
      enableCollaborativeRecognition: options.enableCollaborativeRecognition !== false,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      ...options
    };
    
    // Creative request patterns
    this.creativePatterns = {
      // Direct creative requests
      gameCreation: [
        /\b(create|make|build|design|develop)\s+(a\s+)?(game|adventure|rpg|puzzle|story game)/i,
        /\b(help me (create|make|build|design|develop)\s+(a\s+)?(game|adventure))/i,
        /\b(can you (create|make|build|design|develop)\s+(a\s+)?(game|adventure))/i,
        /\b(let's (create|make|build|design|develop)\s+(a\s+)?(game|adventure))/i,
        /\b(adventure game|computer game|video game|text game)/i
      ],
      
      storyWriting: [
        /\b(write|create|compose|generate)\s+(a\s+)?(story|tale|narrative|script|novel)/i,
        /\b(help me (write|create|compose)\s+(a\s+)?(story|tale|narrative))/i,
        /\b(storytelling|creative writing|fiction)/i
      ],
      
      artAndDesign: [
        /\b(create|design|make|generate)\s+(art|artwork|design|visual|graphic)/i,
        /\b(artistic|creative design|visual design)/i,
        /\b(help me design|help me create art)/i
      ],
      
      musicAndAudio: [
        /\b(create|compose|make|generate)\s+(music|song|audio|sound)/i,
        /\b(musical|composition|soundtrack)/i
      ],
      
      generalCreative: [
        /\b(creative project|artistic project|fun project)/i,
        /\b(something creative|something fun|something interesting)/i,
        /\b(brainstorm|ideation|creative thinking)/i
      ]
    };
    
    // Technical request patterns
    this.technicalPatterns = {
      codingHelp: [
        /\b(write|create|help me write|show me how to write)\s+(code|program|script|function)/i,
        /\b(programming|coding|development|software)/i,
        /\b(algorithm|data structure|api|database)/i
      ],
      
      automation: [
        /\b(automate|automation|script|batch|workflow)/i,
        /\b(help me automate|show me how to automate)/i,
        /\b(streamline|optimize|efficiency)/i
      ],
      
      debugging: [
        /\b(debug|fix|troubleshoot|error|bug|issue)/i,
        /\b(not working|broken|problem with|help with)/i
      ],
      
      systemIntegration: [
        /\b(integrate|integration|connect|setup|configure)/i,
        /\b(system|application|tool|service)/i
      ]
    };
    
    // Collaborative patterns
    this.collaborativePatterns = [
      /\b(let's|we can|we could|together|work with me|collaborate)/i,
      /\b(help me with|assist me with|guide me through)/i,
      /\b(partnership|team up|work together)/i,
      /\b(can we|shall we|would you help)/i
    ];
    
    // Exploratory patterns
    this.exploratoryPatterns = [
      /\b(how does|what is|what are|why does|explain|understand)/i,
      /\b(show me|teach me|help me understand|I want to learn)/i,
      /\b(what can trinity|trinity's capabilities|trinity's features)/i,
      /\b(compared to|different from|unique about)/i
    ];
    
    // Trinity-specific patterns
    this.trinityPatterns = [
      /\b(trinity|trinity's|trinity system|trinity mvp)/i,
      /\b(local ai|local assistant|memory system|persistent memory)/i,
      /\b(file access|local files|system integration)/i
    ];
  }
  
  /**
   * Main method: Recognize and classify request type with confidence scoring
   */
  recognizeAndClassifyRequest(message, context = {}) {
    if (!this.options.enableCreativeRecognition && !this.options.enableTechnicalRecognition) {
      return { type: 'general', confidence: 0, engagement: 'standard' };
    }
    
    const analysis = {
      creative: this.analyzeCreativeContent(message),
      technical: this.analyzeTechnicalContent(message),
      collaborative: this.analyzeCollaborativeContent(message),
      exploratory: this.analyzeExploratoryContent(message),
      trinitySpecific: this.analyzeTrinitySpecific(message)
    };
    
    // Determine primary classification
    const classification = this.classifyRequest(analysis, message);
    
    // Add engagement recommendations
    const engagement = this.determineEngagementStrategy(classification, analysis);
    
    return {
      type: classification.type,
      subtype: classification.subtype,
      confidence: classification.confidence,
      engagement: engagement,
      analysis: analysis,
      recommendations: this.generateResponseRecommendations(classification, analysis)
    };
  }
  
  /**
   * Analyze creative content in the message
   */
  analyzeCreativeContent(message) {
    const results = {
      detected: false,
      confidence: 0,
      categories: [],
      patterns: []
    };
    
    if (!this.options.enableCreativeRecognition) {
      return results;
    }
    
    // Check each creative pattern category
    for (const [category, patterns] of Object.entries(this.creativePatterns)) {
      const categoryMatches = patterns.filter(pattern => pattern.test(message));
      
      if (categoryMatches.length > 0) {
        results.detected = true;
        results.categories.push(category);
        results.patterns.push(...categoryMatches);
        
        // Higher confidence for more specific patterns
        if (category === 'gameCreation' || category === 'storyWriting') {
          results.confidence = Math.max(results.confidence, 0.9);
        } else {
          results.confidence = Math.max(results.confidence, 0.7);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Analyze technical content in the message
   */
  analyzeTechnicalContent(message) {
    const results = {
      detected: false,
      confidence: 0,
      categories: [],
      patterns: []
    };
    
    if (!this.options.enableTechnicalRecognition) {
      return results;
    }
    
    // Check each technical pattern category
    for (const [category, patterns] of Object.entries(this.technicalPatterns)) {
      const categoryMatches = patterns.filter(pattern => pattern.test(message));
      
      if (categoryMatches.length > 0) {
        results.detected = true;
        results.categories.push(category);
        results.patterns.push(...categoryMatches);
        
        // Technical requests generally high confidence
        results.confidence = Math.max(results.confidence, 0.8);
      }
    }
    
    return results;
  }
  
  /**
   * Analyze collaborative content in the message
   */
  analyzeCollaborativeContent(message) {
    const results = {
      detected: false,
      confidence: 0,
      patterns: []
    };
    
    if (!this.options.enableCollaborativeRecognition) {
      return results;
    }
    
    const matches = this.collaborativePatterns.filter(pattern => pattern.test(message));
    
    if (matches.length > 0) {
      results.detected = true;
      results.patterns = matches;
      results.confidence = Math.min(0.8, matches.length * 0.3); // Multiple collaborative indicators increase confidence
    }
    
    return results;
  }
  
  /**
   * Analyze exploratory content in the message
   */
  analyzeExploratoryContent(message) {
    const results = {
      detected: false,
      confidence: 0,
      patterns: []
    };
    
    const matches = this.exploratoryPatterns.filter(pattern => pattern.test(message));
    
    if (matches.length > 0) {
      results.detected = true;
      results.patterns = matches;
      results.confidence = Math.min(0.7, matches.length * 0.25);
    }
    
    return results;
  }
  
  /**
   * Analyze Trinity-specific content
   */
  analyzeTrinitySpecific(message) {
    const results = {
      detected: false,
      confidence: 0,
      patterns: []
    };
    
    const matches = this.trinityPatterns.filter(pattern => pattern.test(message));
    
    if (matches.length > 0) {
      results.detected = true;
      results.patterns = matches;
      results.confidence = 0.9; // High confidence for Trinity-specific requests
    }
    
    return results;
  }
  
  /**
   * Classify the request based on analysis results
   */
  classifyRequest(analysis, message) {
    const scores = {
      creative: analysis.creative.confidence,
      technical: analysis.technical.confidence,
      collaborative: analysis.collaborative.confidence,
      exploratory: analysis.exploratory.confidence,
      trinitySpecific: analysis.trinitySpecific.confidence
    };
    
    // Find highest scoring category
    const maxScore = Math.max(...Object.values(scores));
    const primaryType = Object.keys(scores).find(key => scores[key] === maxScore);
    
    // Determine subtype based on primary type
    let subtype = 'general';
    if (primaryType === 'creative' && analysis.creative.categories.length > 0) {
      subtype = analysis.creative.categories[0];
    } else if (primaryType === 'technical' && analysis.technical.categories.length > 0) {
      subtype = analysis.technical.categories[0];
    }
    
    // Special case: Trinity-specific requests with other content
    if (analysis.trinitySpecific.detected && maxScore >= this.options.confidenceThreshold) {
      return {
        type: 'trinitySpecific',
        subtype: primaryType !== 'trinitySpecific' ? primaryType : 'capabilities',
        confidence: analysis.trinitySpecific.confidence
      };
    }
    
    // Regular classification
    if (maxScore >= this.options.confidenceThreshold) {
      return {
        type: primaryType,
        subtype: subtype,
        confidence: maxScore
      };
    }
    
    // Default to general if no strong classification
    return {
      type: 'general',
      subtype: 'conversational',
      confidence: 0.5
    };
  }
  
  /**
   * Determine engagement strategy based on classification
   */
  determineEngagementStrategy(classification, analysis) {
    const strategies = {
      creative: {
        level: 'enthusiastic',
        approach: 'collaborative',
        tone: 'excited',
        shouldDemonstrate: true
      },
      technical: {
        level: 'helpful',
        approach: 'solution_oriented',
        tone: 'knowledgeable',
        shouldDemonstrate: true
      },
      collaborative: {
        level: 'enthusiastic',
        approach: 'partnership',
        tone: 'friendly',
        shouldDemonstrate: true
      },
      exploratory: {
        level: 'curious',
        approach: 'educational',
        tone: 'informative',
        shouldDemonstrate: true
      },
      trinitySpecific: {
        level: 'proud',
        approach: 'demonstrative',
        tone: 'confident',
        shouldDemonstrate: true
      },
      general: {
        level: 'friendly',
        approach: 'adaptive',
        tone: 'conversational',
        shouldDemonstrate: false
      }
    };
    
    const baseStrategy = strategies[classification.type] || strategies.general;
    
    // Enhance strategy based on confidence and analysis
    if (classification.confidence >= 0.9) {
      baseStrategy.level = 'highly_' + baseStrategy.level;
    }
    
    // Add collaborative elements if detected
    if (analysis.collaborative.detected) {
      baseStrategy.collaborative = true;
    }
    
    return baseStrategy;
  }
  
  /**
   * Generate specific response recommendations
   */
  generateResponseRecommendations(classification, analysis) {
    const recommendations = {
      shouldEngage: classification.confidence >= this.options.confidenceThreshold,
      responseType: classification.type,
      tone: this.getRecommendedTone(classification),
      structure: this.getRecommendedStructure(classification),
      capabilities: this.getRelevantCapabilities(classification, analysis),
      examples: this.shouldProvideExamples(classification),
      followUpQuestions: this.getRecommendedFollowUps(classification, analysis)
    };
    
    // Specific guidance based on request type
    switch (classification.type) {
      case 'creative':
        recommendations.specificGuidance = [
          "Express genuine enthusiasm for the creative project",
          "Offer specific technical assistance and collaboration", 
          "Provide concrete next steps and examples",
          "Ask clarifying questions about the creative vision",
          "Show how Trinity's capabilities enhance the creative process"
        ];
        break;
        
      case 'technical':
        recommendations.specificGuidance = [
          "Provide practical, actionable technical guidance",
          "Offer step-by-step implementation help",
          "Include relevant code examples or pseudocode",
          "Demonstrate Trinity's technical capabilities",
          "Ask about specific requirements and constraints"
        ];
        break;
        
      case 'trinitySpecific':
        recommendations.specificGuidance = [
          "Showcase Trinity's unique features with pride",
          "Provide specific examples of capabilities",
          "Demonstrate local processing and memory advantages",
          "Offer to show Trinity's capabilities in action",
          "Compare to other AI assistants when relevant"
        ];
        break;
        
      case 'exploratory':
        recommendations.specificGuidance = [
          "Provide comprehensive, educational explanations",
          "Use examples to illustrate concepts",
          "Offer to demonstrate relevant functionality",
          "Encourage deeper exploration and follow-up questions",
          "Connect explanations to practical applications"
        ];
        break;
        
      default:
        recommendations.specificGuidance = [
          "Respond naturally and conversationally",
          "Show genuine interest in helping",
          "Offer relevant assistance based on request context",
          "Ask clarifying questions to better understand goals"
        ];
    }
    
    return recommendations;
  }
  
  /**
   * Get recommended tone for response
   */
  getRecommendedTone(classification) {
    const toneMap = {
      creative: 'enthusiastic_collaborative',
      technical: 'helpful_knowledgeable',
      collaborative: 'friendly_enthusiastic',
      exploratory: 'curious_educational',
      trinitySpecific: 'proud_demonstrative',
      general: 'friendly_conversational'
    };
    
    return toneMap[classification.type] || toneMap.general;
  }
  
  /**
   * Get recommended response structure
   */
  getRecommendedStructure(classification) {
    const structureMap = {
      creative: ['acknowledge_enthusiasm', 'offer_collaboration', 'provide_next_steps', 'ask_clarifying_questions'],
      technical: ['acknowledge_challenge', 'provide_solution_approach', 'offer_examples', 'ask_requirements'],
      collaborative: ['express_enthusiasm', 'outline_collaboration', 'suggest_approach', 'invite_discussion'],
      exploratory: ['provide_explanation', 'use_examples', 'offer_demonstration', 'encourage_questions'],
      trinitySpecific: ['showcase_capabilities', 'provide_examples', 'offer_demonstration', 'invite_exploration'],
      general: ['acknowledge_request', 'provide_assistance', 'ask_clarification']
    };
    
    return structureMap[classification.type] || structureMap.general;
  }
  
  /**
   * Get capabilities relevant to the request
   */
  getRelevantCapabilities(classification, analysis) {
    const capabilityMap = {
      creative: ['creative_collaboration', 'file_generation', 'project_organization'],
      technical: ['code_generation', 'automation', 'debugging', 'system_integration'],
      collaborative: ['project_collaboration', 'interactive_development', 'iterative_refinement'],
      exploratory: ['knowledge_sharing', 'demonstration', 'educational_examples'],
      trinitySpecific: ['local_processing', 'persistent_memory', 'file_access', 'system_integration'],
      general: ['general_assistance', 'problem_solving']
    };
    
    return capabilityMap[classification.type] || capabilityMap.general;
  }
  
  /**
   * Determine if examples should be provided
   */
  shouldProvideExamples(classification) {
    return ['creative', 'technical', 'exploratory', 'trinitySpecific'].includes(classification.type);
  }
  
  /**
   * Get recommended follow-up questions
   */
  getRecommendedFollowUps(classification, analysis) {
    const followUpMap = {
      creative: [
        "What style or genre are you envisioning?",
        "Would you like me to help with the technical implementation?",
        "Do you have any specific features or elements in mind?"
      ],
      technical: [
        "What's your current setup or environment?",
        "Are there any specific constraints or requirements?",
        "Would you like me to walk you through the implementation?"
      ],
      collaborative: [
        "How would you like to approach this together?",
        "What role would you like me to play in this project?",
        "Shall we start with planning or dive right into implementation?"
      ],
      exploratory: [
        "Would you like me to demonstrate any specific features?",
        "Are there particular aspects you'd like to explore further?",
        "Would examples help clarify how this works?"
      ],
      trinitySpecific: [
        "Would you like me to show you a specific capability?",
        "Are you interested in comparing Trinity to other assistants?",
        "What would you like to try with Trinity's unique features?"
      ]
    };
    
    return followUpMap[classification.type] || [
      "How can I best help you with this?",
      "Would you like me to provide more specific guidance?"
    ];
  }
  
  /**
   * Get handler statistics
   */
  getHandlerStats() {
    return {
      creative_recognition_enabled: this.options.enableCreativeRecognition,
      technical_recognition_enabled: this.options.enableTechnicalRecognition,
      collaborative_recognition_enabled: this.options.enableCollaborativeRecognition,
      confidence_threshold: this.options.confidenceThreshold,
      creative_pattern_categories: Object.keys(this.creativePatterns).length,
      technical_pattern_categories: Object.keys(this.technicalPatterns).length,
      collaborative_patterns: this.collaborativePatterns.length,
      exploratory_patterns: this.exploratoryPatterns.length,
      trinity_patterns: this.trinityPatterns.length
    };
  }
}

module.exports = CreativeRequestHandler;