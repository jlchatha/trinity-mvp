/**
 * Test Session Metadata Enhancement and Uncertainty Handling
 * Validates the enhanced Trinity Memory Integration with session awareness
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');
const fs = require('fs').promises;

class SessionMetadataTest {
    constructor() {
        this.testDir = path.join(__dirname, 'test-session-data');
        this.memory = new TrinityMemoryIntegration({
            baseDir: this.testDir,
            sessionId: 'test-session-123',
            logger: {
                info: (msg) => console.log(`[INFO] ${msg}`),
                error: (msg) => console.error(`[ERROR] ${msg}`),
                warn: (msg) => console.warn(`[WARN] ${msg}`)
            }
        });
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async setupTest() {
        console.log('\n🔧 Setting up test environment...');
        
        // Clean up any existing test data
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
        } catch (error) {
            // Directory might not exist, that's okay
        }
        
        // Initialize memory system
        await this.memory.initialize();
        console.log('✅ Test environment ready');
    }

    async runTest(name, testFunction) {
        console.log(`\n🧪 Running: ${name}`);
        try {
            await testFunction();
            console.log(`✅ PASSED: ${name}`);
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASSED' });
        } catch (error) {
            console.error(`❌ FAILED: ${name}`);
            console.error(`   Error: ${error.message}`);
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAILED', error: error.message });
        }
    }

    async testSessionTracking() {
        // Test that session metadata is properly tracked
        const sessionData = this.memory.currentSession;
        
        if (sessionData.sessionId !== 'test-session-123') {
            throw new Error(`Expected sessionId 'test-session-123', got '${sessionData.sessionId}'`);
        }
        
        if (!sessionData.startTime || typeof sessionData.startTime !== 'number') {
            throw new Error('Session startTime not properly initialized');
        }
        
        if (!Array.isArray(sessionData.recentConversations)) {
            throw new Error('recentConversations not properly initialized as array');
        }
        
        if (!(sessionData.contextKeywords instanceof Set)) {
            throw new Error('contextKeywords not properly initialized as Set');
        }
        
        console.log('   Session tracking initialized correctly');
    }

    async testConversationSaving() {
        // Test conversation saving with session metadata
        const result = await this.memory.saveConversation(
            "Can you write me a poem about the ocean?",
            "Here's a poem about the ocean:\n\nThe ocean blue so vast and deep,\nWhere ancient secrets safely keep.\nWith waves that dance both night and day,\nA timeless, rhythmic ocean play.",
            'test-session-123'
        );
        
        if (!result.success) {
            throw new Error(`Conversation save failed: ${result.error}`);
        }
        
        // Check that session metadata was updated
        if (this.memory.currentSession.conversationCount !== 1) {
            throw new Error(`Expected conversationCount 1, got ${this.memory.currentSession.conversationCount}`);
        }
        
        if (this.memory.currentSession.recentConversations.length !== 1) {
            throw new Error(`Expected 1 recent conversation, got ${this.memory.currentSession.recentConversations.length}`);
        }
        
        if (this.memory.currentSession.contextKeywords.size === 0) {
            throw new Error('Expected some context keywords to be extracted');
        }
        
        console.log('   Conversation saved with session metadata');
        console.log(`   Keywords extracted: ${Array.from(this.memory.currentSession.contextKeywords).join(', ')}`);
    }

    async testKeywordExtraction() {
        // Test that session keywords are properly extracted
        const keywords = this.memory.extractSessionKeywords(
            "I love writing poetry about nature and the beautiful landscapes"
        );
        
        if (!Array.isArray(keywords)) {
            throw new Error('Keywords should be returned as array');
        }
        
        if (keywords.length === 0) {
            throw new Error('Should extract some keywords from meaningful content');
        }
        
        // Should filter out stop words
        const hasStopWords = keywords.some(word => 
            ['the', 'and', 'about'].includes(word.toLowerCase())
        );
        
        if (hasStopWords) {
            throw new Error('Stop words should be filtered out');
        }
        
        console.log(`   Keywords extracted: ${keywords.join(', ')}`);
    }

    async testSessionRelevanceScoring() {
        // Add another conversation to test session relevance
        await this.memory.saveConversation(
            "Can you write another poem about mountains?",
            "Here's a mountain poem:\n\nTowering peaks that touch the sky,\nWhere eagles soar and spirits fly.\nIn rocky paths and snowy trails,\nThe mountain's ancient wisdom prevails.",
            'test-session-123'
        );
        
        // Load context and check session relevance scoring
        const context = await this.memory.loadRelevantContext("Can you tell me about your poem?");
        
        if (!context.artifacts || context.artifacts.length === 0) {
            throw new Error('Should find conversation artifacts with poems');
        }
        
        // Check that conversations from current session have higher relevance
        const conversationArtifacts = context.artifacts.filter(a => a.category === 'conversation');
        if (conversationArtifacts.length === 0) {
            throw new Error('Should find conversation artifacts');
        }
        
        // All should have high relevance due to session bonus
        const lowRelevanceItems = conversationArtifacts.filter(a => a.relevance < 0.6);
        if (lowRelevanceItems.length > 0) {
            throw new Error('Current session conversations should have high relevance scores');
        }
        
        console.log(`   Found ${conversationArtifacts.length} conversation artifacts with session relevance`);
        console.log(`   Average relevance: ${(conversationArtifacts.reduce((sum, a) => sum + a.relevance, 0) / conversationArtifacts.length).toFixed(2)}`);
    }

    async testMultipleMatchDetection() {
        // Test detection of multiple matches for ambiguous queries
        const context = await this.memory.loadRelevantContext("Can you show me your poem?");
        
        if (!context.multipleMatches) {
            throw new Error('Should detect multiple matches for ambiguous query');
        }
        
        if (!context.requiresClarification) {
            throw new Error('Should require clarification for multiple matches');
        }
        
        if (!context.clarificationSuggestion) {
            throw new Error('Should provide clarification suggestion');
        }
        
        if (context.multipleMatches.length < 2) {
            throw new Error('Should detect at least 2 poem matches');
        }
        
        console.log(`   Detected ${context.multipleMatches.length} potential matches`);
        console.log(`   Clarification suggestion: ${context.clarificationSuggestion.substring(0, 100)}...`);
    }

    async testClarificationSuggestion() {
        // Test that clarification suggestions are helpful
        const context = await this.memory.loadRelevantContext("What did you say about the ocean?");
        
        if (context.multipleMatches && context.multipleMatches.length > 1) {
            const suggestion = context.clarificationSuggestion;
            
            if (!suggestion.includes('multiple')) {
                throw new Error('Clarification should mention multiple matches');
            }
            
            if (!suggestion.includes('1.') || !suggestion.includes('2.')) {
                throw new Error('Clarification should provide numbered options');
            }
            
            console.log('   Clarification suggestion properly formatted');
        } else {
            console.log('   No multiple matches found for this query');
        }
    }

    async testSessionMemoryLimit() {
        // Test that session memory keeps only last 10 conversations
        console.log('   Adding 12 conversations to test memory limit...');
        
        for (let i = 3; i <= 14; i++) {
            await this.memory.saveConversation(
                `Test message ${i}`,
                `Test response ${i}`,
                'test-session-123'
            );
        }
        
        if (this.memory.currentSession.recentConversations.length > 10) {
            throw new Error(`Should keep max 10 recent conversations, got ${this.memory.currentSession.recentConversations.length}`);
        }
        
        if (this.memory.currentSession.conversationCount !== 14) {
            throw new Error(`Should track total count correctly, got ${this.memory.currentSession.conversationCount}`);
        }
        
        console.log(`   Memory limit working: ${this.memory.currentSession.recentConversations.length} recent conversations kept`);
    }

    async testStopWordFiltering() {
        // Test that stop words are properly filtered
        const keywords = this.memory.extractSessionKeywords(
            "The quick brown fox jumps over the lazy dog and runs through the forest"
        );
        
        const stopWords = ['the', 'and', 'over', 'through'];
        const hasStopWords = keywords.some(word => stopWords.includes(word));
        
        if (hasStopWords) {
            throw new Error('Stop words should be filtered out of session keywords');
        }
        
        console.log('   Stop word filtering working correctly');
    }

    async testConversationContentPreservation() {
        // Test that conversations are not compressed (critical fix)
        const conversations = await this.memory.loadConversationItems();
        
        if (conversations.length === 0) {
            throw new Error('Should have saved conversations from previous tests');
        }
        
        const poemConversation = conversations.find(conv => 
            (conv.originalContent || conv.compressedContent || '').includes('ocean')
        );
        
        if (!poemConversation) {
            throw new Error('Should find the ocean poem conversation');
        }
        
        const content = poemConversation.originalContent || poemConversation.compressedContent;
        
        // Check that the poem structure is preserved
        if (!content.includes('ocean blue') || !content.includes('waves that dance')) {
            throw new Error('Poem content should be fully preserved without compression damage');
        }
        
        console.log('   Conversation content properly preserved');
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up test environment...');
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
            console.log('✅ Cleanup complete');
        } catch (error) {
            console.warn('⚠️  Cleanup warning:', error.message);
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Session Metadata Enhancement Tests\n');
        
        await this.setupTest();
        
        // Run all tests
        await this.runTest('Session Tracking Initialization', () => this.testSessionTracking());
        await this.runTest('Conversation Saving with Metadata', () => this.testConversationSaving());
        await this.runTest('Session Keyword Extraction', () => this.testKeywordExtraction());
        await this.runTest('Session Relevance Scoring', () => this.testSessionRelevanceScoring());
        await this.runTest('Multiple Match Detection', () => this.testMultipleMatchDetection());
        await this.runTest('Clarification Suggestions', () => this.testClarificationSuggestion());
        await this.runTest('Session Memory Limit', () => this.testSessionMemoryLimit());
        await this.runTest('Stop Word Filtering', () => this.testStopWordFiltering());
        await this.runTest('Conversation Content Preservation', () => this.testConversationContentPreservation());
        
        await this.cleanup();
        
        // Print results
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n💥 Failed Tests:');
            this.results.tests.filter(t => t.status === 'FAILED').forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
        }
        
        return this.results.failed === 0;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const test = new SessionMetadataTest();
    test.runAllTests()
        .then(success => {
            console.log(success ? '\n🎉 All tests passed!' : '\n💥 Some tests failed!');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = SessionMetadataTest;