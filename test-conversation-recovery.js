#!/usr/bin/env node

/**
 * TEST: Conversation Recovery
 * Test that we can save new conversations properly and they preserve content
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');

async function testConversationRecovery() {
    console.log('🔄 TESTING CONVERSATION RECOVERY');
    console.log('=================================');
    
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        
        // Test 1: Save a new conversation with the fix
        console.log('\n📝 TEST 1: Save New Conversation (Should Preserve Content)');
        
        const testUserMessage = "What was the 2nd line in your poem?";
        const testAssistantResponse = `The 2nd line in my poem was:

"Ocean whispers ancient lore"

This was from the 3-line poem I wrote earlier about the ocean.`;
        
        const saveResult = await memoryIntegration.saveConversation(
            testUserMessage,
            testAssistantResponse,
            "recovery-test-session"
        );
        
        if (saveResult.success) {
            console.log(`✅ Conversation saved: ${saveResult.id}`);
            
            // Test 2: Load the conversation back and verify content
            console.log('\n🔍 TEST 2: Load Conversation Back (Verify Content Preserved)');
            
            const conversations = await memoryIntegration.loadConversationItems();
            const testConversation = conversations.find(conv => conv.id === saveResult.id);
            
            if (testConversation) {
                console.log('Found saved conversation:');
                console.log(`  ID: ${testConversation.id}`);
                console.log(`  Original Content: "${testConversation.originalContent}"`);
                console.log(`  Compressed Content: "${testConversation.compressedContent}"`);
                
                // Validation
                const hasOriginalContent = testConversation.originalContent.includes(testUserMessage) && 
                                         testConversation.originalContent.includes(testAssistantResponse);
                                         
                const hasCompressedContent = testConversation.compressedContent.includes(testUserMessage) && 
                                           testConversation.compressedContent.includes(testAssistantResponse);
                                           
                const contentMatches = testConversation.originalContent === testConversation.compressedContent;
                
                console.log('\n✅ VALIDATION RESULTS:');
                console.log(`  Original content complete: ${hasOriginalContent ? 'YES' : 'NO'}`);
                console.log(`  Compressed content complete: ${hasCompressedContent ? 'YES' : 'NO'}`);
                console.log(`  Content preservation: ${contentMatches ? 'PERFECT' : 'CORRUPTED'}`);
                
                if (hasOriginalContent && hasCompressedContent && contentMatches) {
                    console.log('\n🎉 SUCCESS: New conversations are being saved without corruption!');
                } else {
                    console.log('\n❌ FAILURE: Conversation is still being corrupted');
                }
                
            } else {
                console.log('❌ ERROR: Could not find the saved conversation');
            }
            
        } else {
            console.log(`❌ Failed to save conversation: ${saveResult.error}`);
        }
        
        // Test 3: Test memory-chat integration with the fixed conversation
        console.log('\n🧠 TEST 3: Memory-Chat Integration (Can Trinity Access Content?)');
        
        const context = await memoryIntegration.loadRelevantContext(
            "What was the 2nd line in your poem?",
            { maxItems: 10 }
        );
        
        console.log(`Context artifacts found: ${context.artifacts.length}`);
        
        // Look for our test conversation in the context
        const testContextArtifact = context.artifacts.find(artifact => 
            artifact.content.includes("Ocean whispers ancient lore")
        );
        
        if (testContextArtifact) {
            console.log('✅ SUCCESS: Trinity can access the complete conversation content!');
            console.log(`  Artifact content preview: "${testContextArtifact.content.substring(0, 200)}..."`);
            console.log('\n🏆 CRITICAL ISSUE RESOLVED: Trinity now has access to complete conversation data');
        } else {
            console.log('❌ FAILURE: Trinity still cannot access complete conversation content');
            console.log('Available artifacts:');
            context.artifacts.forEach((artifact, idx) => {
                console.log(`  ${idx + 1}. ${artifact.name} - "${artifact.content.substring(0, 100)}..."`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testConversationRecovery().then(() => {
    console.log('\n🏁 Conversation recovery test completed');
}).catch(error => {
    console.error('💥 Test crashed:', error);
});