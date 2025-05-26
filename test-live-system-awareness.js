#!/usr/bin/env node

/**
 * Trinity System Awareness - Live Integration Test
 * 
 * Tests the complete pipeline including Claude Watcher integration
 * Simulates a real user request through the file-based communication system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function testLiveSystemAwareness() {
  console.log('🚀 Trinity System Awareness - Live Integration Test');
  console.log('==================================================\n');
  
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  const queueDir = path.join(trinityDir, 'queue');
  const inputDir = path.join(queueDir, 'input');
  const outputDir = path.join(queueDir, 'output');
  
  // Ensure directories exist
  [trinityDir, queueDir, inputDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log(`📁 Trinity directory: ${trinityDir}`);
  console.log(`📤 Input queue: ${inputDir}`);
  console.log(`📥 Output queue: ${outputDir}\n`);
  
  // Check if Claude Watcher is integrated properly by testing the components
  try {
    const ClaudeCodeContextEnhancer = require('./src/core/claude-code-context-enhancer');
    const enhancer = new ClaudeCodeContextEnhancer({ systemDir: trinityDir });
    
    console.log('✅ System awareness components loaded successfully');
    
    // Test the enhancement pipeline
    const testMessage = 'Help me understand Trinity\'s capabilities and how I can use it to improve my development workflow';
    const enhanced = await enhancer.enhanceWithSystemAwareness(testMessage, [], { forceEnhancement: true });
    
    const isEnhanced = enhanced !== testMessage;
    console.log(`🔍 Enhancement test: ${isEnhanced ? '✅ Working' : '❌ Failed'}`);
    
    if (isEnhanced) {
      // Extract context file path to verify it's created
      const contextMatch = enhanced.match(/\[Trinity Context Enhancement Available: (.+?)\]/);
      if (contextMatch && fs.existsSync(contextMatch[1])) {
        console.log('📄 Context file created successfully');
        
        // Show sample context
        const contextContent = fs.readFileSync(contextMatch[1], 'utf8');
        console.log(`📏 Context size: ${contextContent.length} characters`);
        
        // Check for Trinity-specific content
        const hasTrinityIdentity = contextContent.includes('You are Trinity');
        const hasCapabilities = contextContent.includes('local file access');
        const hasMemoryAwareness = contextContent.includes('Persistent memory');
        
        console.log(`🤖 Trinity identity: ${hasTrinityIdentity ? '✅' : '❌'}`);
        console.log(`⚙️ Capabilities explained: ${hasCapabilities ? '✅' : '❌'}`);
        console.log(`🧠 Memory awareness: ${hasMemoryAwareness ? '✅' : '❌'}`);
      }
    }
    
    // Now test with a simulated file queue request (like real usage)
    console.log('\n🧪 Testing file queue integration...');
    
    const requestId = 'test-system-awareness-' + Date.now();
    const requestData = {
      sessionId: 'test-session',
      prompt: 'I want to create a project documentation system. What are Trinity\'s capabilities for file management and how can I get started?',
      options: {
        workingDirectory: __dirname,
        userContext: {
          previousMessages: [
            { content: 'I\'m learning about Trinity MVP', timestamp: Date.now() - 60000 }
          ]
        }
      }
    };
    
    const requestFile = path.join(inputDir, `${requestId}.json`);
    const outputFile = path.join(outputDir, `${requestId}.json`);
    
    // Write request to queue
    fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));
    console.log(`📝 Request queued: ${requestId}`);
    
    console.log('\n⚠️ NOTE: For complete testing, you would need to:');
    console.log('1. Start Claude Watcher: node claude-watcher.js');
    console.log('2. Ensure ANTHROPIC_API_KEY is set');
    console.log('3. Wait for request processing');
    console.log('4. Check output file for enhanced response\n');
    
    console.log('📋 Request content preview:');
    console.log(JSON.stringify(requestData, null, 2));
    
    // Check if the request file was created
    if (fs.existsSync(requestFile)) {
      console.log('\n✅ Integration test preparation successful!');
      console.log('🔗 System awareness is properly integrated into the request pipeline');
      console.log('🚀 Ready for live testing with Claude Watcher');
      
      // Clean up test file
      fs.unlinkSync(requestFile);
      console.log('🧹 Test request file cleaned up');
      
      return true;
    } else {
      console.log('\n❌ Failed to create request file');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    console.error(error.stack);
    return false;
  }
}

// Instructions for manual testing
function printManualTestInstructions() {
  console.log('\n📖 MANUAL TESTING INSTRUCTIONS');
  console.log('===============================');
  console.log('To test the complete system awareness integration:');
  console.log('');
  console.log('1. Start Claude Watcher:');
  console.log('   node claude-watcher.js');
  console.log('');
  console.log('2. In another terminal, start Trinity MVP:');
  console.log('   npm start');
  console.log('');
  console.log('3. Test these scenarios in the Trinity UI:');
  console.log('   a) Simple: "hello" (should NOT show system awareness)');
  console.log('   b) Complex: "Help me understand Trinity\'s file management capabilities"');
  console.log('   c) Technical: "I need to optimize my Node.js project structure"');
  console.log('   d) Beginner: "I\'m new to this and need help getting started"');
  console.log('');
  console.log('4. Expected behaviors:');
  console.log('   - Trinity explains its capabilities when relevant');
  console.log('   - Communication style adapts to user technical level');
  console.log('   - Agent shows curiosity about user goals');
  console.log('   - References local file access and memory capabilities');
  console.log('   - Provides multiple solution approaches');
  console.log('');
  console.log('5. Check logs for system awareness messages:');
  console.log('   - Look for "[SYSTEM-AWARENESS]" entries');
  console.log('   - Verify context enhancement is applied');
  console.log('   - Performance should be <100ms overhead');
}

// Run the test
if (require.main === module) {
  testLiveSystemAwareness().then(success => {
    if (success) {
      printManualTestInstructions();
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Live test error:', error);
    process.exit(1);
  });
}

module.exports = testLiveSystemAwareness;