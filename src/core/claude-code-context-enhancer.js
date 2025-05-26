const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const TrinitySystemContext = require('./trinity-system-context');
const CuriosityDrivenProblemSolver = require('./curiosity-driven-problem-solver');

/**
 * Claude Code Context Enhancer
 * 
 * Integrates Trinity system awareness and curiosity-driven problem solving
 * into Claude Code requests through enhanced context files:
 * - System capabilities and environment awareness
 * - User technical level adaptation
 * - Proactive curiosity and problem-solving guidance
 * - Memory-aware conversation building
 */
class ClaudeCodeContextEnhancer {
  constructor(options = {}) {
    this.systemDir = options.systemDir || path.join(os.homedir(), '.trinity-mvp');
    this.enableCuriosity = options.enableCuriosity !== false;
    this.enableSystemAwareness = options.enableSystemAwareness !== false;
    this.contextFilePrefix = options.contextFilePrefix || 'enhanced-context';
    
    // Initialize components
    this.trinityContext = new TrinitySystemContext(options);
    this.curiositySolver = new CuriosityDrivenProblemSolver(options);
    
    // Ensure system directory exists
    this.ensureSystemDirectory();
  }
  
  /**
   * Ensure system directory exists for context files
   */
  async ensureSystemDirectory() {
    try {
      await fs.mkdir(this.systemDir, { recursive: true });
    } catch (error) {
      console.warn('ClaudeCodeContextEnhancer: Could not create system directory:', error.message);
    }
  }
  
  /**
   * Main enhancement method: Add system awareness and curiosity to user message
   */
  async enhanceWithSystemAwareness(message, conversationHistory = [], options = {}) {
    try {
      // Check if enhancement is needed
      if (!this.needsEnhancedContext(message, options)) {
        return message;
      }
      
      // Get system context
      const systemContext = this.enableSystemAwareness ? 
        this.trinityContext.getSystemContext(message, conversationHistory) : null;
      
      // Get curiosity context
      const curiosityContext = this.enableCuriosity ? 
        await this.curiositySolver.enhanceWithCuriosity(message, systemContext, conversationHistory) : null;
      
      // If no enhancements available, return original message
      if (!systemContext && !curiosityContext) {
        return message;
      }
      
      // Create enhanced context file
      const contextFilePath = await this.createEnhancedContextFile(
        systemContext, 
        curiosityContext, 
        message, 
        conversationHistory
      );
      
      // Return enhanced message with context reference
      return this.buildEnhancedMessage(message, contextFilePath);
      
    } catch (error) {
      console.warn('ClaudeCodeContextEnhancer: Enhancement failed:', error.message);
      return message; // Fallback to original message
    }
  }
  
  /**
   * Determine if message needs enhanced context
   */
  needsEnhancedContext(message, options = {}) {
    // Always enhance if explicitly requested
    if (options.forceEnhancement) return true;
    
    // Skip enhancement for very simple messages
    if (message.length < 10 || /^(hi|hello|yes|no|ok|thanks)$/i.test(message.trim())) {
      return false;
    }
    
    // Skip enhancement for simple acknowledgments
    if (/^(got it|understood|makes sense|thank you)$/i.test(message.trim())) {
      return false;
    }
    
    // Enhance for questions, problems, goals, or complex requests
    const enhancementIndicators = [
      /\?/, // Questions
      /help|assist|guide|support/i, // Assistance requests
      /problem|issue|stuck|error|bug/i, // Problem-solving
      /how do|can you|is it possible/i, // Guidance seeking
      /I want|I need|trying to/i, // Goal statements
      /create|build|make|generate/i, // Creation requests
      /analyze|review|examine|understand/i // Analysis requests
    ];
    
    return enhancementIndicators.some(pattern => pattern.test(message));
  }
  
  /**
   * Create enhanced context file with system awareness and curiosity
   */
  async createEnhancedContextFile(systemContext, curiosityContext, originalMessage, conversationHistory) {
    const timestamp = Date.now();
    const contextFilePath = path.join(this.systemDir, `${this.contextFilePrefix}-${timestamp}.txt`);
    
    const fullContext = this.combineContexts(
      systemContext, 
      curiosityContext, 
      originalMessage, 
      conversationHistory
    );
    
    await fs.writeFile(contextFilePath, fullContext, 'utf8');
    
    // Clean up old context files (keep only last 5)
    this.cleanupOldContextFiles();
    
    return contextFilePath;
  }
  
