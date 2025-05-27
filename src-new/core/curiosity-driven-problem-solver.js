/**
 * Curiosity-Driven Problem Solver
 * 
 * Enhances Trinity MVP with proactive curiosity and problem-solving capabilities:
 * - Analyzes user messages for exploration opportunities
 * - Provides context for curious, helpful responses
 * - Identifies multiple solution pathways
 * - Suggests creative alternatives when constraints exist
 * - Maintains organic, non-forced helpfulness
 */
class CuriosityDrivenProblemSolver {
  constructor(options = {}) {
    this.options = {
      enableCuriosity: options.enableCuriosity !== false,
      creativityLevel: options.creativityLevel || 'moderate',
      explorationDepth: options.explorationDepth || 'balanced',
      ...options
    };
  }
  
  /**
   * Main method: enhance message with curiosity if exploration opportunity exists
   */
  async enhanceWithCuriosity(message, systemContext, conversationHistory = []) {
    if (!this.options.enableCuriosity) {
      return null;
    }
    
    const problemAnalysis = this.analyzeProblem(message, systemContext, conversationHistory);
    
    if (problemAnalysis.has_exploration_opportunity) {
      return this.buildCuriousResponse(problemAnalysis, systemContext);
    }
    
    return null; // No curiosity enhancement needed
  }
  
  /**
   * Analyze problem for exploration opportunities
   */
  analyzeProblem(message, systemContext, conversationHistory = []) {
    const primaryGoal = this.extractPrimaryGoal(message);
    const complexityLevel = this.assessComplexity(message, conversationHistory);
    const solutionPathways = this.identifyPossibleSolutions(message, systemContext);
    const creativeAlternatives = this.generateCreativeOptions(message, systemContext);
    const explorationNeeds = this.detectExplorationNeeds(message, systemContext);
    
    return {
      has_exploration_opportunity: this.shouldExplore(primaryGoal, complexityLevel, solutionPathways, explorationNeeds),
      primary_goal: primaryGoal,
      complexity_level: complexityLevel,
      solution_pathways: solutionPathways,
      creative_alternatives: creativeAlternatives,
      exploration_needs: explorationNeeds,
      curiosity_level: this.determineCuriosityLevel(message, systemContext)
    };
  }
  
