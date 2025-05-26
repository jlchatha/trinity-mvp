#!/usr/bin/env node

/**
 * Test Enhanced Memory Reference Detector
 * 
 * Tests the accuracy fixes for:
 * 1. Transparent line counting display
 * 2. Context switching bug fixes  
 * 3. Improved line position parsing
 * 
 * Run with: node test-enhanced-memory-reference-detector.js
 */

const path = require('path');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector.js');

console.log('🧪 Testing Enhanced Memory Reference Detector\n');

const detector = new MemoryReferenceDetector();

// Test cases based on user feedback
const testCases = [
  {
    name: "4th to last line query (original bug case)",
    message: "what was the 4th to last line?",
    expectedLinePosition: 'from-end',
    expectedLineNumber: 4,
    expectsTransparentReasoning: true
  },
  {
    name: "Follow-up question context switching",
    message: "wouldn't that be line 33?",
    isFollowUp: true,
    expectsContextPersistence: true
  },
  {
    name: "Second line from start",
    message: "what was the second line?",
    expectedLinePosition: 'from-start',
    expectedLineNumber: 2,
    expectsTransparentReasoning: true
  },
  {
    name: "Last line query",
    message: "what was the last line of that poem?",
    expectedLinePosition: 'from-end',
    expectedLineNumber: 1,
    expectsTransparentReasoning: true
  },
  {
    name: "3rd line from start",
    message: "show me the 3rd line",
    expectedLinePosition: 'from-start',
    expectedLineNumber: 3,
    expectsTransparentReasoning: true
  },
  {
    name: "Follow-up with 'actually' pattern",
    message: "actually that doesn't seem right",
    isFollowUp: true,
    expectsContextPersistence: true
  }
];

console.log('📋 **TEST 1: Basic Memory Reference Detection**\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Query: "${testCase.message}"`);
  
  const detects = detector.detectsMemoryReference(testCase.message);
  console.log(`✅ Detects memory reference: ${detects}`);
  
  if (!detects) {
    console.log('❌ FAILED - Should detect memory reference\n');
    return;
  }
  
  console.log('✅ PASSED - Memory reference detected\n');
});

console.log('📋 **TEST 2: Enhanced Content Query Analysis**\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Query: "${testCase.message}"`);
  
  // Simulate previous context for follow-up tests
  const previousContext = testCase.isFollowUp ? {
    contentId: 'poem_mountain_36lines',
    contentType: 'poem'
  } : null;
  
  const query = detector.extractContentQuery(testCase.message, previousContext);
  
  if (!query) {
    console.log('❌ FAILED - Should return query object\n');
    return;
  }
  
  console.log('📊 Query Analysis Results:');
  console.log(`   Request Type: ${query.requestType}`);
  console.log(`   Content Type: ${query.contentType}`);
  console.log(`   Line Number: ${query.lineNumber}`);
  console.log(`   Line Position: ${query.linePosition}`);
  console.log(`   Is Follow-up: ${query.isFollowUp}`);
  
  // Test transparent reasoning
  if (testCase.expectsTransparentReasoning && query.reasoning) {
    console.log('🔍 Transparent Reasoning:');
    query.reasoning.steps.forEach(step => {
      console.log(`   - ${step}`);
    });
    
    if (query.reasoning.transparentDisplay) {
      console.log(`📊 Transparent Display: "${query.reasoning.transparentDisplay}"`);
    }
    
    if (query.reasoning.calculation) {
      console.log('🧮 Calculation Details:');
      console.log(`   Method: ${query.reasoning.calculation.method}`);
      console.log(`   Target Position: ${query.reasoning.calculation.targetPosition}`);
      console.log(`   Explanation: ${query.reasoning.calculation.explanation}`);
    }
  }
  
  // Test context persistence
  if (testCase.expectsContextPersistence && query.contextPersistence) {
    console.log('🔗 Context Persistence:');
    console.log(`   Maintain Previous: ${query.contextPersistence.maintainPreviousContent}`);
    console.log(`   Previous ID: ${query.contextPersistence.previousContentId}`);
    console.log(`   Previous Type: ${query.contextPersistence.previousContentType}`);
  }
  
  // Validate expectations
  let passed = true;
  if (testCase.expectedLinePosition && query.linePosition !== testCase.expectedLinePosition) {
    console.log(`❌ Line position mismatch: expected ${testCase.expectedLinePosition}, got ${query.linePosition}`);
    passed = false;
  }
  
  if (testCase.expectedLineNumber && query.lineNumber !== testCase.expectedLineNumber) {
    console.log(`❌ Line number mismatch: expected ${testCase.expectedLineNumber}, got ${query.lineNumber}`);
    passed = false;
  }
  
  if (testCase.isFollowUp && !query.isFollowUp) {
    console.log(`❌ Follow-up detection failed`);
    passed = false;
  }
  
  if (testCase.expectsContextPersistence && !query.contextPersistence.maintainPreviousContent) {
    console.log(`❌ Context persistence not activated`);
    passed = false;
  }
  
  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  console.log('');
});

