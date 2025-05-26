#!/usr/bin/env node

/**
 * Quick System Awareness Test
 * Tests the enhancement pipeline without requiring Claude API
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Direct test of the enhancement pipeline
async function testEnhancementPipeline() {
  console.log('🧪 Quick System Awareness Test');
  console.log('==============================\n');
  
  try {
    // Load components exactly as claude-watcher.js does
    const TrinityNativeMemory = require('./src/core/trinity-native-memory');
    const MemoryReferenceDetector = require('./src/core/memory-reference-detector');
    const ComplexQueryProcessor = require('./src/core/complex-query-processor');
    const ClaudeCodeContextEnhancer = require('./src/core/claude-code-context-enhancer');
    
    const trinityDir = path.join(os.homedir(), '.trinity-mvp');
    
    console.log('🔧 Initializing components...');
    
    // Initialize memory system
    const trinityMemory = new TrinityNativeMemory({
      baseDir: trinityDir,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    
    await trinityMemory.initialize();
    console.log('✅ Trinity Memory initialized');
    
    // Initialize memory detector
    const memoryDetector = new MemoryReferenceDetector({
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    console.log('✅ Memory detector initialized');
    
    // Initialize complex query processor
    const complexQueryProcessor = new ComplexQueryProcessor({
      baseDir: trinityDir,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    console.log('✅ Complex query processor initialized');
    
    // Initialize system awareness
    const contextEnhancer = new ClaudeCodeContextEnhancer({
      systemDir: trinityDir,
      enableCuriosity: true,
      enableSystemAwareness: true,
      logger: { info: () => {}, warn: () => {}, error: () => {} }
    });
    console.log('✅ System awareness initialized\n');
    
    // Test the complete pipeline as claude-watcher.js does
    console.log('🧪 Testing complete enhancement pipeline...');
    
    const testPrompt = 'I want to automate my project documentation and need help understanding what Trinity can do for file management';
    const userContext = {
      previousMessages: [
        { content: 'I\'m working on improving my development workflow', timestamp: Date.now() - 60000 }
      ]
    };
    
    let enhancedPrompt = testPrompt;
    
    // Step 1: Complex query processing
    const needsComplexProcessing = complexQueryProcessor.needsComplexProcessing(testPrompt);
    console.log(`📋 Needs complex processing: ${needsComplexProcessing}`);
    
    if (needsComplexProcessing) {
      const complexQueryResult = await complexQueryProcessor.processComplexQuery(testPrompt);
      if (complexQueryResult.enhanced) {
        enhancedPrompt = complexQueryResult.enhancedPrompt;
        console.log('✅ Complex query enhancement applied');
      }
    }
    
    // Step 2: Memory reference detection
    const hasMemoryReference = memoryDetector.detectsMemoryReference(enhancedPrompt);
    console.log(`🧠 Has memory reference: ${hasMemoryReference}`);
    
    if (hasMemoryReference) {
      const memoryContext = await trinityMemory.buildContextForClaude(enhancedPrompt);
      if (memoryContext.contextText && memoryContext.contextText.trim().length > 0) {
        console.log(`✅ Memory context loaded: ${memoryContext.contextText.length} chars`);
        enhancedPrompt = `${enhancedPrompt}\n\nRELEVANT CONTEXT: Available in memory context`;
      }
    }
    
    // Step 3: System awareness enhancement
    console.log('🧠 Applying system awareness...');
    
    const conversationHistory = userContext.previousMessages || [];
    const systemAwarePrompt = await contextEnhancer.enhanceWithSystemAwareness(
      enhancedPrompt,
      conversationHistory,
      {
        workingDirectory: __dirname,
        sessionId: 'test-session',
        forceEnhancement: false
      }
    );
    
    const systemAwarenessApplied = systemAwarePrompt !== enhancedPrompt;
    console.log(`✅ System awareness applied: ${systemAwarenessApplied}`);
    
    if (systemAwarenessApplied) {
      // Extract context file for verification
      const contextMatch = systemAwarePrompt.match(/\[Trinity Context Enhancement Available: (.+?)\]/);
      if (contextMatch && fs.existsSync(contextMatch[1])) {
        const contextContent = fs.readFileSync(contextMatch[1], 'utf8');
        
        // Verify key features
        const features = {
          systemCapabilities: contextContent.includes('SYSTEM CAPABILITIES AVAILABLE'),
          environmentContext: contextContent.includes('USER ENVIRONMENT CONTEXT'),
          communicationAdaptation: contextContent.includes('COMMUNICATION ADAPTATION'),
          curiosityGuidance: contextContent.includes('Curiosity guidance'),
          trinityGuidance: contextContent.includes('TRINITY ASSISTANT GUIDANCE')
        };
        
        console.log('\n📊 System Awareness Features:');
        Object.entries(features).forEach(([key, present]) => {
          console.log(`  ${key}: ${present ? '✅' : '❌'}`);
        });
        
        const allPresent = Object.values(features).every(f => f);
        console.log(`\n🎯 Complete integration: ${allPresent ? '✅ YES' : '❌ NO'}`);
        
        // Show final prompt transformation
        console.log('\n📝 Prompt transformation:');
        console.log(`Original: ${testPrompt.length} chars`);
        console.log(`Final: ${systemAwarePrompt.length} chars`);
        console.log(`Context: ${contextContent.length} chars`);
        
        return allPresent;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test
if (require.main === module) {
  testEnhancementPipeline().then(success => {
    console.log('\n🎯 QUICK TEST RESULT:');
    if (success) {
      console.log('✅ System awareness integration working perfectly!');
      console.log('🚀 Ready for operator testing with Trinity MVP');
    } else {
      console.log('❌ System awareness integration has issues');
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
}

module.exports = testEnhancementPipeline;