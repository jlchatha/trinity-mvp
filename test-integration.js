#!/usr/bin/env node

/**
 * Trinity MVP Integration Test
 * Tests the complete file communication pipeline from Claude SDK to Watcher
 */

// Load environment variables for secure API key handling
require('dotenv').config();

const path = require('path');
const ClaudeCodeSDK = require('./src/core/claude-integration');

async function testTrinityMVPIntegration() {
  console.log('🧪 Starting Trinity MVP Integration Test');
  console.log('=' .repeat(50));
  
  // Initialize Claude SDK
  console.log('1️⃣  Initializing Claude Code SDK...');
  const sdk = new ClaudeCodeSDK({
    workingDirectory: __dirname,
    debugMode: true,
    timeout: 45000 // Extended timeout for testing
  });
  
  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test simple command
    console.log('2️⃣  Testing simple command execution...');
    const result = await sdk.executeCommand('Hello! Can you confirm you are working correctly? Please respond with "Trinity MVP integration successful" if everything is working.', {
      sessionId: 'integration-test-session',
      timeout: 45000
    });
    
    console.log('✅ Command Result:', {
      success: result.success,
      hasContent: !!result.content,
      contentLength: result.content ? result.content.length : 0,
      sessionId: result.sessionId
    });
    
    if (result.success) {
      console.log('📄 Response Preview:', result.content.substring(0, 200) + '...');
      console.log('🎉 Trinity MVP Integration Test PASSED!');
    } else {
      console.log('❌ Trinity MVP Integration Test FAILED:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up...');
    await sdk.destroy();
  }
  
  console.log('=' .repeat(50));
  console.log('🏁 Integration test completed');
}

// Run test if called directly
if (require.main === module) {
  testTrinityMVPIntegration().catch(console.error);
}

module.exports = { testTrinityMVPIntegration };