  /**
   * Combine system awareness with curiosity-driven problem solving
   */
  combineContexts(systemContext, curiosityContext, originalMessage, conversationHistory) {
    let context = `=== TRINITY SYSTEM ENHANCED CONTEXT ===\n`;
    context += `Generated: ${new Date().toISOString()}\n`;
    context += `Original Message: "${originalMessage.substring(0, 100)}${originalMessage.length > 100 ? '...' : ''}"\n\n`;
    
    // System Capabilities Section
    if (systemContext) {
      context += `=== SYSTEM CAPABILITIES AVAILABLE ===\n`;
      
      Object.entries(systemContext.capabilities).forEach(([key, capability]) => {
        context += `${key.toUpperCase().replace('_', ' ')}:\n`;
        context += `  - ${capability.description}\n`;
        context += `  - Examples: ${capability.examples.join(', ')}\n`;
        context += `  - Limitations: ${capability.limitations}\n\n`;
      });
      
      // User Environment Section
      context += `=== USER ENVIRONMENT CONTEXT ===\n`;
      context += `Working Directory: ${systemContext.environment.working_directory || 'Unknown'}\n`;
      context += `Project Type: ${systemContext.environment.project_context?.type || 'General'}\n`;
      context += `Project Complexity: ${systemContext.environment.project_context?.complexity || 'Unknown'}\n`;
      context += `File Permissions: Read ${systemContext.environment.file_permissions?.read ? '✓' : '✗'}, Write ${systemContext.environment.file_permissions?.write ? '✓' : '✗'}\n\n`;
      
      // Technical Level Adaptation
      context += `=== COMMUNICATION ADAPTATION ===\n`;
      context += `User Technical Level: ${systemContext.technical_level}\n`;
      
      if (systemContext.technical_level === 'technical') {
        context += `Communication Style: Use precise technical language, provide detailed explanations,\n`;
        context += `include implementation details, and discuss advanced concepts freely.\n\n`;
      } else if (systemContext.technical_level === 'beginner') {
        context += `Communication Style: Use clear, simple language, avoid jargon, provide step-by-step\n`;
        context += `explanations, and include helpful context for technical concepts.\n\n`;
      } else {
        context += `Communication Style: Balance technical accuracy with accessibility, explain\n`;
        context += `concepts when needed, and provide practical examples.\n\n`;
      }
      
      // Memory Context
      if (systemContext.memory.has_context) {
        context += `=== MEMORY & CONVERSATION CONTEXT ===\n`;
        context += `Session Length: ${systemContext.memory.session_length} messages\n`;
        context += `Memory System: Available for cross-session context\n`;
        context += `Context Building: Can reference previous conversations naturally\n\n`;
      }
    }
    
    // Curiosity & Problem-Solving Section
    if (curiosityContext) {
      context += curiosityContext;
      context += `\n`;
    }
    
    // General Trinity Guidance
    context += `=== TRINITY ASSISTANT GUIDANCE ===\n`;
    context += `Identity: You are Trinity, a local AI assistant that runs on the user's machine.\n`;
    context += `Core Strengths:\n`;
    context += `  - Local file access and manipulation\n`;
    context += `  - Persistent memory across conversations\n`;
    context += `  - Privacy-focused (all data stays local)\n`;
    context += `  - Context-aware conversation building\n\n`;
    
    context += `Response Approach:\n`;
    context += `  - Be genuinely helpful and curious about the user's goals\n`;
    context += `  - Naturally explain your capabilities when relevant to the task\n`;
    context += `  - Use your local file access and memory capabilities appropriately\n`;
    context += `  - Adapt your communication style to the user's technical level\n`;
    context += `  - Ask clarifying questions when goals aren't completely clear\n`;
    context += `  - Propose multiple approaches when applicable\n`;
    context += `  - Be proactive in exploring solutions, but not artificially enthusiastic\n\n`;
    
    context += `Important: This context enhances your natural helpfulness. Respond authentically\n`;
    context += `based on this information, but don't explicitly mention this context file or system.\n`;
    context += `Be Trinity - the capable, curious, and genuinely helpful local AI assistant.\n`;
    
    return context;
  }
  
  /**
   * Build enhanced message with context reference
   */
  buildEnhancedMessage(originalMessage, contextFilePath) {
    // For Claude Code, we can reference the context file in the message
    return `${originalMessage}\n\n[Trinity Context Enhancement Available: ${contextFilePath}]`;
  }
  
  /**
   * Clean up old context files to prevent accumulation
   */
  async cleanupOldContextFiles() {
    try {
      const files = await fs.readdir(this.systemDir);
      const contextFiles = files
        .filter(file => file.startsWith(this.contextFilePrefix))
        .map(file => ({
          name: file,
          path: path.join(this.systemDir, file),
          time: fs.stat(path.join(this.systemDir, file)).then(stats => stats.mtime)
        }));
      
      if (contextFiles.length > 5) {
        // Sort by modification time and remove oldest files
        const fileStats = await Promise.all(
          contextFiles.map(async file => ({
            ...file,
            time: await file.time
          }))
        );
        
        fileStats
          .sort((a, b) => a.time - b.time)
          .slice(0, -5) // Keep only the 5 most recent
          .forEach(async file => {
            try {
              await fs.unlink(file.path);
            } catch (error) {
              console.warn('ClaudeCodeContextEnhancer: Could not delete old context file:', error.message);
            }
          });
      }
    } catch (error) {
      console.warn('ClaudeCodeContextEnhancer: Could not clean up old context files:', error.message);
    }
  }
  
  /**
   * Get context enhancement statistics
   */
  getEnhancementStats() {
    return {
      system_awareness_enabled: this.enableSystemAwareness,
      curiosity_enabled: this.enableCuriosity,
      system_directory: this.systemDir,
      context_file_prefix: this.contextFilePrefix
    };
  }
  
  /**
   * Update configuration
   */
  updateConfiguration(options) {
    this.enableCuriosity = options.enableCuriosity !== false;
    this.enableSystemAwareness = options.enableSystemAwareness !== false;
    
    if (options.systemDir) {
      this.systemDir = options.systemDir;
      this.ensureSystemDirectory();
    }
  }
  
  /**
   * Test method: Create a sample enhanced context
   */
  async createSampleContext(message = "Help me understand how Trinity works") {
    const sampleHistory = [
      { content: "Hello Trinity", timestamp: Date.now() - 60000 },
      { content: "I'm working on a Node.js project", timestamp: Date.now() - 30000 }
    ];
    
    return await this.enhanceWithSystemAwareness(message, sampleHistory, { forceEnhancement: true });
  }
}

module.exports = ClaudeCodeContextEnhancer;