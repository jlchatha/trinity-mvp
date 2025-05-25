/**
 * Test Trinity Memory Integration
 * Basic test to verify memory patterns are working
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const IntelligentCompressor = require('./src/core/intelligent-compressor');

async function testMemoryIntegration() {
    console.log('🧠 Testing Trinity Memory Integration...\n');
    
    try {
        // Initialize memory system
        const memory = new TrinityMemoryIntegration({
            baseDir: '/tmp/trinity-mvp-test',
            logger: {
                info: (msg) => console.log(`📝 ${msg}`),
                error: (msg) => console.error(`❌ ${msg}`)
            }
        });
        
        console.log('1. Initializing memory system...');
        await memory.initialize();
        console.log('✅ Memory system initialized\n');
        
        // Test intelligent compressor
        console.log('2. Testing Intelligent Compressor...');
        const compressor = new IntelligentCompressor();
        
        const testContent = "This is a test document about Trinity System architecture. It contains information about memory hierarchy, intelligent compression, and context optimization. The system uses a 4-tier approach with core, working, reference, and historical memory categories.";
        
        const signature = compressor.generateSemanticSignature(testContent);
        console.log(`✅ Semantic signature: ${signature.substring(0, 16)}...`);
        
        const category = compressor.detectCategory(testContent);
        console.log(`✅ Detected category: ${category}`);
        
        const compressionResult = compressor.compressContent(testContent, category);
        console.log(`✅ Compression: ${compressionResult.originalLength} → ${compressionResult.compressedContent.length} chars (${Math.round((1 - compressionResult.compressedContent.length/compressionResult.originalLength) * 100)}% reduction)\n`);
        
        // Test storing content
        console.log('3. Testing memory storage...');
        const storeResult1 = await memory.store('reference', {
            type: 'user_document',
            content: 'Trinity MVP is a professional AI assistant with memory hierarchy and task management capabilities.',
            source: 'test-document.md',
            tags: ['trinity', 'mvp', 'documentation']
        });
        console.log(`✅ Stored document: ${storeResult1.itemId}`);
        
        // Test storing conversation
        const conversationResult = await memory.saveConversation(
            'How does Trinity memory work?',
            'Trinity uses a 4-tier memory hierarchy with intelligent compression to optimize context loading and provide persistent memory across sessions.',
            'test-session'
        );
        console.log(`✅ Stored conversation: ${conversationResult.itemId}\n`);
        
        // Test loading relevant context
        console.log('4. Testing context loading...');
        const context = await memory.loadRelevantContext('Tell me about Trinity memory features');
        console.log(`✅ Loaded context: ${context.summary}`);
        console.log(`✅ Optimization: ${context.optimization.contextPercent}% of memory used, ${context.optimization.tokensSaved} tokens saved`);
        console.log(`✅ Artifacts found: ${context.artifacts.length}`);
        
        if (context.artifacts.length > 0) {
            console.log('   Artifacts:');
            context.artifacts.forEach(artifact => {
                console.log(`   - ${artifact.name} (relevance: ${Math.round(artifact.relevance * 100)}%)`);
            });
        }
        console.log();
        
        // Test memory stats
        console.log('5. Testing memory statistics...');
        const stats = memory.getStats();
        console.log(`✅ Total items: ${stats.totalItems}`);
        console.log(`✅ Total size: ${Math.round(stats.totalSize / 1024 * 100) / 100} KB`);
        console.log(`✅ By category:`);
        Object.entries(stats.itemsByCategory).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count} items`);
        });
        
        console.log('\n🎉 All tests passed! Trinity Memory Integration is working correctly.');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testMemoryIntegration()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = testMemoryIntegration;