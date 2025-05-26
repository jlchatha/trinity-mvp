#!/usr/bin/env node

/**
 * Operator Validation Test
 * Quick test for human operator to validate Trinity-Native Memory is working
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

async function operatorTest() {
  console.log('👤 OPERATOR VALIDATION TEST\n');
  
  const trinityDir = path.join(os.homedir(), '.trinity-mvp');
  const inputDir = path.join(trinityDir, 'queue', 'input');
  const outputDir = path.join(trinityDir, 'queue', 'output');
  
  console.log('Step 1: Sending a poem request...');
  
  // Send poem request
  const poemRequest = {
    sessionId: 'operator-test',
    prompt: 'Write me a 4-line poem about Trinity having a good memory',
    options: { workingDirectory: process.cwd() }
  };
  
  const poemId = `operator-poem-${Date.now()}`;
  fs.writeFileSync(
    path.join(inputDir, `${poemId}.json`), 
    JSON.stringify(poemRequest, null, 2)
  );
  
  console.log('✅ Poem request sent. Waiting for response...');
  
  // Wait for poem response
  let poemResponse = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith(poemId));
    if (files.length > 0) {
      poemResponse = JSON.parse(fs.readFileSync(path.join(outputDir, files[0]), 'utf8'));
      break;
    }
    process.stdout.write('.');
  }
  
  if (!poemResponse?.success) {
    console.log('\n❌ Poem request failed');
    return;
  }
  
  console.log(`\n✅ Poem received (${poemResponse.content.length} chars)`);
  console.log('📝 Poem content:');
  console.log(poemResponse.content);
  console.log('');
  
  // Wait a moment for memory storage
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Step 2: Testing memory reference...');
  
  // Send memory reference request
  const memoryRequest = {
    sessionId: 'operator-test', // Same session
    prompt: 'What was the second line of that poem you just wrote?',
    options: { workingDirectory: process.cwd() }
  };
  
  const memoryId = `operator-memory-${Date.now()}`;
  fs.writeFileSync(
    path.join(inputDir, `${memoryId}.json`), 
    JSON.stringify(memoryRequest, null, 2)
  );
  
  console.log('✅ Memory request sent. Waiting for response...');
  
  // Wait for memory response
  let memoryResponse = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith(memoryId));
    if (files.length > 0) {
      memoryResponse = JSON.parse(fs.readFileSync(path.join(outputDir, files[0]), 'utf8'));
      break;
    }
    process.stdout.write('.');
  }
  
  if (!memoryResponse?.success) {
    console.log('\n❌ Memory request failed');
    return;
  }
  
  console.log(`\n✅ Memory response received`);
  console.log('🧠 Memory context detected:', memoryResponse.memoryContext ? 'YES' : 'NO');
  
  if (memoryResponse.memoryContext) {
    console.log(`   Summary: ${memoryResponse.memoryContext.summary}`);
    console.log(`   Conversations: ${memoryResponse.memoryContext.relevantConversations}`);
  }
  
  console.log('💬 Response content:');
  console.log(memoryResponse.content);
  console.log('');
  
  // Check context file
  const contextFile = path.join(trinityDir, 'memory', 'claude-context.txt');
  const contextExists = fs.existsSync(contextFile);
  console.log(`📄 Context file created: ${contextExists ? 'YES' : 'NO'}`);
  
  if (contextExists) {
    const contextContent = fs.readFileSync(contextFile, 'utf8');
    console.log('📄 Context file preview:');
    console.log(contextContent.substring(0, 200) + '...');
  }
  
  // Cleanup
  try {
    fs.readdirSync(outputDir).forEach(file => {
      if (file.startsWith('operator-')) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    });
  } catch (e) {}
  
  console.log('\n🎯 OPERATOR VALIDATION RESULTS:');
  console.log(`✅ Poem generation: ${poemResponse.success ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Memory detection: ${memoryResponse.memoryContext ? 'WORKING' : 'FAILED'}`);
  console.log(`✅ Context file: ${contextExists ? 'WORKING' : 'FAILED'}`);
  
  const allWorking = poemResponse.success && memoryResponse.memoryContext && contextExists;
  
  console.log(`\n🏆 OVERALL STATUS: ${allWorking ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
  
  if (allWorking) {
    console.log('\n🎉 Trinity-Native Memory is working correctly!');
    console.log('✨ The critical use case "What was the 2nd line of that poem?" should now work');
  } else {
    console.log('\n🔧 Some components need debugging');
  }
}

operatorTest().catch(console.error);