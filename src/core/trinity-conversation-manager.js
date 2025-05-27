#!/usr/bin/env node

/**
 * Trinity Conversation Manager
 * 
 * Handles current session conversation awareness, enabling Trinity to answer
 * simple queries directly without calling Claude Code (preventing token explosion).
 * 
 * Solves critical issue: "What was the last line in the poem you just wrote?"
 * Trinity can now see and respond to current conversation content.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class TrinityConversationManager {
  constructor(options = {}) {
    this.logger = options.logger || console;
    
    // Current session tracking
    this.currentSession = [];
    this.sessionId = this.generateSessionId();
    this.maxSessionLength = 50; // Prevent memory bloat
    
    // Session file management
    this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
    this.sessionsDir = path.join(this.trinityDir, 'sessions');
    this.currentSessionFile = path.join(this.sessionsDir, 'current-session.md');
    
    // Initialize directories
    this.ensureDirectories();
    
    // Start new session file
    this.initializeSessionFile();
    
    this.logger.info(`[Trinity Conversation Manager] Initialized session ${this.sessionId}`);
  }
  
  /**
   * Process incoming message with conversation awareness
   * Returns response directly if Trinity can handle it, otherwise delegates to Claude Code
   */
  async processMessage(userMessage, sessionId = null) {
    if (sessionId && sessionId !== this.sessionId) {
      // New session started
      this.startNewSession(sessionId);
    }
    
    // Add user message to current session
    this.addToSession('user', userMessage);
    
    // Check if Trinity can answer this directly from current session
    if (this.canAnswerFromCurrentSession(userMessage)) {
      const directAnswer = this.answerFromSession(userMessage);
      
      if (directAnswer) {
        this.logger.info(`[Trinity Conversation Manager] Answered directly: "${userMessage.substring(0, 50)}..."`);
        this.addToSession('assistant', directAnswer);
        return {
          canHandle: true,
          response: directAnswer,
          source: 'trinity-direct'
        };
      }
    }
    
    // Trinity can't handle this - needs Claude Code
    return {
      canHandle: false,
      enhancedMessage: this.enhanceMessageForClaudeCode(userMessage),
      sessionContext: this.getRecentContext()
    };
  }
  
  /**
   * Add Assistant response to session (called after Claude Code responds)
   */
  addAssistantResponse(response) {
    this.addToSession('assistant', response);
  }
  
  /**
   * Check if Trinity can answer query directly from current session
   */
  canAnswerFromCurrentSession(message) {
    const simpleQueryPatterns = [
      /what was the (last|final) line/i,
      /what('?s|s) the (last|final) line/i,
      /you just (wrote|created|made)/i,
      /that (poem|code) you/i,
      /the (poem|code) you just/i,
      /show me the (last|first|\d+) line/i
    ];
    
    const hasPattern = simpleQueryPatterns.some(pattern => pattern.test(message));
    const hasRecentContent = this.hasRecentCreativeContent();
    
    this.logger.info(`[Trinity Conversation Manager] Can answer check: pattern=${hasPattern}, recentContent=${hasRecentContent}`);
    
    return hasPattern && hasRecentContent;
  }
  
  /**
   * Answer query directly from current session
   */
  answerFromSession(message) {
    try {
      // Handle "last line" queries
      if (/what was the (last|final) line|what('?s|s) the (last|final) line/i.test(message)) {
        return this.getLastLineFromRecentContent();
      }
      
      // Handle "you just wrote" queries
      if (/you just (wrote|created|made)|that (poem|code) you|the (poem|code) you just/i.test(message)) {
        return this.getRecentCreativeContent();
      }
      
      // Handle "show me line X" queries
      const lineMatch = message.match(/show me the (\w+) line/i);
      if (lineMatch) {
        return this.getSpecificLineFromRecentContent(lineMatch[1]);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`[Trinity Conversation Manager] Error answering from session: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get last line from most recent creative content
   */
  getLastLineFromRecentContent() {
    const recentContent = this.findMostRecentCreativeContent();
    
    if (!recentContent) {
      return "I don't see any recent creative content in our conversation that I can reference.";
    }
    
    const lines = recentContent.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return "I found recent content but couldn't identify distinct lines.";
    }
    
    const lastLine = lines[lines.length - 1];
    
    // Check if it's a poem by looking for title
    const titleMatch = recentContent.content.match(/Here's "([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'the content';
    
    return `The last line of ${title} is: "${lastLine}"`;
  }
  
  /**
   * Get specific line number from recent content
   */
  getSpecificLineFromRecentContent(lineNumber) {
    const recentContent = this.findMostRecentCreativeContent();
    
    if (!recentContent) {
      return "I don't see any recent creative content in our conversation.";
    }
    
    const lines = recentContent.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Convert line number words to numbers
    const lineMap = {
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
      'last': lines.length, 'final': lines.length
    };
    
    const lineIndex = lineMap[lineNumber.toLowerCase()] || parseInt(lineNumber);
    
    if (isNaN(lineIndex) || lineIndex < 1 || lineIndex > lines.length) {
      return `I found ${lines.length} lines. Please specify a line number between 1 and ${lines.length}.`;
    }
    
    const line = lines[lineIndex - 1];
    return `Line ${lineIndex}: "${line}"`;
  }
  
  /**
   * Get recent creative content
   */
  getRecentCreativeContent() {
    const recentContent = this.findMostRecentCreativeContent();
    
    if (!recentContent) {
      return "I don't see any recent creative content in our conversation.";
    }
    
    return `Here's what I just created:\n\n${recentContent.content}`;
  }
  
  /**
   * Find most recent creative content (poems, code, substantial responses)
   * CRITICAL FIX: Added emergency logging to debug content classification
   */
  findMostRecentCreativeContent() {
    // Look through recent assistant messages for creative content
    const recentAssistantMessages = this.currentSession
      .filter(msg => msg.role === 'assistant')
      .slice(-5); // Last 5 assistant responses
    
    this.logger.info(`[EMERGENCY DEBUG] Searching for creative content in ${recentAssistantMessages.length} recent messages`);
    
    for (let i = recentAssistantMessages.length - 1; i >= 0; i--) {
      const message = recentAssistantMessages[i];
      const isCreative = this.isCreativeContent(message.content);
      const preview = message.content.substring(0, 100).replace(/\n/g, ' ') + '...';
      
      this.logger.info(`[EMERGENCY DEBUG] Message ${i}: isCreative=${isCreative}, preview="${preview}"`);
      
      // Check for creative content indicators
      if (isCreative) {
        const result = {
          content: message.content,
          timestamp: message.timestamp,
          type: this.detectContentType(message.content)
        };
        
        this.logger.info(`[EMERGENCY DEBUG] Found creative content: type=${result.type}, length=${message.content.length}`);
        return result;
      }
    }
    
    this.logger.warn(`[EMERGENCY DEBUG] No creative content found in ${recentAssistantMessages.length} messages`);
    return null;
  }
  
  /**
   * Check if content is creative (poem, code, substantial response)
   * CRITICAL FIX: Made much more specific to prevent factual content being classified as creative
   */
  isCreativeContent(content) {
    // SPECIFIC poem indicators (strict matching)
    if (/Here's "([^"]+)"/i.test(content) || 
        /^#\s+[A-Z]/m.test(content) || // Starts with "# Title"
        content.includes('*That\'s one of my favorite things about') || // Trinity poem signature
        (/poem/i.test(content) && content.split('\n').length > 10)) { // "poem" + multi-line
      return true;
    }
    
    // SPECIFIC code indicators
    if (content.includes('```') || 
        /function\s+\w+\s*\(/i.test(content) ||
        /class\s+\w+\s*{/i.test(content) ||
        /const\s+\w+\s*=/i.test(content)) {
      return true;
    }
    
    // REMOVED: Overly broad "substantial content" heuristic that was catching factual responses
    // The old logic: content.length > 300 && content.split('\n').length > 5
    // This was incorrectly classifying scientific explanations as creative content
    
    return false;
  }
  
  /**
   * Detect content type
   */
  detectContentType(content) {
    if (content.includes('```') || /function|class|const\s+\w+/i.test(content)) {
      return 'code';
    }
    
    if (/Here's "([^"]+)"/i.test(content) || content.includes('poem')) {
      return 'poem';
    }
    
    return 'general';
  }
  
  /**
   * Check if session has recent creative content
   */
  hasRecentCreativeContent() {
    return this.findMostRecentCreativeContent() !== null;
  }
  
  /**
   * Enhance message for Claude Code with minimal context
   */
  enhanceMessageForClaudeCode(message) {
    const recentContext = this.getRecentContext();
    
    if (!recentContext) {
      return message;
    }
    
    // Only add context if message seems to reference recent content
    const needsContext = /\b(that|the|this)\s+/i.test(message) || 
                         /\b(recent|previous|last|just)\b/i.test(message);
    
    if (needsContext) {
      return `Recent session context (for reference only):
${recentContext}

Current query: ${message}

Please check the session file ~/.trinity-mvp/sessions/current-session.md if you need more detailed conversation history.`;
    }
    
    return message;
  }
  
  /**
   * Get recent conversation context (last 3 messages, summarized)
   */
  getRecentContext() {
    const recentMessages = this.currentSession.slice(-6); // Last 6 messages (3 pairs)
    
    if (recentMessages.length === 0) {
      return null;
    }
    
    // Summarize recent context to prevent token bloat
    const contextLines = recentMessages.map(msg => {
      const preview = msg.content.length > 100 ? 
        msg.content.substring(0, 100) + '...' : 
        msg.content;
      return `${msg.role}: ${preview}`;
    });
    
    return contextLines.join('\n');
  }
  
  /**
   * Add message to current session
   */
  addToSession(role, content) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    this.currentSession.push(message);
    
    // Prevent memory bloat
    if (this.currentSession.length > this.maxSessionLength) {
      this.currentSession = this.currentSession.slice(-this.maxSessionLength);
    }
    
    // Update session file
    this.updateSessionFile();
    
    this.logger.info(`[Trinity Conversation Manager] Added ${role} message (${content.length} chars)`);
  }
  
  /**
   * Start new session
   */
  startNewSession(sessionId = null) {
    this.currentSession = [];
    this.sessionId = sessionId || this.generateSessionId();
    this.initializeSessionFile();
    
    this.logger.info(`[Trinity Conversation Manager] Started new session: ${this.sessionId}`);
  }
  
  /**
   * Initialize session file
   */
  initializeSessionFile() {
    const header = `# Trinity Session - ${this.sessionId}

Started: ${new Date().toISOString()}

---

`;
    
    try {
      fs.writeFileSync(this.currentSessionFile, header, 'utf8');
    } catch (error) {
      this.logger.error(`[Trinity Conversation Manager] Failed to initialize session file: ${error.message}`);
    }
  }
  
  /**
   * Update session file with current conversation
   */
  updateSessionFile() {
    try {
      const header = `# Trinity Session - ${this.sessionId}

Started: ${new Date().toISOString()}
Messages: ${this.currentSession.length}

---

`;
      
      const messages = this.currentSession.map((msg, index) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `## ${time} - ${msg.role === 'user' ? 'User' : 'Trinity'}

${msg.content}

`;
      }).join('');
      
      fs.writeFileSync(this.currentSessionFile, header + messages, 'utf8');
    } catch (error) {
      this.logger.error(`[Trinity Conversation Manager] Failed to update session file: ${error.message}`);
    }
  }
  
  /**
   * Ensure directories exist
   */
  ensureDirectories() {
    [this.trinityDir, this.sessionsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * Generate session ID
   */
  generateSessionId() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getTime()}`;
  }
  
  /**
   * Get session statistics
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      messageCount: this.currentSession.length,
      hasRecentCreativeContent: this.hasRecentCreativeContent(),
      sessionFile: this.currentSessionFile,
      lastActivity: this.currentSession.length > 0 ? 
        this.currentSession[this.currentSession.length - 1].timestamp : null
    };
  }
}

module.exports = TrinityConversationManager;