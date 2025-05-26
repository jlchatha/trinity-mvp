#!/usr/bin/env node

/**
 * Direct timeout test by starting Claude Watcher with a complex query
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== DIRECT TIMEOUT TEST ===');
console.log('Testing timeout behavior by starting Claude Watcher with complex query...\n');

// Create a complex query
const complexQuery = "Explain quantum computing in great detail including mathematical foundations, quantum gates, algorithms like Shor's and Grover's, implementation examples, error correction, hardware implementations, and future prospects with comprehensive coverage of each topic.";

// Create request
const baseDir = path.join(process.env.HOME, '.trinity-mvp');
const requestsDir = path.join(baseDir, 'requests');

if (!fs.existsSync(requestsDir)) {
  fs.mkdirSync(requestsDir, { recursive: true });
}

const requestId = `direct-timeout-test-${Date.now()}`;
const requestData = {
  id: requestId,
  prompt: complexQuery,
  timestamp: Date.now(),
  sessionId: 'direct-timeout-test'
};

const requestFile = path.join(requestsDir, `${requestId}.json`);
fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));

console.log(`✅ Created request: ${requestId}`);
console.log(`📝 Query: "${complexQuery.substring(0, 100)}..."`);
console.log('');

// Start Claude Watcher process
console.log('🚀 Starting Claude Watcher...');
const claudeWatcher = spawn('node', ['claude-watcher.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

let watcherOutput = '';

claudeWatcher.stdout.on('data', (data) => {
  const output = data.toString();
  watcherOutput += output;
  
  // Look for timeout warning messages
  if (output.includes('⚠️')) {
    console.log('🔍 FOUND WARNING:', output.trim());
  }
  if (output.includes('🐌')) {
    console.log('🔍 FOUND SLOW RESPONSE:', output.trim());
  }
  if (output.includes('⏰')) {
    console.log('🔍 FOUND TIMEOUT:', output.trim());
  }
  if (output.includes('timeout')) {
    console.log('🔍 TIMEOUT MESSAGE:', output.trim());
  }
});

claudeWatcher.stderr.on('data', (data) => {
  console.log('🔍 STDERR:', data.toString().trim());
});

const startTime = Date.now();

// Monitor progress
const monitor = setInterval(() => {
  const elapsed = Date.now() - startTime;
  const responseFile = path.join(path.join(baseDir, 'responses'), `${requestId}.json`);
  
  if (fs.existsSync(responseFile)) {
    console.log(`✅ Response received after ${elapsed}ms`);
    claudeWatcher.kill();
    clearInterval(monitor);
    process.exit(0);
  }
  
  if (elapsed > 35000) {
    console.log(`⏰ Test timeout after ${elapsed}ms`);
    claudeWatcher.kill();
    clearInterval(monitor);
    process.exit(0);
  }
  
  process.stdout.write(`⏳ ${elapsed}ms elapsed...\r`);
}, 2000);

// Cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  claudeWatcher.kill();
  clearInterval(monitor);
  process.exit(0);
});