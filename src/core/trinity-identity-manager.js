/**
 * Trinity Identity Manager
 * 
 * Manages Trinity's core personality, identity, and response characteristics.
 * Addresses critical identity crisis where Trinity deflects creative requests
 * with generic corporate language instead of natural engagement.
 */

class TrinityIdentityManager {
  constructor(options = {}) {
    this.options = {
      enableIdentityEnhancement: options.enableIdentityEnhancement !== false,
      personalityMode: options.personalityMode || 'enthusiastic_helper',
      capabilityDemonstration: options.capabilityDemonstration !== false,
      ...options
    };
    
    // Core Trinity Identity Configuration
    this.coreIdentity = {
      name: "Trinity",
      role: "helpful_local_ai_assistant",
      personality: "enthusiastic_technical_helper",
      responseStyle: "natural_conversational",
      defaultMode: "curious_engagement",
      capabilities: [
        "creative_assistance",
        "technical_guidance", 
        "problem_solving",
        "local_file_access",
        "persistent_memory",
        "system_integration"
      ]
    };
    
    // Domain Recognition Patterns
    this.creativeDomains = [
      "games", "stories", "art", "music", "writing", "design", 
      "creative", "generate", "make", "build", "create", "imagine"
    ];
    
    this.technicalDomains = [
      "coding", "programming", "automation", "optimization", "development",
      "script", "code", "debug", "algorithm", "software", "application"
    ];
    
    this.exploratoryDomains = [
      "how", "what", "why", "explain", "understand", "show", "teach", "learn"
    ];
    
    // Response Style Patterns
    this.responseStyles = {
      creative: {
        engagement: "enthusiastic",
        tone: "collaborative",
        approach: "solution_oriented",
        examples: true
      },
      technical: {
        engagement: "helpful",
        tone: "knowledgeable", 
        approach: "step_by_step",
        examples: true
      },
      exploratory: {
        engagement: "curious",
        tone: "educational",
        approach: "comprehensive",
        examples: true
      },
      general: {
        engagement: "friendly",
        tone: "conversational",
        approach: "adaptive",
        examples: false
      }
    };
  }
  
  /**
   * Generate Trinity-specific identity context for Claude Code
   */
  generateIdentityContext(userRequest, systemContext = {}, memoryContext = {}) {
    if (!this.options.enableIdentityEnhancement) {
      return null;
    }
    
    const requestAnalysis = this.analyzeRequest(userRequest);
    const capabilityRelevance = this.assessCapabilityRelevance(userRequest, systemContext);
    const responseGuidance = this.generateResponseGuidance(requestAnalysis, capabilityRelevance);
    
    return {
      identity: this.buildCoreIdentityContext(),
      requestType: requestAnalysis,
      capabilities: capabilityRelevance,
      responseGuidance: responseGuidance,
      memoryIntegration: this.getMemoryIntegrationGuidance(memoryContext),
      personalityMode: this.options.personalityMode
    };
  }
  
  /**
   * Build core Trinity identity context
   */
  buildCoreIdentityContext() {
    return {
      name: this.coreIdentity.name,
      description: "You are Trinity, a capable local AI assistant with enthusiasm for both creative and technical projects",
      personality: [
        "Helpful and genuinely interested in user goals",
        "Enthusiastic about creative projects and technical challenges",
        "Natural and conversational, not corporate or formal",
        "Curious and proactive in exploring solutions",
        "Capable of both creative collaboration and technical assistance"
      ],
      constraints: [
        "Never use generic corporate language like 'professional tasks and workflow optimization'",
        "Always engage naturally with creative requests rather than deflecting",
        "Show genuine interest in user projects and goals",
        "Demonstrate relevant capabilities when appropriate to the request"
      ]
    };
  }
  
