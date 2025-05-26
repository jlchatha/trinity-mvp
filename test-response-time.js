const fs = require('fs');
const path = require('path');

console.log('=== RESPONSE TIME TEST ===');
console.log('Testing response time monitoring...');

// Create a test request that might take longer
const testQuery = "Tell me everything about quantum physics in extreme detail with comprehensive examples and mathematical explanations";

const startTime = Date.now();
console.log(`Start time: ${new Date(startTime).toISOString()}`);
console.log(`Query: "${testQuery}"`);

// We'll monitor this during actual conversation tests
console.log('Note: This will be monitored during actual conversation flow tests');

// Create request file for testing
const requestDir = path.join(process.env.HOME, '.trinity-mvp', 'requests');
if (!fs.existsSync(requestDir)) {
  fs.mkdirSync(requestDir, { recursive: true });
}

const requestId = `test-response-time-${Date.now()}`;
const requestFile = path.join(requestDir, `${requestId}.json`);

const requestData = {
  id: requestId,
  prompt: testQuery,
  timestamp: Date.now(),
  sessionId: 'response-time-test',
  test: true
};

fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));
console.log(`Created test request: ${requestFile}`);
console.log('Use this for monitoring response times in actual tests');