#!/usr/bin/env node

/**
 * EMERGENCY MEMORY DIAGNOSTIC
 * 
 * Diagnose why "Desert Dreams" poem is stored but not selected for context
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector');
const path = require('path');
const os = require('os');

console.log('🚨 EMERGENCY: Memory System Diagnostic\n');

async function emergencyDiagnostic() {
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  
  const memory = new TrinityNativeMemory({
    baseDir: trinityDir,
    logger: {
      info: (msg) => console.log(`[MEMORY] ${msg}`),
      warn: (msg) => console.log(`[WARN] ${msg}`),
      error: (msg) => console.log(`[ERROR] ${msg}`)
    }
  });
  
  const detector = new MemoryReferenceDetector();
  
  await memory.initialize();
  
  console.log('📋 **STEP 1: Verify Desert Dreams Poem Storage**\n');
  
  // Check if Desert Dreams is actually stored
  let desertDreamsFound = false;
  let desertDreamsId = null;
  let desertDreamsTimestamp = null;
  
  for (const [id, conv] of memory.conversations) {
    if (conv.assistantResponse && conv.assistantResponse.includes('Desert Dreams')) {
      desertDreamsFound = true;
      desertDreamsId = id;
      desertDreamsTimestamp = conv.timestamp;
      console.log(`✅ Found "Desert Dreams" poem:`);
      console.log(`   ID: ${id}`);
      console.log(`   Timestamp: ${conv.timestamp}`);
      console.log(`   Content Type: ${conv.contentType}`);
      console.log(`   User Message: "${conv.userMessage}"`);
      console.log(`   Response Length: ${conv.assistantResponse.length} chars`);
      console.log(`   Topics: ${conv.topics ? conv.topics.join(', ') : 'none'}`);
      break;
    }
  }
  
  if (!desertDreamsFound) {
    console.log('❌ CRITICAL: "Desert Dreams" poem NOT found in memory!');
    return;
  }
  
  console.log('\n📋 **STEP 2: Test Memory Detection for User Query**\n');
  
  const userQuery = "No the one you just wrote for yusef";
  console.log(`User Query: "${userQuery}"`);
  
  const detects = detector.detectsMemoryReference(userQuery);
  console.log(`Memory Detection: ${detects ? '✅' : '❌'}`);
  
  if (!detects) {
    console.log('❌ CRITICAL: User clarification not detected as memory reference!');
    return;
  }
  
  console.log('\n📋 **STEP 3: Debug Context Building Process**\n');
  
  // Step by step debugging of buildContextForClaude
  console.log('Testing context building...');
  
  try {
    // Test findRelevantConversations directly
    const relevantIds = memory.findRelevantConversations(userQuery);
    console.log(`\nRelevant Conversation IDs: ${relevantIds.length}`);
    
    relevantIds.forEach((id, index) => {
      const conv = memory.conversations.get(id);
      if (conv) {
        const isDesertDreams = conv.assistantResponse.includes('Desert Dreams');
        const preview = conv.userMessage.substring(0, 50);
        console.log(`  ${index + 1}. ${id}: "${preview}..." (${conv.contentType}, ${conv.timestamp.substring(11, 19)}) ${isDesertDreams ? '🏜️ DESERT DREAMS' : ''}`);
      }
    });
    
    // Check if Desert Dreams is in the relevant results
    const desertDreamsInResults = relevantIds.includes(desertDreamsId);
    console.log(`\n"Desert Dreams" in relevant results: ${desertDreamsInResults ? '✅' : '❌'}`);
    
    if (!desertDreamsInResults) {
      console.log('❌ CRITICAL: "Desert Dreams" not selected as relevant!');
      
      // Debug why it's not selected
      console.log('\n🔍 DEBUGGING RELEVANCE SCORING...');
      
      const messageTokens = memory.tokenize(userQuery.toLowerCase());
      console.log(`Query tokens: ${messageTokens.join(', ')}`);
      
      // Check artifact index for poems
      const poemIds = memory.artifactIndex.get('poem') || new Set();
      console.log(`Poem artifacts: ${Array.from(poemIds).join(', ')}`);
      console.log(`Desert Dreams in poem artifacts: ${poemIds.has(desertDreamsId) ? '✅' : '❌'}`);
      
      // Check topic index
      console.log('\nTopic search results:');
      messageTokens.forEach(token => {
        const topicIds = memory.topicIndex.get(token) || new Set();
        const hasDesertDreams = topicIds.has(desertDreamsId);
        console.log(`  "${token}": ${Array.from(topicIds).join(', ')} ${hasDesertDreams ? '🏜️' : ''}`);
      });
      
      // Calculate relevance score manually
      const desertDreamsConv = memory.conversations.get(desertDreamsId);
      if (desertDreamsConv) {
        const relevanceScore = memory.calculateRelevanceScore(userQuery, desertDreamsConv);
        console.log(`\nDesert Dreams relevance score: ${relevanceScore}`);
      }
    }
    
    // Test the full context building
    console.log('\n📋 **STEP 4: Test Full Context Building**\n');
    
    const context = await memory.buildContextForClaude(userQuery);
    console.log(`Context Length: ${context.contextText.length} chars`);
    console.log(`Summary: ${context.summary}`);
    console.log(`Relevant Conversations: ${context.relevantConversations}`);
    
    const hasDesertDreams = context.contextText.includes('Desert Dreams');
    console.log(`Context contains "Desert Dreams": ${hasDesertDreams ? '✅' : '❌'}`);
    
    if (!hasDesertDreams) {
      console.log('❌ CRITICAL: Context building excluded "Desert Dreams"!');
      console.log('\nContext preview (first 500 chars):');
      console.log(context.contextText.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.log(`❌ ERROR in context building: ${error.message}`);
  }
  
  console.log('\n🎯 **EMERGENCY DIAGNOSIS COMPLETE**');
  console.log('\nExpected Behavior:');
  console.log('✅ "Desert Dreams" should be most relevant for Yusef clarification');
  console.log('✅ Context should include Desert Dreams poem content');
  console.log('✅ Line 4 should be: "Through blazing sun and starlit bay,"');
  console.log('\nIf Desert Dreams is not selected, this indicates:');
  console.log('- Relevance scoring algorithm failure');
  console.log('- Topic indexing not working for current content');
  console.log('- Context selection logic prioritizing wrong content');
}

emergencyDiagnostic().catch(console.error);