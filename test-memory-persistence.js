#!/usr/bin/env node

/**
 * Test Memory Persistence 
 * 
 * Tests if conversations persist correctly across memory instances
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory');
const path = require('path');
const os = require('os');

console.log('🔍 TESTING: Memory Persistence Across Instances\n');

async function testMemoryPersistence() {
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  
  console.log('📋 **TEST 1: Create New Memory Instance and Initialize**');
  
  const memory1 = new TrinityNativeMemory({
    baseDir: trinityDir,
    logger: {
      info: (msg) => console.log(`[MEMORY1] ${msg}`),
      warn: (msg) => console.log(`[WARN1] ${msg}`),
      error: (msg) => console.log(`[ERROR1] ${msg}`)
    }
  });
  
  console.log('Initializing first memory instance...');
  await memory1.initialize();
  
  const stats1 = memory1.getStats();
  console.log(`First instance loaded: ${stats1.totalConversations} conversations`);
  console.log(`Conversations map size: ${memory1.conversations.size}`);
  console.log(`Artifact index size: ${memory1.artifactIndex.size}`);
  
  // Try to build context with first instance
  console.log('\nTesting context building with first instance...');
  const context1 = await memory1.buildContextForClaude("What was the 4th to last line of that poem?");
  console.log(`Context 1 length: ${context1.contextText.length}`);
  console.log(`Context 1 summary: ${context1.summary}`);
  
  console.log('\n📋 **TEST 2: Create Second Memory Instance (Simulating Claude Watcher)**');
  
  const memory2 = new TrinityNativeMemory({
    baseDir: trinityDir,
    logger: {
      info: (msg) => console.log(`[MEMORY2] ${msg}`),
      warn: (msg) => console.log(`[WARN2] ${msg}`),
      error: (msg) => console.log(`[ERROR2] ${msg}`)
    }
  });
  
  console.log('Initializing second memory instance...');
  await memory2.initialize();
  
  const stats2 = memory2.getStats();
  console.log(`Second instance loaded: ${stats2.totalConversations} conversations`);
  console.log(`Conversations map size: ${memory2.conversations.size}`);
  console.log(`Artifact index size: ${memory2.artifactIndex.size}`);
  
  // Try to build context with second instance
  console.log('\nTesting context building with second instance...');
  const context2 = await memory2.buildContextForClaude("What was the 4th to last line of that poem?");
  console.log(`Context 2 length: ${context2.contextText.length}`);
  console.log(`Context 2 summary: ${context2.summary}`);
  
  console.log('\n📋 **TEST 3: Compare Results**');
  
  const same_conversations = memory1.conversations.size === memory2.conversations.size;
  const same_context_length = context1.contextText.length === context2.contextText.length;
  
  console.log(`Same conversation count: ${same_conversations ? '✅' : '❌'}`);
  console.log(`Same context length: ${same_context_length ? '✅' : '❌'}`);
  
  if (memory1.conversations.size > 0 && memory2.conversations.size > 0) {
    console.log('✅ Memory persistence is working - both instances loaded conversations');
  } else if (memory1.conversations.size === 0 && memory2.conversations.size === 0) {
    console.log('⚠️  Both instances have empty memory - no conversations stored yet');
  } else {
    console.log('❌ Memory persistence inconsistency detected');
  }
  
  console.log('\n📋 **TEST 4: Check Specific Poem Content**');
  
  if (memory2.conversations.size > 0) {
    console.log('\nSearching for poem content in conversations...');
    let foundPoem = false;
    
    for (const [id, conv] of memory2.conversations) {
      if (conv.contentType === 'poem' || conv.assistantResponse.includes('mountain') || conv.assistantResponse.includes('halls the echoes ring')) {
        console.log(`✅ Found poem in conversation ${id}`);
        console.log(`Content type: ${conv.contentType}`);
        console.log(`Response length: ${conv.assistantResponse.length} chars`);
        console.log(`Topics: ${conv.topics ? conv.topics.join(', ') : 'none'}`);
        foundPoem = true;
        break;
      }
    }
    
    if (!foundPoem) {
      console.log('❌ No poem found in stored conversations');
      console.log('\nStored conversation types:');
      for (const [id, conv] of memory2.conversations) {
        console.log(`  ${id}: ${conv.contentType} - "${conv.userMessage.substring(0, 50)}..."`);
      }
    }
  }
  
  console.log('\n🎯 **PERSISTENCE TEST COMPLETE**');
  console.log('If memory persistence is working, both instances should load the same conversations.');
  console.log('If context building fails, the issue is in search/relevance logic, not persistence.');
}

testMemoryPersistence().catch(console.error);