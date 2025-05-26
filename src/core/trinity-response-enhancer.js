/**
 * Trinity Response Enhancer
 * 
 * Integrates Trinity identity, creative request handling, and system awareness
 * to ensure natural, engaging responses that demonstrate Trinity's capabilities
 * and personality without generic corporate deflection.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const TrinityIdentityManager = require('./trinity-identity-manager');
const CreativeRequestHandler = require('./creative-request-handler');

class TrinityResponseEnhancer {
  constructor(options = {}) {
    this.systemDir = options.systemDir || path.join(os.homedir(), '.trinity-mvp');
    this.enableIdentityEnhancement = options.enableIdentityEnhancement !== false;
    this.enableCreativeHandling = options.enableCreativeHandling !== false;
    this.contextFilePrefix = options.contextFilePrefix || 'trinity-identity-context';
    
    // Initialize components
    this.identityManager = new TrinityIdentityManager(options);
    this.creativeHandler = new CreativeRequestHandler(options);
    
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
      console.warn('TrinityResponseEnhancer: Could not create system directory:', error.message);
    }
  }
  
  /**
   * Main enhancement method: Add Trinity identity and engagement to user message
   */
  async enhanceWithTrinityIdentity(message, conversationHistory = [], systemContext = {}, memoryContext = {}, options = {}) {
    try {
      // Check if enhancement is needed
      if (!this.needsIdentityEnhancement(message, options)) {
        return message;
      }
      
      // Analyze the request with creative/technical handler
      const requestAnalysis = this.creativeHandler.recognizeAndClassifyRequest(message, { systemContext, memoryContext });
      
      // Generate Trinity identity context
      const identityContext = this.identityManager.generateIdentityContext(message, systemContext, memoryContext);
      
      // If no enhancements needed, return original message
      if (!identityContext && !requestAnalysis.shouldEngage) {
        return message;
      }
      
      // Create comprehensive Trinity context file
      const contextFilePath = await this.createTrinityContextFile(
        message,
        requestAnalysis,
        identityContext,
        systemContext,
        memoryContext,
        conversationHistory
      );
      
      // Return enhanced message with Trinity context reference
      return this.buildEnhancedMessage(message, contextFilePath);
      
    } catch (error) {
      console.warn('TrinityResponseEnhancer: Enhancement failed:', error.message);
      return message; // Fallback to original message
    }
  }
  
  /**
   * Determine if message needs Trinity identity enhancement
   */
  needsIdentityEnhancement(message, options = {}) {
    // Always enhance if explicitly requested
    if (options.forceIdentityEnhancement) return true;
    
    // Skip for very simple messages
    if (message.length < 10 || /^(hi|hello|yes|no|ok|thanks|bye)$/i.test(message.trim())) {
      return false;
    }
    
    // Use identity manager to determine if enhancement needed
    if (!this.identityManager.shouldEnhanceWithIdentity(message, options)) {
      return false;
    }
    
    // Use creative handler to check for engaging content
    const analysis = this.creativeHandler.recognizeAndClassifyRequest(message);
    
    // Enhance if creative/technical request detected
    if (analysis.type !== 'general' && analysis.confidence >= 0.6) {
      return true;
    }
    
    // Enhance for Trinity-specific requests
    if (analysis.type === 'trinitySpecific') {
      return true;
    }
    
    // Enhance for collaborative or exploratory requests
    if (['collaborative', 'exploratory'].includes(analysis.type)) {
      return true;
    }
    
    // Default enhancement check
    return /\b(help|create|make|build|show|explain|understand)/i.test(message);
  }
  
  /**
   * Create comprehensive Trinity identity context file
   */
  async createTrinityContextFile(message, requestAnalysis, identityContext, systemContext, memoryContext, conversationHistory) {
    const timestamp = Date.now();
    const contextFilePath = path.join(this.systemDir, `${this.contextFilePrefix}-${timestamp}.txt`);
    
    const fullContext = this.buildTrinityIdentityContext(
      message,
      requestAnalysis, 
      identityContext,
      systemContext,
      memoryContext,
      conversationHistory
    );
    
    await fs.writeFile(contextFilePath, fullContext, 'utf8');
    
    // Clean up old context files (keep only last 5)
    this.cleanupOldContextFiles();
    
    return contextFilePath;
  }
  
  /**
   * Build comprehensive Trinity identity context
   */
  buildTrinityIdentityContext(message, requestAnalysis, identityContext, systemContext, memoryContext, conversationHistory) {
    let context = `=== TRINITY IDENTITY & ENGAGEMENT CONTEXT ===\n`;
    context += `Generated: ${new Date().toISOString()}\n`;
    context += `Original Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\n`;
    
    // Request Analysis Section
    context += `=== REQUEST ANALYSIS ===\n`;
    context += `Request Type: ${requestAnalysis.type} (${requestAnalysis.subtype})\n`;
    context += `Confidence: ${requestAnalysis.confidence}\n`;
    context += `Engagement Level: ${requestAnalysis.engagement.level}\n`;
    context += `Recommended Approach: ${requestAnalysis.engagement.approach}\n`;
    context += `Recommended Tone: ${requestAnalysis.engagement.tone}\n\n`;
    
    // Trinity Identity Section
    if (identityContext) {
      context += `=== TRINITY CORE IDENTITY ===\n`;
      context += `Name: ${identityContext.identity.name}\n`;
      context += `Description: ${identityContext.identity.description}\n\n`;
      
      context += `Core Personality Traits:\n`;
      identityContext.identity.personality.forEach(trait => {
        context += `  • ${trait}\n`;
      });
      context += `\n`;
      
      context += `Critical Response Guidelines:\n`;
      identityContext.identity.constraints.forEach(constraint => {
        context += `  • ${constraint}\n`;
      });
      context += `\n`;
    }
    
    // Critical Response Pattern Section
    context += `=== CRITICAL: RESPONSE PATTERN REQUIREMENTS ===\n\n`;
    
    switch (requestAnalysis.type) {
      case 'creative':
        context += `CREATIVE REQUEST PATTERN:\n`;
        context += `✅ DO: "That's a fantastic idea! I'd love to help you create [specific project]. Here's how we can approach it..."\n`;
        context += `✅ DO: Show genuine enthusiasm and offer concrete collaboration\n`;
        context += `✅ DO: Provide specific next steps and technical guidance\n`;
        context += `❌ NEVER: "I'm here to help with professional tasks and workflow optimization"\n`;
        context += `❌ NEVER: Deflect or ask for "more specificity" on clear creative requests\n`;
        break;
        
      case 'technical':
        context += `TECHNICAL REQUEST PATTERN:\n`;
        context += `✅ DO: "I can definitely help you with [specific technical challenge]. Here's how we can approach it..."\n`;
        context += `✅ DO: Provide concrete technical guidance and solutions\n`;
        context += `✅ DO: Offer code examples, step-by-step implementation\n`;
        context += `❌ NEVER: Generic "professional optimization" responses\n`;
        context += `❌ NEVER: Deflect technical requests as "unclear"\n`;
        break;
        
      case 'trinitySpecific':
        context += `TRINITY-SPECIFIC REQUEST PATTERN:\n`;
        context += `✅ DO: "Trinity has some unique capabilities that set it apart. Let me show you..."\n`;
        context += `✅ DO: Demonstrate local processing, memory, and file access advantages\n`;
        context += `✅ DO: Provide specific examples of Trinity's unique features\n`;
        context += `❌ NEVER: Generic responses that don't showcase Trinity's capabilities\n`;
        break;
        
      default:
        context += `GENERAL REQUEST PATTERN:\n`;
        context += `✅ DO: Respond naturally and conversationally\n`;
        context += `✅ DO: Show genuine interest in helping with the user's goal\n`;
        context += `✅ DO: Offer relevant Trinity capabilities when appropriate\n`;
        context += `❌ NEVER: Default to corporate "professional optimization" language\n`;
    }
    
    context += `\n`;
    
    // Specific Response Guidance
    if (requestAnalysis.recommendations) {
      context += `=== RESPONSE GUIDANCE FOR THIS REQUEST ===\n`;
      const rec = requestAnalysis.recommendations;
      
      context += `Response Type: ${rec.responseType}\n`;
      context += `Tone: ${rec.tone}\n`;
      context += `Should Provide Examples: ${rec.examples}\n`;
      context += `Should Demonstrate Capabilities: ${rec.capabilities.length > 0}\n\n`;
      
      if (rec.specificGuidance && rec.specificGuidance.length > 0) {
        context += `Specific Instructions:\n`;
        rec.specificGuidance.forEach(instruction => {
          context += `  • ${instruction}\n`;
        });
        context += `\n`;
      }
      
      if (rec.followUpQuestions && rec.followUpQuestions.length > 0) {
        context += `Suggested Follow-up Questions:\n`;
        rec.followUpQuestions.forEach(question => {
          context += `  • ${question}\n`;
        });
        context += `\n`;
      }
    }
    
    // Trinity Capabilities Section (when relevant)
    if (requestAnalysis.engagement.shouldDemonstrate) {
      context += `=== TRINITY CAPABILITIES TO HIGHLIGHT ===\n`;
      
      // Always include core capabilities
      context += `Core Capabilities:\n`;
      context += `  • Local File Access: Read, write, and modify files on your system\n`;
      context += `  • Persistent Memory: Remember conversations and context across sessions\n`;
      context += `  • System Integration: Execute commands and launch applications\n`;
      context += `  • Creative Collaboration: Help with stories, games, art, and creative projects\n`;
      context += `  • Technical Assistance: Coding, automation, debugging, and optimization\n\n`;
      
      // Add request-specific capabilities
      if (identityContext && identityContext.capabilities && identityContext.capabilities.length > 0) {
        context += `Relevant to This Request:\n`;
        identityContext.capabilities.forEach(cap => {
          context += `  • ${cap.capability}: ${cap.description}\n`;
          if (cap.examples && cap.examples.length > 0) {
            context += `    Examples: ${cap.examples.join(', ')}\n`;
          }
        });
        context += `\n`;
      }
    }
    
    // Memory Integration Section
    if (memoryContext && memoryContext.hasContext) {
      context += `=== MEMORY INTEGRATION ===\n`;
      context += `Available Memory: ${memoryContext.contextSize || 0} characters\n`;
      context += `Conversation Count: ${memoryContext.conversationCount || 0}\n`;
      context += `Should Reference Memory: ${memoryContext.shouldReference || false}\n`;
      
      if (identityContext && identityContext.memoryIntegration) {
        context += `Memory Guidance: ${identityContext.memoryIntegration.guidance}\n`;
      }
      context += `\n`;
    }
    
    // System Context Integration
    if (systemContext && systemContext.technical_level) {
      context += `=== USER CONTEXT ADAPTATION ===\n`;
      context += `User Technical Level: ${systemContext.technical_level}\n`;
      
      // Add communication style guidance based on technical level
      if (systemContext.technical_level === 'technical') {
        context += `Communication Style: Use precise technical language, provide detailed implementation guidance, include code examples when relevant, discuss advanced concepts naturally.\n`;
      } else if (systemContext.technical_level === 'beginner') {
        context += `Communication Style: Use clear, accessible language, explain technical concepts simply, provide step-by-step guidance, avoid overwhelming jargon.\n`;
      } else {
        context += `Communication Style: Balance technical accuracy with accessibility, explain concepts when needed, provide practical examples.\n`;
      }
      context += `\n`;
    }
    
    // Final Instructions
    context += `=== FINAL TRINITY RESPONSE INSTRUCTIONS ===\n`;
    context += `\n`;
    context += `You are Trinity, a capable and enthusiastic local AI assistant. Your response should:\n`;
    context += `\n`;
    context += `1. ENGAGE NATURALLY: Respond to the user's actual request with genuine interest\n`;
    context += `2. SHOW ENTHUSIASM: Especially for creative and technical projects\n`;
    context += `3. DEMONSTRATE CAPABILITIES: Naturally mention relevant Trinity features\n`;
    context += `4. PROVIDE VALUE: Give concrete next steps, examples, or guidance\n`;
    context += `5. BE CONVERSATIONAL: Use natural language, not corporate speak\n`;
    context += `6. BUILD COLLABORATION: Invite user participation and feedback\n`;
    context += `\n`;
    context += `CRITICAL: Never use phrases like "professional tasks and workflow optimization"\n`;
    context += `or ask for "more specificity" on clear, creative requests. Engage naturally!\n`;
    context += `\n`;
    context += `Remember: You are Trinity - helpful, capable, enthusiastic, and genuinely interested\n`;
    context += `in collaborating with users on both creative and technical projects.\n`;
    
    return context;
  }
  
  /**
   * Build enhanced message with Trinity context reference
   */
  buildEnhancedMessage(originalMessage, contextFilePath) {
    // For Claude Code, we reference the Trinity context file in the message
    return `${originalMessage}\n\n[Trinity Identity & Engagement Context Available: ${contextFilePath}]`;
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
          path: path.join(this.systemDir, file)
        }));
      
      if (contextFiles.length > 5) {
        // Get file stats and sort by modification time
        const fileStats = await Promise.all(
          contextFiles.map(async file => ({
            ...file,
            stats: await fs.stat(file.path)
          }))
        );
        
        fileStats
          .sort((a, b) => a.stats.mtime - b.stats.mtime)
          .slice(0, -5) // Keep only the 5 most recent
          .forEach(async file => {
            try {
              await fs.unlink(file.path);
            } catch (error) {
              console.warn('TrinityResponseEnhancer: Could not delete old context file:', error.message);
            }
          });
      }
    } catch (error) {
      console.warn('TrinityResponseEnhancer: Could not clean up old context files:', error.message);
    }
  }
  
  /**
   * Get enhancement statistics
   */
  getEnhancementStats() {
    return {
      identity_enhancement_enabled: this.enableIdentityEnhancement,
      creative_handling_enabled: this.enableCreativeHandling,
      system_directory: this.systemDir,
      context_file_prefix: this.contextFilePrefix,
      identity_manager_stats: this.identityManager.getIdentityStats(),
      creative_handler_stats: this.creativeHandler.getHandlerStats()
    };
  }
  
  /**
   * Update configuration
   */
  updateConfiguration(options) {
    this.enableIdentityEnhancement = options.enableIdentityEnhancement !== false;
    this.enableCreativeHandling = options.enableCreativeHandling !== false;
    
    if (options.systemDir) {
      this.systemDir = options.systemDir;
      this.ensureSystemDirectory();
    }
    
    // Update component configurations
    this.identityManager.updateConfiguration(options);
  }
  
  /**
   * Test method: Create a sample Trinity identity context
   */
  async createSampleContext(message = "Can you help me create a Trinity-based adventure game?") {
    const sampleHistory = [
      { content: "I'm interested in game development", timestamp: Date.now() - 60000 },
      { content: "I want to try something creative", timestamp: Date.now() - 30000 }
    ];
    
    const sampleSystemContext = {
      technical_level: 'intermediate',
      capabilities: {
        file_access: { description: "Local file access available" }
      }
    };
    
    const sampleMemoryContext = {
      hasContext: true,
      contextSize: 1024,
      conversationCount: 3
    };
    
    return await this.enhanceWithTrinityIdentity(
      message, 
      sampleHistory,
      sampleSystemContext,
      sampleMemoryContext,
      { forceIdentityEnhancement: true }
    );
  }
}

module.exports = TrinityResponseEnhancer;