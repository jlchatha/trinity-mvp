/**
 * Trinity Intelligent Compressor
 * Ported from Trinity System with optimizations for MVP
 * 
 * Provides semantic compression, categorization, and context optimization
 * for Trinity MVP memory integration.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class IntelligentCompressor {
    constructor(config = {}) {
        // Default configuration optimized for MVP
        this.config = {
            // Core features enabled for MVP
            intelligentCompression: config.intelligentCompression !== false,
            adaptiveCompressionRatios: config.adaptiveCompressionRatios !== false,
            semanticChunking: config.semanticChunking !== false,
            crossDocumentCompression: config.crossDocumentCompression !== false,
            
            // Performance settings
            compressionWorkers: config.compressionWorkers || 1, // Simplified for MVP
            compressionBatchSize: config.compressionBatchSize || 5,
            
            // Memory category compression ratios
            compressionRatios: config.compressionRatios || {
                core: 0.9,        // Minimal compression for essential content
                working: 0.7,     // Moderate compression for active work
                reference: 0.4,   // Significant compression for reference docs
                historical: 0.2   // Heavy compression for old content
            },
            
            // Category detection keywords
            categoryDetectionRules: config.categoryDetectionRules || {
                core: ['architecture', 'system', 'core', 'foundation', 'critical'],
                working: ['task', 'current', 'active', 'project', 'working'],
                reference: ['documentation', 'guide', 'reference', 'manual', 'spec'],
                historical: ['old', 'archive', 'previous', 'deprecated', 'legacy']
            },
            
            // Logging configuration
            logging: config.logging || { 
                logLevel: 'info', 
                logCompressionStats: true 
            }
        };

        // In-memory caches for performance
        this.compressionCache = new Map();
        this.semanticSignatureCache = new Map();
        this.categoryCache = new Map();
        
        this.logger = config.logger || console;
    }

    /**
     * Generate semantic signature for content deduplication
     * @param {string} content - Content to generate signature for
     * @returns {string} - MD5 hash of semantic features
     */
    generateSemanticSignature(content) {
        if (!content || typeof content !== 'string') {
            return crypto.createHash('md5').update('').digest('hex');
        }

        // Check cache first
        const cacheKey = content.substring(0, 100);
        if (this.semanticSignatureCache.has(cacheKey)) {
            return this.semanticSignatureCache.get(cacheKey);
        }

        // Extract semantic features
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter out short words

        const wordFrequency = words.reduce((freq, word) => {
            freq[word] = (freq[word] || 0) + 1;
            return freq;
        }, {});

        // Get top 15 most frequent meaningful words
        const semanticWords = Object.entries(wordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([word]) => word);

        const signature = crypto.createHash('md5')
            .update(JSON.stringify(semanticWords))
            .digest('hex');

        // Cache the result
        this.semanticSignatureCache.set(cacheKey, signature);
        
        return signature;
    }

    /**
     * Detect memory category based on content analysis
     * @param {string} content - Content to categorize
     * @returns {string} - Detected category (core/working/reference/historical)
     */
    detectCategory(content) {
        if (!content) return 'working';

        // Check cache first
        const signature = this.generateSemanticSignature(content);
        if (this.categoryCache.has(signature)) {
            return this.categoryCache.get(signature);
        }

        const contentLower = content.toLowerCase();
        const scores = {};

        // Score each category based on keyword presence
        for (const [category, keywords] of Object.entries(this.config.categoryDetectionRules)) {
            scores[category] = 0;
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = (contentLower.match(regex) || []).length;
                scores[category] += matches;
            }
        }

        // Additional heuristics
        if (content.includes('TODO') || content.includes('FIXME')) {
            scores.working += 2;
        }
        
        if (content.includes('# ') || content.includes('## ')) {
            scores.reference += 1; // Markdown headers suggest documentation
        }

        if (content.length > 5000) {
            scores.reference += 1; // Long documents are often reference
        }

        // Find category with highest score
        let bestCategory = 'working'; // Default
        let bestScore = scores.working || 0;

        for (const [category, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestCategory = category;
                bestScore = score;
            }
        }

        // Cache the result
        this.categoryCache.set(signature, bestCategory);
        
        return bestCategory;
    }

    /**
     * Calculate adaptive compression ratio based on content characteristics
     * @param {string} content - Content to analyze
     * @param {string} category - Memory category
     * @returns {number} - Compression ratio (0.0 to 1.0)
     */
    calculateCompressionRatio(content, category) {
        const baseRatio = this.config.compressionRatios[category] || 0.7;
        
        if (!this.config.adaptiveCompressionRatios) {
            return baseRatio;
        }

        // Analyze content characteristics
        const contentLength = content.length;
        const wordCount = content.split(/\s+/).length;
        const lineCount = content.split('\n').length;
        const codeLineCount = content.split('\n').filter(line => 
            line.trim().length > 0 && 
            (line.includes('{') || line.includes('}') || line.includes(';'))
        ).length;

        let dynamicRatio = baseRatio;

        // Adjust based on content type
        if (codeLineCount > lineCount * 0.3) {
            // Code content - less compression
            dynamicRatio += 0.15;
        }
        
        if (wordCount > 2000) {
            // Very long content - more compression needed
            dynamicRatio -= 0.1;
        }
        
        if (contentLength < 500) {
            // Short content - minimal compression
            dynamicRatio += 0.2;
        }

        // Ensure ratio stays within bounds
        return Math.max(0.1, Math.min(0.95, dynamicRatio));
    }

    /**
     * Compress content for memory storage
     * @param {string} content - Content to compress
     * @param {string} category - Memory category
     * @returns {Object} - Compression result with metadata
     */
    compressContent(content, category = 'working') {
        if (!content) {
            return {
                originalLength: 0,
                compressedContent: '',
                compressionRatio: 1.0,
                tokensSaved: 0,
                semanticSignature: this.generateSemanticSignature('')
            };
        }

        const semanticSignature = this.generateSemanticSignature(content);
        
        // Check cache
        const cacheKey = `${semanticSignature}-${category}`;
        if (this.compressionCache.has(cacheKey)) {
            return this.compressionCache.get(cacheKey);
        }

        const compressionRatio = this.calculateCompressionRatio(content, category);
        const originalLength = content.length;
        
        // For MVP, use extractive summarization
        let compressedContent = content;
        
        if (compressionRatio < 0.9) {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const targetSentenceCount = Math.max(1, Math.floor(sentences.length * compressionRatio));
            
            // Keep first sentence, last sentence, and most important middle sentences
            if (sentences.length > 2) {
                const middleSentences = sentences.slice(1, -1);
                const selectedMiddle = middleSentences
                    .sort((a, b) => b.length - a.length) // Simple importance heuristic
                    .slice(0, Math.max(0, targetSentenceCount - 2));
                
                compressedContent = [
                    sentences[0],
                    ...selectedMiddle,
                    sentences[sentences.length - 1]
                ].join('. ') + '.';
            }
        }

        const result = {
            originalLength,
            compressedContent,
            compressionRatio,
            tokensSaved: Math.max(0, originalLength - compressedContent.length),
            semanticSignature,
            category,
            timestamp: new Date().toISOString()
        };

        // Cache the result
        this.compressionCache.set(cacheKey, result);
        
        if (this.config.logging.logCompressionStats) {
            this.logger.info(`Compressed ${category} content: ${originalLength} → ${compressedContent.length} chars (${Math.round((1 - compressedContent.length/originalLength) * 100)}% reduction)`);
        }

        return result;
    }

    /**
     * Cross-document deduplication
     * @param {Array} documents - Array of document contents
     * @returns {Array} - Deduplicated documents
     */
    crossDocumentCompression(documents) {
        if (!this.config.crossDocumentCompression || !Array.isArray(documents)) {
            return documents;
        }

        const uniqueDocuments = [];
        const seenSignatures = new Set();

        for (const document of documents) {
            const signature = this.generateSemanticSignature(document);
            if (!seenSignatures.has(signature)) {
                uniqueDocuments.push(document);
                seenSignatures.add(signature);
            }
        }

        const duplicatesRemoved = documents.length - uniqueDocuments.length;
        if (duplicatesRemoved > 0 && this.config.logging.logCompressionStats) {
            this.logger.info(`Removed ${duplicatesRemoved} duplicate documents via cross-document compression`);
        }

        return uniqueDocuments;
    }

    /**
     * Compress multiple items with intelligent batching
     * @param {Array} items - Array of content items
     * @param {string} category - Memory category
     * @returns {Array} - Array of compression results
     */
    async compressWithWorkers(items, category = 'working') {
        if (!Array.isArray(items)) {
            return [];
        }

        // First, deduplicate across documents
        const deduplicatedItems = this.crossDocumentCompression(items);
        
        // Compress each item
        const results = deduplicatedItems.map(item => 
            this.compressContent(item, category)
        );

        return results;
    }

    /**
     * Get compression statistics
     * @returns {Object} - Compression statistics
     */
    getCompressionStats() {
        return {
            cacheSize: this.compressionCache.size,
            semanticCacheSize: this.semanticSignatureCache.size,
            categoryCacheSize: this.categoryCache.size,
            totalCompressions: this.compressionCache.size
        };
    }

    /**
     * Clear all caches
     */
    clearCaches() {
        this.compressionCache.clear();
        this.semanticSignatureCache.clear();
        this.categoryCache.clear();
    }
}

module.exports = IntelligentCompressor;