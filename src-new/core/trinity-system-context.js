const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Trinity System Context Provider
 * 
 * Provides system awareness context for Claude Code integration including:
 * - System capabilities awareness (local files, memory persistence)
 * - User environment context (project structure, working patterns)
 * - Technical capability understanding (Trinity limitations/abilities)
 * - Communication style adaptation based on user context
 */
class TrinitySystemContext {
  constructor(options = {}) {
    this.systemDir = options.systemDir || path.join(os.homedir(), '.trinity-mvp');
    this.workingDir = options.workingDir || process.cwd();
    
    // System awareness context (not personality)
    this.systemCapabilities = new Map();
    this.userEnvironment = new Map();
    this.memoryContext = new Map();
    this.problemSolvingContext = new Map();
    
    this.initializeSystemContext();
  }
  
  /**
   * Initialize system context with capabilities and environment detection
   */
  initializeSystemContext() {
    // System capabilities (what Trinity can do)
    this.systemCapabilities.set('file_access', {
      description: 'Can read, write, and modify files on local system',
      limitations: 'Cannot access network files or restricted system directories',
      examples: ['Reading project files', 'Creating documentation', 'Modifying configurations']
    });
    
    this.systemCapabilities.set('memory_system', {
      description: 'Maintains conversation history and project context across sessions',
      limitations: 'Memory tied to specific Trinity instance and user directory',
      examples: ['Remembering previous conversations', 'Building on past project work', 'Learning user preferences']
    });
    
    this.systemCapabilities.set('local_processing', {
      description: 'Runs locally, user data stays on machine',
      limitations: 'Cannot access internet or external APIs directly',
      examples: ['Privacy-preserving AI assistance', 'Offline functionality', 'Local file analysis']
    });
    
    this.systemCapabilities.set('cross_session', {
      description: 'Remembers context across different conversations',
      limitations: 'Context limited to Trinity MVP session history',
      examples: ['Continuing previous projects', 'Building on past solutions', 'Learning from feedback']
    });
    
    // Load user environment context
    this.loadUserEnvironmentContext();
  }
  
  /**
   * Load user environment context from working directory and patterns
   */
  loadUserEnvironmentContext() {
    try {
      // Detect project type and structure
      const projectContext = this.detectProjectContext();
      this.userEnvironment.set('project_context', projectContext);
      
      // Working directory information
      this.userEnvironment.set('working_directory', this.workingDir);
      
      // File system permissions (basic check)
      const permissions = this.checkFileSystemPermissions();
      this.userEnvironment.set('file_permissions', permissions);
      
    } catch (error) {
      console.warn('TrinitySystemContext: Could not fully load user environment:', error.message);
      this.userEnvironment.set('error', 'Partial environment context available');
    }
  }
  
  /**
   * Detect project context from directory structure
   */
  detectProjectContext() {
    try {
      const files = fs.readdirSync(this.workingDir);
      const projectIndicators = {
        hasPackageJson: files.includes('package.json'),
        hasPythonFiles: files.some(f => f.endsWith('.py')),
        hasGitRepo: files.includes('.git'),
        hasDocumentation: files.some(f => f.toLowerCase().includes('readme')),
        hasConfigFiles: files.some(f => f.includes('config') || f.endsWith('.json') || f.endsWith('.yaml')),
        directoryCount: files.filter(f => {
          try {
            return fs.statSync(path.join(this.workingDir, f)).isDirectory();
          } catch { return false; }
        }).length
      };
      
      // Determine project type
      let projectType = 'general';
      if (projectIndicators.hasPackageJson) projectType = 'nodejs';
      else if (projectIndicators.hasPythonFiles) projectType = 'python';
      else if (projectIndicators.hasGitRepo) projectType = 'git_repository';
      
      return {
        type: projectType,
        indicators: projectIndicators,
        complexity: projectIndicators.directoryCount > 5 ? 'complex' : 'simple'
      };
    } catch (error) {
      return { type: 'unknown', error: error.message };
    }
  }
  
