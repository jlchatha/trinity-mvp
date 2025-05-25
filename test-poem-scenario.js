#!/usr/bin/env node

/**
 * Test Poem Reference Scenario
 * Simulates the exact scenario the user mentioned where Trinity should remember a poem
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');

async function testPoemScenario() {
    console.log('🎭 Testing Poem Reference Scenario...');
    
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        
        // Step 1: User asks for a poem (simulate Trinity writing a poem)
        console.log('\n📝 Step 1: User asks for a poem...');
        const poemResponse = `Here's a beautiful poem about the ocean:

The Ocean's Song

Endless waves kiss the shore with grace,
While seagulls dance in ocean's embrace.
Azure depths hold secrets untold,
Stories of sailors brave and bold.

Salt spray mists the morning air,
As sunlight makes the waters flare.
The ocean sings its ancient tune,
Beneath the stars, beneath the moon.`;

        const saveResult = await memoryIntegration.saveConversation(
            "Write me a poem about the ocean",
            poemResponse,
            "poem-test-session"
        );
        
        console.log(`✅ Poem conversation saved: ${saveResult.id}`);
        
        // Step 2: User asks about the poem later (memory-chat integration test)
        console.log('\n🔍 Step 2: User asks about the poem later...');
        const context = await memoryIntegration.loadRelevantContext(
            "Tell me about the poem you wrote earlier about the ocean",
            { maxItems: 10 }
        );
        
        console.log(`Context loaded: ${context.summary}`);
        console.log(`Artifacts: ${context.artifacts.length}`);
        
        // Check if the poem is found in context
        const poemArtifact = context.artifacts.find(artifact => 
            artifact.content.toLowerCase().includes('ocean') && 
            artifact.content.toLowerCase().includes('poem')
        );
        
        if (poemArtifact) {
            console.log('✅ SUCCESS: Trinity CAN access the poem from memory!');
            console.log(`Relevance score: ${poemArtifact.relevance}`);
            console.log('Poem content preview:');
            console.log(poemArtifact.content.substring(0, 200) + '...');
            
            // Simulate what Trinity would respond
            console.log('\n🤖 Trinity should now be able to respond:');
            console.log('"I wrote a poem called "The Ocean\'s Song" earlier. It talks about waves kissing the shore, seagulls dancing, and the ocean singing its ancient tune..."');
            
        } else {
            console.log('❌ FAILURE: Trinity CANNOT access the poem from memory');
            console.log('This means memory-chat integration is still broken');
        }
        
        // Step 3: Test if context text would be included in prompt
        console.log('\n📤 Step 3: Testing context text for prompt enhancement...');
        if (context.contextText && context.contextText.trim().length > 0) {
            console.log('✅ Context text available for prompt enhancement');
            console.log(`Context length: ${context.contextText.length} characters`);
            console.log('Context preview:');
            console.log(context.contextText.substring(0, 150) + '...');
        } else {
            console.log('❌ No context text available - conversation won\'t be accessible');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testPoemScenario().then(() => {
    console.log('\n🏁 Poem scenario test completed');
}).catch(error => {
    console.error('💥 Test crashed:', error);
});