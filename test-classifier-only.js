const ComplexQueryProcessor = require('./src/core/complex-query-processor.js');
const processor = new ComplexQueryProcessor();

const testQueries = [
  'Hi',
  'Write a blockchain voting system',
  'What did I tell you earlier about my project?',
  'Calculate the first 50 Fibonacci numbers',
  'How are you?'
];

console.log('=== CLASSIFIER TEST BEFORE FIX ===');
testQueries.forEach(q => {
  const result = processor.classifyQuery(q);
  console.log(`Query: '${q}' -> ${result.type} (score: ${result.score || 'N/A'})`);
});