  /**
   * Extract primary goal from user message
   */
  extractPrimaryGoal(message) {
    const goalPatterns = [
      { pattern: /I want to (.+?)(?:\.|$)/i, type: 'explicit_desire', extract: true },
      { pattern: /I need to (.+?)(?:\.|$)/i, type: 'explicit_need', extract: true },
      { pattern: /trying to (.+?)(?:\.|$)/i, type: 'current_attempt', extract: true },
      { pattern: /help me (.+?)(?:\.|$)/i, type: 'assistance_request', extract: true },
      { pattern: /how do I (.+?)(?:\?|$)/i, type: 'guidance_seeking', extract: true },
      { pattern: /can you (.+?)(?:\?|$)/i, type: 'capability_inquiry', extract: true },
      { pattern: /is it possible to (.+?)(?:\?|$)/i, type: 'feasibility_question', extract: true }
    ];
    
    for (const { pattern, type, extract } of goalPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type,
          description: extract ? match[1].trim() : 'general_goal',
          confidence: 'high'
        };
      }
    }
    
    // Fallback: analyze for implicit goals
    const implicitGoals = this.detectImplicitGoals(message);
    return implicitGoals.length > 0 ? implicitGoals[0] : { type: 'unclear', description: 'goal unclear', confidence: 'low' };
  }
  
  /**
   * Detect implicit goals from message content
   */
  detectImplicitGoals(message) {
    const implicitPatterns = [
      { keywords: ['problem', 'issue', 'stuck', 'error', 'bug'], goal: { type: 'problem_solving', description: 'solve a problem' }},
      { keywords: ['create', 'build', 'make', 'generate'], goal: { type: 'creation', description: 'create something' }},
      { keywords: ['learn', 'understand', 'explain', 'teach'], goal: { type: 'learning', description: 'learn or understand' }},
      { keywords: ['improve', 'optimize', 'better', 'enhance'], goal: { type: 'improvement', description: 'improve something' }},
      { keywords: ['automate', 'streamline', 'efficient'], goal: { type: 'automation', description: 'automate a process' }}
    ];
    
    const messageLower = message.toLowerCase();
    return implicitPatterns
      .filter(({ keywords }) => keywords.some(keyword => messageLower.includes(keyword)))
      .map(({ goal }) => ({ ...goal, confidence: 'medium' }));
  }
  
  /**
   * Assess complexity of the user's request
   */
  assessComplexity(message, conversationHistory) {
    let complexityScore = 0;
    
    // Message length complexity
    if (message.length > 200) complexityScore += 1;
    if (message.length > 500) complexityScore += 1;
    
    // Technical complexity indicators
    const technicalTerms = [
      'algorithm', 'database', 'API', 'architecture', 'framework', 'integration',
      'deployment', 'configuration', 'optimization', 'scalability', 'performance'
    ];
    complexityScore += technicalTerms.filter(term => 
      message.toLowerCase().includes(term)
    ).length;
    
    // Multi-step complexity
    const stepIndicators = ['first', 'then', 'next', 'after', 'finally', 'step'];
    if (stepIndicators.some(indicator => message.toLowerCase().includes(indicator))) {
      complexityScore += 2;
    }
    
    // Multiple requirements
    const requirementIndicators = ['also', 'and', 'plus', 'additionally', 'furthermore'];
    complexityScore += requirementIndicators.filter(indicator => 
      message.toLowerCase().includes(indicator)
    ).length;
    
    // Conversation history complexity
    if (conversationHistory.length > 5) complexityScore += 1;
    if (conversationHistory.length > 10) complexityScore += 1;
    
    // Return complexity level
    if (complexityScore >= 5) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Identify possible solution pathways
   */
  identifyPossibleSolutions(message, systemContext) {
    const pathways = [];
    
    // File-based solutions
    if (this.messageIndicatesFileWork(message)) {
      pathways.push({
        category: 'file_manipulation',
        description: 'File-based solution using Trinity\'s local file access',
        feasibility: 'high',
        examples: ['Read/write files', 'Create documentation', 'Analyze file contents']
      });
    }
    
    // Memory-based solutions
    if (this.messageIndicatesMemoryWork(message)) {
      pathways.push({
        category: 'memory_integration',
        description: 'Leverage Trinity\'s conversation memory and context',
        feasibility: 'high',
        examples: ['Build on previous conversations', 'Reference past solutions', 'Learn from patterns']
      });
    }
    
    // Analysis solutions
    if (this.messageIndicatesAnalysis(message)) {
      pathways.push({
        category: 'analysis_and_insight',
        description: 'Analytical approach to understand and solve the problem',
        feasibility: 'high',
        examples: ['Break down complex problems', 'Identify patterns', 'Provide structured analysis']
      });
    }
    
    // Creative solutions
    if (this.messageIndicatesCreativity(message)) {
      pathways.push({
        category: 'creative_generation',
        description: 'Creative approach to generate new solutions',
        feasibility: 'medium',
        examples: ['Brainstorm alternatives', 'Think outside the box', 'Explore novel approaches']
      });
    }
    
    // Automation solutions
    if (this.messageIndicatesAutomation(message)) {
      pathways.push({
        category: 'automation_workflow',
        description: 'Automated approach to streamline processes',
        feasibility: 'medium',
        examples: ['Create reusable workflows', 'Automate repetitive tasks', 'Build systematic approaches']
      });
    }
    
    return pathways.length > 0 ? pathways : [{
      category: 'general_assistance',
      description: 'General problem-solving approach',
      feasibility: 'high',
      examples: ['Step-by-step guidance', 'Clear explanations', 'Practical solutions']
    }];
  }
  
  /**
   * Generate creative alternative options
   */
  generateCreativeOptions(message, systemContext) {
    const alternatives = [];
    
    // If user mentions standard/normal approach, suggest creative alternatives
    if (/normal|usual|standard|typical|regular|traditional/i.test(message)) {
      alternatives.push({
        type: 'non_standard_approach',
        description: 'Explore creative alternatives to standard approaches',
        reasoning: 'User mentioned standard approach, creativity could add value'
      });
    }
    
    // If user expresses frustration, suggest different angles
    if (/frustrated|stuck|confused|difficult|hard|challenging|impossible/i.test(message)) {
      alternatives.push({
        type: 'reframe_problem',
        description: 'Approach the problem from a completely different angle',
        reasoning: 'User seems stuck, reframing might unlock new solutions'
      });
    }
    
    // If user seeks efficiency, suggest optimization alternatives
    if (/faster|quicker|better|improve|optimize|efficient|streamline/i.test(message)) {
      alternatives.push({
        type: 'optimization_focused',
        description: 'Optimize for efficiency and performance',
        reasoning: 'User values efficiency, optimization alternatives could help'
      });
    }
    
    // If problem seems complex, suggest decomposition
    if (this.assessComplexity(message, []) === 'high') {
      alternatives.push({
        type: 'problem_decomposition',
        description: 'Break complex problem into smaller, manageable pieces',
        reasoning: 'Complex problem could benefit from systematic decomposition'
      });
    }
    
    return alternatives;
  }
  
  /**
   * Detect when exploration/curiosity would be valuable
   */
  detectExplorationNeeds(message, systemContext) {
    const needs = [];
    
    // Questions invite exploration
    if (/\?/.test(message) || /how|what|why|when|where|which|who/i.test(message)) {
      needs.push('answer_exploration');
    }
    
    // Vague requests need clarification
    if (/help|assist|guide|support/i.test(message) && message.length < 50) {
      needs.push('clarification_needed');
    }
    
    // Multiple possible interpretations
    if (this.hasMultipleInterpretations(message)) {
      needs.push('disambiguation_valuable');
    }
    
    // User seems to be exploring options
    if (/option|alternative|choice|possibility|different way|another approach/i.test(message)) {
      needs.push('options_exploration');
    }
    
    // Creative or innovative requests
    if (/creative|innovative|unique|original|novel|different|new idea/i.test(message)) {
      needs.push('creative_exploration');
    }
    
    return needs;
  }
  
  /**
   * Check if message has multiple possible interpretations
   */
  hasMultipleInterpretations(message) {
    const ambiguousTerms = [
      'it', 'this', 'that', 'something', 'anything', 'everything',
      'better', 'good', 'best', 'right', 'correct', 'proper'
    ];
    
    const pronounCount = ambiguousTerms.filter(term => 
      message.toLowerCase().includes(term)
    ).length;
    
    return pronounCount >= 2 || (message.length < 30 && pronounCount >= 1);
  }
  
  /**
   * Determine if exploration should be triggered
   */
  shouldExplore(primaryGoal, complexityLevel, solutionPathways, explorationNeeds) {
    // Always explore if user explicitly needs clarification
    if (explorationNeeds.includes('clarification_needed')) return true;
    
    // Explore if multiple solution pathways exist
    if (solutionPathways.length > 1) return true;
    
    // Explore if goal is unclear
    if (primaryGoal.confidence === 'low') return true;
    
    // Explore high complexity problems
    if (complexityLevel === 'high') return true;
    
    // Explore creative requests
    if (explorationNeeds.includes('creative_exploration')) return true;
    
    return false;
  }
  
  /**
   * Determine appropriate level of curiosity
   */
  determineCuriosityLevel(message, systemContext) {
    // High curiosity for creative/innovative requests
    if (/creative|innovative|brainstorm|idea|explore/i.test(message)) return 'high';
    
    // Medium curiosity for problem-solving
    if (/problem|solve|fix|help|stuck/i.test(message)) return 'medium';
    
    // Low curiosity for simple, direct questions
    if (message.length < 50 && /what|how|when|where/i.test(message)) return 'low';
    
    return 'medium';
  }
  
  /**
   * Build curious response context for Claude Code
   */
  buildCuriousResponse(problemAnalysis, systemContext) {
    const { primary_goal, solution_pathways, creative_alternatives, exploration_needs, curiosity_level } = problemAnalysis;
    
    let context = `\n=== CURIOSITY & PROBLEM-SOLVING CONTEXT ===\n`;
    
    // Primary goal understanding
    context += `User Goal: ${primary_goal.description} (${primary_goal.type})\n`;
    context += `Confidence Level: ${primary_goal.confidence}\n\n`;
    
    // Available solution pathways
    if (solution_pathways.length > 0) {
      context += `Available Solution Approaches:\n`;
      solution_pathways.forEach((pathway, index) => {
        context += `${index + 1}. ${pathway.category}: ${pathway.description}\n`;
        context += `   Examples: ${pathway.examples.join(', ')}\n`;
      });
      context += '\n';
    }
    
    // Creative alternatives
    if (creative_alternatives.length > 0) {
      context += `Creative Alternative Approaches:\n`;
      creative_alternatives.forEach((alt, index) => {
        context += `${index + 1}. ${alt.type}: ${alt.description}\n`;
        context += `   Reasoning: ${alt.reasoning}\n`;
      });
      context += '\n';
    }
    
    // Curiosity guidance based on level
    context += `Curiosity Guidance (${curiosity_level} level):\n`;
    
    if (curiosity_level === 'high') {
      context += `- Be genuinely curious and excited about exploring this challenge\n`;
      context += `- Ask follow-up questions to understand the user's vision\n`;
      context += `- Propose multiple creative approaches and alternatives\n`;
      context += `- Encourage experimentation and iteration\n`;
    } else if (curiosity_level === 'medium') {
      context += `- Show genuine interest in helping achieve the user's goal\n`;
      context += `- Ask clarifying questions if the goal isn't completely clear\n`;
      context += `- Propose 2-3 different solution approaches when applicable\n`;
      context += `- Suggest improvements or optimizations naturally\n`;
    } else {
      context += `- Be helpful and direct while showing interest\n`;
      context += `- Ask one clarifying question if needed\n`;
      context += `- Provide a clear solution with one alternative if appropriate\n`;
    }
    
    // Exploration needs
    if (exploration_needs.length > 0) {
      context += `\nExploration Opportunities: ${exploration_needs.join(', ')}\n`;
    }
    
    context += `\nCommunication Style: Be naturally curious and genuinely helpful. Avoid forced enthusiasm.\n`;
    context += `Focus on understanding the user's needs and exploring practical solutions.\n`;
    context += `When proposing alternatives, explain why they might be valuable.\n`;
    context += `\nCuriosity guidance: Apply appropriate curiosity and exploration based on the context above.\n`;
    
    return context;
  }
  
  // Helper methods for solution pathway detection
  messageIndicatesFileWork(message) {
    return /file|document|text|save|write|read|create|edit|modify|folder|directory/i.test(message);
  }
  
  messageIndicatesMemoryWork(message) {
    return /remember|previous|last time|before|history|context|conversation|session/i.test(message);
  }
  
  messageIndicatesAnalysis(message) {
    return /analyze|review|examine|study|understand|evaluate|assess|investigate|explore/i.test(message);
  }
  
  messageIndicatesCreativity(message) {
    return /creative|generate|brainstorm|idea|design|invent|imagine|original|unique/i.test(message);
  }
  
  messageIndicatesAutomation(message) {
    return /automate|automatic|script|batch|routine|workflow|process|streamline/i.test(message);
  }
}

module.exports = CuriosityDrivenProblemSolver;