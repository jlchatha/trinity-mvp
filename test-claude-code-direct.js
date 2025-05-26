#!/usr/bin/env node

/**
 * Direct test of Claude Code to see what's happening with simple queries
 */

const ClaudeCodeSDK = require('./src/core/claude-integration');
const AGENT_PROMPTS = require('./src/core/ai-prompts');

async function testClaudeCodeDirect() {
  console.log('🧪 Testing Claude Code SDK directly...\n');
  
  const claudeSDK = new ClaudeCodeSDK();
  
  const testQueries = [
    "Hola",
    "write a poem", 
    "What files are in the current directory?",
    "Review your codebase and assess what we are delivering vs what we are promising"
  ];
  
  for (const query of testQueries) {
    console.log(`\n=== Testing: "${query}" ===`);
    
    try {
      const result = await claudeSDK.executeCommand(query, {
        sessionId: 'test-session',
        role: 'OVERSEER',
        systemPrompt: AGENT_PROMPTS.OVERSEER.systemPrompt
      });
      
      console.log(`✅ Success: ${result.result ? result.result.substring(0, 200) : '[BLANK RESPONSE]'}...`);
      console.log(`Session ID: ${result.sessionId}`);
      console.log(`Response length: ${result.result ? result.result.length : 0} chars`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testClaudeCodeDirect().catch(console.error);