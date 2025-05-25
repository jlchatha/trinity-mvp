#!/usr/bin/env node

/**
 * CRITICAL INVESTIGATION: Memory-Chat Pipeline Analysis
 * 
 * Purpose: Determine why Trinity cannot access current conversation content
 * despite compression fix and memory integration working
 */

const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
const path = require('path');
const fs = require('fs').promises;

async function investigateMemoryChatPipeline() {
    console.log('🚨 CRITICAL INVESTIGATION: Memory-Chat Pipeline');
    console.log('================================================');
    
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        
        // STEP 1: Verify Current Conversation Storage
        console.log('\n📂 STEP 1: CURRENT CONVERSATION STORAGE ANALYSIS');
        console.log('--------------------------------------------------');
        
        const conversations = await memoryIntegration.loadConversationItems();
        console.log(`Total conversations stored: ${conversations.length}`);
        
        // Find the most recent conversations 
        const recentConversations = conversations
            .sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0))
            .slice(0, 5);
            
        console.log('\nMost recent 5 conversations:');
        recentConversations.forEach((conv, idx) => {
            const timestamp = new Date(conv.metadata?.timestamp || 0).toLocaleString();
            console.log(`  ${idx + 1}. ${conv.id} (${timestamp})`);
            console.log(`     Session: ${conv.metadata?.sessionId}`);
            console.log(`     Content: "${(conv.originalContent || conv.compressedContent || '').substring(0, 100)}..."`);
        });
        
        // STEP 2: Test Current Session Context Loading
        console.log('\n\n🔍 STEP 2: CURRENT SESSION CONTEXT LOADING TEST');
        console.log('------------------------------------------------');
        
        // Simulate the exact queries that are failing
        const testQueries = [
            "What was the 2nd line in your poem?",
            "What was the 3rd line in your poem?", 
            "What was the 4th word of your explanation of dogs?"
        ];
        
        for (const query of testQueries) {
            console.log(`\nTesting query: "${query}"`);
            
            const context = await memoryIntegration.loadRelevantContext(query, {
                maxItems: 10,
                categories: ['core', 'working', 'reference']
            });
            
            console.log(`  Artifacts found: ${context.artifacts.length}`);
            console.log(`  Context text length: ${context.contextText.length}`);
            
            // Check if context contains the specific content Trinity should find
            const poemContent = context.artifacts.find(artifact => 
                artifact.content.toLowerCase().includes('ocean whispers ancient lore') ||
                artifact.content.toLowerCase().includes('salt-kissed air fills hearts') ||
                artifact.content.toLowerCase().includes('gentle waves embrace')
            );
            
            const dogContent = context.artifacts.find(artifact =>
                artifact.content.toLowerCase().includes('dogs are domesticated')
            );
            
            console.log(`  Contains poem content: ${poemContent ? 'YES' : 'NO'}`);
            console.log(`  Contains dog content: ${dogContent ? 'YES' : 'NO'}`);
            
            if (poemContent) {
                console.log(`  Poem artifact content: "${poemContent.content.substring(0, 200)}..."`);
            }
            if (dogContent) {
                console.log(`  Dog artifact content: "${dogContent.content.substring(0, 200)}..."`);
            }
        }
        
        // STEP 3: Check Session Isolation Issue
        console.log('\n\n🔐 STEP 3: SESSION ISOLATION ANALYSIS');
        console.log('-------------------------------------');
        
        // Group conversations by session
        const sessionGroups = {};
        conversations.forEach(conv => {
            const sessionId = conv.metadata?.sessionId || 'unknown';
            if (!sessionGroups[sessionId]) sessionGroups[sessionId] = [];
            sessionGroups[sessionId].push(conv);
        });
        
        console.log('Conversations by session:');
        Object.entries(sessionGroups).forEach(([sessionId, convs]) => {
            console.log(`  ${sessionId}: ${convs.length} conversations`);
            if (convs.length > 0) {
                const latest = convs.sort((a, b) => new Date(b.metadata?.timestamp || 0) - new Date(a.metadata?.timestamp || 0))[0];
                console.log(`    Latest: "${(latest.originalContent || latest.compressedContent || '').substring(0, 80)}..."`);
            }
        });
        
        // STEP 4: Check Current vs Historical Context Confusion
        console.log('\n\n⏰ STEP 4: CURRENT VS HISTORICAL CONTEXT ANALYSIS');
        console.log('--------------------------------------------------');
        
        // Check if Trinity is accessing old conversations instead of current ones
        const currentSessionConvs = conversations.filter(conv => 
            conv.metadata?.sessionId === 'overseer-main' || 
            conv.metadata?.sessionId === 'current' ||
            conv.metadata?.sessionId === 'default'
        );
        
        console.log(`Current session conversations: ${currentSessionConvs.length}`);
        currentSessionConvs.forEach(conv => {
            console.log(`  ${conv.id}: "${(conv.originalContent || conv.compressedContent || '').substring(0, 100)}..."`);
        });
        
        // STEP 5: Test Relevance Scoring Issues
        console.log('\n\n🎯 STEP 5: RELEVANCE SCORING ANALYSIS');
        console.log('-------------------------------------');
        
        // Manually test relevance scoring for poem query
        const poemQuery = "What was the 2nd line in your poem?";
        const promptTags = memoryIntegration.extractTags(poemQuery);
        console.log(`Poem query tags: [${promptTags.join(', ')}]`);
        
        // Check relevance scores for all conversations
        console.log('\nRelevance scores for poem query:');
        recentConversations.forEach(conv => {
            const itemTags = conv.metadata?.tags || [];
            const content = conv.originalContent || conv.compressedContent || '';
            
            // Calculate basic relevance
            const hasPoem = content.toLowerCase().includes('poem');
            const hasOcean = content.toLowerCase().includes('ocean');
            const hasLine = content.toLowerCase().includes('line');
            
            console.log(`  ${conv.id}:`);
            console.log(`    Tags: [${itemTags.join(', ')}]`);
            console.log(`    Contains 'poem': ${hasPoem}`);
            console.log(`    Contains 'ocean': ${hasOcean}`);
            console.log(`    Contains 'line': ${hasLine}`);
            console.log(`    Content preview: "${content.substring(0, 80)}..."`);
        });
        
        // STEP 6: Check Memory Integration Point
        console.log('\n\n🔗 STEP 6: MEMORY INTEGRATION POINT ANALYSIS');
        console.log('---------------------------------------------');
        
        // Verify that conversations are actually being included in context loading
        const testContext = await memoryIntegration.loadRelevantContext(
            "poem ocean line",
            { maxItems: 20 }
        );
        
        console.log(`Test context with ocean/poem keywords:`);
        console.log(`  Total artifacts: ${testContext.artifacts.length}`);
        console.log(`  Conversation artifacts: ${testContext.artifacts.filter(a => a.category === 'conversation').length}`);
        console.log(`  Memory artifacts: ${testContext.artifacts.filter(a => a.category !== 'conversation').length}`);
        
        testContext.artifacts.forEach((artifact, idx) => {
            console.log(`  ${idx + 1}. ${artifact.category} - ${artifact.name} (relevance: ${artifact.relevance})`);
            console.log(`     "${artifact.content.substring(0, 100)}..."`);
        });
        
        // STEP 7: Test Direct File Access
        console.log('\n\n📁 STEP 7: DIRECT FILE ACCESS TEST');
        console.log('-----------------------------------');
        
        const conversationsDir = path.join(require('os').homedir(), '.trinity-mvp', 'conversations');
        const files = await fs.readdir(conversationsDir);
        const recentFiles = files.filter(f => f.endsWith('.json')).slice(-3);
        
        console.log('Most recent conversation files:');
        for (const file of recentFiles) {
            const content = await fs.readFile(path.join(conversationsDir, file), 'utf8');
            const data = JSON.parse(content);
            console.log(`  ${file}:`);
            console.log(`    Original: "${(data.originalContent || '').substring(0, 100)}..."`);
            console.log(`    Compressed: "${(data.compressedContent || '').substring(0, 100)}..."`);
        }
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
        console.error(error.stack);
    }
}

investigateMemoryChatPipeline().then(() => {
    console.log('\n🏁 Memory-chat pipeline investigation completed');
}).catch(error => {
    console.error('💥 Investigation crashed:', error);
});