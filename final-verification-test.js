#!/usr/bin/env node

/**
 * FINAL VERIFICATION: Check if Desert Dreams line 4 is actually in the context
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory.js');

async function finalVerificationTest() {
    const memory = new TrinityNativeMemory();
    await memory.initialize();
    
    console.log('=== FINAL VERIFICATION TEST ===');
    console.log('Testing: "What\'s line 4?" should return Desert Dreams line 4\n');
    
    // Get the complete context for line query
    const lineQuery = "What's line 4?";
    const contextResult = await memory.buildContextForClaude(lineQuery);
    
    console.log('📝 COMPLETE CONTEXT CONTENT:');
    console.log('=' * 50);
    console.log(contextResult.contextText);
    console.log('=' * 50);
    console.log('');
    
    // Check for specific Desert Dreams content
    const hasDesertDreams = contextResult.contextText.includes('Desert Dreams');
    const hasLine4 = contextResult.contextText.includes('Through blazing sun and starlit bay.');
    const hasFullPoem = contextResult.contextText.includes('Beneath the golden dunes so vast');
    
    console.log('=== VERIFICATION RESULTS ===');
    console.log(`✅ Contains "Desert Dreams": ${hasDesertDreams}`);
    console.log(`✅ Contains line 4 text: ${hasLine4}`);
    console.log(`✅ Contains full poem: ${hasFullPoem}`);
    
    if (hasDesertDreams && hasLine4) {
        console.log('\n🎉🎉🎉 EMERGENCY FIX COMPLETELY SUCCESSFUL! 🎉🎉🎉');
        console.log('Trinity can now correctly access Desert Dreams poem for Yusef!');
        console.log('Line 4: "Through blazing sun and starlit bay," will be available to Claude Code');
    } else {
        console.log('\n❌ Still missing some content - needs more investigation');
    }
}

finalVerificationTest().catch(console.error);