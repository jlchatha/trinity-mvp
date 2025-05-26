#!/usr/bin/env node

/**
 * Comprehensive Weird Behavior Validation Suite
 * 
 * Tests all the weird behaviors identified and validates that Phase 1 fixes are working correctly.
 * This is the definitive test suite for Trinity MVP weird behavior resolution.
 */

const fs = require('fs');
const path = require('path');
const ComplexQueryProcessor = require('./src/core/complex-query-processor.js');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector.js');

console.log('=== TRINITY MVP: COMPREHENSIVE WEIRD BEHAVIOR VALIDATION ===');
console.log('Testing Phase 1 fixes for critical weird behaviors...\n');

// Initialize components
const complexQueryProcessor = new ComplexQueryProcessor();
const memoryDetector = new MemoryReferenceDetector();

// Test cases for all weird behaviors
const testSuite = {
  complexQueryClassification: {
    name: "Complex Query Classification",
    description: "Verify queries are properly classified as COMPLEX vs SIMPLE",
    tests: [
      {
        name: "Blockchain System Creation",
        query: "Write a blockchain voting system with real-time verification",
        expectedType: "complex",
        expectedMinScore: 2,
        validate: (result) => {
          return result.isComplex === true && result.score >= 2;
        }
      },
      {
        name: "Technical Implementation",
        query: "Create a cryptographic algorithm with security verification",
        expectedType: "complex", 
        expectedMinScore: 2,
        validate: (result) => {
          return result.isComplex === true && result.score >= 2;
        }
      },
      {
        name: "Multi-step Calculation",
        query: "Calculate the first 50 Fibonacci numbers and explain the pattern",
        expectedType: "complex",
        expectedMinScore: 2,
        validate: (result) => {
          return result.isComplex === true && result.score >= 2;
        }
      },
      {
        name: "Simple Greeting",
        query: "Hi there",
        expectedType: "simple",
        expectedMaxScore: 1,
        validate: (result) => {
          return result.isComplex === false && (result.score || 0) < 2;
        }
      },
      {
        name: "Simple Question",
        query: "What is the capital of France?",
        expectedType: "simple", 
        expectedMaxScore: 1,
        validate: (result) => {
          return result.isComplex === false && (result.score || 0) < 2;
        }
      }
    ]
  },

  memoryReferenceDetection: {
    name: "Memory Reference Detection",
    description: "Verify memory references are properly detected",
    tests: [
      {
        name: "Explicit Memory Question",
        query: "What did I tell you earlier?",
        expectedDetection: true,
        expectedMinScore: 1,
        validate: (detected) => detected === true
      },
      {
        name: "Remember Request",
        query: "Remember when we discussed that project?",
        expectedDetection: true,
        expectedMinScore: 1,
        validate: (detected) => detected === true
      },
      {
        name: "Vague Reference",
        query: "That thing we talked about earlier",
        expectedDetection: true,
        expectedMinScore: 1,
        validate: (detected) => detected === true
      },
      {
        name: "Personal Preference Reference",
        query: "What is my favorite color?",
        expectedDetection: true,
        expectedMinScore: 1,
        validate: (detected) => detected === true
      },
      {
        name: "Context Continuation",
        query: "Based on what I said before",
        expectedDetection: true,
        expectedMinScore: 1,
        validate: (detected) => detected === true
      },
      {
        name: "Non-Memory Query",
        query: "What is the weather today?",
        expectedDetection: false,
        expectedMaxScore: 0,
        validate: (detected) => detected === false
      },
      {
        name: "Simple Greeting",
        query: "Hello there",
        expectedDetection: false,
        expectedMaxScore: 0,
        validate: (detected) => detected === false
      }
    ]
  },

  conversationFlowIntegrity: {
    name: "Conversation Flow Integrity",
    description: "Verify Trinity still provides proper responses",
    tests: [
      {
        name: "Basic Question Response",
        setupRequest: () => {
          const requestId = `validation-basic-${Date.now()}`;
          const requestData = {
            id: requestId,
            prompt: "What is the capital of France?",
            timestamp: Date.now(),
            sessionId: 'validation-test'
          };
          
          const requestDir = path.join(process.env.HOME, '.trinity-mvp', 'requests');
          if (!fs.existsSync(requestDir)) {
            fs.mkdirSync(requestDir, { recursive: true });
          }
          
          const requestFile = path.join(requestDir, `${requestId}.json`);
          fs.writeFileSync(requestFile, JSON.stringify(requestData, null, 2));
          
          return { requestId, requestFile };
        },
        validate: async (requestId) => {
          // Wait for response with timeout
          const responseDir = path.join(process.env.HOME, '.trinity-mvp', 'responses');
          const responseFile = path.join(responseDir, `${requestId}.json`);
          
          const startTime = Date.now();
          const timeout = 45000; // 45 seconds
          
          while (Date.now() - startTime < timeout) {
            if (fs.existsSync(responseFile)) {
              try {
                const response = JSON.parse(fs.readFileSync(responseFile, 'utf8'));
                return {
                  success: response.success === true,
                  hasContent: response.content && response.content.length > 0,
                  isNotFallback: !response.content?.includes("I'm here to help"),
                  responseTime: response.executionTime || 0,
                  content: response.content
                };
              } catch (e) {
                return { success: false, error: 'Response parsing failed' };
              }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          return { success: false, error: 'Response timeout' };
        }
      }
    ]
  }
};

// Utility functions
function formatResult(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const detailsStr = details ? ` (${details})` : '';
  return `  ${status}: ${testName}${detailsStr}`;
}

// Run test suite
async function runValidationSuite() {
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    categories: {}
  };

  // Test 1: Complex Query Classification
  console.log('🧠 Testing Complex Query Classification...');
  const complexityResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const test of testSuite.complexQueryClassification.tests) {
    results.totalTests++;
    
    try {
      const result = complexQueryProcessor.classifyQuery(test.query);
      const passed = test.validate(result);
      
      if (passed) {
        results.passedTests++;
        complexityResults.passed++;
        complexityResults.details.push(formatResult(test.name, true, `${result.type}, score: ${result.score || 'N/A'}`));
      } else {
        results.failedTests++;
        complexityResults.failed++;
        complexityResults.details.push(formatResult(test.name, false, `Got: ${result.type}, score: ${result.score || 'N/A'}`));
      }
    } catch (error) {
      results.failedTests++;
      complexityResults.failed++;
      complexityResults.details.push(formatResult(test.name, false, `Error: ${error.message}`));
    }
  }

  results.categories.complexQueryClassification = complexityResults;
  console.log(`  Results: ${complexityResults.passed}/${complexityResults.passed + complexityResults.failed} passed`);
  complexityResults.details.forEach(detail => console.log(detail));
  console.log('');

  // Test 2: Memory Reference Detection
  console.log('🧠 Testing Memory Reference Detection...');
  const memoryResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const test of testSuite.memoryReferenceDetection.tests) {
    results.totalTests++;
    
    try {
      const detected = memoryDetector.detectsMemoryReference(test.query);
      const passed = test.validate(detected);
      
      if (passed) {
        results.passedTests++;
        memoryResults.passed++;
        memoryResults.details.push(formatResult(test.name, true, `detected: ${detected}`));
      } else {
        results.failedTests++;
        memoryResults.failed++;
        memoryResults.details.push(formatResult(test.name, false, `Expected: ${test.expectedDetection}, Got: ${detected}`));
      }
    } catch (error) {
      results.failedTests++;
      memoryResults.failed++;
      memoryResults.details.push(formatResult(test.name, false, `Error: ${error.message}`));
    }
  }

  results.categories.memoryReferenceDetection = memoryResults;
  console.log(`  Results: ${memoryResults.passed}/${memoryResults.passed + memoryResults.failed} passed`);
  memoryResults.details.forEach(detail => console.log(detail));
  console.log('');

  // Test 3: Conversation Flow Integrity (requires actual Trinity execution)
  console.log('🔄 Testing Conversation Flow Integrity...');
  const flowResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const test of testSuite.conversationFlowIntegrity.tests) {
    results.totalTests++;
    
    try {
      console.log(`  🚀 Running: ${test.name}...`);
      const setup = test.setupRequest();
      
      // Wait for response
      const validationResult = await test.validate(setup.requestId);
      
      if (validationResult.success && validationResult.hasContent && validationResult.isNotFallback) {
        results.passedTests++;
        flowResults.passed++;
        flowResults.details.push(formatResult(test.name, true, `${validationResult.responseTime}ms, content: "${validationResult.content?.substring(0, 30)}..."`));
      } else {
        results.failedTests++;
        flowResults.failed++;
        const errorDetails = validationResult.error || `success: ${validationResult.success}, hasContent: ${validationResult.hasContent}, isNotFallback: ${validationResult.isNotFallback}`;
        flowResults.details.push(formatResult(test.name, false, errorDetails));
      }
    } catch (error) {
      results.failedTests++;
      flowResults.failed++;
      flowResults.details.push(formatResult(test.name, false, `Error: ${error.message}`));
    }
  }

  results.categories.conversationFlowIntegrity = flowResults;
  console.log(`  Results: ${flowResults.passed}/${flowResults.passed + flowResults.failed} passed`);
  flowResults.details.forEach(detail => console.log(detail));
  console.log('');

  // Final Results
  console.log('=== FINAL VALIDATION RESULTS ===');
  console.log(`📊 Overall: ${results.passedTests}/${results.totalTests} tests passed (${Math.round(results.passedTests/results.totalTests*100)}%)`);
  console.log('');
  
  Object.entries(results.categories).forEach(([category, categoryResults]) => {
    const total = categoryResults.passed + categoryResults.failed;
    const percentage = Math.round(categoryResults.passed/total*100);
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${category}: ${categoryResults.passed}/${total} (${percentage}%)`);
  });

  console.log('');
  
  if (results.passedTests === results.totalTests) {
    console.log('🎉 ALL WEIRD BEHAVIORS SUCCESSFULLY FIXED!');
    console.log('✅ Trinity MVP Phase 1 implementation VALIDATED');
  } else if (results.passedTests / results.totalTests >= 0.9) {
    console.log('✅ PHASE 1 SUBSTANTIALLY COMPLETE');
    console.log('⚠️ Minor issues detected - see details above');
  } else {
    console.log('❌ SIGNIFICANT ISSUES DETECTED');
    console.log('🔧 Additional fixes required before Phase 2');
  }

  console.log('');
  console.log('📋 Next Steps:');
  if (results.passedTests === results.totalTests) {
    console.log('   - Proceed to Phase 2: Security filtering and tool setup reliability');
    console.log('   - Implement ResponseSecurityFilter for system introspection protection');
    console.log('   - Enhance tool setup retry logic in claude-watcher.js');
  } else {
    console.log('   - Review failed tests above');
    console.log('   - Fix remaining issues before proceeding to Phase 2');
    console.log('   - Re-run validation suite to confirm fixes');
  }

  return results;
}

// Main execution
if (require.main === module) {
  runValidationSuite().catch(error => {
    console.error('❌ Validation suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runValidationSuite, testSuite };