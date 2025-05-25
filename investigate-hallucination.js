#!/usr/bin/env node

/**
 * CRITICAL INVESTIGATION: Trinity Hallucination Root Cause Analysis
 * 
 * Purpose: Determine why Trinity confidently fabricates conversation content
 * instead of accurately retrieving or admitting uncertainty
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');
const fs = require('fs').promises;

async function investigateHallucination() {
    console.log('🚨 CRITICAL INVESTIGATION: Trinity Hallucination Root Cause');
    console.log('================================================================');
    
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        
        // 1. EXAMINE ACTUAL STORED CONVERSATIONS
        console.log('\n📂 1. EXAMINING STORED CONVERSATIONS');
        console.log('-----------------------------------');
        
        const conversations = await memoryIntegration.loadConversationItems();
        console.log(`Found ${conversations.length} stored conversations`);
        
        for (let i = 0; i < conversations.length; i++) {
            const conv = conversations[i];
            console.log(`\nConversation ${i + 1}:`);
            console.log(`  ID: ${conv.id}`);
            console.log(`  Type: ${conv.type}`);
            console.log(`  Session: ${conv.metadata?.sessionId}`);
            console.log(`  Timestamp: ${conv.metadata?.timestamp}`);
            console.log(`  Original Content (first 200 chars):`);
            console.log(`  "${(conv.originalContent || 'NO ORIGINAL CONTENT').substring(0, 200)}..."`);
            console.log(`  Compressed Content (first 200 chars):`);
            console.log(`  "${(conv.compressedContent || 'NO COMPRESSED CONTENT').substring(0, 200)}..."`);
        }
        
        // 2. TEST CONTEXT LOADING FOR POEM QUESTION
        console.log('\n\n🔍 2. TESTING CONTEXT LOADING FOR POEM QUESTION');
        console.log('------------------------------------------------');
        
        const poemContext = await memoryIntegration.loadRelevantContext(
            "What was the 2nd line in your poem?",
            { maxItems: 10 }
        );
        
        console.log(`Context Summary: ${poemContext.summary}`);
        console.log(`Artifacts Found: ${poemContext.artifacts.length}`);
        console.log(`Context Text Length: ${poemContext.contextText.length} characters`);
        
        if (poemContext.artifacts.length > 0) {
            console.log('\nArtifacts Details:');
            poemContext.artifacts.forEach((artifact, idx) => {
                console.log(`  Artifact ${idx + 1}:`);
                console.log(`    ID: ${artifact.id}`);
                console.log(`    Name: ${artifact.name}`);
                console.log(`    Type: ${artifact.type}`);
                console.log(`    Category: ${artifact.category}`);
                console.log(`    Relevance: ${artifact.relevance}`);
                console.log(`    Content (first 300 chars): "${artifact.content.substring(0, 300)}..."`);
            });
        }
        
        if (poemContext.contextText) {
            console.log('\nFull Context Text That Would Be Sent to Trinity:');
            console.log('='.repeat(80));
            console.log(poemContext.contextText);
            console.log('='.repeat(80));
        } else {
            console.log('\n❌ NO CONTEXT TEXT - This explains the hallucination!');
        }
        
        // 3. TEST CONTEXT LOADING FOR DOG QUESTION
        console.log('\n\n🐕 3. TESTING CONTEXT LOADING FOR DOG QUESTION');
        console.log('-----------------------------------------------');
        
        const dogContext = await memoryIntegration.loadRelevantContext(
            "What was the 4th word of your explanation of dogs?",
            { maxItems: 10 }
        );
        
        console.log(`Context Summary: ${dogContext.summary}`);
        console.log(`Artifacts Found: ${dogContext.artifacts.length}`);
        console.log(`Context Text Length: ${dogContext.contextText.length} characters`);
        
        if (dogContext.contextText) {
            console.log('\nDog Context Text:');
            console.log('='.repeat(80));
            console.log(dogContext.contextText);
            console.log('='.repeat(80));
        } else {
            console.log('\n❌ NO DOG CONTEXT TEXT EITHER!');
        }
        
        // 4. TEST SEMANTIC MATCHING
        console.log('\n\n🧠 4. TESTING SEMANTIC MATCHING LOGIC');
        console.log('-------------------------------------');
        
        // Test with exact keywords
        const oceanContext = await memoryIntegration.loadRelevantContext(
            "ocean poem waves seagulls",
            { maxItems: 10 }
        );
        
        console.log(`Ocean keyword search - Artifacts: ${oceanContext.artifacts.length}`);
        
        // 5. EXAMINE RELEVANCE SCORING
        console.log('\n\n📊 5. EXAMINING RELEVANCE SCORING');
        console.log('---------------------------------');
        
        // Manual relevance calculation
        const testPrompt = "What was the 2nd line in your poem?";
        const promptTags = memoryIntegration.extractTags(testPrompt);
        console.log(`Prompt tags: [${promptTags.join(', ')}]`);
        
        for (const conv of conversations) {
            const itemTags = conv.metadata?.tags || [];
            const tagOverlap = promptTags.filter(tag => itemTags.includes(tag)).length;
            const tagScore = itemTags.length > 0 ? tagOverlap / Math.max(promptTags.length, itemTags.length) : 0;
            
            console.log(`\nConversation ${conv.id}:`);
            console.log(`  Item tags: [${itemTags.join(', ')}]`);
            console.log(`  Tag overlap: ${tagOverlap}`);
            console.log(`  Tag score: ${tagScore}`);
            console.log(`  Content preview: "${(conv.originalContent || conv.compressedContent || '').substring(0, 100)}..."`);
        }
        
        // 6. RAW FILE EXAMINATION
        console.log('\n\n📁 6. RAW FILE EXAMINATION');
        console.log('---------------------------');
        
        const conversationsDir = path.join(require('os').homedir(), '.trinity-mvp', 'conversations');
        try {
            const files = await fs.readdir(conversationsDir);
            console.log(`Raw files in conversations directory: ${files.length}`);
            
            for (const file of files.slice(0, 3)) { // Examine first 3 files
                if (file.endsWith('.json')) {
                    const filePath = path.join(conversationsDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    console.log(`\nFile: ${file}`);
                    console.log(`Size: ${content.length} bytes`);
                    console.log(`Content preview: ${content.substring(0, 300)}...`);
                }
            }
        } catch (error) {
            console.error('❌ Cannot read conversations directory:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
        console.error(error.stack);
    }
}

investigateHallucination().then(() => {
    console.log('\n🏁 Hallucination investigation completed');
}).catch(error => {
    console.error('💥 Investigation crashed:', error);
});