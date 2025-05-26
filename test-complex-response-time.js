#!/usr/bin/env node

/**
 * Test response time manager with complex query
 */

const fs = require('fs');
const path = require('path');

console.log('=== COMPLEX RESPONSE TIME TEST ===');

// Create complex query that might take longer
const complexQuery = "Write a comprehensive blockchain voting system with smart contracts, explain the cryptographic verification process, include security measures against double-voting, and provide detailed implementation examples with Solidity code";

console.log(`Testing with complex query: "${complexQuery}"`);

// Create test request
const requestDir = path.join(process.env.HOME, '.trinity-mvp', 'requests');
if (!fs.existsSync(requestDir)) {
  fs.mkdirSync(requestDir, { recursive: true });
}

const requestId = `complex-response-time-${Date.now()}`;
const requestFile = path.join(requestDir, `${requestId}.json`);

const requestData = {
  id: requestId,
  prompt: complexQuery,
  timestamp: Date.now(),
  sessionId: 'complex-response-time-test',
  test: true,
  complexity: 'high'
};

fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));

console.log(`Created complex test request: ${requestFile}`);
console.log('');
console.log('🔍 Monitor for:');
console.log('- ⚠️ Warning after 15 seconds');
console.log('- 🐌 Slow response warnings');
console.log('- ⏰ Timeout after 30 seconds');
console.log('');
console.log('Now run: node quick-conversation-test.js');
console.log('Or monitor logs: tail -f ~/.trinity-mvp/logs/claude-watcher-*.log');