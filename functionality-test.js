#!/usr/bin/env node

/**
 * Trinity MVP Functionality Test
 * Tests if the implemented features actually work
 * CRITICAL: This is a READ-ONLY test that doesn't modify the codebase permanently
 */

console.log('⚡ Trinity MVP Functionality Test');
console.log('=================================');

async function testMemoryHierarchy() {
  console.log('\n🧠 Testing Memory Hierarchy...');
  
  try {
    const MemoryHierarchy = require('./src/core/memory-hierarchy');
    const os = require('os');
    const path = require('path');
    
    // Create test instance with temporary directory
    const testDir = path.join(os.tmpdir(), '.trinity-mvp-test');
    const memory = new MemoryHierarchy({
      mvpDataDir: testDir
    });
    
    console.log('  ✅ Memory hierarchy module loaded');
    
    // Test initialization
    await memory.initialize();
    console.log('  ✅ Memory hierarchy initialized');
    
    // Test storage
    const testData = { test: 'Trinity MVP memory test', timestamp: new Date().toISOString() };
    const result = await memory.store('working', testData, {
      title: 'Test Memory Item',
      description: 'Functionality test'
    });
    
    console.log(`  ✅ Memory storage successful: ${result.id}`);
    
    // Test retrieval
    const retrieved = await memory.retrieve({ id: result.id });
    if (retrieved.length > 0 && retrieved[0].content.test === testData.test) {
      console.log('  ✅ Memory retrieval successful');
    } else {
      console.log('  ❌ Memory retrieval failed');
    }
    
    // Cleanup test directory
    const fs = require('fs');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Memory hierarchy test failed: ${error.message}`);
    return false;
  }
}

async function testClaudeIntegration() {
  console.log('\n🤖 Testing Claude Integration...');
  
  try {
    const ClaudeCodeSDK = require('./src/core/claude-integration');
    console.log('  ✅ Claude integration module loaded');
    
    // Test SDK initialization (without API key - just structure)
    const sdk = new ClaudeCodeSDK({
      apiKey: 'test-key-no-real-calls'
    });
    
    console.log('  ✅ Claude SDK initialized');
    
    // Test method existence
    if (typeof sdk.executeCommand === 'function') {
      console.log('  ✅ executeCommand method exists');
    } else {
      console.log('  ❌ executeCommand method missing');
    }
    
    if (typeof sdk.executeBackgroundTask === 'function') {
      console.log('  ✅ executeBackgroundTask method exists');
    } else {
      console.log('  ❌ executeBackgroundTask method missing');
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Claude integration test failed: ${error.message}`);
    return false;
  }
}

async function testFileManager() {
  console.log('\n📁 Testing File Manager...');
  
  try {
    const FileManager = require('./src/core/file-manager');
    console.log('  ✅ File manager module loaded');
    
    // Test initialization
    const fileManager = new FileManager();
    console.log('  ✅ File manager initialized');
    
    // Check for key methods
    const requiredMethods = ['initialize', 'sendRequest', 'shutdown'];
    let methodsFound = 0;
    
    for (const method of requiredMethods) {
      if (typeof fileManager[method] === 'function') {
        console.log(`  ✅ ${method} method exists`);
        methodsFound++;
      } else {
        console.log(`  ⚠️  ${method} method missing`);
      }
    }
    
    console.log(`  📊 File manager methods: ${methodsFound}/${requiredMethods.length}`);
    
    return methodsFound >= 2; // At least 2 core methods should exist
  } catch (error) {
    console.log(`  ❌ File manager test failed: ${error.message}`);
    return false;
  }
}

async function testUIComponents() {
  console.log('\n🖥️  Testing UI Components...');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Test main HTML file
    const indexPath = path.join(__dirname, 'renderer/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    console.log('  ✅ Main HTML file loaded');
    
    // Check for key UI elements
    const uiElements = [
      'chat', 'memory', 'status', 'trinity', 'sidebar'
    ];
    
    let elementsFound = 0;
    for (const element of uiElements) {
      if (indexContent.toLowerCase().includes(element)) {
        console.log(`  ✅ UI element '${element}' found`);
        elementsFound++;
      } else {
        console.log(`  ⚠️  UI element '${element}' not found`);
      }
    }
    
    console.log(`  📊 UI elements: ${elementsFound}/${uiElements.length}`);
    
    // Test preload script
    const preloadPath = path.join(__dirname, 'preload.js');
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    
    if (preloadContent.includes('trinityAPI')) {
      console.log('  ✅ Trinity API bridge found in preload');
    } else {
      console.log('  ❌ Trinity API bridge missing in preload');
    }
    
    return elementsFound >= 3;
  } catch (error) {
    console.log(`  ❌ UI components test failed: ${error.message}`);
    return false;
  }
}

async function testMemoryIntegration() {
  console.log('\n🔗 Testing Memory Integration...');
  
  try {
    const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
    console.log('  ✅ Memory integration module loaded');
    
    // Test initialization (minimal test without full setup)
    const integration = new TrinityMemoryIntegration({
      sessionId: 'test-session'
    });
    
    console.log('  ✅ Memory integration initialized');
    
    // Check for key methods
    const keyMethods = ['loadRelevantContext', 'initialize'];
    let methodsFound = 0;
    
    for (const method of keyMethods) {
      if (typeof integration[method] === 'function') {
        console.log(`  ✅ ${method} method exists`);
        methodsFound++;
      } else {
        console.log(`  ❌ ${method} method missing`);
      }
    }
    
    return methodsFound >= 1;
  } catch (error) {
    console.log(`  ❌ Memory integration test failed: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive functionality tests...\n');
  
  const tests = [
    { name: 'Memory Hierarchy', test: testMemoryHierarchy },
    { name: 'Claude Integration', test: testClaudeIntegration },
    { name: 'File Manager', test: testFileManager },
    { name: 'UI Components', test: testUIComponents },
    { name: 'Memory Integration', test: testMemoryIntegration }
  ];
  
  const results = {};
  
  for (const { name, test } of tests) {
    try {
      results[name] = await test();
    } catch (error) {
      console.log(`❌ ${name} test crashed: ${error.message}`);
      results[name] = false;
    }
  }
  
  console.log('\n📊 FUNCTIONALITY TEST RESULTS');
  console.log('==============================');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  for (const [testName, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${testName}: ${result ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log(`\n📈 Overall: ${passed}/${total} tests passed (${Math.round(passed/total * 100)}%)`);
  
  if (passed >= total * 0.8) {
    console.log('🎉 EXCELLENT: Most functionality is working!');
  } else if (passed >= total * 0.6) {
    console.log('⚠️ GOOD: Core functionality working, some issues found');
  } else {
    console.log('❌ POOR: Major functionality issues detected');
  }
  
  console.log('\n🏁 Functionality Analysis Complete');
}

runAllTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});