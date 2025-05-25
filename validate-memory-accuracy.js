/**
 * Memory Integration Accuracy Validator
 * Test if Trinity can accurately access conversation content
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');

async function validateMemoryAccuracy() {
    console.log('🔍 **TRINITY MEMORY ACCURACY VALIDATION**\n');
    
    const memory = new TrinityMemoryIntegration({
        sessionId: 'accuracy-test',
        logger: { info: () => {}, error: console.error, warn: console.warn }
    });
    
    await memory.initialize();
    
    // Test specific queries against known content
    const testCases = [
        {
            query: "What did you say about the ocean?",
            expected: "ocean", // Should find ocean-related content
            description: "Ocean poem reference"
        },
        {
            query: "Tell me about your mountain poem",
            expected: "mountain", // Should find mountain content
            description: "Mountain poem reference"
        },
        {
            query: "What function did you show me?",
            expected: "function", // Should find JavaScript function
            description: "JavaScript function reference"
        }
    ];
    
    console.log('📊 **MEMORY CONTEXT LOADING TESTS**\n');
    
    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`Test ${i + 1}: ${test.description}`);
        console.log(`Query: "${test.query}"`);
        
        try {
            const result = await memory.loadRelevantContext(test.query);
            
            console.log(`✅ Context loaded: ${result.artifacts?.length || 0} items`);
            console.log(`📝 Summary: ${result.summary}`);
            
            // Check if expected content is found
            const hasExpectedContent = result.contextText && 
                result.contextText.toLowerCase().includes(test.expected.toLowerCase());
            
            console.log(`🎯 Contains "${test.expected}": ${hasExpectedContent ? '✅ YES' : '❌ NO'}`);
            
            if (result.artifacts && result.artifacts.length > 0) {
                console.log(`📋 Top artifact: ${result.artifacts[0].name} (${Math.round(result.artifacts[0].relevance * 100)}% relevance)`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        
        console.log('---\n');
    }
    
    // Test conversation loading specifically
    console.log('📋 **CONVERSATION ITEMS ANALYSIS**\n');
    
    try {
        const conversations = await memory.loadConversationItems();
        console.log(`💬 Total conversations found: ${conversations.length}`);
        
        if (conversations.length > 0) {
            console.log('\n📝 **Recent Conversations**:');
            conversations.slice(-3).forEach((conv, idx) => {
                const preview = (conv.originalContent || conv.compressedContent || '').substring(0, 100);
                console.log(`${idx + 1}. ${preview}...`);
            });
        } else {
            console.log('⚠️  No conversations found - this may indicate a loading issue');
        }
        
    } catch (error) {
        console.log(`❌ Conversation loading error: ${error.message}`);
    }
    
    console.log('\n🎯 **ACCURACY VALIDATION COMPLETE**');
    console.log('\n💡 **Testing Instructions for Trinity MVP**:');
    console.log('1. Open Trinity MVP and ask: "What did you say about the ocean?"');
    console.log('2. Trinity should reference actual ocean poem content');
    console.log('3. Check memory indicator shows "Memory Used: X items"');
    console.log('4. Verify response accuracy against actual conversation content');
    console.log('\n🚨 **Watch for**: Confident fabrication vs actual content retrieval');
}

// Run validation
validateMemoryAccuracy()
    .then(() => {
        console.log('\n✅ Validation complete - Ready to test in Trinity MVP!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });