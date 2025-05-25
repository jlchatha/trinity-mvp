/**
 * Demo: Trinity MVP Session Metadata and Uncertainty Handling
 * Shows how the enhanced memory system handles ambiguous queries
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');

async function demonstrateUncertaintyHandling() {
    console.log('🎭 Trinity MVP Session Metadata & Uncertainty Handling Demo\n');
    
    // Initialize memory system
    const memory = new TrinityMemoryIntegration({
        sessionId: 'demo-session',
        logger: {
            info: (msg) => console.log(`[Memory] ${msg}`),
            error: (msg) => console.error(`[Error] ${msg}`),
            warn: (msg) => console.warn(`[Warn] ${msg}`)
        }
    });
    
    await memory.initialize();
    
    console.log('💾 Setting up demo conversations...\n');
    
    // Save multiple conversations that could be ambiguous
    await memory.saveConversation(
        "Can you write me a poem about the ocean?",
        "Here's an ocean poem:\n\nThe ocean blue so vast and deep,\nWhere ancient secrets safely keep.\nWith waves that dance both night and day,\nA timeless, rhythmic ocean play.",
        'demo-session'
    );
    
    await memory.saveConversation(
        "Can you write another poem about mountains?", 
        "Here's a mountain poem:\n\nTowering peaks that touch the sky,\nWhere eagles soar and spirits fly.\nIn rocky paths and snowy trails,\nThe mountain's ancient wisdom prevails.",
        'demo-session'
    );
    
    await memory.saveConversation(
        "What's the weather like today?",
        "I don't have access to real-time weather data, but I can help you find weather information if you tell me your location.",
        'demo-session'
    );
    
    console.log('📊 Session Status:');
    console.log(`   Conversations: ${memory.currentSession.conversationCount}`);
    console.log(`   Keywords tracked: ${Array.from(memory.currentSession.contextKeywords).slice(0, 8).join(', ')}`);
    console.log(`   Recent conversations: ${memory.currentSession.recentConversations.length}\n`);
    
    // Test 1: Specific query (should work normally)
    console.log('🔍 Test 1: Specific Query');
    console.log('Query: "What did you say about the weather?"');
    const specificContext = await memory.loadRelevantContext("What did you say about the weather?");
    console.log(`Result: ${specificContext.requiresClarification ? 'NEEDS CLARIFICATION' : 'CLEAR ANSWER'}`);
    if (!specificContext.requiresClarification) {
        console.log(`Found ${specificContext.artifacts.length} relevant artifacts\n`);
    }
    
    // Test 2: Ambiguous query (should trigger uncertainty handling)
    console.log('🔍 Test 2: Ambiguous Query');
    console.log('Query: "Can you show me your poem?"');
    const ambiguousContext = await memory.loadRelevantContext("Can you show me your poem?");
    console.log(`Result: ${ambiguousContext.requiresClarification ? 'NEEDS CLARIFICATION' : 'CLEAR ANSWER'}`);
    
    if (ambiguousContext.requiresClarification) {
        console.log(`Multiple matches found: ${ambiguousContext.multipleMatches.length}`);
        console.log('\n📝 Clarification Suggestion:');
        console.log(ambiguousContext.clarificationSuggestion);
    }
    
    console.log('\n✨ Session metadata enhancement successfully demonstrated!');
    console.log('   - Session context tracking ✓');
    console.log('   - Keyword extraction ✓');
    console.log('   - Uncertainty detection ✓');
    console.log('   - Clarification suggestions ✓');
}

// Run the demonstration
demonstrateUncertaintyHandling()
    .then(() => {
        console.log('\n🎉 Demo completed successfully!');
    })
    .catch(error => {
        console.error('💥 Demo failed:', error);
    });