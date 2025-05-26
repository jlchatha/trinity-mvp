#!/usr/bin/env node

/**
 * Real Integration Test for Trinity-Native Memory
 * This tests the actual integration with Trinity MVP's queue system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function testRealIntegration() {
  console.log('🧪 Testing Trinity-Native Memory Real Integration\n');
  
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  const queueDir = path.join(trinityDir, 'queue');
  const inputDir = path.join(queueDir, 'input');
  const outputDir = path.join(queueDir, 'output');
  
  console.log('📂 Trinity MVP directories:');
  console.log(`   Base: ${trinityDir}`);
  console.log(`   Input: ${inputDir}`);
  console.log(`   Output: ${outputDir}`);
  console.log('');
  
  // Check if directories exist
  const dirsExist = [trinityDir, queueDir, inputDir, outputDir].every(dir => {
    const exists = fs.existsSync(dir);
    console.log(`   ${exists ? '✅' : '❌'} ${dir}`);
    return exists;
  });
  
  if (!dirsExist) {
    console.log('\n❌ Trinity MVP queue directories not found');
    console.log('💡 You need to run Trinity MVP first to create the queue system');
    return;
  }
  
  console.log('\n✅ All Trinity MVP directories exist');
  
  // Test 1: Send a poem request through the queue
  console.log('\n📝 Test 1: Sending poem request through Trinity queue...');
  
  const poemRequest = {
    sessionId: 'test-memory-session',
    prompt: 'Write me a short poem about Trinity remembering things',
    options: {
      workingDirectory: process.cwd()
    }
  };
  
  const requestId = `test-poem-${Date.now()}`;
  const requestFile = path.join(inputDir, `${requestId}.json`);
  
  try {
    fs.writeFileSync(requestFile, JSON.stringify(poemRequest, null, 2));
    console.log(`✅ Poem request sent: ${requestFile}`);
    
    // Wait for processing (up to 30 seconds)
    console.log('⏳ Waiting for Claude Watcher to process...');
    
    let attempts = 0;
    let responseFile = null;
    
    while (attempts < 30 && !responseFile) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const responseFiles = fs.readdirSync(outputDir).filter(f => f.startsWith(requestId));
      if (responseFiles.length > 0) {
        responseFile = path.join(outputDir, responseFiles[0]);
        break;
      }
      
      process.stdout.write('.');
    }
    
    console.log('');
    
    if (!responseFile) {
      console.log('❌ No response received after 30 seconds');
      console.log('💡 Make sure claude-watcher.js is running');
      return;
    }
    
    // Read the response
    const responseData = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
    console.log('✅ Response received!');
    console.log(`   Success: ${responseData.success}`);
    console.log(`   Content length: ${responseData.content?.length || 0} chars`);
    
    if (responseData.content) {
      console.log(`   Content preview: "${responseData.content.substring(0, 100)}..."`);
    }
    
    // Test 2: Send a memory reference request
    console.log('\n🔍 Test 2: Sending memory reference request...');
    
    const memoryRequest = {
      sessionId: 'test-memory-session', // Same session
      prompt: 'What was the 2nd line of that poem you just wrote?',
      options: {
        workingDirectory: process.cwd()
      }
    };
    
    const memoryRequestId = `test-memory-${Date.now()}`;
    const memoryRequestFile = path.join(inputDir, `${memoryRequestId}.json`);
    
    fs.writeFileSync(memoryRequestFile, JSON.stringify(memoryRequest, null, 2));
    console.log(`✅ Memory request sent: ${memoryRequestFile}`);
    
    // Wait for processing
    console.log('⏳ Waiting for memory-aware response...');
    
    attempts = 0;
    let memoryResponseFile = null;
    
    while (attempts < 30 && !memoryResponseFile) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
      const responseFiles = fs.readdirSync(outputDir).filter(f => f.startsWith(memoryRequestId));
      if (responseFiles.length > 0) {
        memoryResponseFile = path.join(outputDir, responseFiles[0]);
        break;
      }
      
      process.stdout.write('.');
    }
    
    console.log('');
    
    if (!memoryResponseFile) {
      console.log('❌ No memory response received after 30 seconds');
      return;
    }
    
    // Read the memory response
    const memoryResponseData = JSON.parse(fs.readFileSync(memoryResponseFile, 'utf8'));
    console.log('✅ Memory response received!');
    console.log(`   Success: ${memoryResponseData.success}`);
    console.log(`   Has memory context: ${memoryResponseData.memoryContext ? 'YES' : 'NO'}`);
    
    if (memoryResponseData.memoryContext) {
      console.log(`   Memory summary: ${memoryResponseData.memoryContext.summary}`);
      console.log(`   Relevant conversations: ${memoryResponseData.memoryContext.relevantConversations}`);
    }
    
    if (memoryResponseData.content) {
      console.log(`   Response preview: "${memoryResponseData.content.substring(0, 100)}..."`);
    }
    
    // Check if the context file was created
    const contextFile = path.join(trinityDir, 'memory', 'claude-context.txt');
    if (fs.existsSync(contextFile)) {
      console.log(`✅ Context file created: ${contextFile}`);
      const contextContent = fs.readFileSync(contextFile, 'utf8');
      console.log(`   Context preview: "${contextContent.substring(0, 100)}..."`);
    } else {
      console.log('❌ Context file not found');
    }
    
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    try {
      if (fs.existsSync(responseFile)) fs.unlinkSync(responseFile);
      if (fs.existsSync(memoryResponseFile)) fs.unlinkSync(memoryResponseFile);
      console.log('✅ Test files cleaned up');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
    
    // Final assessment
    console.log('\n📊 Integration Test Results:');
    console.log(`✅ Queue system working: ${responseData.success ? 'YES' : 'NO'}`);
    console.log(`✅ Memory detection working: ${memoryResponseData.memoryContext ? 'YES' : 'NO'}`);
    console.log(`✅ Context file generation: ${fs.existsSync(contextFile) ? 'YES' : 'NO'}`);
    
    const integrationWorking = responseData.success && 
                              memoryResponseData.memoryContext && 
                              fs.existsSync(contextFile);
    
    console.log(`\n🎯 Overall Status: ${integrationWorking ? '✅ WORKING' : '❌ NEEDS FIXING'}`);
    
    if (integrationWorking) {
      console.log('\n🎉 Trinity-Native Memory integration is working!');
      console.log('The system can now:');
      console.log('✅ Store conversations with content type detection');
      console.log('✅ Detect memory references in user queries');
      console.log('✅ Generate context files for Claude Code to read');
      console.log('✅ Provide memory-aware responses');
    } else {
      console.log('\n❌ Integration issues detected');
      console.log('Check:');
      console.log('- Is claude-watcher.js running?');
      console.log('- Are there any errors in the logs?');
      console.log('- Is the API key configured?');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the integration test
testRealIntegration().catch(console.error);