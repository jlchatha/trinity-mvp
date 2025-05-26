#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== TIMEOUT BEHAVIOR TEST ===');
console.log('Testing response time warnings and timeout handling...\n');

// Create a request that's likely to trigger timeout warnings
const complexPrompt = `Explain quantum computing in extreme detail with the following requirements:
1. Full mathematical foundation including linear algebra
2. Complete explanation of quantum gates and circuits
3. Detailed coverage of quantum algorithms (Shor's, Grover's, etc.)
4. Implementation examples in multiple quantum frameworks
5. Discussion of quantum error correction
6. Current hardware implementations
7. Future prospects and challenges
8. Comparison with classical computing
9. Real-world applications and case studies
10. Step-by-step tutorial for beginners

Please provide comprehensive coverage of each topic with examples, diagrams, and detailed explanations.`;

// Create the request file manually to test Trinity's response
const baseDir = path.join(process.env.HOME, '.trinity-mvp');
const requestsDir = path.join(baseDir, 'requests');
const responsesDir = path.join(baseDir, 'responses');

[requestsDir, responsesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const timestamp = Date.now();
const requestId = `timeout-test-${timestamp}`;

const requestData = {
  id: requestId,
  prompt: complexPrompt,
  timestamp: timestamp,
  sessionId: `test-session-${timestamp}`,
  options: {
    maxTokens: 4096,
    temperature: 0.7
  }
};

const requestFile = path.join(requestsDir, `${requestId}.json`);
fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));

console.log(`✅ Created test request: ${requestId}`);
console.log(`📁 Request file: ${requestFile}`);
console.log(`📝 Prompt length: ${complexPrompt.length} characters`);
console.log('');

console.log('🔍 Expected behavior:');
console.log('- Response should start processing');
console.log('- Warning at 15 seconds: "⚠️ Response taking longer than expected"');
console.log('- Slow response warning if > 15 seconds: "🐌 Slow response: XXXXms"');
console.log('- Timeout at 30 seconds: "Response timeout after 30000ms"');
console.log('');

console.log('🚀 Starting monitoring...');
console.log('Watch Trinity process this request with timing controls');

// Monitor for response
const responseFile = path.join(responsesDir, `${requestId}.json`);
const startTime = Date.now();
let warningShown = false;
let slowWarningShown = false;

const monitor = setInterval(() => {
  const elapsed = Date.now() - startTime;
  
  if (elapsed > 15000 && !warningShown) {
    console.log(`⚠️ ${elapsed}ms elapsed - should see warning message`);
    warningShown = true;
  }
  
  if (elapsed > 20000 && !slowWarningShown) {
    console.log(`🐌 ${elapsed}ms elapsed - should see slow response warning`);
    slowWarningShown = true;
  }
  
  if (elapsed > 30000) {
    console.log(`⏰ ${elapsed}ms elapsed - should have timed out`);
    clearInterval(monitor);
    return;
  }
  
  if (fs.existsSync(responseFile)) {
    console.log(`✅ Response received after ${elapsed}ms`);
    try {
      const response = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
      console.log(`📊 Response length: ${response.content ? response.content.length : 'N/A'} characters`);
    } catch (e) {
      console.log('📊 Response file exists but parsing failed');
    }
    clearInterval(monitor);
    return;
  }
  
  process.stdout.write(`⏳ ${elapsed}ms elapsed...\r`);
}, 1000);

// Safety timeout
setTimeout(() => {
  clearInterval(monitor);
  console.log('\n🔴 Test completed (60 second safety limit)');
}, 60000);