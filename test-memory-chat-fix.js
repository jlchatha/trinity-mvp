#!/usr/bin/env node

/**
 * Test Memory-Chat Integration Fix
 * Verifies that conversations are being loaded correctly for memory-chat bridge
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');
const fs = require('fs');

async function testMemoryChatFix() {
    console.log('Testing Memory-Chat Integration Fix...');
    
    // Initialize memory integration
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        console.log('✅ Memory integration initialized');
        
        // Test saving a conversation
        console.log('\n📝 Testing conversation save...');
        const saveResult = await memoryIntegration.saveConversation(
            "Write me a poem about the ocean",
            "Here's a poem about the ocean:\n\nWaves crash upon the sandy shore,\nBlue waters stretch to horizon's door...",
            "test-session-123"
        );
        
        if (saveResult.success) {
            console.log(`✅ Conversation saved successfully: ${saveResult.id}`);
        } else {
            console.log(`❌ Failed to save conversation: ${saveResult.error}`);
            return;
        }
        
        // Test loading relevant context that should include the conversation
        console.log('\n🔍 Testing context loading (should include conversation)...');
        const context = await memoryIntegration.loadRelevantContext(
            "Tell me about the poem you wrote earlier",
            { maxItems: 10 }
        );
        
        console.log(`Context summary: ${context.summary}`);
        console.log(`Artifacts found: ${context.artifacts.length}`);
        console.log(`Context optimization: ${JSON.stringify(context.optimization)}`);
        
        // Check if conversation is included
        const conversationArtifact = context.artifacts.find(artifact => 
            artifact.type === 'conversation'
        );
        
        if (conversationArtifact) {
            console.log('✅ SUCCESS: Conversation found in context!');
            console.log(`  - Conversation relevance: ${conversationArtifact.relevance}`);
            console.log(`  - Content preview: ${conversationArtifact.content.substring(0, 100)}...`);
        } else {
            console.log('❌ FAILURE: Conversation NOT found in context');
            console.log('Available artifacts:');
            context.artifacts.forEach(artifact => {
                console.log(`  - ${artifact.type} (${artifact.category}) - relevance: ${artifact.relevance}`);
            });
        }
        
        // Test direct conversation loading
        console.log('\n📂 Testing direct conversation loading...');
        const conversations = await memoryIntegration.loadConversationItems();
        console.log(`Direct conversation load found: ${conversations.length} items`);
        
        if (conversations.length > 0) {
            console.log('✅ Direct conversation loading works');
            conversations.forEach((conv, i) => {
                console.log(`  ${i+1}. ${conv.id} - ${conv.type} - ${new Date(conv.metadata.timestamp).toLocaleString()}`);
            });
        } else {
            console.log('❌ Direct conversation loading found no items');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testMemoryChatFix().then(() => {
    console.log('\n🏁 Memory-chat integration test completed');
}).catch(error => {
    console.error('💥 Test crashed:', error);
});