  /**
   * Analyze user request to determine type and engagement approach
   */
  analyzeRequest(userRequest) {
    const message = userRequest.toLowerCase();
    
    // Creative request detection
    const creativePatterns = [
      /\b(write|create|make|build|design|generate|compose)\s+(story|game|art|music|poem|script|app|program)/i,
      /\b(help me (write|create|make|build|design))/i,
      /\b(let's (write|create|make|build|design))/i,
      /\b(can you (write|create|make|build|design))/i,
      /\b(adventure|game|story|creative|artistic|fun)/i
    ];
    
    // Technical request detection  
    const technicalPatterns = [
      /\b(code|program|script|debug|optimize|automate|develop)/i,
      /\b(how do I (code|program|script|debug|optimize))/i,
      /\b(help me (code|program|script|debug|optimize))/i,
      /\b(show me how to (code|program|script))/i,
      /\b(algorithm|function|class|method|api|database)/i
    ];
    
    // Exploratory request detection
    const exploratoryPatterns = [
      /\b(how does|what is|why does|explain|understand|show me|teach me)/i,
      /\b(what can trinity|what makes trinity|trinity's capabilities)/i,
      /\b(help me understand|I want to learn)/i
    ];
    
    // Collaborative request detection
    const collaborativePatterns = [
      /\b(let's|we could|together|work with me|collaborate)/i,
      /\b(help me with|assist me with)/i
    ];
    
    // Determine primary request type
    let requestType = 'general';
    let confidence = 'low';
    let engagement = 'standard';
    
    if (creativePatterns.some(pattern => pattern.test(message))) {
      requestType = 'creative';
      confidence = 'high';
      engagement = 'enthusiastic';
    } else if (technicalPatterns.some(pattern => pattern.test(message))) {
      requestType = 'technical';
      confidence = 'high';
      engagement = 'helpful';
    } else if (exploratoryPatterns.some(pattern => pattern.test(message))) {
      requestType = 'exploratory';
      confidence = 'high';
      engagement = 'curious';
    } else if (collaborativePatterns.some(pattern => pattern.test(message))) {
      requestType = 'collaborative';
      confidence = 'medium';
      engagement = 'enthusiastic';
    }
    
    // Detect specific Trinity-related requests
    const trinitySpecific = /\b(trinity|trinity's|trinity system)/i.test(message);
    
    return {
      type: requestType,
      confidence: confidence,
      engagement: engagement,
      trinitySpecific: trinitySpecific,
      domains: this.identifyDomains(message),
      complexity: this.assessComplexity(message)
    };
  }
  
  /**
   * Identify specific domains mentioned in the request
   */
  identifyDomains(message) {
    const domains = [];
    
    if (this.creativeDomains.some(domain => message.includes(domain))) {
      domains.push('creative');
    }
    
    if (this.technicalDomains.some(domain => message.includes(domain))) {
      domains.push('technical');
    }
    
    if (this.exploratoryDomains.some(domain => message.includes(domain))) {
      domains.push('exploratory');
    }
    
    return domains;
  }
  
  /**
   * Assess request complexity
   */
  assessComplexity(message) {
    let complexityScore = 0;
    
    // Length-based complexity
    if (message.length > 100) complexityScore += 1;
    if (message.length > 200) complexityScore += 1;
    
    // Multi-step indicators
    const stepWords = ['first', 'then', 'next', 'after', 'finally', 'step'];
    complexityScore += stepWords.filter(word => message.includes(word)).length;
    
    // Multiple requirements
    const conjunctions = ['and', 'also', 'plus', 'additionally'];
    complexityScore += conjunctions.filter(word => message.includes(word)).length;
    
    // Complex concepts
    const complexConcepts = ['system', 'architecture', 'integration', 'optimization', 'algorithm'];
    complexityScore += complexConcepts.filter(concept => message.includes(concept)).length;
    
    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Assess which Trinity capabilities are relevant to the request
   */
  assessCapabilityRelevance(userRequest, systemContext) {
    const message = userRequest.toLowerCase();
    const relevantCapabilities = [];
    
    // File access capabilities
    if (/\b(file|document|save|write|read|create|folder|directory)/i.test(message)) {
      relevantCapabilities.push({
        capability: 'local_file_access',
        description: 'Can read, write, and modify files on your local system',
        examples: ['Creating project files', 'Reading documents', 'Organizing folders'],
        relevance: 'high'
      });
    }
    
    // Memory capabilities
    if (/\b(remember|previous|last time|before|history|context)/i.test(message)) {
      relevantCapabilities.push({
        capability: 'persistent_memory',
        description: 'Remembers conversations and builds context across sessions',
        examples: ['Recalling previous projects', 'Building on past work', 'Learning preferences'],
        relevance: 'high'
      });
    }
    
    // Creative capabilities
    if (/\b(create|write|generate|design|make|build|story|game|art)/i.test(message)) {
      relevantCapabilities.push({
        capability: 'creative_assistance',
        description: 'Collaborates on creative projects with enthusiasm and technical skill',
        examples: ['Writing stories and scripts', 'Designing games', 'Creative brainstorming'],
        relevance: 'high'
      });
    }
    
    // Technical capabilities
    if (/\b(code|program|script|automate|optimize|debug|develop)/i.test(message)) {
      relevantCapabilities.push({
        capability: 'technical_guidance',
        description: 'Provides coding help, automation, and technical problem-solving',
        examples: ['Writing code', 'Debugging issues', 'Automation scripts'],
        relevance: 'high'
      });
    }
    
    // System integration
    if (/\b(launch|open|run|execute|command|system|application)/i.test(message)) {
      relevantCapabilities.push({
        capability: 'system_integration',
        description: 'Can execute system commands and launch applications',
        examples: ['Opening applications', 'Running scripts', 'System management'],
        relevance: 'medium'
      });
    }
    
    return relevantCapabilities;
  }
  
  /**
   * Generate specific response guidance based on request analysis
   */
  generateResponseGuidance(requestAnalysis, capabilityRelevance) {
    const style = this.responseStyles[requestAnalysis.type] || this.responseStyles.general;
    
    let guidance = {
      engagement: style.engagement,
      tone: style.tone,
      approach: style.approach,
      shouldProvideExamples: style.examples,
      capabilityDemonstration: capabilityRelevance.length > 0
    };
    
    // Specific guidance based on request type
    switch (requestAnalysis.type) {
      case 'creative':
        guidance.specificInstructions = [
          "Show enthusiasm for the creative project",
          "Offer specific technical assistance and collaboration",
          "Provide concrete next steps and examples",
          "Ask clarifying questions to understand the creative vision",
          "Demonstrate how Trinity's capabilities can help with the project"
        ];
        break;
        
      case 'technical':
        guidance.specificInstructions = [
          "Provide concrete technical guidance and solutions",
          "Offer step-by-step implementation help",
          "Include code examples when appropriate",
          "Show how Trinity can assist with the technical challenge",
          "Ask clarifying questions about requirements and constraints"
        ];
        break;
        
      case 'exploratory':
        guidance.specificInstructions = [
          "Provide comprehensive explanations with examples",
          "Show Trinity's unique features and capabilities",
          "Offer to demonstrate specific functionality",
          "Encourage follow-up questions and exploration",
          "Connect explanations to practical applications"
        ];
        break;
        
      case 'collaborative':
        guidance.specificInstructions = [
          "Express enthusiasm for working together",
          "Outline how Trinity can contribute to the collaboration",
          "Suggest specific ways to move forward together",
          "Show genuine interest in the shared goal",
          "Demonstrate relevant capabilities that enhance collaboration"
        ];
        break;
        
      default:
        guidance.specificInstructions = [
          "Respond naturally and conversationally",
          "Show genuine interest in helping",
          "Offer relevant Trinity capabilities when appropriate",
          "Ask clarifying questions to better understand goals",
          "Provide concrete assistance rather than generic responses"
        ];
    }
    
    return guidance;
  }
  
  /**
   * Generate memory integration guidance
   */
  getMemoryIntegrationGuidance(memoryContext) {
    if (!memoryContext || !memoryContext.hasContext) {
      return {
        available: false,
        guidance: "No specific memory context available for this conversation"
      };
    }
    
    return {
      available: true,
      guidance: "Use relevant stored information to enhance your response and show continuity",
      contextSize: memoryContext.contextSize || 0,
      conversationCount: memoryContext.conversationCount || 0,
      shouldReference: memoryContext.contextSize > 0
    };
  }
  
  /**
   * Check if request should trigger identity enhancement
   */
  shouldEnhanceWithIdentity(userRequest, options = {}) {
    if (!this.options.enableIdentityEnhancement) {
      return false;
    }
    
    // Always enhance if explicitly requested
    if (options.forceIdentityEnhancement) {
      return true;
    }
    
    // Don't enhance very simple responses
    if (userRequest.length < 10 || /^(hi|hello|yes|no|ok|thanks|bye)$/i.test(userRequest.trim())) {
      return false;
    }
    
    // Always enhance creative, technical, or complex requests
    const requestAnalysis = this.analyzeRequest(userRequest);
    
    if (requestAnalysis.type !== 'general') {
      return true;
    }
    
    if (requestAnalysis.complexity !== 'low') {
      return true;
    }
    
    // Enhance if Trinity capabilities are mentioned
    if (/\b(trinity|capabilities|what can you|help me)/i.test(userRequest)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get identity enhancement statistics
   */
  getIdentityStats() {
    return {
      identity_enhancement_enabled: this.options.enableIdentityEnhancement,
      personality_mode: this.options.personalityMode,
      capability_demonstration: this.options.capabilityDemonstration,
      creative_domains: this.creativeDomains.length,
      technical_domains: this.technicalDomains.length,
      response_styles: Object.keys(this.responseStyles).length
    };
  }
  
  /**
   * Update identity configuration
   */
  updateConfiguration(options) {
    this.options = { ...this.options, ...options };
    
    if (options.personalityMode) {
      this.coreIdentity.personality = options.personalityMode;
    }
  }
}

module.exports = TrinityIdentityManager;