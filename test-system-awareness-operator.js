#!/usr/bin/env node

/**
 * Trinity System Awareness - Operator Test
 * 
 * Real-world test to verify system awareness enhancement works in practice
 * Tests the complete pipeline: user message -> system awareness -> Claude Code
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the components we want to test
const ClaudeCodeContextEnhancer = require('./src/core/claude-code-context-enhancer');

async function runOperatorTest() {
  console.log('🧪 Trinity System Awareness - Operator Test');
  console.log('===============================================\n');
  
  const testSystemDir = path.join(os.tmpdir(), 'trinity-operator-test-' + Date.now());
  
  try {
    // Create test environment
    fs.mkdirSync(testSystemDir, { recursive: true });
    console.log(`📁 Test environment: ${testSystemDir}\n`);
    
    // Initialize the context enhancer
    const enhancer = new ClaudeCodeContextEnhancer({ 
      systemDir: testSystemDir,
      enableCuriosity: true,
      enableSystemAwareness: true
    });
    
    console.log('✅ Context enhancer initialized\n');
    
    // Test Scenario 1: Simple greeting (should NOT be enhanced)
    console.log('🧪 TEST 1: Simple greeting (should not enhance)');
    const simpleMessage = 'hello';
    const simpleResult = await enhancer.enhanceWithSystemAwareness(simpleMessage, []);
    
    const simpleEnhanced = simpleResult !== simpleMessage;
    console.log(`📝 Original: "${simpleMessage}"`);
    console.log(`📝 Result: "${simpleResult}"`);
    console.log(`🔍 Enhanced: ${simpleEnhanced ? 'YES' : 'NO'} ${simpleEnhanced ? '❌ UNEXPECTED' : '✅ CORRECT'}\n`);
    
    // Test Scenario 2: Complex help request (should be enhanced)
    console.log('🧪 TEST 2: Complex help request (should enhance)');
    const complexMessage = 'I want to create a Node.js project with automated testing and help optimize my development workflow';
    const conversationHistory = [
      { content: 'I\'m working on improving my development process', timestamp: Date.now() - 60000 },
      { content: 'I need better project structure', timestamp: Date.now() - 30000 }
    ];
    
    const complexResult = await enhancer.enhanceWithSystemAwareness(complexMessage, conversationHistory, {
      forceEnhancement: true // Force for demonstration
    });
    
    const complexEnhanced = complexResult !== complexMessage;
    console.log(`📝 Original: "${complexMessage}"`);
    console.log(`📝 Enhanced: ${complexEnhanced ? 'YES' : 'NO'} ${complexEnhanced ? '✅ CORRECT' : '❌ UNEXPECTED'}`);
    
    if (complexEnhanced) {
      // Extract context file path
      const contextMatch = complexResult.match(/\[Trinity Context Enhancement Available: (.+?)\]/);
      
      if (contextMatch) {
        const contextFile = contextMatch[1];
        console.log(`📄 Context file created: ${path.basename(contextFile)}`);
        
        if (fs.existsSync(contextFile)) {
          const contextContent = fs.readFileSync(contextFile, 'utf8');
          
          // Check for key system awareness features
          const hasSystemCapabilities = contextContent.includes('SYSTEM CAPABILITIES AVAILABLE');
          const hasEnvironmentContext = contextContent.includes('USER ENVIRONMENT CONTEXT');
          const hasCommunicationAdaptation = contextContent.includes('COMMUNICATION ADAPTATION');
          const hasCuriosityGuidance = contextContent.includes('Curiosity guidance');
          const hasTrinityGuidance = contextContent.includes('TRINITY ASSISTANT GUIDANCE');
          
          console.log('\n📊 Context Analysis:');
          console.log(`  🔧 System Capabilities: ${hasSystemCapabilities ? '✅' : '❌'}`);
          console.log(`  🌍 Environment Context: ${hasEnvironmentContext ? '✅' : '❌'}`);
          console.log(`  💬 Communication Adaptation: ${hasCommunicationAdaptation ? '✅' : '❌'}`);
          console.log(`  🤔 Curiosity Guidance: ${hasCuriosityGuidance ? '✅' : '❌'}`);
          console.log(`  🧠 Trinity Guidance: ${hasTrinityGuidance ? '✅' : '❌'}`);
          
          // Show a sample of the context content
          console.log('\n📋 Sample Context Content:');
          const lines = contextContent.split('\n');
          const sampleLines = lines.slice(0, 15).map(line => `  ${line}`).join('\n');
          console.log(sampleLines);
          console.log(`  ... (${lines.length - 15} more lines)\n`);
          
          // Measure context performance
          const contextSize = contextContent.length;
          console.log(`📏 Context size: ${contextSize} characters (${(contextSize / 1024).toFixed(1)}KB)`);
          
          const allFeaturesPresent = hasSystemCapabilities && hasEnvironmentContext && 
                                   hasCommunicationAdaptation && hasCuriosityGuidance && hasTrinityGuidance;
          
          if (allFeaturesPresent) {
            console.log('🎉 All system awareness features present in context!');
          } else {
            console.log('⚠️ Some system awareness features missing');
          }
        } else {
          console.log('❌ Context file not found!');
        }
      } else {
        console.log('❌ No context file reference found in enhanced message');
      }
    }
    
    console.log('\n🧪 TEST 3: Performance check');
    const performanceStartTime = Date.now();
    
    await enhancer.enhanceWithSystemAwareness(
      'Help me debug this complex algorithm performance issue',
      [{ content: 'Working on optimization' }],
      { forceEnhancement: true }
    );
    
    const performanceTime = Date.now() - performanceStartTime;
    const meetsPerformanceTarget = performanceTime < 100;
    
    console.log(`⏱️ Enhancement time: ${performanceTime}ms (target: <100ms)`);
    console.log(`🎯 Performance: ${meetsPerformanceTarget ? '✅ MEETS TARGET' : '❌ TOO SLOW'}\n`);
    
    // Test Scenario 4: Real-world Claude Code integration simulation
    console.log('🧪 TEST 4: Claude Code integration simulation');
    
    const realWorldMessage = 'I need help organizing my project files and setting up automated documentation';
    const realWorldHistory = [
      { content: 'I\'m working on a Node.js project', timestamp: Date.now() - 120000 },
      { content: 'The project is getting complex', timestamp: Date.now() - 60000 }
    ];
    
    const integrationStartTime = Date.now();
    const integrationResult = await enhancer.enhanceWithSystemAwareness(
      realWorldMessage, 
      realWorldHistory,
      { 
        workingDirectory: __dirname,
        sessionId: 'test-session-' + Date.now()
      }
    );
    const integrationTime = Date.now() - integrationStartTime;
    
    console.log(`📝 Real-world message processed in ${integrationTime}ms`);
    console.log(`🔍 Enhancement applied: ${integrationResult !== realWorldMessage ? 'YES' : 'NO'}`);
    
    if (integrationResult !== realWorldMessage) {
      console.log('✅ Real-world integration test successful!');
    } else {
      console.log('❌ Real-world integration test failed - no enhancement applied');
    }
    
    // Summary
    console.log('\n🎯 OPERATOR TEST SUMMARY');
    console.log('========================');
    
    const tests = [
      { name: 'Simple message filtering', passed: !simpleEnhanced },
      { name: 'Complex message enhancement', passed: complexEnhanced },
      { name: 'Performance requirement', passed: meetsPerformanceTarget },
      { name: 'Real-world integration', passed: integrationResult !== realWorldMessage }
    ];
    
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    
    tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 SYSTEM AWARENESS OPERATOR TEST: ALL TESTS PASSED!');
      console.log('🚀 Ready for real user testing!');
    } else {
      console.log('\n⚠️ Some tests failed - review implementation before user testing');
    }
    
    return passedTests === totalTests;
    
  } catch (error) {
    console.error('❌ Operator test failed:', error);
    return false;
    
  } finally {
    // Cleanup
    try {
      fs.rmSync(testSystemDir, { recursive: true, force: true });
      console.log(`\n🧹 Cleanup completed`);
    } catch (error) {
      console.warn('Could not clean up test directory:', error.message);
    }
  }
}

// Run the operator test
if (require.main === module) {
  runOperatorTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Operator test error:', error);
    process.exit(1);
  });
}

module.exports = runOperatorTest;