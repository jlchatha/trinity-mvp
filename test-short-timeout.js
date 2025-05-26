#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test with very short timeouts to verify the mechanism works
const requestDir = path.join(process.env.HOME, '.trinity-mvp', 'requests');
if (!fs.existsSync(requestDir)) {
  fs.mkdirSync(requestDir, { recursive: true });
}

const requestId = `short-timeout-test-${Date.now()}`;
const requestData = {
  id: requestId,
  prompt: 'What is the capital of France?',
  timestamp: Date.now(),
  sessionId: 'short-timeout-test',
  options: {
    // Force very short timeouts for testing
    maxResponseTime: 3000,  // 3 seconds timeout
    warningThreshold: 1500  // 1.5 seconds warning
  }
};

const requestFile = path.join(requestDir, `${requestId}.json`);
fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));

console.log('✅ Created short timeout test request');
console.log(`📁 File: ${requestFile}`);
console.log('⚠️ Warning should trigger at 1.5 seconds');
console.log('⏰ Timeout should trigger at 3 seconds');
console.log('');
console.log('🔍 Check logs: tail -f ~/.trinity-mvp/logs/claude-watcher-*.log');
console.log('🚀 Run: node quick-conversation-test.js');