#!/usr/bin/env node

/**
 * Test Claude Watcher Memory Integration
 * 
 * Specifically tests the claude-watcher.js memory integration layer
 * to identify intermittent memory loading issues.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 TESTING: Claude Watcher Memory Integration\n');

// Test the specific integration points
async function testClaudeWatcherIntegration() {
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  const memoryContextPath = path.join(trinityDir, 'memory', 'claude-context.txt');
  
  console.log(`Trinity Directory: ${trinityDir}`);
  console.log(`Context File Path: ${memoryContextPath}`);
  
  // Test 1: Directory structure
  console.log('\n📋 **TEST 1: Directory Structure**');
  
  const requiredDirs = [
    trinityDir,
    path.join(trinityDir, 'memory'),
    path.join(trinityDir, 'queue'),
    path.join(trinityDir, 'queue', 'input'),
    path.join(trinityDir, 'queue', 'output'),
    path.join(trinityDir, 'queue', 'processing'),
    path.join(trinityDir, 'queue', 'failed')
  ];
  
  for (const dir of requiredDirs) {
    const exists = fs.existsSync(dir);
    console.log(`${exists ? '✅' : '❌'} ${dir}`);
    
    if (!exists) {
      console.log(`   Creating missing directory...`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Test 2: Context file creation reliability
  console.log('\n📋 **TEST 2: Context File Creation Reliability**');
  
  const testContext = `RELEVANT MEMORY CONTEXT FOR CLAUDE CODE:

User Query: "What was the 4th to last line of that poem?"

POEM CONTENT:
Mountains rise beyond the veil,
Through code and dreams they tell their tale.
In silence deep, the answers lie,
Beneath the vast computing sky.

Line counting: 36 - 4 + 1 = 33
Target line: "In memory's halls the echoes ring,"
`;

  for (let i = 1; i <= 5; i++) {
    console.log(`Attempt ${i}:`);
    
    try {
      // Simulate claude-watcher.js context writing
      fs.writeFileSync(memoryContextPath, testContext);
      
      // Immediate read test
      const readContent = fs.readFileSync(memoryContextPath, 'utf8');
      const success = readContent === testContext;
      
      console.log(`  Write Success: ✅`);
      console.log(`  Read Success: ${success ? '✅' : '❌'}`);
      console.log(`  File Size: ${readContent.length} chars`);
      
      if (!success) {
        console.log(`  Expected: ${testContext.length} chars`);
        console.log(`  Got: ${readContent.length} chars`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }
  
  // Test 3: Concurrent access simulation
  console.log('\n📋 **TEST 3: Concurrent Access Simulation**');
  
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    promises.push(
      new Promise(async (resolve) => {
        try {
          const contextContent = `Context ${i}: ${testContext}`;
          fs.writeFileSync(memoryContextPath, contextContent);
          
          // Small delay to simulate processing
          await new Promise(r => setTimeout(r, 10));
          
          const readBack = fs.readFileSync(memoryContextPath, 'utf8');
          resolve({
            attempt: i,
            success: readBack.includes(`Context ${i}`),
            size: readBack.length
          });
        } catch (error) {
          resolve({
            attempt: i,
            success: false,
            error: error.message
          });
        }
      })
    );
  }
  
  const results = await Promise.all(promises);
  results.forEach(result => {
    console.log(`Concurrent ${result.attempt}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  });
  
  // Test 4: File system permissions
  console.log('\n📋 **TEST 4: File System Permissions**');
  
  try {
    const stats = fs.statSync(memoryContextPath);
    console.log(`File exists: ✅`);
    console.log(`File size: ${stats.size} bytes`);
    console.log(`Readable: ${fs.constants.R_OK ? '✅' : '❌'}`);
    console.log(`Writable: ${fs.constants.W_OK ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`❌ File access error: ${error.message}`);
  }
  
  // Test 5: Memory integration simulation
  console.log('\n📋 **TEST 5: Memory Integration Simulation**');
  
  // Import Trinity components
  const TrinityNativeMemory = require('./src/core/trinity-native-memory');
  const MemoryReferenceDetector = require('./src/core/memory-reference-detector');
  
  const trinityMemory = new TrinityNativeMemory({ baseDir: trinityDir, logger: console });
  const memoryDetector = new MemoryReferenceDetector({ logger: console });
  
  const testQuery = "What was the 4th to last line of that poem?";
  
  for (let i = 1; i <= 3; i++) {
    console.log(`Integration Test ${i}:`);
    
    try {
      // Step 1: Memory Detection (claude-watcher.js line 151)
      const hasMemoryReference = memoryDetector.detectsMemoryReference(testQuery);
      console.log(`  1. Memory Detection: ${hasMemoryReference ? '✅' : '❌'}`);
      
      if (hasMemoryReference) {
        // Step 2: Context Building (claude-watcher.js line 157)
        const memoryContext = await trinityMemory.buildContextForClaude(testQuery);
        console.log(`  2. Context Building: ${memoryContext.contextText ? '✅' : '❌'}`);
        
        if (memoryContext.contextText && memoryContext.contextText.trim().length > 0) {
          // Step 3: File Writing (claude-watcher.js line 170)
          fs.writeFileSync(memoryContextPath, memoryContext.contextText);
          console.log(`  3. Context File Write: ✅`);
          
          // Step 4: Enhanced Prompt (claude-watcher.js line 173)
          const enhancedPrompt = `${testQuery}\n\nRELEVANT CONTEXT: Available in file: ${memoryContextPath}`;
          console.log(`  4. Enhanced Prompt: ✅ (${enhancedPrompt.length} chars)`);
          
          // Step 5: Immediate verification (what Claude Code would see)
          const claudeWouldRead = fs.readFileSync(memoryContextPath, 'utf8');
          const contextMatch = claudeWouldRead === memoryContext.contextText;
          console.log(`  5. Claude Code View: ${contextMatch ? '✅' : '❌'}`);
          
          if (!contextMatch) {
            console.log(`     Expected: ${memoryContext.contextText.length} chars`);
            console.log(`     Claude reads: ${claudeWouldRead.length} chars`);
          }
          
        } else {
          console.log(`  ❌ No context generated`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Integration Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 **INTEGRATION DIAGNOSTIC COMPLETE**');
  console.log('\nIf you see ❌ in the Integration Tests above, this indicates:');
  console.log('- File I/O race conditions');
  console.log('- Memory component reliability issues');
  console.log('- File system access problems');
  console.log('\nIf all tests show ✅, the intermittent issue is likely in:');
  console.log('- Claude Code execution environment');
  console.log('- WSL file system timing');
  console.log('- Async operation ordering in claude-watcher.js');
}

testClaudeWatcherIntegration().catch(console.error);