#!/usr/bin/env node

/**
 * EMERGENCY TEST: End-to-end memory context selection with emergency fix
 * Testing the complete flow: clarification query -> Desert Dreams selection -> line extraction
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory.js');

async function testEmergencyFixE2E() {
    const memory = new TrinityNativeMemory();
    await memory.initialize();
    
    console.log('=== EMERGENCY FIX END-TO-END TEST ===');
    console.log('Testing complete memory context selection flow...\n');
    
    // Test 1: Clarification query should select Desert Dreams
    console.log('🔍 TEST 1: Clarification Query');
    console.log('Query: "No the one you just wrote for yusef"');
    
    const clarificationResults = memory.findRelevantConversations("No the one you just wrote for yusef");
    console.log(`Search results: ${clarificationResults.length} conversations found`);
    
    const desertDreamsId = "conv_1748233295681_8c6kzu42h";
    const desertDreamsPosition = clarificationResults.indexOf(desertDreamsId);
    
    if (desertDreamsPosition >= 0) {
        console.log(`✅ Desert Dreams found at position ${desertDreamsPosition + 1}`);
        
        // Test the context assembly
        const contextResult = await memory.buildContextForClaude("No the one you just wrote for yusef");
        console.log('\n📝 Generated context result:');
        console.log(`Summary: ${contextResult.summary}`);
        console.log(`Relevant conversations: ${contextResult.relevantConversations}`);
        console.log(`Artifacts: ${contextResult.artifacts.length}`);
        console.log('Context preview:');
        console.log('---');
        console.log(contextResult.contextText.substring(0, 500) + '...');
        console.log('---\n');
        
        // Check if Desert Dreams appears in context
        if (contextResult.contextText.includes('Desert Dreams')) {
            console.log('✅ Desert Dreams poem included in context');
        } else {
            console.log('❌ Desert Dreams poem NOT in context');
        }
    } else {
        console.log('❌ Desert Dreams NOT found in clarification results');
        return;
    }
    
    // Test 2: Follow-up query should maintain context  
    console.log('🔍 TEST 2: Follow-up Line Query');
    console.log('Query: "What\'s line 4?"');
    
    const followUpResults = memory.findRelevantConversations("What's line 4?");
    const followUpPosition = followUpResults.indexOf(desertDreamsId);
    
    if (followUpPosition >= 0) {
        console.log(`✅ Desert Dreams found at position ${followUpPosition + 1} for follow-up`);
        
        // Test the context assembly for line query
        const lineContextResult = await memory.buildContextForClaude("What's line 4?");
        console.log('\n📝 Line query context result:');
        console.log(`Summary: ${lineContextResult.summary}`);
        console.log(`Relevant conversations: ${lineContextResult.relevantConversations}`);
        console.log('Context preview:');
        console.log('---');
        console.log(lineContextResult.contextText.substring(0, 500) + '...');
        console.log('---\n');
        
        // Check if Desert Dreams appears in line query context
        if (lineContextResult.contextText.includes('Through blazing sun and starlit bay,')) {
            console.log('✅ Line 4 content ("Through blazing sun and starlit bay,") found in context');
            console.log('🎉 EMERGENCY FIX FULLY SUCCESSFUL!');
        } else {
            console.log('❌ Line 4 content not found in context');
        }
    } else {
        console.log('❌ Desert Dreams NOT found in follow-up results');
    }
    
    // Test 3: Show relevance scores for transparency
    console.log('\n🔢 RELEVANCE SCORING TEST');
    const desertDreams = memory.conversations.get(desertDreamsId);
    if (desertDreams) {
        const clarificationScore = memory.calculateRelevanceScore("No the one you just wrote for yusef", desertDreams);
        const lineScore = memory.calculateRelevanceScore("What's line 4?", desertDreams);
        
        console.log(`Desert Dreams relevance score for clarification: ${clarificationScore}`);
        console.log(`Desert Dreams relevance score for line query: ${lineScore}`);
    }
}

testEmergencyFixE2E().catch(console.error);