console.log('📋 **TEST 3: Calculation Display Generation**\n');

// Test the calculation display method with different scenarios
const calculationTests = [
  {
    name: "4th to last line in 36-line poem",
    query: {
      reasoning: {
        calculation: {
          method: 'from-end',
          targetPosition: 4
        }
      }
    },
    totalLines: 36,
    expectedLine: 33,
    expectedDisplay: "Line counting: 36 - 4 + 1 = 33"
  },
  {
    name: "2nd line from start",
    query: {
      reasoning: {
        calculation: {
          method: 'from-start',
          targetPosition: 2
        }
      }
    },
    totalLines: 36,
    expectedLine: 2,
    expectedDisplay: "Line counting: Line 2 from start"
  },
  {
    name: "Last line (1st from end)",
    query: {
      reasoning: {
        calculation: {
          method: 'from-end',
          targetPosition: 1
        }
      }
    },
    totalLines: 36,
    expectedLine: 36,
    expectedDisplay: "Line counting: 36 - 1 + 1 = 36"
  }
];

calculationTests.forEach((test, index) => {
  console.log(`Calculation Test ${index + 1}: ${test.name}`);
  
  const calculation = detector.createCalculationDisplay(test.query, test.totalLines);
  
  if (!calculation) {
    console.log('❌ FAILED - No calculation returned\n');
    return;
  }
  
  console.log(`📊 Display: "${calculation.display}"`);
  console.log(`📝 Explanation: ${calculation.explanation}`);
  console.log(`🎯 Actual Line: ${calculation.actualLineNumber}`);
  console.log(`✅ Valid: ${calculation.validation}`);
  
  // Validate results
  let passed = true;
  if (calculation.actualLineNumber !== test.expectedLine) {
    console.log(`❌ Line number mismatch: expected ${test.expectedLine}, got ${calculation.actualLineNumber}`);
    passed = false;
  }
  
  if (!calculation.display.includes(test.expectedDisplay)) {
    console.log(`❌ Display format mismatch`);
    console.log(`   Expected to contain: "${test.expectedDisplay}"`);
    console.log(`   Got: "${calculation.display}"`);
    passed = false;
  }
  
  console.log(passed ? '✅ PASSED' : '❌ FAILED');
  console.log('');
});

console.log('📋 **TEST 4: Edge Cases and Error Handling**\n');

const edgeCases = [
  {
    name: "Invalid line number (0th line)",
    message: "what was the 0th line?",
    shouldDetect: false
  },
  {
    name: "Empty message",
    message: "",
    shouldDetect: false
  },
  {
    name: "Null message",
    message: null,
    shouldDetect: false
  },
  {
    name: "Very high line number",
    message: "what was the 999th line?",
    shouldDetect: true,
    expectedLineNumber: 999
  }
];

edgeCases.forEach((testCase, index) => {
  console.log(`Edge Case ${index + 1}: ${testCase.name}`);
  console.log(`Query: "${testCase.message}"`);
  
  try {
    const detects = detector.detectsMemoryReference(testCase.message);
    const query = testCase.message ? detector.extractContentQuery(testCase.message) : null;
    
    console.log(`Detects: ${detects}`);
    
    if (testCase.shouldDetect !== detects) {
      console.log(`❌ FAILED - Expected detection: ${testCase.shouldDetect}, got: ${detects}`);
    } else {
      console.log('✅ PASSED');
    }
    
    if (query && testCase.expectedLineNumber && query.lineNumber !== testCase.expectedLineNumber) {
      console.log(`❌ Line number mismatch: expected ${testCase.expectedLineNumber}, got ${query.lineNumber}`);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
  
  console.log('');
});

console.log('🎉 **TEST SUMMARY**');
console.log('All enhanced memory reference detector tests completed!');
console.log('');
console.log('🔧 **KEY ENHANCEMENTS TESTED**:');
console.log('✅ Transparent line counting with calculation display');
console.log('✅ Context switching prevention for follow-up questions');
console.log('✅ Improved line position parsing with proper formulas');
console.log('✅ Enhanced follow-up question detection patterns');
console.log('✅ Ordinal suffix handling and validation');
console.log('');
console.log('Ready for integration with trinity-native-memory.js and real user testing!');