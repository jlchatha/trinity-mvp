/**
 * Test Session Metadata Enhancement in Trinity MVP
 * Creates test conversations that should trigger uncertainty handling
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');

async function createTestConversations() {
    console.log('🧪 Creating test conversations for session metadata enhancement...');
    
    const memory = new TrinityMemoryIntegration({
        baseDir: path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp'),
        sessionId: 'test-session-enhancement',
        logger: {
            info: (msg) => console.log(`[Memory] ${msg}`),
            error: (msg) => console.error(`[Error] ${msg}`),
            warn: (msg) => console.warn(`[Warn] ${msg}`)
        }
    });
    
    await memory.initialize();
    
    // Create conversations that will trigger multiple matches for "your poem"
    console.log('📝 Adding conversation 1: Ocean poem');
    await memory.saveConversation(
        "Can you write me a poem about the ocean?",
        "Here's an ocean poem:\n\nThe endless blue stretches far and wide,\nWhere waves and dreams collide.\nBeneath the surface mysteries hide,\nIn ocean's eternal tide.",
        'test-session-enhancement'
    );
    
    console.log('📝 Adding conversation 2: Mountain poem');
    await memory.saveConversation(
        "Can you write another poem about mountains?",
        "Here's a mountain poem:\n\nTowering peaks reach for the sky,\nWhere eagles learn to fly.\nIn silence and majesty they lie,\nWatching the world go by.",
        'test-session-enhancement'
    );
    
    console.log('📝 Adding conversation 3: Sunset poem');
    await memory.saveConversation(
        "Write a poem about sunsets please",
        "A sunset poem for you:\n\nGolden rays paint the evening sky,\nAs daylight waves goodbye.\nColors dance where earth meets high,\nA masterpiece that makes hearts sigh.",
        'test-session-enhancement'
    );
    
    console.log('📝 Adding conversation 4: Code help');
    await memory.saveConversation(
        "How do I write a function in JavaScript?",
        "Here's how to write a JavaScript function:\n\n```javascript\nfunction myFunction(parameter) {\n    return parameter * 2;\n}\n```\n\nYou can also use arrow functions:\n```javascript\nconst myFunction = (parameter) => parameter * 2;\n```",
        'test-session-enhancement'
    );
    
    console.log('✅ Test conversations created!');
    console.log('\n🎯 Now test these queries in Trinity MVP to see uncertainty handling:');
    console.log('   1. "Can you show me your poem?" - Should trigger clarification');
    console.log('   2. "What did you say about the ocean?" - Should find specific match');
    console.log('   3. "Your function example" - Should find the JavaScript function');
    console.log('   4. "Tell me about your code" - Should find the JavaScript help');
    
    // Test the uncertainty detection directly
    console.log('\n🔍 Testing uncertainty detection directly...');
    
    const result = await memory.loadRelevantContext("Can you show me your poem?");
    
    console.log(`📊 Results:`);
    console.log(`   - Found ${result.artifacts?.length || 0} relevant items`);
    console.log(`   - Requires clarification: ${result.requiresClarification}`);
    console.log(`   - Multiple matches: ${result.multipleMatches?.length || 0}`);
    
    if (result.requiresClarification) {
        console.log(`\n💬 Clarification suggestion:`);
        console.log(result.clarificationSuggestion);
    }
    
    console.log('\n🎉 Session metadata enhancement test setup complete!');
    console.log('💡 Open Trinity MVP and try the test queries above to see the uncertainty handling in action.');
}

// Run test setup
createTestConversations()
    .then(() => {
        console.log('\n✨ Ready to test session metadata enhancement in Trinity MVP!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test setup failed:', error);
        process.exit(1);
    });