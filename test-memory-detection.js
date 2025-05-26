const MemoryReferenceDetector = require('./src/core/memory-reference-detector.js');
const detector = new MemoryReferenceDetector();

const testQueries = [
  'What did I tell you earlier?',
  'Remember when we discussed that?',
  'Based on what I said before',
  'Hi there',
  'My favorite color is blue',
  'What is my favorite color?',
  'That thing we talked about',
  'Like you said',
  'What we discussed earlier',
  'About that project'
];

console.log('=== MEMORY DETECTION TEST BEFORE FIX ===');
testQueries.forEach(q => {
  const hasRef = detector.detectsMemoryReference(q);
  console.log(`Query: '${q}' -> Memory Reference: ${hasRef}`);
});