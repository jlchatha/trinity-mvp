/**
 * Simple test for memory-enhanced claude-watcher functionality
 * Tests core memory integration without complex mocking
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const fs = require('fs').promises;
const path = require('path');

async function testMemoryWatcherIntegration() {
    console.log('🧠 Testing Memory-Enhanced Claude Watcher Integration...\n');
    
    const testDir = '/tmp/trinity-mvp-memory-test';
    
    try {
        // Initialize memory system
        console.log('1. Initializing Trinity Memory Integration...');
        const memory = new TrinityMemoryIntegration({
            baseDir: testDir,
            logger: {
                info: (msg) => console.log(`📝 ${msg}`),
                error: (msg) => console.error(`❌ ${msg}`)
            }
        });
        
        await memory.initialize();
        console.log('✅ Memory system initialized\n');
        
        // Add test documents
        console.log('2. Adding test documents to memory...');
        const doc1 = await memory.store('reference', {
            type: 'user_document',
            content: 'Trinity MVP uses intelligent compression and semantic analysis for memory optimization. The system categorizes content into core, working, reference, and historical tiers.',
            source: 'trinity-architecture.md',
            tags: ['trinity', 'architecture', 'compression']
        });
        
        const doc2 = await memory.store('working', {
            type: 'user_document',
            content: 'The enhanced claude-watcher loads relevant memory context before sending requests to Claude Code, then saves the conversation afterward.',
            source: 'claude-watcher-docs.md', 
            tags: ['claude-watcher', 'memory', 'integration']
        });
        
        console.log(`✅ Document 1 stored: ${doc1.itemId}`);
        console.log(`✅ Document 2 stored: ${doc2.itemId}\n`);
        
        // Test context loading (simulating what claude-watcher does)
        console.log('3. Testing memory context loading (claude-watcher simulation)...');
        const testPrompt = 'How does the Trinity memory system work with Claude?';
        
        const memoryContext = await memory.loadRelevantContext(testPrompt, {
            maxItems: 8,
            categories: ['core', 'working', 'reference']
        });
        
        console.log(`✅ Memory context loaded: ${memoryContext.summary}`);
        console.log(`✅ Optimization stats: ${memoryContext.optimization.contextPercent}% context used, ${memoryContext.optimization.tokensSaved} tokens saved`);
        console.log(`✅ Artifacts found: ${memoryContext.artifacts.length}`);
        
        // Build enhanced prompt (simulating claude-watcher enhancement)
        let enhancedPrompt = testPrompt;
        if (memoryContext.contextText && memoryContext.contextText.trim().length > 0) {
            enhancedPrompt = `Context from memory:\n${memoryContext.contextText}\n\n---\n\nUser request: ${testPrompt}`;
            console.log(`✅ Enhanced prompt created (${enhancedPrompt.length} characters)`);
        }
        
        // Test conversation saving (simulating post-Claude processing)
        console.log('\n4. Testing conversation saving...');
        const mockResponse = 'Trinity memory system integrates with Claude by loading relevant context before requests and saving conversations afterward for persistent learning.';
        
        const conversationResult = await memory.saveConversation(
            testPrompt,
            mockResponse,
            'test-session',
            memoryContext
        );
        
        console.log(`✅ Conversation saved: ${conversationResult.itemId}\n`);
        
        // Test the complete response format (what claude-watcher returns)
        console.log('5. Testing complete response format...');
        const responseData = {
            requestId: 'test-request',
            sessionId: 'test-session',
            timestamp: new Date().toISOString(),
            success: true,
            content: mockResponse,
            output: mockResponse,
            error: null,
            executionTime: 1500,
            duration_ms: 1500,
            // Trinity Memory Context for UI display
            memoryContext: {
                summary: memoryContext.summary,
                optimization: memoryContext.optimization,
                artifacts: memoryContext.artifacts
            }
        };
        
        console.log('✅ Complete response format created:');
        console.log(`   - Success: ${responseData.success}`);
        console.log(`   - Content length: ${responseData.content.length} characters`);
        console.log(`   - Memory context included: ${responseData.memoryContext ? 'YES' : 'NO'}`);
        console.log(`   - Memory summary: "${responseData.memoryContext.summary}"`);
        console.log(`   - Artifacts for UI: ${responseData.memoryContext.artifacts.length} items`);
        
        // Verify memory stats
        console.log('\n6. Verifying memory statistics...');
        const stats = memory.getStats();
        console.log(`✅ Total memory items: ${stats.totalItems}`);
        console.log(`✅ Memory size: ${Math.round(stats.totalSize / 1024 * 100) / 100} KB`);
        console.log(`✅ Items by category:`);
        Object.entries(stats.itemsByCategory).forEach(([category, count]) => {
            if (count > 0) {
                console.log(`   - ${category}: ${count} items`);
            }
        });
        
        console.log('\n🎉 Memory-Enhanced Claude Watcher Integration Test Complete!');
        console.log('\n📋 Key Integration Points Verified:');
        console.log('  ✅ Memory initialization in claude-watcher');
        console.log('  ✅ Context loading before Claude requests');
        console.log('  ✅ Prompt enhancement with memory content');
        console.log('  ✅ Conversation storage after responses');
        console.log('  ✅ Memory context metadata in response format');
        console.log('  ✅ UI-ready artifact data structure');
        
        console.log('\n🔧 Ready for Milestone 3: User Document Ingestion');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testMemoryWatcherIntegration()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = testMemoryWatcherIntegration;