/**
 * Trinity Memory Integration
 * Integrates Trinity System memory patterns with MVP architecture
 * 
 * Provides 4-tier memory hierarchy, conversation tracking, and context optimization
 * for Trinity MVP enhanced file communication system.
 * 
 * FEATURES:
 * - Session-aware context tracking with metadata enhancement
 * - Uncertainty handling with clarification suggestions for ambiguous queries
 * - Smart keyword extraction with stop word filtering
 * - Conversation content preservation (compression-exempt)
 * - Memory hierarchy with compression for non-conversation content
 * - Relevance scoring with session bonus weighting
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const IntelligentCompressor = require('./intelligent-compressor');

class TrinityMemoryIntegration {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp');
        this.memoryDir = path.join(this.baseDir, 'memory');
        
        // 4-tier memory hierarchy
        this.memoryTiers = {
            core: path.join(this.memoryDir, 'core'),
            working: path.join(this.memoryDir, 'working'), 
            reference: path.join(this.memoryDir, 'reference'),
            historical: path.join(this.memoryDir, 'historical')
        };
        
        this.metadataFile = path.join(this.memoryDir, 'metadata.json');
        this.conversationDir = path.join(this.baseDir, 'conversations'); // Store at root level, separate from memory hierarchy
        
        // Session Context Tracking (FUTURE-PROOFING)
        this.currentSession = {
            sessionId: options.sessionId || 'default',
            startTime: Date.now(),
            conversationCount: 0,
            recentConversations: [], // Track last 10 conversations for context
            contextKeywords: new Set() // Track important keywords from current session
        };
        
        // Initialize intelligent compressor
        this.compressor = new IntelligentCompressor({
            logger: options.logger || console,
            logging: { logLevel: options.logLevel || 'info', logCompressionStats: true }
        });
        
        this.logger = options.logger || console;
        this.initialized = false;
        
        // Memory statistics
        this.stats = {
            totalItems: 0,
            totalSize: 0,
            compressionRatio: 0,
            lastAccessed: null,
            itemsByCategory: {
                core: 0,
                working: 0,
                reference: 0,
                historical: 0
            }
        };
    }

    /**
     * Initialize memory hierarchy directories and metadata
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Create base directories
            await fs.mkdir(this.baseDir, { recursive: true });
            await fs.mkdir(this.memoryDir, { recursive: true });
            await fs.mkdir(this.conversationDir, { recursive: true });
            
            // Create tier directories
            for (const [tier, dirPath] of Object.entries(this.memoryTiers)) {
                await fs.mkdir(dirPath, { recursive: true });
            }
            
            // Load or create metadata
            await this.loadMetadata();
            
            // Update statistics
            await this.updateStats();
            
            this.initialized = true;
            this.logger.info('Trinity Memory Integration initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize Trinity Memory Integration:', error);
            throw error;
        }
    }

    /**
     * Load memory metadata
     */
    async loadMetadata() {
        try {
            const data = await fs.readFile(this.metadataFile, 'utf8');
            this.metadata = JSON.parse(data);
        } catch (error) {
            // Create default metadata if file doesn't exist
            this.metadata = {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalItems: 0,
                items: {}
            };
            await this.saveMetadata();
        }
    }

    /**
     * Save memory metadata
     */
    async saveMetadata() {
        try {
            this.metadata.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.metadataFile, JSON.stringify(this.metadata, null, 2));
        } catch (error) {
            this.logger.error('Failed to save metadata:', error);
        }
    }

    /**
     * Store content in memory hierarchy
     * @param {string} category - Memory category (core/working/reference/historical)
     * @param {Object} content - Content object with data and metadata
     * @returns {Object} - Storage result with item ID and compression stats
     */
    async store(category, content) {
        await this.initialize();
        
        if (!this.memoryTiers[category]) {
            throw new Error(`Invalid memory category: ${category}`);
        }

        try {
            // Auto-detect category if not specified or validate existing
            const detectedCategory = this.compressor.detectCategory(content.content || content.text || JSON.stringify(content));
            const finalCategory = category || detectedCategory;
            
            // Generate unique ID for this memory item
            const itemId = this.generateItemId(content);
            
            // Compress content
            const compressionResult = this.compressor.compressContent(
                content.content || content.text || JSON.stringify(content),
                finalCategory
            );
            
            // Create memory item
            const memoryItem = {
                id: itemId,
                type: content.type || 'user_content',
                category: finalCategory,
                originalContent: content.content || content.text || JSON.stringify(content),
                compressedContent: compressionResult.compressedContent,
                semanticSignature: compressionResult.semanticSignature,
                metadata: {
                    source: content.source || 'user',
                    timestamp: new Date().toISOString(),
                    originalSize: compressionResult.originalLength,
                    compressedSize: compressionResult.compressedContent.length,
                    compressionRatio: compressionResult.compressionRatio,
                    tokensSaved: compressionResult.tokensSaved,
                    tags: content.tags || this.extractTags(content.content || content.text || ''),
                    ...content.metadata
                }
            };
            
            // Save to appropriate tier
            const filePath = path.join(this.memoryTiers[finalCategory], `${itemId}.json`);
            await fs.writeFile(filePath, JSON.stringify(memoryItem, null, 2));
            
            // Update metadata
            this.metadata.items[itemId] = {
                category: finalCategory,
                type: memoryItem.type,
                timestamp: memoryItem.metadata.timestamp,
                size: memoryItem.metadata.compressedSize,
                semanticSignature: memoryItem.semanticSignature
            };
            this.metadata.totalItems++;
            await this.saveMetadata();
            
            // Update statistics
            await this.updateStats();
            
            this.logger.info(`Stored memory item ${itemId} in ${finalCategory} category`);
            
            return {
                itemId,
                category: finalCategory,
                compressionStats: {
                    originalSize: compressionResult.originalLength,
                    compressedSize: compressionResult.compressedContent.length,
                    tokensSaved: compressionResult.tokensSaved,
                    compressionRatio: compressionResult.compressionRatio
                }
            };
            
        } catch (error) {
            this.logger.error('Failed to store memory item:', error);
            throw error;
        }
    }

    /**
     * Save conversation to memory
     * @param {string} userMessage - User's message
     * @param {string} assistantResponse - Assistant's response
     * @param {string} sessionId - Session identifier
     * @param {Object} memoryContext - Memory context used for response
     * @returns {Object} - Storage result
     */
    async saveConversation(userMessage, assistantResponse, sessionId = 'default', memoryContext = null) {
        // Update current session tracking
        this.currentSession.conversationCount++;
        
        // Extract keywords for session context
        const keywords = this.extractSessionKeywords(userMessage + ' ' + assistantResponse);
        keywords.forEach(keyword => this.currentSession.contextKeywords.add(keyword));
        
        const conversationData = {
            type: 'conversation',
            content: `User: ${userMessage}\n\nAssistant: ${assistantResponse}`,
            source: 'chat_session',
            metadata: {
                sessionId,
                userMessage,
                assistantResponse,
                memoryContext,
                conversationLength: userMessage.length + assistantResponse.length,
                // Enhanced session metadata (FUTURE-PROOFING)
                sessionPosition: this.currentSession.conversationCount,
                sessionTimestamp: Date.now(),
                isCurrentSession: sessionId === this.currentSession.sessionId,
                sessionKeywords: Array.from(keywords)
            },
            tags: ['conversation', 'chat', sessionId]
        };
        
        // Store conversations in separate directory, NOT in memory hierarchy
        const result = await this.storeConversation(conversationData);
        
        // Track in current session (keep last 10)
        if (result.success) {
            this.currentSession.recentConversations.push({
                id: result.id,
                userMessage,
                assistantResponse,
                timestamp: Date.now(),
                keywords
            });
            
            // Keep only last 10 conversations in memory
            if (this.currentSession.recentConversations.length > 10) {
                this.currentSession.recentConversations.shift();
            }
        }
        
        return result;
    }

    /**
     * Store conversation in separate conversations directory
     * @param {Object} conversationData - Conversation data to store
     * @returns {Object} - Storage result
     */
    async storeConversation(conversationData) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            // Ensure conversations directory exists (at root level)
            const conversationsDir = path.join(this.baseDir, 'conversations');
            await fs.mkdir(conversationsDir, { recursive: true });
            
            // Generate ID and compress content
            const timestamp = Date.now();
            const id = `mem_${timestamp}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Apply compression
            const compressedData = this.compressor.compressContent(
                conversationData.content, 
                'conversation'
            );
            
            const memoryItem = {
                id,
                type: conversationData.type,
                category: 'conversation', // Special category for conversations
                originalContent: conversationData.content,
                compressedContent: compressedData.compressedContent,
                semanticSignature: compressedData.semanticSignature,
                metadata: {
                    ...conversationData.metadata,
                    source: conversationData.source,
                    timestamp: new Date().toISOString(),
                    originalSize: conversationData.content.length,
                    compressedSize: compressedData.compressedContent.length,
                    compressionRatio: compressedData.compressionRatio,
                    tokensSaved: compressedData.tokensSaved,
                    tags: conversationData.tags || []
                }
            };
            
            // Save to conversations directory
            const filename = `${id}.json`;
            const filepath = path.join(conversationsDir, filename);
            await fs.writeFile(filepath, JSON.stringify(memoryItem, null, 2));
            
            this.logger.info(`Conversation stored: ${filename} (${compressedData.tokensSaved} tokens saved)`);
            
            return {
                success: true,
                id,
                path: filepath,
                tokensSaved: compressedData.tokensSaved,
                compressionRatio: compressedData.compressionRatio
            };
            
        } catch (error) {
            this.logger.error('Failed to store conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load relevant memory context for a given prompt
     * @param {string} prompt - User prompt to find context for
     * @param {Object} options - Loading options
     * @returns {Object} - Memory context with relevant items
     */
    async loadRelevantContext(prompt, options = {}) {
        await this.initialize();
        
        const maxItems = options.maxItems || 10;
        const categories = options.categories || ['core', 'working', 'reference'];
        
        try {
            // Generate semantic signature for prompt
            const promptSignature = this.compressor.generateSemanticSignature(prompt);
            const promptTags = this.extractTags(prompt);
            
            // Load items from specified categories
            const relevantItems = [];
            
            for (const category of categories) {
                const categoryItems = await this.loadCategoryItems(category);
                for (const item of categoryItems) {
                    const relevanceScore = this.calculateRelevanceScore(prompt, promptSignature, promptTags, item);
                    if (relevanceScore > 0.3) {
                        relevantItems.push({
                            ...item,
                            relevanceScore
                        });
                    }
                }
            }
            
            // Load conversations only if explicitly requested in categories
            if (categories.includes('conversation')) {
                const conversationItems = await this.loadConversationItems();
                for (const item of conversationItems) {
                    const relevanceScore = this.calculateRelevanceScore(prompt, promptSignature, promptTags, item);
                    if (relevanceScore > 0.3) {
                        relevantItems.push({
                            ...item,
                            relevanceScore
                        });
                    }
                }
            }
            
            // Sort by relevance and limit results
            const sortedItems = relevantItems
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, maxItems);
            
            // Build context summary
            const contextSummary = this.buildContextSummary(sortedItems);
            const optimizationStats = this.calculateOptimizationStats(sortedItems);
            
            // Check for ambiguous queries (multiple high-relevance matches)
            const highRelevanceItems = sortedItems.filter(item => item.relevanceScore > 0.8);
            const multipleMatches = this.detectMultipleMatches(prompt, sortedItems);
            
            return {
                summary: contextSummary,
                optimization: optimizationStats,
                artifacts: sortedItems.map(item => ({
                    id: item.id,
                    name: this.getItemDisplayName(item),
                    type: item.type,
                    category: item.category,
                    relevance: item.relevanceScore,
                    content: item.compressedContent || item.originalContent
                })),
                contextText: sortedItems
                    .map(item => item.compressedContent || item.originalContent)
                    .join('\n\n---\n\n'),
                // Uncertainty handling for multiple matches
                multipleMatches: multipleMatches,
                requiresClarification: multipleMatches.length > 1,
                clarificationSuggestion: multipleMatches.length > 1 ? 
                    this.generateClarificationSuggestion(prompt, multipleMatches) : null
            };
            
        } catch (error) {
            this.logger.error('Failed to load relevant context:', error);
            return {
                summary: 'No relevant context found',
                optimization: { contextPercent: 0, tokensSaved: 0, totalMemoryItems: 0, itemsLoaded: 0 },
                artifacts: [],
                contextText: ''
            };
        }
    }

    /**
     * Load all items from a memory category
     * @param {string} category - Memory category
     * @returns {Array} - Array of memory items
     */
    async loadCategoryItems(category) {
        const categoryDir = this.memoryTiers[category];
        const items = [];
        
        try {
            const files = await fs.readdir(categoryDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(categoryDir, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    items.push(JSON.parse(data));
                }
            }
        } catch (error) {
            this.logger.error(`Failed to load category ${category}:`, error);
        }
        
        return items;
    }

    /**
     * Load conversation items for memory-chat integration
     * @returns {Array} - Array of conversation memory items
     */
    async loadConversationItems() {
        const conversationDir = path.join(this.baseDir, 'conversations');
        const items = [];
        
        try {
            const files = await fs.readdir(conversationDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(conversationDir, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    items.push(JSON.parse(data));
                }
            }
        } catch (error) {
            this.logger.error('Failed to load conversation items:', error);
        }
        
        return items;
    }

    /**
     * Calculate relevance score between prompt and memory item
     * @param {string} prompt - User prompt
     * @param {string} promptSignature - Prompt semantic signature
     * @param {Array} promptTags - Prompt tags
     * @param {Object} item - Memory item
     * @returns {number} - Relevance score (0.0 to 1.0)
     */
    calculateRelevanceScore(prompt, promptSignature, promptTags, item) {
        let score = 0;
        
        // Semantic signature similarity (30% weight - reduced)
        const signatureSimilarity = this.calculateSignatureSimilarity(promptSignature, item.semanticSignature);
        score += signatureSimilarity * 0.3;
        
        // Tag overlap (25% weight - reduced)
        const itemTags = item.metadata.tags || [];
        const tagOverlap = this.calculateTagOverlap(promptTags, itemTags);
        score += tagOverlap * 0.25;
        
        // Recency boost (20% weight - enhanced for very recent items)
        const recencyScore = this.calculateRecencyScore(item.metadata.timestamp);
        score += recencyScore * 0.2;
        
        // Extra boost for very recent conversations (within last hour)
        if (item.category === 'conversation') {
            const timeDiff = Date.now() - new Date(item.metadata.timestamp).getTime();
            if (timeDiff < 3600000) { // Less than 1 hour
                score += 0.3; // Significant boost for very recent conversations
            }
        }
        
        // Session relevance boost (15% weight - NEW)
        const sessionScore = this.calculateSessionRelevance(item);
        score += sessionScore * 0.15;
        
        // Category preference (10% weight - same)
        const categoryScore = item.category === 'core' ? 1.0 : 
                             item.category === 'working' ? 0.8 : 
                             item.category === 'conversation' ? 0.9 : 0.6;
        score += categoryScore * 0.1;
        
        return Math.min(1.0, score);
    }
    
    /**
     * Calculate session relevance for current conversation context
     * @param {Object} item - Memory item
     * @returns {number} - Session relevance score (0.0 to 1.0)
     */
    calculateSessionRelevance(item) {
        if (item.category !== 'conversation') return 0.5; // Neutral for non-conversations
        
        const metadata = item.metadata || {};
        let sessionScore = 0;
        
        // Current session bonus
        if (metadata.isCurrentSession || metadata.sessionId === this.currentSession.sessionId) {
            sessionScore += 0.6; // Strong preference for current session
        }
        
        // Recent conversation bonus
        const recentIds = this.currentSession.recentConversations.map(conv => conv.id);
        if (recentIds.includes(item.id)) {
            sessionScore += 0.4; // Bonus for conversations in current session memory
        }
        
        // Session keyword overlap bonus
        const sessionKeywords = Array.from(this.currentSession.contextKeywords);
        const itemKeywords = metadata.sessionKeywords || [];
        const keywordOverlap = this.calculateTagOverlap(sessionKeywords, itemKeywords);
        sessionScore += keywordOverlap * 0.3;
        
        return Math.min(1.0, sessionScore);
    }
    
    /**
     * Extract session-relevant keywords from conversation content
     * @param {string} content - Conversation content
     * @returns {Array} - Array of important keywords
     */
    extractSessionKeywords(content) {
        if (!content) return [];
        
        // Extract meaningful words (nouns, verbs, adjectives likely)
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !this.isStopWord(word));
            
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Return top 5 most frequent meaningful words
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }
    
    /**
     * Check if word is a stop word (common words to ignore)
     * @param {string} word - Word to check
     * @returns {boolean} - True if stop word
     */
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'run', 'say', 'she', 'too', 'use',
            // Additional common stop words
            'about', 'over', 'through', 'into', 'from', 'with', 'what', 'when', 'where', 'they', 'this', 'that', 'there', 'here'
        ]);
        return stopWords.has(word);
    }
    
    /**
     * Detect multiple potential matches for ambiguous queries (CONSERVATIVE MODE)
     * @param {string} prompt - User prompt
     * @param {Array} sortedItems - Relevance-sorted items
     * @returns {Array} - Array of potential matches requiring clarification
     */
    detectMultipleMatches(prompt, sortedItems) {
        const lowercasePrompt = prompt.toLowerCase();
        
        // CONSERVATIVE: Only trigger for very specific ambiguous patterns
        const ambiguousPatterns = [
            { pattern: /^(show me your poem|your poem|which poem)$/i, type: 'poem' },
            { pattern: /^(which response|what response|your response)$/i, type: 'response' }
        ];
        
        for (const { pattern, type } of ambiguousPatterns) {
            if (pattern.test(prompt.trim())) {
                // Find all items that could match this pattern
                const matches = sortedItems.filter(item => {
                    const content = (item.compressedContent || item.originalContent || '').toLowerCase();
                    switch (type) {
                        case 'poem':
                            // STRICT: Only actual poems with poetic structure
                            return (content.includes('poem') || /\n.*\n.*\n.*\n/.test(content)) && 
                                   item.relevanceScore > 0.8; // HIGH relevance threshold
                        case 'response':
                            return item.category === 'conversation' && item.relevanceScore > 0.8;
                        default:
                            return false;
                    }
                }).slice(0, 3); // Limit to top 3 matches only
                
                // CONSERVATIVE: Only trigger if 3+ very high relevance matches
                if (matches.length >= 3 && matches.filter(m => m.relevanceScore > 0.85).length >= 3) {
                    return matches.map(match => ({
                        id: match.id,
                        type: type,
                        content: match.compressedContent || match.originalContent,
                        relevance: match.relevanceScore,
                        summary: this.generateMatchSummary(match, type)
                    }));
                }
            }
        }
        
        // DEFAULT: No clarification needed - proceed with normal conversation
        return [];
    }
    
    /**
     * Generate a clarification suggestion when multiple matches exist
     * @param {string} prompt - Original prompt
     * @param {Array} matches - Multiple matches found
     * @returns {string} - Clarification suggestion
     */
    generateClarificationSuggestion(prompt, matches) {
        const matchType = matches[0]?.type || 'item';
        
        let suggestion = `I found multiple ${matchType}s that could match your question. Could you clarify which one you're referring to?\n\n`;
        
        matches.forEach((match, idx) => {
            suggestion += `${idx + 1}. ${match.summary}\n`;
        });
        
        suggestion += `\nPlease let me know which ${matchType} you're asking about, or provide more specific details.`;
        
        return suggestion;
    }
    
    /**
     * Generate a summary for a match to help with clarification
     * @param {Object} match - Match item
     * @param {string} type - Type of match
     * @returns {string} - Match summary
     */
    generateMatchSummary(match, type) {
        const content = match.compressedContent || match.originalContent || '';
        const timestamp = match.metadata?.timestamp ? 
            new Date(match.metadata.timestamp).toLocaleString() : 'Unknown time';
        
        switch (type) {
            case 'poem':
                // Extract first few lines of poem
                const poemLines = content.split('\n').filter(line => 
                    line.trim() && !line.toLowerCase().includes('user:') && !line.toLowerCase().includes('assistant:')
                ).slice(0, 2);
                return `Poem starting with: "${poemLines.join(', ')}..." (${timestamp})`;
                
            case 'response':
            case 'explanation':
                // Extract the topic or first part of response
                const responseMatch = content.match(/Assistant?:\s*([^.!?]+)/i);
                const responseStart = responseMatch ? responseMatch[1] : content.substring(0, 60);
                return `Response about: "${responseStart}..." (${timestamp})`;
                
            case 'conversation':
                // Extract the main topic
                const topicMatch = content.match(/User:\s*([^?!.]+)/i);
                const topic = topicMatch ? topicMatch[1] : 'conversation';
                return `Conversation about: "${topic}" (${timestamp})`;
                
            default:
                return `Item: "${content.substring(0, 60)}..." (${timestamp})`;
        }
    }

    /**
     * Generate unique ID for memory item
     * @param {Object} content - Content object
     * @returns {string} - Unique identifier
     */
    generateItemId(content) {
        const timestamp = Date.now();
        const contentHash = crypto.createHash('md5')
            .update(JSON.stringify(content))
            .digest('hex')
            .substring(0, 8);
        return `mem_${timestamp}_${contentHash}`;
    }

    /**
     * Extract tags from content
     * @param {string} content - Content to extract tags from
     * @returns {Array} - Array of tags
     */
    extractTags(content) {
        if (!content) return [];
        
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
            
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Update memory statistics
     */
    async updateStats() {
        try {
            this.stats.totalItems = this.metadata.totalItems;
            this.stats.lastAccessed = new Date().toISOString();
            
            // Count items by category and calculate total size
            let totalSize = 0;
            for (const [category, dir] of Object.entries(this.memoryTiers)) {
                const files = await fs.readdir(dir);
                const jsonFiles = files.filter(f => f.endsWith('.json'));
                this.stats.itemsByCategory[category] = jsonFiles.length;
                
                // Calculate size
                for (const file of jsonFiles) {
                    const stats = await fs.stat(path.join(dir, file));
                    totalSize += stats.size;
                }
            }
            
            this.stats.totalSize = totalSize;
            
        } catch (error) {
            this.logger.error('Failed to update stats:', error);
        }
    }

    /**
     * Get memory statistics
     * @returns {Object} - Current memory statistics
     */
    getStats() {
        return {
            ...this.stats,
            compressionStats: this.compressor.getCompressionStats()
        };
    }

    /**
     * Helper methods for context building
     */
    buildContextSummary(items) {
        const typeCount = {};
        items.forEach(item => {
            typeCount[item.type] = (typeCount[item.type] || 0) + 1;
        });
        
        const parts = [];
        if (typeCount.conversation) parts.push(`${typeCount.conversation} conversations`);
        if (typeCount.user_document) parts.push(`${typeCount.user_document} documents`);
        if (typeCount.user_content) parts.push(`${typeCount.user_content} items`);
        
        return `Used ${parts.join(' and ')} for context`;
    }

    calculateOptimizationStats(items) {
        const totalItems = this.stats.totalItems;
        const itemsLoaded = items.length;
        const contextPercent = totalItems > 0 ? Math.round((itemsLoaded / totalItems) * 100) : 0;
        
        const tokensSaved = items.reduce((sum, item) => {
            return sum + (item.metadata?.tokensSaved || 0);
        }, 0);
        
        return {
            contextPercent,
            tokensSaved,
            totalMemoryItems: totalItems,
            itemsLoaded
        };
    }

    getItemDisplayName(item) {
        if (item.metadata?.source && item.metadata.source !== 'user') {
            return item.metadata.source;
        }
        if (item.type === 'conversation') {
            return `Conversation (${item.metadata?.sessionId || 'session'})`;
        }
        return `${item.type} - ${item.metadata?.timestamp?.substring(0, 10) || 'unknown'}`;
    }

    calculateSignatureSimilarity(sig1, sig2) {
        if (!sig1 || !sig2) return 0;
        // Simple similarity - could be enhanced with more sophisticated algorithms
        const commonChars = sig1.split('').filter(char => sig2.includes(char)).length;
        return commonChars / Math.max(sig1.length, sig2.length);
    }

    calculateTagOverlap(tags1, tags2) {
        if (!tags1.length || !tags2.length) return 0;
        const overlap = tags1.filter(tag => tags2.includes(tag)).length;
        return overlap / Math.max(tags1.length, tags2.length);
    }

    calculateRecencyScore(timestamp) {
        const now = Date.now();
        const itemTime = new Date(timestamp).getTime();
        const daysSince = (now - itemTime) / (1000 * 60 * 60 * 24);
        
        if (daysSince < 1) return 1.0;
        if (daysSince < 7) return 0.8;
        if (daysSince < 30) return 0.6;
        return 0.4;
    }
}

module.exports = TrinityMemoryIntegration;