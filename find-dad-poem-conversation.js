#!/usr/bin/env node

/**
 * Find the conversation that contains the full dad poem
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory');

async function findDadPoemConversation() {
    console.log('=== FINDING FULL DAD POEM CONVERSATION ===');
    
    const memory = new TrinityNativeMemory();
    await memory.initialize();
    
    const allConversations = Array.from(memory.conversations.values());
    console.log(`Total conversations: ${allConversations.length}`);
    
    // Find conversations that contain the full dad poem structure
    const dadPoemConversations = allConversations.filter(conv => {
        const response = conv.assistantResponse;
        return (
            response.includes('Strong hands that fixed what broke') &&
            response.includes('Patient teacher, steady guide') &&
            response.length > 200  // Ensure it's the full poem, not just a line answer
        );
    });
    
    console.log(`\nFound ${dadPoemConversations.length} conversations with full dad poem:`);
    
    dadPoemConversations.forEach((conv, index) => {
        console.log(`\n--- Full Dad Poem Conversation ${index + 1}: ${conv.id} ---`);
        console.log(`Content Type: ${conv.contentType}`);
        console.log(`Timestamp: ${conv.timestamp}`);
        console.log(`User: ${conv.userMessage}`);
        console.log(`Response length: ${conv.assistantResponse.length}`);
        
        // Test authoritative classification
        const hasFullContent = conv.assistantResponse.length > 200 && 
                              (conv.assistantResponse.includes('```') || 
                               conv.assistantResponse.includes('contents of the poem') ||
                               conv.assistantResponse.includes('display it'));
        
        console.log(`Classified as authoritative: ${hasFullContent}`);
        
        // Check why it might not be selected for "3rd line" query
        const lineQuery = "what was the 3rd line in poem for dad?";
        const score = memory.calculateRelevanceScore(lineQuery, conv);
        console.log(`Relevance score for line query: ${score}`);
        
        // Check if it's in the search results
        const relevantIds = memory.findRelevantConversations(lineQuery);
        const position = relevantIds.indexOf(conv.id);
        console.log(`Position in search results: ${position >= 0 ? position + 1 : 'not found'}`);
        
        console.log(`Response preview:`);
        console.log(conv.assistantResponse.substring(0, 300) + '...');
    });
    
    // If no full conversations found, look for partial ones
    if (dadPoemConversations.length === 0) {
        console.log('\n❌ No full dad poem conversations found');
        
        const partialMatches = allConversations.filter(conv => 
            conv.assistantResponse.includes('Strong hands that fixed what broke')
        );
        
        console.log(`\nFound ${partialMatches.length} partial matches:`);
        partialMatches.forEach((conv, index) => {
            console.log(`  ${index + 1}. ${conv.id}: "${conv.userMessage}" -> ${conv.assistantResponse.length} chars`);
        });
    }
}

findDadPoemConversation().catch(console.error);