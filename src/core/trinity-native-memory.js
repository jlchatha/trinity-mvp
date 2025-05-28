#!/usr/bin/env node

/**
 * Trinity-Native Memory System
 * 
 * Provides true persistent memory for Trinity MVP using only Node.js built-ins.
 * Solves the core problem: "What was the 2nd line of that poem you just wrote?"
 * 
 * Architecture: In-memory indexing + selective file loading
 * Performance: <250ms context assembly, zero installation dependencies
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class TrinityNativeMemory {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(os.homedir(), '.trinity-mvp');
    this.memoryDir = path.join(this.baseDir, 'memory');
    this.conversationsDir = path.join(this.memoryDir, 'conversations');
    this.indexesDir = path.join(this.memoryDir, 'indexes');
    
    // Fast in-memory indexes (Node.js Map/Set)
    this.conversations = new Map();     // sessionId -> conversation
    this.topicIndex = new Map();        // topic -> Set(conversationIds)  
    this.artifactIndex = new Map();     // type -> Set(conversationIds) (poems, code)
    this.timeIndex = new Map();         // date -> Set(conversationIds)
    this.sessionIndex = new Map();      // sessionId -> metadata
    
    // 🔧 MEMORY DEBUG TRAIL SYSTEM
    this.DEBUG_ENABLED = process.env.TRINITY_MEMORY_DEBUG === 'true' || true; // TODO: Set to false for production
    this.MEMORY_TRACE_ID = null;
    this.memoryStep = 0;
    
    // Performance tracking
    this.stats = {
      indexLoadTime: 0,
      contextAssemblyTime: 0,
      totalConversations: 0,
      memoryHits: 0,
      memoryMisses: 0
    };
    
    this.logger = options.logger || console;
    this.isInitialized = false;
  }
  
  /**
   * Initialize the memory system
   * Creates directories and loads existing indexes
   */
  async initialize() {
    const startTime = Date.now();
    
    try {
      // Ensure directories exist
      this.ensureDirectories();
      
      // Load existing indexes from disk
      await this.loadIndexes();
      
      this.stats.indexLoadTime = Date.now() - startTime;
      this.isInitialized = true;
      
      this.logger.info(`[Trinity Memory] Initialized successfully`);
      this.logger.info(`[Trinity Memory] Loaded ${this.conversations.size} conversations`);
      this.logger.info(`[Trinity Memory] Index loading time: ${this.stats.indexLoadTime}ms`);
      
      return true;
    } catch (error) {
      this.logger.error(`[Trinity Memory] Initialization failed: ${error.message}`);
      throw error;
    }
  }
  
  // 🔧 MEMORY DEBUG TRAIL METHODS
  memoryTrace(step, message, data = null) {
    if (!this.DEBUG_ENABLED) return;
    
    this.memoryStep++;
    const traceId = this.MEMORY_TRACE_ID || 'NO_TRACE';
    let debugMsg = `🔧 [MEM-TRACE:${traceId}:${this.memoryStep}] ${step}: ${message}`;
    
    if (data) {
      if (typeof data === 'string') {
        debugMsg += ` | "${data.substring(0, 100)}..." (len:${data.length})`;
      } else if (Array.isArray(data)) {
        debugMsg += ` | [${data.length} items]`;
      } else if (typeof data === 'object') {
        debugMsg += ` | ${JSON.stringify(data, null, 0)}`;
      } else {
        debugMsg += ` | ${data} (${typeof data})`;
      }
    }
    
    console.log(debugMsg);
  }
  
  startMemoryTrace(operation, query) {
    if (!this.DEBUG_ENABLED) return;
    
    this.MEMORY_TRACE_ID = `${operation}_${Date.now()}`;
    this.memoryStep = 0;
    this.memoryTrace('START', `Beginning ${operation}`, query);
  }
  
  endMemoryTrace(result = 'completed') {
    if (!this.DEBUG_ENABLED) return;
    
    this.memoryTrace('END', `Memory trace completed: ${result}`);
    this.MEMORY_TRACE_ID = null;
    this.memoryStep = 0;
  }
  
  /**
   * Detect if a message contains memory references
   * Uses simple pattern matching for MVP scope
   */
  detectsMemoryReference(message) {
    if (!message || typeof message !== 'string') return false;
    
    const patterns = [
      /\b(that|the|last|previous) (poem|code|function|explanation)\b/i,
      /what was the (\w+) line/i,
      /you (said|wrote|mentioned|explained)/i,
      /earlier you (told|showed|wrote)/i,
      /from (our|the) (previous|last) (conversation|discussion)/i
    ];
    
    return patterns.some(pattern => pattern.test(message));
  }
  
  /**
   * Build context for Claude Code to read
   * Core functionality: selective file loading with relevance scoring
   */
  async buildContextForClaude(message) {

    console.log(`🔍 MEMORY_TRACE: buildContextForClaude called with: "${message}" (type: ${typeof message})`);
    console.log(`🔍 MEMORY_TRACE: message length: ${message?.length}`);
    console.log(`🔍 MEMORY_TRACE: message constructor: ${message?.constructor?.name}`);
    
    if (!message || typeof message !== 'string') {
      console.log('🚨 MEMORY_TRACE: Invalid message parameter!');
      throw new Error(`Invalid message parameter: ${typeof message}`);
    }
    this.startMemoryTrace('buildContext', message);
    const startTime = Date.now();
    
    try {
      // CRITICAL: Aggressive parameter validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.error(`[EMERGENCY] buildContextForClaude received invalid message: "${message}" (type: ${typeof message})`);
        return {
          contextText: '',
          summary: 'Invalid message parameter provided',
          artifacts: [],
          relevantConversations: 0
        };
      }
      
      // Debug logging for parameter validation
      console.log(`[DEBUG] buildContextForClaude received valid message: "${message}" (type: ${typeof message}, length: ${message.length})`);
      
      // Find relevant conversation IDs
      this.memoryTrace('SEARCH_START', 'Finding relevant conversations', message);
      const relevantIds = this.findRelevantConversations(message);
      this.memoryTrace('SEARCH_RESULT', 'Found relevant conversations', relevantIds);
      
      if (relevantIds.length === 0) {
        this.stats.memoryMisses++;
        return {
          contextText: '',
          summary: 'No relevant memory found',
          artifacts: [],
          relevantConversations: 0
        };
      }
      
      // For "you wrote" queries about specific content, prioritize single most relevant item
      const isSpecificContentQuery = /\b(the|that)\s+(poem|code|function|explanation)\s+you\s+(wrote|created|made)\b/i.test(message);
      
      let selectedIds;
      if (isSpecificContentQuery) {
        // For specific content queries, focus on the most relevant content type
        const contentTypeMatch = message.match(/\b(poem|code|function|explanation)\b/i);
        const requestedType = contentTypeMatch ? contentTypeMatch[1].toLowerCase() : null;
        
        if (requestedType) {
          // Filter to only conversations of the requested type and get the most recent
          const typeSpecificIds = relevantIds.filter(id => {
            const conv = this.conversations.get(id);
            return conv && (conv.contentType === requestedType || 
                          (requestedType === 'poem' && conv.assistantResponse.length > 200 && 
                           /\n.*\n.*\n/s.test(conv.assistantResponse)));
          });
          
          selectedIds = typeSpecificIds.length > 0 ? typeSpecificIds.slice(0, 2) : relevantIds.slice(0, 3);
        } else {
          selectedIds = relevantIds.slice(0, 3);
        }
      } else {
        // For line-specific queries, ensure we include authoritative content even if it's not in top 5
        const isLineQuery = /\b(line|verse)\s+\d+/i.test(message) || 
                           /what('?s|\s+is|\s+was)\s+(the\s+)?(\w+)\s+(line|verse)/i.test(message) ||
                           /(\w+)\s+(line|verse)\s+(in|of|from)/i.test(message);
        
        if (isLineQuery) {
          // Get top results first
          let lineSelectedIds = relevantIds.slice(0, 5);
          
          // Check if any authoritative content is missing from top 5
          const authoritativeIds = relevantIds.filter(id => {
            const conv = this.conversations.get(id);
            if (!conv) return false;
            return conv.assistantResponse.length > 200 && 
                   (conv.assistantResponse.includes('```') || 
                    conv.assistantResponse.includes('contents of the poem') ||
                    conv.assistantResponse.includes('display it'));
          });
          
          // Add missing authoritative content (up to 2 additional items)
          for (const authId of authoritativeIds.slice(0, 2)) {
            if (!lineSelectedIds.includes(authId)) {
              lineSelectedIds.push(authId);
            }
          }
          
          selectedIds = lineSelectedIds;
        } else {
          // Load only the most relevant conversations (max 5 for performance)
          selectedIds = relevantIds.slice(0, 5);
        }
      }
      
      const conversations = await this.loadConversationFiles(selectedIds);
      
      // Format context for Claude Code
      const contextText = this.formatContextFile(message, conversations);
      
      this.stats.contextAssemblyTime = Date.now() - startTime;
      this.stats.memoryHits++;
      
      this.logger.info(`[Trinity Memory] Context assembled in ${this.stats.contextAssemblyTime}ms`);
      this.logger.info(`[Trinity Memory] Found ${selectedIds.length} relevant conversations`);
      
      // Add selection transparency for debugging
      if (selectedIds.length > 1) {
        this.logger.info(`[Trinity Memory] Selected conversations (by relevance):`);
        selectedIds.slice(0, 3).forEach((id, index) => {
          const conv = this.conversations.get(id);
          if (conv) {
            // EMERGENCY: Validate conversation properties before accessing
            const userMessage = conv.userMessage || '[no message]';
            const timestamp = conv.timestamp || '[no timestamp]';
            const preview = userMessage.substring(0, 50);
            const timeStr = typeof timestamp === 'string' && timestamp.length > 11 ? timestamp.substring(11, 19) : timestamp;
            this.logger.info(`  ${index + 1}. ${id}: "${preview}..." (${conv.contentType}, ${timeStr})`);
          }
        });
      }
      
      this.memoryTrace('CONTEXT_BUILT', 'Context assembly completed', { 
        selectedCount: selectedIds.length, 
        executionTime: this.stats.contextAssemblyTime 
      });
      this.endMemoryTrace('success');
      
      return {
        contextText,
        summary: `Found ${selectedIds.length} relevant conversations`,
        artifacts: conversations.map(conv => ({
          id: conv.id,
          type: conv.contentType || 'conversation',
          relevance: conv.relevanceScore || 0.5,
          timestamp: conv.timestamp
        })),
        relevantConversations: selectedIds.length
      };
      
    } catch (error) {
      this.logger.error(`[Trinity Memory] Context assembly failed: ${error.message}`);
      return {
        contextText: '',
        summary: 'Memory context assembly failed',
        artifacts: [],
        relevantConversations: 0
      };
    }
  }
  
  /**
   * Store a conversation response with content type detection
   */
  async storeResponse(userMessage, assistantResponse, sessionId = 'default') {
    try {
      const conversationId = this.generateConversationId();
      const timestamp = new Date().toISOString();
      const contentType = this.detectContentType(assistantResponse);
      
      const conversation = {
        id: conversationId,
        sessionId,
        timestamp,
        userMessage,
        assistantResponse,
        contentType,
        topics: this.extractTopics(userMessage + ' ' + assistantResponse),
        metadata: {
          messageLength: userMessage.length,
          responseLength: assistantResponse.length,
          detectedType: contentType
        }
      };
      
      // Store in memory
      this.conversations.set(conversationId, conversation);
      
      // Update indexes
      this.updateIndexes(conversation);
      
      // Persist to disk
      await this.persistConversation(conversation);
      await this.persistIndexes();
      
      this.stats.totalConversations++;
      
      this.logger.info(`[Trinity Memory] Stored conversation ${conversationId} (${contentType})`);
      
      return conversationId;
      
    } catch (error) {
      this.logger.error(`[Trinity Memory] Failed to store response: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find relevant conversations based on message content
   * Uses topic matching, content type, and recency scoring
   */
  findRelevantConversations(message) {
    const relevantIds = new Set();
    
    // AGGRESSIVE TRACE: Log all parameters received
    console.log(`[TRACE] findRelevantConversations called with: "${message}" (type: ${typeof message})`);
    console.log(`[TRACE] Stack trace:`, new Error().stack.split('\n').slice(1, 4).join('\n'));
    
    // CRITICAL: Validate message parameter before processing
    if (!message || typeof message !== 'string') {
      console.error(`[CRITICAL] findRelevantConversations received invalid message: ${message} (type: ${typeof message})`);
      return []; // Return empty array instead of crashing
    }
    
    const messageTokens = this.tokenize(message.toLowerCase());
    
    // EMERGENCY FIX: Handle "just wrote" clarification queries with temporal proximity
    const isJustWroteQuery = /\b(just\s+wrote|recently\s+wrote|you\s+wrote|you\s+just\s+wrote)\b/i.test(message);
    const isTheOneQuery = /\b(the\s+one|that\s+one)\s+you\s+.*\b(wrote|created|made)\b/i.test(message);
    const isClarificationQuery = /^(no|not|that|the)\s+/i.test(message.trim());
    const isLineQuery = /\b(line|verse)\s+\d+/i.test(message) || /what('?s|\s+is)\s+(line|verse)/i.test(message);
    
    // Handle clarification queries OR line queries about recent content
    if ((isJustWroteQuery || isTheOneQuery) && isClarificationQuery || isLineQuery) {
      // For "just wrote" clarification queries, prioritize recent content creation by type
      const hourAgo = Date.now() - (60 * 60 * 1000);
      
      // Get all recent conversations sorted by time (most recent first)
      const recentConversations = Array.from(this.conversations.values())
        .filter(conv => new Date(conv.timestamp).getTime() > hourAgo)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Add recent content creation (poems, code) first
      recentConversations
        .filter(conv => conv.contentType === 'poem' || conv.contentType === 'code')
        .forEach(conv => relevantIds.add(conv.id));
      
      // Add other recent conversations
      recentConversations
        .filter(conv => conv.contentType !== 'poem' && conv.contentType !== 'code')
        .forEach(conv => relevantIds.add(conv.id));
        
      // If we found recent content, don't do normal topic matching (return early)
      if (relevantIds.size > 0) {
        return this.sortAndReturnRelevantIds(message, relevantIds);
      }
    }
    
    // Check for specific content type requests
    if (/poem/i.test(message)) {
      const poemIds = this.artifactIndex.get('poem') || new Set();
      poemIds.forEach(id => relevantIds.add(id));
    }
    
    if (/code|function/i.test(message)) {
      const codeIds = this.artifactIndex.get('code') || new Set();
      codeIds.forEach(id => relevantIds.add(id));
    }
    
    // Topic-based matching
    messageTokens.forEach(token => {
      const topicIds = this.topicIndex.get(token) || new Set();
      topicIds.forEach(id => relevantIds.add(id));
    });
    
    // Convert to array and score by relevance
    const scoredIds = Array.from(relevantIds).map(id => {
      const conversation = this.conversations.get(id);
      if (!conversation) return null;
      
      const relevanceScore = this.calculateRelevanceScore(message, conversation);
      return { id, score: relevanceScore, timestamp: conversation.timestamp };
    }).filter(item => item !== null);
    
    // Enhanced sorting: prioritize recency for "you wrote" queries
    const isYouWroteQuery = /\b(the|that)\s+(poem|code|function|explanation)\s+you\s+(wrote|created|made)\b/i.test(message);
    const hasRecentQualifier = /\b(recent|latest|most recent|just wrote|recently wrote)\b/i.test(message);
    
    scoredIds.sort((a, b) => {
      // For "you wrote" queries or explicit recency requests, strongly favor recent content
      if (isYouWroteQuery || hasRecentQualifier) {
        const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
        // Add significant recency bonus for "you wrote" queries
        const recencyWeight = isYouWroteQuery ? 0.3 : 0.5;
        const adjustedScoreA = a.score + (timeDiff < 0 ? recencyWeight : 0);
        const adjustedScoreB = b.score + (timeDiff > 0 ? recencyWeight : 0);
        
        if (Math.abs(adjustedScoreA - adjustedScoreB) < 0.1) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return adjustedScoreB - adjustedScoreA;
      }
      
      // Default sorting: relevance first, then recency for ties
      if (Math.abs(a.score - b.score) < 0.1) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return b.score - a.score;
    });
    
    return scoredIds.map(item => item.id);
  }
  
  /**
   * Helper method to sort and return relevant conversation IDs
   */
  sortAndReturnRelevantIds(message, relevantIds) {
    // Convert to array and score by relevance
    const scoredIds = Array.from(relevantIds).map(id => {
      const conversation = this.conversations.get(id);
      if (!conversation) return null;
      
      const relevanceScore = this.calculateRelevanceScore(message, conversation);
      return { id, score: relevanceScore, timestamp: conversation.timestamp };
    }).filter(item => item !== null);
    
    // Enhanced sorting: prioritize recency for "you wrote" queries
    const isYouWroteQuery = /\b(the|that)\s+(poem|code|function|explanation)\s+you\s+(wrote|created|made)\b/i.test(message);
    const hasRecentQualifier = /\b(recent|latest|most recent|just wrote|recently wrote)\b/i.test(message);
    
    scoredIds.sort((a, b) => {
      // For "you wrote" queries or explicit recency requests, strongly favor recent content
      if (isYouWroteQuery || hasRecentQualifier) {
        const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
        // Add significant recency bonus for "you wrote" queries
        const recencyWeight = isYouWroteQuery ? 0.3 : 0.5;
        const adjustedScoreA = a.score + (timeDiff < 0 ? recencyWeight : 0);
        const adjustedScoreB = b.score + (timeDiff > 0 ? recencyWeight : 0);
        
        if (Math.abs(adjustedScoreA - adjustedScoreB) < 0.1) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        }
        return adjustedScoreB - adjustedScoreA;
      }
      
      // Default sorting: relevance first, then recency for ties
      if (Math.abs(a.score - b.score) < 0.1) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return b.score - a.score;
    });
    
    return scoredIds.map(item => item.id);
  }
  
  /**
   * Calculate relevance score between message and conversation
   */
  calculateRelevanceScore(message, conversation) {
    let score = 0;
    const messageTokens = this.tokenize(message.toLowerCase());
    const conversationText = (conversation.userMessage + ' ' + conversation.assistantResponse).toLowerCase();
    const conversationTokens = this.tokenize(conversationText);
    
    // EMERGENCY FIX: Boost relevance for "just wrote" clarification queries
    const isJustWroteQuery = /\b(just\s+wrote|recently\s+wrote|you\s+wrote|you\s+just\s+wrote)\b/i.test(message);
    const isContentTypeQuery = /\b(poem|code|function|explanation)\b/i.test(message);
    const isTheOneQuery = /\b(the\s+one|that\s+one)\s+you\s+.*\b(wrote|created|made)\b/i.test(message);
    
    if ((isJustWroteQuery || isTheOneQuery) && isContentTypeQuery) {
      // For "just wrote" + content type queries, heavily favor recent content of that type
      const requestedType = message.match(/\b(poem|code|function|explanation)\b/i)?.[1]?.toLowerCase();
      if (requestedType && conversation.contentType === requestedType) {
        score += 0.8; // Major boost for matching content type
        
        // Additional boost for very recent content (within last hour)
        const conversationTime = new Date(conversation.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (conversationTime > hourAgo) {
          score += 0.5; // Recency boost
        }
      }
    }
    
    // EMERGENCY FIX: Special handling for clarification queries without explicit content type
    if (isTheOneQuery && !isContentTypeQuery) {
      // "the one you wrote" without specifying type - boost recent content creation
      if (conversation.contentType === 'poem' || conversation.contentType === 'code') {
        score += 0.7; // Boost for created content
        
        const conversationTime = new Date(conversation.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (conversationTime > hourAgo) {
          score += 0.6; // Strong recency boost
        }
      }
    }
    
    // EMERGENCY FIX: Massive boost for recent content creation on line queries
    const isLineQuery = /\b(line|verse)\s+\d+/i.test(message) || /what('?s|\s+is)\s+(line|verse)/i.test(message);
    if (isLineQuery && (conversation.contentType === 'poem' || conversation.contentType === 'code')) {
      const conversationTime = new Date(conversation.timestamp);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (conversationTime > hourAgo) {
        score += 1.5; // Massive boost for recent poems/code on line queries
        this.logger.info(`[Emergency Fix] Boosting recent ${conversation.contentType} for line query: ${conversation.id} -> ${score}`);
      }
    }
    
    // Token overlap scoring
    const overlap = messageTokens.filter(token => conversationTokens.includes(token));
    score += (overlap.length / messageTokens.length) * 0.6;
    
    // Content type boost
    if (conversation.contentType === 'poem' && /poem/i.test(message)) score += 0.3;
    if (conversation.contentType === 'code' && /code|function/i.test(message)) score += 0.3;
    
    // Recency boost (conversations from last 24 hours get boost)
    const hoursSince = (Date.now() - new Date(conversation.timestamp)) / (1000 * 60 * 60);
    if (hoursSince < 24) score += 0.1;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
  
  /**
   * Detect content type of response
   */
  detectContentType(response) {
    if (this.isPoem(response)) return 'poem';
    if (this.isCode(response)) return 'code';  
    if (this.isExplanation(response)) return 'explanation';
    return 'general';
  }
  
  /**
   * Simple poem detection
   */
  isPoem(text) {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.length > 2 && 
           lines.length < 20 &&
           lines.every(line => line.length < 80) &&
           !text.includes('function') &&
           !text.includes('const ') &&
           lines.some(line => line.length < 50); // Poetry tends to have shorter lines
  }
  
  /**
   * Simple code detection
   */
  isCode(text) {
    const codePatterns = [
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /class\s+\w+/,
      /import\s+.*from/,
      /if\s*\([^)]+\)\s*{/,
      /\w+\.\w+\(/
    ];
    
    return codePatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Simple explanation detection
   */
  isExplanation(text) {
    const explanationPatterns = [
      /this\s+(means|explains|shows)/i,
      /in\s+other\s+words/i,
      /for\s+example/i,
      /the\s+reason\s+(is|why)/i
    ];
    
    return explanationPatterns.some(pattern => pattern.test(text)) ||
           (text.length > 200 && !this.isCode(text) && !this.isPoem(text));
  }
  
  /**
   * Load conversation files from disk
   */
  async loadConversationFiles(conversationIds) {
    const conversations = [];
    
    for (const id of conversationIds) {
      try {
        const filePath = path.join(this.conversationsDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const conversation = JSON.parse(content);
          conversations.push(conversation);
        } else {
          // Try to get from memory if file doesn't exist
          const memoryConversation = this.conversations.get(id);
          if (memoryConversation) {
            conversations.push(memoryConversation);
          }
        }
      } catch (error) {
        this.logger.warn(`[Trinity Memory] Failed to load conversation ${id}: ${error.message}`);
      }
    }
    
    return conversations;
  }
  
  /**
   * Format context file for Claude Code to read
   */
  formatContextFile(userMessage, conversations) {
    if (!conversations || conversations.length === 0) {
      return '';
    }
    
    // Detect if this is a line-specific query that needs source hierarchy
    const isLineQuery = /\b(line|verse)\s+\d+/i.test(userMessage) || 
                       /what('?s|\s+is|\s+was)\s+(the\s+)?(\w+)\s+(line|verse)/i.test(userMessage) ||
                       /(\w+)\s+(line|verse)\s+(in|of|from)/i.test(userMessage);
    const lineQueryPattern = /\b(the\s+)?(\w+)\s+(line|verse)/i;
    const lineMatch = userMessage.match(lineQueryPattern);
    
    let contextText = `User question: "${userMessage}"\n\n`;
    
    if (isLineQuery) {
      this.memoryTrace('LINE_QUERY', 'Processing line-specific query', { isLineQuery, conversationCount: conversations.length });
      // For line queries, implement source hierarchy to prevent self-reinforcing errors
      const authoritativeContent = [];
      const previousQA = [];
      
      conversations.forEach(conv => {
        // Classify as authoritative if it contains full content displays
        const hasFullContent = conv.assistantResponse.length > 200 && 
                              (conv.assistantResponse.includes('```') || 
                               conv.assistantResponse.includes('contents of the poem') ||
                               conv.assistantResponse.includes('display it'));
        
        if (hasFullContent) {
          authoritativeContent.push(conv);
        } else {
          previousQA.push(conv);
        }
      });
      
      contextText += `IMPORTANT: For line-specific questions, use the AUTHORITATIVE CONTENT below for accurate line counting.\n\n`;
      
      // Show authoritative content first and prominently
      if (authoritativeContent.length > 0) {
        contextText += `=== AUTHORITATIVE CONTENT (use for line counting) ===\n\n`;
        authoritativeContent.forEach((conv, index) => {
          contextText += `--- Source ${index + 1}: ${conv.contentType || 'content display'} ---\n`;
          contextText += `User: ${conv.userMessage}\n`;
          contextText += `Assistant: ${conv.assistantResponse}\n\n`;
        });
      }
      
      // Show previous Q&A as reference only
      if (previousQA.length > 0) {
        contextText += `=== PREVIOUS Q&A (reference only - may contain errors) ===\n\n`;
        
        // Sort by timestamp so most recent appears last (for "poem you just wrote" queries)
        const sortedQA = previousQA.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        sortedQA.forEach((conv, index) => {
          contextText += `--- Q&A ${index + 1} (${conv.contentType || 'general'}) ---\n`;
          contextText += `User: ${conv.userMessage}\n`;
          contextText += `Assistant: ${conv.assistantResponse}\n\n`;
        });
      }
      
      contextText += `INSTRUCTION: When answering "${userMessage}", use the MOST RECENT poem from either section above. If the question asks about "the poem you just wrote", use the last poem in chronological order. The AUTHORITATIVE CONTENT and PREVIOUS Q&A are both valid - choose the most recent one.`;
      
      // 🔧 MEMORY DEBUG: Log what poems were found
      this.memoryTrace('SOURCES_FOUND', 'Classified conversation sources', { 
        authCount: authoritativeContent.length, 
        qaCount: previousQA.length 
      });
      
      authoritativeContent.forEach((conv, i) => {
        this.memoryTrace('AUTH_SOURCE', `Authoritative[${i}]`, { 
          timestamp: conv.timestamp, 
          preview: conv.assistantResponse.substring(0, 100) 
        });
      });
      
      previousQA.forEach((conv, i) => {
        this.memoryTrace('QA_SOURCE', `Previous Q&A[${i}]`, { 
          timestamp: conv.timestamp, 
          preview: conv.assistantResponse.substring(0, 100) 
        });
      });
      
    } else {
      // Standard context format for non-line queries
      contextText += `RELEVANT MEMORY CONTEXT (${conversations.length} conversations):\n\n`;
      
      conversations.forEach((conv, index) => {
        contextText += `--- Memory ${index + 1} (${conv.contentType || 'general'}) ---\n`;
        contextText += `User: ${conv.userMessage}\n`;
        contextText += `Assistant: ${conv.assistantResponse}\n\n`;
      });
      
      contextText += `Please use this memory context to provide an accurate response to the user's question.`;
    }
    
    return contextText;
  }
  
  /**
   * Helper methods
   */
  
  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .filter(token => !['the', 'and', 'but', 'for', 'are', 'was', 'you', 'can'].includes(token));
  }
  
  extractTopics(text) {
    const tokens = this.tokenize(text);
    // Simple topic extraction - return meaningful tokens
    return tokens.filter(token => token.length > 3).slice(0, 10);
  }
  
  updateIndexes(conversation) {
    // Update topic index
    conversation.topics.forEach(topic => {
      if (!this.topicIndex.has(topic)) {
        this.topicIndex.set(topic, new Set());
      }
      this.topicIndex.get(topic).add(conversation.id);
    });
    
    // Update artifact index by content type
    if (!this.artifactIndex.has(conversation.contentType)) {
      this.artifactIndex.set(conversation.contentType, new Set());
    }
    this.artifactIndex.get(conversation.contentType).add(conversation.id);
    
    // Update time index
    const dateKey = conversation.timestamp.split('T')[0]; // YYYY-MM-DD
    if (!this.timeIndex.has(dateKey)) {
      this.timeIndex.set(dateKey, new Set());
    }
    this.timeIndex.get(dateKey).add(conversation.id);
    
    // Update session index
    this.sessionIndex.set(conversation.sessionId, {
      lastActivity: conversation.timestamp,
      conversationCount: (this.sessionIndex.get(conversation.sessionId)?.conversationCount || 0) + 1
    });
  }
  
  ensureDirectories() {
    const dirs = [this.baseDir, this.memoryDir, this.conversationsDir, this.indexesDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  async loadIndexes() {
    try {
      const indexFile = path.join(this.indexesDir, 'memory-indexes.json');
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf8');
        const indexes = JSON.parse(content);
        
        // Restore Map/Set structures
        this.conversations = new Map(indexes.conversations || []);
        this.topicIndex = new Map(Object.entries(indexes.topicIndex || {}).map(([k, v]) => [k, new Set(v)]));
        this.artifactIndex = new Map(Object.entries(indexes.artifactIndex || {}).map(([k, v]) => [k, new Set(v)]));
        this.timeIndex = new Map(Object.entries(indexes.timeIndex || {}).map(([k, v]) => [k, new Set(v)]));
        this.sessionIndex = new Map(indexes.sessionIndex || []);
      }
    } catch (error) {
      this.logger.warn(`[Trinity Memory] Failed to load indexes, starting fresh: ${error.message}`);
    }
  }
  
  async persistIndexes() {
    try {
      const indexFile = path.join(this.indexesDir, 'memory-indexes.json');
      const tempFile = indexFile + '.tmp';
      
      const indexes = {
        conversations: Array.from(this.conversations.entries()),
        topicIndex: Object.fromEntries(Array.from(this.topicIndex.entries()).map(([k, v]) => [k, Array.from(v)])),
        artifactIndex: Object.fromEntries(Array.from(this.artifactIndex.entries()).map(([k, v]) => [k, Array.from(v)])),
        timeIndex: Object.fromEntries(Array.from(this.timeIndex.entries()).map(([k, v]) => [k, Array.from(v)])),
        sessionIndex: Array.from(this.sessionIndex.entries()),
        lastUpdated: new Date().toISOString()
      };
      
      // Atomic write: temp file → rename
      fs.writeFileSync(tempFile, JSON.stringify(indexes, null, 2));
      fs.renameSync(tempFile, indexFile);
      
    } catch (error) {
      this.logger.error(`[Trinity Memory] Failed to persist indexes: ${error.message}`);
    }
  }
  
  async persistConversation(conversation) {
    try {
      const filePath = path.join(this.conversationsDir, `${conversation.id}.json`);
      const tempFile = filePath + '.tmp';
      
      // Atomic write: temp file → rename
      fs.writeFileSync(tempFile, JSON.stringify(conversation, null, 2));
      fs.renameSync(tempFile, filePath);
      
    } catch (error) {
      this.logger.error(`[Trinity Memory] Failed to persist conversation ${conversation.id}: ${error.message}`);
    }
  }
  
  /**
   * Get memory statistics for UI display
   */
  getStats() {
    return {
      ...this.stats,
      totalConversations: this.conversations.size,
      totalTopics: this.topicIndex.size,
      totalSessions: this.sessionIndex.size,
      isInitialized: this.isInitialized
    };
  }
  
  /**
   * Search memory by query
   */
  searchMemory(query, limit = 10) {
    // EMERGENCY: Validate query parameter before processing
    if (!query || typeof query !== 'string') {
      console.error(`[CRITICAL] searchMemory received invalid query: ${query} (type: ${typeof query})`);
      return []; // Return empty array instead of crashing
    }
    
    const relevantIds = this.findRelevantConversations(query);
    return relevantIds.slice(0, limit).map(id => this.conversations.get(id)).filter(Boolean);
  }
}

module.exports = TrinityNativeMemory;