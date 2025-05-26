#!/usr/bin/env node

/**
 * Test Memory Selection Logic Fixes
 * 
 * Tests the fixes for:
 * 1. Recency logic for "you wrote" queries
 * 2. Follow-up query detection
 * 3. Memory selection transparency
 */

const TrinityNativeMemory = require('./src/core/trinity-native-memory');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector');
const path = require('path');
const os = require('os');

console.log('🔍 TESTING: Memory Selection Logic Fixes\n');

async function testMemorySelectionFixes() {
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  
  const memory = new TrinityNativeMemory({
    baseDir: trinityDir,
    logger: {
      info: (msg) => console.log(`[MEMORY] ${msg}`),
      warn: (msg) => console.log(`[WARN] ${msg}`),
      error: (msg) => console.log(`[ERROR] ${msg}`)
    }
  });
  
  const detector = new MemoryReferenceDetector({
    logger: console
  });
  
  await memory.initialize();
  
  console.log('📋 **TEST 1: "You Wrote" Query Recency Logic**\n');
  
  const youWroteQuery = "What was the 2nd to last line in the poem you wrote?";
  console.log(`Query: "${youWroteQuery}"`);
  
  // Test memory detection
  const detects1 = detector.detectsMemoryReference(youWroteQuery);
  console.log(`Memory Detection: ${detects1 ? '✅' : '❌'}`);
  
  if (detects1) {
    // Test context building with new recency logic
    console.log('\nBuilding context with enhanced recency logic...');
    const context1 = await memory.buildContextForClaude(youWroteQuery);
    console.log(`Context Length: ${context1.contextText.length} chars`);
    console.log(`Summary: ${context1.summary}`);
    
    // Check which poem was selected by looking at context content
    if (context1.contextText.includes('Digital Dawn')) {
      console.log('✅ Correctly selected "Digital Dawn" (most recent poem)');
    } else if (context1.contextText.includes('Trinity MVP') || context1.contextText.includes('Mountains rise')) {
      console.log('❌ Incorrectly selected "Trinity MVP" (older poem)');
    } else {
      console.log('⚠️  Could not determine which poem was selected');
    }
    
    // Check for transparency logging
    console.log('\n(Check console output above for selection transparency)');
  }
  
  console.log('\n📋 **TEST 2: Follow-up Query Detection**\n');
  
  const followUpQueries = [
    "How about the poem you most recently wrote?",
    "What about the most recent poem?", 
    "You recently wrote a poem, right?",
    "How about that latest poem?"
  ];
  
  followUpQueries.forEach((query, index) => {
    console.log(`Follow-up Test ${index + 1}: "${query}"`);
    const detects = detector.detectsMemoryReference(query);
    const analysis = detector.analyzeMemoryReferences(query);
    console.log(`  Detection: ${detects ? '✅' : '❌'}`);
    console.log(`  Confidence: ${analysis.confidence.toFixed(2)}`);
    console.log(`  Categories: ${analysis.categories.join(', ')}`);
    console.log('');
  });
  
  console.log('📋 **TEST 3: Temporal Qualifier Understanding**\n');
  
  const temporalQueries = [
    "What was the last line of the most recent poem?",
    "Show me the latest poem you wrote",
    "What about the poem you just wrote?",
    "How about the most recent one?"
  ];
  
  for (const query of temporalQueries) {
    console.log(`Temporal Test: "${query}"`);
    
    const detects = detector.detectsMemoryReference(query);
    console.log(`  Detection: ${detects ? '✅' : '❌'}`);
    
    if (detects) {
      try {
        const context = await memory.buildContextForClaude(query);
        console.log(`  Context: ${context.contextText.length} chars`);
        
        // Check recency selection
        if (context.contextText.includes('Digital Dawn')) {
          console.log('  ✅ Selected most recent poem');
        } else if (context.contextText.includes('Trinity MVP')) {
          console.log('  ❌ Selected older poem');
        } else {
          console.log('  ⚠️  Could not determine selection');
        }
      } catch (error) {
        console.log(`  ❌ Context building failed: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('📋 **TEST 4: Compare Old vs New Behavior**\n');
  
  // Simulate the exact user scenario
  const scenario = [
    "What was the 2nd to last line in the poem you wrote?",
    "How about the poem you most recently wrote?"
  ];
  
  for (let i = 0; i < scenario.length; i++) {
    const query = scenario[i];
    console.log(`Scenario Step ${i + 1}: "${query}"`);
    
    const detects = detector.detectsMemoryReference(query);
    console.log(`  Memory Detection: ${detects ? '✅' : '❌'}`);
    
    if (detects) {
      const context = await memory.buildContextForClaude(query);
      console.log(`  Context Generated: ${context.contextText.length > 0 ? '✅' : '❌'}`);
      console.log(`  Summary: ${context.summary}`);
      
      // Check poem selection
      const hasDigitalDawn = context.contextText.includes('Digital Dawn');
      const hasTrinityMVP = context.contextText.includes('Trinity MVP') || context.contextText.includes('Mountains rise');
      
      if (hasDigitalDawn && !hasTrinityMVP) {
        console.log('  ✅ Selected ONLY "Digital Dawn" (most recent)');
      } else if (hasTrinityMVP && !hasDigitalDawn) {
        console.log('  ❌ Selected ONLY "Trinity MVP" (older)');
      } else if (hasDigitalDawn && hasTrinityMVP) {
        console.log('  ⚠️  Selected BOTH poems (check ranking)');
      } else {
        console.log('  ❌ No poem content found');
      }
    } else {
      console.log('  ❌ Memory detection failed - this should not happen!');
    }
    console.log('');
  }
  
  console.log('🎯 **TEST SUMMARY**');
  console.log('Expected Results:');
  console.log('✅ "You wrote" queries should select most recent content');
  console.log('✅ Follow-up queries should be detected as memory references');
  console.log('✅ Temporal qualifiers should work correctly');
  console.log('✅ Selection transparency should show reasoning in logs');
}

testMemorySelectionFixes().catch(console.error);