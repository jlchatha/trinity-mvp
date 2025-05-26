#!/usr/bin/env node

/**
 * Security Filter Test Suite
 * Validates that sensitive information is properly filtered from responses
 */

const ResponseSecurityFilter = require('./src/core/response-security-filter.js');

console.log('=== RESPONSE SECURITY FILTER TEST SUITE ===\n');

// Initialize filter
const securityFilter = new ResponseSecurityFilter();

// Test cases with sensitive information
const testCases = [
  {
    name: "File Path Filtering",
    input: "Check the log at /home/alreadyinuse/.trinity-mvp/logs/claude-watcher-2025-05-26.log for details",
    shouldFilter: true,
    expectNoMatch: ['/home/alreadyinuse', '.trinity-mvp']
  },
  {
    name: "Process ID Filtering", 
    input: "The process PID: 12345 is running successfully",
    shouldFilter: true,
    expectNoMatch: ['12345', 'PID: 12345']
  },
  {
    name: "Internal Component Filtering",
    input: "trinity-mvp-public directory contains claude-watcher.js and git/trinity-system files",
    shouldFilter: true,
    expectNoMatch: ['trinity-mvp-public', 'claude-watcher', 'git/trinity-system']
  },
  {
    name: "Development Info Filtering", 
    input: "User alreadyinuse in domain users group accessing package.json and .env files",
    shouldFilter: true,
    expectNoMatch: ['alreadyinuse', 'domain users', 'package.json', '.env']
  },
  {
    name: "Network Details Filtering",
    input: "Server running on localhost:8081 and 127.0.0.1:3000 endpoints",
    shouldFilter: true,
    expectNoMatch: ['localhost:8081', '127.0.0.1:3000']
  },
  {
    name: "Safe Content Preservation",
    input: "Hello! The capital of France is Paris. How can I help you today?",
    shouldFilter: false,
    expectNoMatch: []
  },
  {
    name: "Technical Content Preservation",
    input: "Here's a JavaScript function to calculate Fibonacci numbers: function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }",
    shouldFilter: false,
    expectNoMatch: []
  }
];

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`🧪 Test ${index + 1}: ${testCase.name}`);
  
  // Analyze original content
  const originalAnalysis = securityFilter.analyzeContent(testCase.input);
  
  // Filter the content
  const filteredContent = securityFilter.filterResponse(testCase.input);
  
  // Validate filtering
  const validation = securityFilter.validateFiltering(testCase.input, filteredContent);
  
  // Check expectations
  let testPassed = true;
  let failureReasons = [];
  
  if (testCase.shouldFilter) {
    // Should have filtered sensitive content
    if (!originalAnalysis.hasSensitiveContent) {
      testPassed = false;
      failureReasons.push('Expected to find sensitive content but none detected');
    }
    
    if (!validation.isEffective) {
      testPassed = false;
      failureReasons.push(`Filtering not effective: ${validation.filteredMatches}/${validation.originalMatches} sensitive items remain`);
    }
    
    // Check that specific patterns are no longer present
    testCase.expectNoMatch.forEach(pattern => {
      if (filteredContent.includes(pattern)) {
        testPassed = false;
        failureReasons.push(`Pattern "${pattern}" still present in filtered content`);
      }
    });
    
  } else {
    // Should NOT have filtered anything (safe content)
    if (originalAnalysis.hasSensitiveContent) {
      testPassed = false;
      failureReasons.push(`Unexpectedly found sensitive content: ${originalAnalysis.totalMatches} matches`);
    }
    
    if (filteredContent !== testCase.input) {
      testPassed = false;
      failureReasons.push('Safe content was modified when it should be preserved');
    }
  }
  
  // Report results
  if (testPassed) {
    passedTests++;
    console.log(`  ✅ PASS`);
    if (testCase.shouldFilter) {
      console.log(`     Filtered ${originalAnalysis.totalMatches} sensitive items (${validation.reductionPercentage}% reduction)`);
    } else {
      console.log(`     Preserved safe content unchanged`);
    }
  } else {
    console.log(`  ❌ FAIL`);
    failureReasons.forEach(reason => {
      console.log(`     - ${reason}`);
    });
  }
  
  console.log(`     Original: "${testCase.input.substring(0, 60)}${testCase.input.length > 60 ? '...' : ''}"`);
  console.log(`     Filtered: "${filteredContent.substring(0, 60)}${filteredContent.length > 60 ? '...' : ''}"`);
  console.log('');
});

// Summary
console.log('=== SECURITY FILTER TEST RESULTS ===');
console.log(`📊 Overall: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('🎉 ALL SECURITY FILTER TESTS PASSED!');
  console.log('✅ ResponseSecurityFilter is working correctly');
} else {
  console.log('❌ SECURITY FILTER ISSUES DETECTED');
  console.log('🔧 Review failed tests and fix filter patterns');
}

console.log('\n📋 Filter Statistics:');
const stats = securityFilter.getFilterStats();
console.log(`   - Total Patterns: ${stats.totalPatterns}`);
console.log(`   - Categories: ${stats.categories.join(', ')}`);
console.log(`   - Strict Mode: ${stats.strictMode}`);

// Export results for potential integration testing
module.exports = { passedTests, totalTests, testCases };