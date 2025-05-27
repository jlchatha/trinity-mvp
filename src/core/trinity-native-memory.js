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
const crypto = require('crypto');

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
   * Core functionality: session-first search, then historical memories
   */
  async buildContextForClaude(message, sessionId = 'default') {
    const startTime = Date.now();
    
    try {
      // CRITICAL FIX: Search current session FIRST, then historical
      const currentSessionIds = this.findRelevantConversationsInSession(message, sessionId);
      
      // If we found relevant content in current session, prioritize it
      let relevantIds;
      if (currentSessionIds.length > 0) {
        this.logger.info(`[Trinity Memory] Found ${currentSessionIds.length} relevant items in current session`);
        
        // For session-specific queries, only return current session content
        const isSessionSpecificQuery = /\b(this\s+conversation|in\s+this\s+session|you\s+(just\s+)?wrote|you\s+(just\s+)?created)\b/i.test(message);
        const isLineSpecificQuery = /\b(last\s+line|first\s+line|what\s+(is|was)\s+the\s+(last|first|second|third|\d+)\s+(line|verse))\b/i.test(message);
        
        if (isSessionSpecificQuery || isLineSpecificQuery) {
          // Session-specific or line-specific queries get ONLY current session content
          relevantIds = currentSessionIds;
          this.logger.info(`[Trinity Memory] ${isLineSpecificQuery ? 'Line-specific' : 'Session-specific'} query - returning only current session content`);
        } else {
          // General queries can include historical context for completeness
          const historicalIds = this.findRelevantConversations(message)
            .filter(id => !currentSessionIds.includes(id))
            .slice(0, 2); // Only 2 historical items max when current session has content
          
          relevantIds = [...currentSessionIds, ...historicalIds];
          this.logger.info(`[Trinity Memory] General query - including historical context`);
        }
      } else {
        // No current session matches, search all historical memories
        this.logger.info(`[Trinity Memory] No current session matches, searching historical memories`);
        relevantIds = this.findRelevantConversations(message);
      }
      
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
            const preview = conv.userMessage.substring(0, 50);
            this.logger.info(`  ${index + 1}. ${id}: "${preview}..." (${conv.contentType}, ${conv.timestamp.substring(11, 19)})`);
          }
        });
      }
      
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
   * Store a conversation response with content type detection and unique content ID
   */
  async storeResponse(userMessage, assistantResponse, sessionId = 'default') {
    try {
      const conversationId = this.generateConversationId();
      const timestamp = new Date().toISOString();
      const contentType = this.detectContentType(assistantResponse);
      
      // CRITICAL FIX: Generate unique content identifiers to prevent name collisions
      const contentMetadata = this.generateContentMetadata(assistantResponse, contentType, sessionId);
      
      const conversation = {
        id: conversationId,
        sessionId,
        timestamp,
        userMessage,
        assistantResponse,
        contentType,
        topics: this.extractTopics(userMessage + ' ' + assistantResponse),
        // NEW: Content identification system
        contentId: contentMetadata.contentId,
        contentTitle: contentMetadata.title,
        contentHash: contentMetadata.hash,
        conversationIndex: await this.getConversationIndex(sessionId),
        metadata: {
          messageLength: userMessage.length,
          responseLength: assistantResponse.length,
          detectedType: contentType,
          hasCreativeContent: contentMetadata.hasCreativeContent
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
   * Find relevant conversations within the current session ONLY
   * CRITICAL: Enhanced with content disambiguation and strict session isolation
   */
  findRelevantConversationsInSession(message, sessionId = 'default') {
    const sessionConversations = Array.from(this.conversations.values())
      .filter(conv => conv.sessionId === sessionId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first
    
    if (sessionConversations.length === 0) {
      this.logger.info(`[Trinity Memory] No conversations found in session ${sessionId}`);
      return [];
    }
    
    this.logger.info(`[Trinity Memory] Searching ${sessionConversations.length} conversations in current session ${sessionId}`);
    
    const relevantIds = new Set();
    const messageTokens = this.tokenize(message.toLowerCase());
    
    // ENHANCED: Detect specific content requests with disambiguation
    const isLastLineQuery = /\b(last|final)\s+(line|verse)\b/i.test(message);
    const isSpecificLineQuery = /\b(\w+)\s+(line|verse)\b/i.test(message) || /\bline\s+\d+\b/i.test(message);
    const isContentQuery = /\b(poem|code|function|explanation)\b/i.test(message);
    
    // For line-specific queries, prioritize most recent creative content
    if ((isLastLineQuery || isSpecificLineQuery) && isContentQuery) {
      this.logger.info(`[Trinity Memory] Detected line-specific query in current session`);
      
      // Find most recent creative content in current session
      const recentCreative = sessionConversations
        .filter(conv => conv.contentType === 'poem' || conv.contentType === 'code')
        .slice(0, 2); // Most recent 2 creative items
      
      recentCreative.forEach(conv => {
        relevantIds.add(conv.id);
        this.logger.info(`[Trinity Memory] Added recent ${conv.contentType}: ${conv.id} (${conv.contentTitle || 'untitled'})`);
      });
      
      // Return early for line queries - don't dilute with other content
      if (relevantIds.size > 0) {
        return Array.from(relevantIds);
      }
    }
    
    // Standard content type filtering within session
    if (/poem/i.test(message)) {
      sessionConversations
        .filter(conv => conv.contentType === 'poem')
        .forEach(conv => {
          relevantIds.add(conv.id);
          this.logger.info(`[Trinity Memory] Added poem: ${conv.contentTitle || 'untitled'} (${conv.contentHash})`);
        });
    }
    
    if (/code|function/i.test(message)) {
      sessionConversations
        .filter(conv => conv.contentType === 'code')
        .forEach(conv => relevantIds.add(conv.id));
    }
    
    // Enhanced topic matching with session context
    if (relevantIds.size === 0) {
      sessionConversations.forEach(conv => {
        const conversationText = (conv.userMessage + ' ' + conv.assistantResponse).toLowerCase();
        const tokenMatches = messageTokens.filter(token => conversationText.includes(token));
        
        // Require at least 2 token matches for session queries to avoid noise
        if (tokenMatches.length >= 2) {
          relevantIds.add(conv.id);
        }
      });
    }
    
    // Score and sort by relevance within session with recency bias
    const scoredIds = Array.from(relevantIds).map(id => {
      const conversation = this.conversations.get(id);
      if (!conversation) return null;
      
      let relevanceScore = this.calculateRelevanceScore(message, conversation);
      
      // CRITICAL: Add massive session bonus to ensure current session wins
      relevanceScore += 2.0; // Huge session bonus
      
      return { 
        id, 
        score: relevanceScore, 
        timestamp: conversation.timestamp,
        contentTitle: conversation.contentTitle,
        contentType: conversation.contentType 
      };
    }).filter(item => item !== null);
    
    // Sort by relevance, heavily favoring recency within session
    scoredIds.sort((a, b) => {
      // For equal relevance, strongly favor recency
      if (Math.abs(a.score - b.score) < 0.3) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      return b.score - a.score;
    });
    
    this.logger.info(`[Trinity Memory] Session search found ${scoredIds.length} relevant conversations`);
    scoredIds.slice(0, 3).forEach((item, i) => {
      this.logger.info(`  ${i+1}. ${item.contentTitle || 'untitled'} (${item.contentType}, score: ${item.score.toFixed(2)})`);
    });
    
    return scoredIds.map(item => item.id);
  }

  /**
   * Find relevant conversations based on message content
   * Uses topic matching, content type, and recency scoring
   */
  findRelevantConversations(message) {
    const relevantIds = new Set();
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
        previousQA.forEach((conv, index) => {
          contextText += `--- Q&A ${index + 1} (${conv.contentType || 'general'}) ---\n`;
          contextText += `User: ${conv.userMessage}\n`;
          contextText += `Assistant: ${conv.assistantResponse}\n\n`;
        });
      }
      
      contextText += `INSTRUCTION: When answering "${userMessage}", analyze the AUTHORITATIVE CONTENT above to find the correct line. Previous Q&A may contain errors - always verify against the full content.`;
      
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
  
  /**
   * CRITICAL FIX: Generate unique content metadata to prevent name collisions
   */
  generateContentMetadata(response, contentType, sessionId) {
    const hasCreativeContent = contentType === 'poem' || contentType === 'code';
    
    // Extract title from content if it's creative content
    let title = null;
    if (hasCreativeContent) {
      title = this.extractContentTitle(response, contentType);
    }
    
    // Generate unique content hash for disambiguation
    const contentHash = crypto.createHash('md5')
      .update(response.substring(0, 200)) // First 200 chars for uniqueness
      .digest('hex')
      .substring(0, 8);
    
    // Generate unique content ID
    const timestamp = Date.now();
    const contentId = hasCreativeContent 
      ? `${contentType}_${timestamp}_${contentHash}`
      : null;
    
    return {
      contentId,
      title,
      hash: contentHash,
      hasCreativeContent,
      sessionScoped: true // Mark as session-aware content
    };
  }
  
  /**
   * Extract title from creative content (poems, code)
   */
  extractContentTitle(response, contentType) {
    if (contentType === 'poem') {
      // Look for poem title patterns
      const titlePatterns = [
        /Here's "([^"]+)"/,
        /titled "([^"]+)"/,
        /called "([^"]+)"/,
        /poem "([^"]+)"/,
        /^"([^"]+)"$/m
      ];
      
      for (const pattern of titlePatterns) {
        const match = response.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      // Fallback: use first line if it looks like a title
      const lines = response.split('\n').filter(line => line.trim());
      if (lines.length > 0 && lines[0].length < 50 && !lines[0].includes(' ')) {
        return lines[0].trim();
      }
    }
    
    return null; // No title detected
  }
  
  /**
   * Get conversation index within session (for ordering)
   */
  async getConversationIndex(sessionId) {
    const sessionConversations = Array.from(this.conversations.values())
      .filter(conv => conv.sessionId === sessionId);
    return sessionConversations.length + 1;
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
    const relevantIds = this.findRelevantConversations(query);
    return relevantIds.slice(0, limit).map(id => this.conversations.get(id)).filter(Boolean);
  }
}

module.exports = TrinityNativeMemory;