  /**
   * Check basic file system permissions
   */
  checkFileSystemPermissions() {
    try {
      // Test read permission
      fs.readdirSync(this.workingDir);
      
      // Test write permission (create temporary file)
      const testFile = path.join(this.workingDir, '.trinity-test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      return { read: true, write: true };
    } catch (error) {
      return { read: true, write: false, limitation: error.message };
    }
  }
  
  /**
   * Get comprehensive system context for user message and conversation history
   */
  getSystemContext(userMessage, conversationHistory = []) {
    const technicalLevel = this.detectUserTechnicalLevel(userMessage, conversationHistory);
    const problemAnalysis = this.analyzeProblemSolvingOpportunities(userMessage, conversationHistory);
    
    return {
      capabilities: this.getCapabilityContext(),
      environment: this.getUserEnvironmentContext(),
      memory: this.getMemoryContext(conversationHistory),
      technical_level: technicalLevel,
      problem_solving: problemAnalysis,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get system capabilities context
   */
  getCapabilityContext() {
    const capabilities = {};
    for (const [key, value] of this.systemCapabilities) {
      capabilities[key] = {
        description: value.description,
        examples: value.examples,
        limitations: value.limitations
      };
    }
    return capabilities;
  }
  
  /**
   * Get user environment context
   */
  getUserEnvironmentContext() {
    const environment = {};
    for (const [key, value] of this.userEnvironment) {
      environment[key] = value;
    }
    return environment;
  }
  
  /**
   * Get memory context relevant to conversation history
   */
  getMemoryContext(conversationHistory) {
    return {
      session_length: conversationHistory.length,
      has_context: conversationHistory.length > 0,
      memory_available: true,
      cross_session_capable: true
    };
  }
  
  /**
   * Detect user technical level from message content and conversation history
   */
  detectUserTechnicalLevel(userMessage, conversationHistory) {
    const technicalIndicators = {
      // High technical level indicators
      high: [
        /\b(API|SDK|JSON|CLI|regex|algorithm|repository|git|npm|pip|bash|terminal)\b/i,
        /\b(function|class|method|variable|parameter|callback|async|promise)\b/i,
        /\b(database|query|schema|migration|deployment|configuration)\b/i
      ],
      
      // Medium technical level indicators  
      medium: [
        /\b(file|folder|directory|install|setup|configure|settings)\b/i,
        /\b(application|program|software|computer|technology)\b/i,
        /\b(help|guide|tutorial|documentation|manual)\b/i
      ],
      
      // Basic level indicators
      basic: [
        /\b(simple|easy|basic|beginner|new to|don't understand|confused)\b/i,
        /\b(what is|how do|can you explain|I don't know)\b/i,
        /\b(I'm new|I am new|getting started|just started)\b/i
      ]
    };
    
    const allText = [userMessage, ...conversationHistory.map(h => h.content || h.message || '')].join(' ');
    
    // Count matches for each level
    const scores = {
      high: technicalIndicators.high.reduce((count, pattern) => count + (pattern.test(allText) ? 1 : 0), 0),
      medium: technicalIndicators.medium.reduce((count, pattern) => count + (pattern.test(allText) ? 1 : 0), 0),
      basic: technicalIndicators.basic.reduce((count, pattern) => count + (pattern.test(allText) ? 1 : 0), 0)
    };
    
    // Determine level based on highest score, with medium as default
    if (scores.high >= 2) return 'technical';
    if (scores.basic >= 2) return 'beginner';
    return 'intermediate';
  }
  
  /**
   * Analyze problem-solving opportunities in user message
   */
  analyzeProblemSolvingOpportunities(userMessage, conversationHistory) {
    const goals = this.extractUserGoals(userMessage);
    const constraints = this.identifyConstraints(userMessage, conversationHistory);
    const solutionPathways = this.exploreSolutionOptions(userMessage);
    const creativeAlternatives = this.generateAlternativeApproaches(userMessage);
    const curiosityTriggers = this.identifyExplorationOpportunities(userMessage);
    
    return {
      goal_understanding: goals,
      constraint_analysis: constraints,
      solution_pathways: solutionPathways,
      creative_alternatives: creativeAlternatives,
      curiosity_triggers: curiosityTriggers,
      has_exploration_opportunity: goals.length > 0 || solutionPathways.length > 1 || curiosityTriggers.length > 0
    };
  }
  
  /**
   * Extract user goals from message content
   */
  extractUserGoals(message) {
    const goalPatterns = [
      { pattern: /I want to|I need to|trying to|help me/i, type: 'explicit_goal' },
      { pattern: /how do I|can you help|is it possible/i, type: 'seeking_guidance' },
      { pattern: /problem|issue|stuck|not working|error|bug/i, type: 'solving_problem' },
      { pattern: /automate|streamline|optimize|improve|better|efficient/i, type: 'improvement_seeking' },
      { pattern: /create|build|make|develop|write|generate/i, type: 'creation_goal' },
      { pattern: /understand|learn|explain|teach|show me/i, type: 'learning_goal' }
    ];
    
    return goalPatterns
      .filter(p => p.pattern.test(message))
      .map(p => p.type);
  }
  
  /**
   * Identify constraints from message and conversation context
   */
  identifyConstraints(userMessage, conversationHistory) {
    const constraintPatterns = [
      { pattern: /can't|cannot|unable to|doesn't work|won't/i, type: 'capability_constraint' },
      { pattern: /budget|cost|money|expensive|cheap|free/i, type: 'financial_constraint' },
      { pattern: /time|deadline|urgent|quickly|fast|slow/i, type: 'time_constraint' },
      { pattern: /simple|easy|basic|complicated|complex/i, type: 'complexity_constraint' },
      { pattern: /local|offline|online|internet|network/i, type: 'connectivity_constraint' }
    ];
    
    const allText = [userMessage, ...conversationHistory.map(h => h.content || h.message || '')].join(' ');
    
    return constraintPatterns
      .filter(p => p.pattern.test(allText))
      .map(p => ({ type: p.type, context: 'detected from conversation' }));
  }
  
  /**
   * Explore solution options based on message content
   */
  exploreSolutionOptions(message) {
    const solutionCategories = [];
    
    // File-based solutions
    if (/file|document|text|save|write|read/i.test(message)) {
      solutionCategories.push('file_manipulation');
    }
    
    // Automation solutions
    if (/automate|script|batch|routine|repeat/i.test(message)) {
      solutionCategories.push('automation');
    }
    
    // Analysis solutions
    if (/analyze|review|check|examine|study|understand/i.test(message)) {
      solutionCategories.push('analysis_and_review');
    }
    
    // Creative solutions
    if (/create|generate|build|design|write|make/i.test(message)) {
      solutionCategories.push('creative_generation');
    }
    
    // Problem-solving solutions
    if (/fix|solve|debug|troubleshoot|resolve|repair/i.test(message)) {
      solutionCategories.push('problem_solving');
    }
    
    return solutionCategories.length > 0 ? solutionCategories : ['general_assistance'];
  }
  
  /**
   * Generate creative alternative approaches
   */
  generateAlternativeApproaches(message) {
    const alternatives = [];
    
    // If requesting standard approach, suggest creative alternatives
    if (/normal|usual|standard|typical|regular/i.test(message)) {
      alternatives.push('explore_creative_alternatives');
    }
    
    // If expressing frustration, suggest different angles
    if (/frustrated|stuck|confused|difficult|hard/i.test(message)) {
      alternatives.push('try_different_approach');
    }
    
    // If seeking efficiency, suggest optimization
    if (/faster|better|improve|optimize|efficient/i.test(message)) {
      alternatives.push('optimization_focused');
    }
    
    return alternatives;
  }
  
  /**
   * Identify opportunities for curious exploration
   */
  identifyExplorationOpportunities(message) {
    const opportunities = [];
    
    // Questions that invite exploration
    if (/\?/.test(message) || /how|what|why|when|where/i.test(message)) {
      opportunities.push('question_exploration');
    }
    
    // Goals that could benefit from exploration
    if (/help|assist|guide|support/i.test(message)) {
      opportunities.push('assistance_exploration');
    }
    
    // Problems that could have multiple solutions
    if (/problem|issue|challenge|difficulty/i.test(message)) {
      opportunities.push('solution_exploration');
    }
    
    // Creative requests
    if (/idea|creative|innovative|unique|different/i.test(message)) {
      opportunities.push('creative_exploration');
    }
    
    return opportunities;
  }
  
  /**
   * Check if system context needs updating
   */
  shouldUpdateContext() {
    // Update if working directory changed
    if (this.workingDir !== process.cwd()) {
      return true;
    }
    
    // Update periodically (could be enhanced with more sophisticated checks)
    return false;
  }
  
  /**
   * Update system context (refresh environment detection)
   */
  updateContext() {
    this.workingDir = process.cwd();
    this.loadUserEnvironmentContext();
  }
}

module.exports = TrinitySystemContext;