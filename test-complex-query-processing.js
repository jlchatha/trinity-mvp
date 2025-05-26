#!/usr/bin/env node

/**
 * Consolidated Complex Query Processing Test Suite
 * 
 * Tests Trinity MVP's ability to handle complex analytical requests
 * that define professional AI assistant capability.
 * 
 * Pattern: Follow exact success methodology from memory integration breakthrough
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ComplexQueryTestSuite {
  constructor() {
    this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
    this.queueDir = path.join(this.trinityDir, 'queue');
    this.inputDir = path.join(this.queueDir, 'input');
    this.outputDir = path.join(this.queueDir, 'output');
    
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
    
    console.log('🧪 Trinity MVP Complex Query Processing Test Suite');
    console.log('====================================================');
    console.log('Testing professional AI assistant analytical capabilities');
    console.log('');
  }

  /**
   * Test 1: Complex Analytical Request Processing
   * Target failure: "Review codebase and assess delivery vs promises" → Generic response
   * Expected: Detailed analytical response with structured findings
   */
  async testAnalyticalRequests() {
    console.log("=== Test 1: Complex Analytical Requests ===");
    
    const testQueries = [
      {
        name: "Codebase Review Request",
        query: "Review your codebase and assess what we are delivering vs what we are promising in README and elsewhere",
        expectedResponseType: "analytical_detailed",
        shouldNotContain: [
          "I'm here to help you with professional tasks",
          "Could you please be more specific",
          "What would you like assistance with"
        ],
        shouldContain: [
          "codebase",
          "analysis",
          "README",
          "delivery",
          "promise"
        ]
      },
      {
        name: "Project Assessment Request", 
        query: "Analyze the current project structure and identify key components",
        expectedResponseType: "analytical_structured",
        shouldNotContain: [
          "I'm here to help you with professional tasks",
          "Could you please be more specific"
        ],
        shouldContain: [
          "project",
          "structure", 
          "component",
          "analysis"
        ]
      }
    ];

    for (const testQuery of testQueries) {
      await this.runSingleComplexQueryTest(testQuery, "Analytical Request");
    }
  }

  /**
   * Test 2: Multi-step Operation Processing  
   * Target failure: "Analyze, compare, recommend" → Generic fallback
   * Expected: Step-by-step processing with structured results
   */
  async testMultiStepOperations() {
    console.log("=== Test 2: Multi-step Operation Processing ===");
    
    const testQueries = [
      {
        name: "Multi-step Analysis Request",
        query: "Review the codebase, identify gaps, and provide recommendations for improvement",
        expectedResponseType: "multi_step_analytical",
        shouldNotContain: [
          "I'm here to help you with professional tasks",
          "Could you please be more specific"
        ],
        shouldContain: [
          "review",
          "gap",
          "recommendation",
          "improvement"
        ]
      },
      {
        name: "Comparative Analysis Request",
        query: "Compare current capabilities with documented promises and suggest alignment strategies",
        expectedResponseType: "comparative_analysis", 
        shouldNotContain: [
          "professional tasks and workflow optimization"
        ],
        shouldContain: [
          "capabilit",
          "promise",
          "compare",
          "alignment"
        ]
      }
    ];

    for (const testQuery of testQueries) {
      await this.runSingleComplexQueryTest(testQuery, "Multi-step Operation");
    }
  }

  /**
   * Test 3: Professional Task Classification
   * Target failure: Complex requests misclassified as unclear requests
   * Expected: Proper classification and routing to analytical processing
   */
  async testProfessionalTaskClassification() {
    console.log("=== Test 3: Professional Task Classification ===");
    
    const testQueries = [
      {
        name: "Strategic Assessment Request",
        query: "Assess Trinity's competitive positioning relative to other AI assistants",
        expectedResponseType: "strategic_analysis",
        shouldNotContain: [
          "Could you please be more specific"
        ],
        shouldContain: [
          "Trinity",
          "competitive",
          "positioning",
          "assess"
        ]
      },
      {
        name: "Technical Evaluation Request", 
        query: "Evaluate the technical architecture and identify optimization opportunities",
        expectedResponseType: "technical_evaluation",
        shouldNotContain: [
          "I'm here to help you with professional tasks"
        ],
        shouldContain: [
          "technical",
          "architecture", 
          "optimization"
        ]
      }
    ];

    for (const testQuery of testQueries) {
      await this.runSingleComplexQueryTest(testQuery, "Professional Classification");
    }
  }

  /**
   * Test 4: Simple Query Preservation (Control Test)
   * Target success: Simple queries continue working perfectly
   * Expected: Detailed responses as before (no regression)
   */
  async testSimpleQueryPreservation() {
    console.log("=== Test 4: Simple Query Preservation (Control) ===");
    
    const testQueries = [
      {
        name: "Directory Listing Request",
        query: "What files are in the current directory?",
        expectedResponseType: "simple_factual",
        shouldNotContain: [
          "I'm here to help you with professional tasks"
        ],
        shouldContain: [
          "file",
          "directory"
        ]
      },
      {
        name: "Basic Factual Request",
        query: "What is your name?",
        expectedResponseType: "simple_identity",
        shouldNotContain: [
          "Could you please be more specific"
        ],
        shouldContain: [
          "Trinity"
        ]
      }
    ];

    for (const testQuery of testQueries) {
      await this.runSingleComplexQueryTest(testQuery, "Simple Query Control");
    }
  }

  /**
   * Test 5: End-to-End Complex Query Flow
   * Target: Complete complex query processing pipeline validation
   * Expected: Professional analytical capabilities demonstrated
   */
  async testEndToEndComplexFlow() {
    console.log("=== Test 5: End-to-End Complex Query Flow ===");
    
    const testQuery = {
      name: "Complete Professional Analysis Workflow",
      query: "Perform a comprehensive analysis of Trinity MVP: review the codebase structure, assess current capabilities vs promised features, identify implementation gaps, and provide strategic recommendations for professional positioning",
      expectedResponseType: "comprehensive_professional_analysis",
      shouldNotContain: [
        "I'm here to help you with professional tasks",
        "Could you please be more specific",
        "What would you like assistance with"
      ],
      shouldContain: [
        "Trinity MVP",
        "analysis",
        "codebase",
        "capabilit",
        "gap",
        "recommendation",
        "positioning"
      ]
    };

    await this.runSingleComplexQueryTest(testQuery, "End-to-End Professional Analysis");
  }

  /**
   * Run a single complex query test
   */
  async runSingleComplexQueryTest(testQuery, category) {
    console.log(`\nTesting: ${testQuery.name}`);
    console.log(`Query: "${testQuery.query}"`);
    console.log(`Category: ${category}`);
    
    this.testResults.total++;
    
    try {
      // Send query through Trinity system
      const response = await this.sendQueryToTrinity(testQuery.query);
      
      // Analyze response
      const analysisResult = this.analyzeResponse(response, testQuery);
      
      if (analysisResult.passed) {
        console.log(`✅ PASSED: ${analysisResult.reason}`);
        this.testResults.passed++;
      } else {
        console.log(`❌ FAILED: ${analysisResult.reason}`);
        this.testResults.failed++;
      }
      
      this.testResults.details.push({
        name: testQuery.name,
        category: category,
        query: testQuery.query,
        response: response,
        passed: analysisResult.passed,
        reason: analysisResult.reason
      });
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      this.testResults.failed++;
      
      this.testResults.details.push({
        name: testQuery.name,
        category: category,
        query: testQuery.query,
        response: null,
        passed: false,
        reason: `Test execution error: ${error.message}`
      });
    }
  }

  /**
   * Send query to Trinity system using file queue approach
   */
  async sendQueryToTrinity(query) {
    // Ensure directories exist
    this.ensureDirectories();
    
    // Create request file
    const requestId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestData = {
      sessionId: `complex_query_test_${Date.now()}`,
      prompt: query,
      options: {
        workingDirectory: process.cwd(),
        userContext: {
          testMode: true,
          testCategory: 'complex_query_processing'
        }
      }
    };
    
    const requestPath = path.join(this.inputDir, `${requestId}.json`);
    fs.writeFileSync(requestPath, JSON.stringify(requestData, null, 2));
    
    console.log(`   📤 Request sent: ${requestId}`);
    
    // Wait for response (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const outputPath = path.join(this.outputDir, `${requestId}.json`);
      
      if (fs.existsSync(outputPath)) {
        const responseData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        
        // Clean up files
        try {
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.warn(`   ⚠️ Could not clean up output file: ${err.message}`);
        }
        
        console.log(`   📥 Response received: ${responseData.response ? 'Success' : 'Error/Empty'}`);
        return responseData.response || responseData.error || '[No response content]';
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error('Query timeout - no response received within 30 seconds');
  }

  /**
   * Analyze response quality and classification
   */
  analyzeResponse(response, testQuery) {
    const responseText = response.toLowerCase();
    
    // Check for generic fallback responses (failure indicators)
    for (const badPhrase of testQuery.shouldNotContain) {
      if (responseText.includes(badPhrase.toLowerCase())) {
        return {
          passed: false,
          reason: `Response contains generic fallback phrase: "${badPhrase}"`
        };
      }
    }
    
    // Check for expected analytical content
    let containsExpectedContent = 0;
    for (const goodPhrase of testQuery.shouldContain) {
      if (responseText.includes(goodPhrase.toLowerCase())) {
        containsExpectedContent++;
      }
    }
    
    const expectedContentRatio = containsExpectedContent / testQuery.shouldContain.length;
    
    if (expectedContentRatio < 0.5) {
      return {
        passed: false,
        reason: `Response lacks expected analytical content (${containsExpectedContent}/${testQuery.shouldContain.length} expected terms found)`
      };
    }
    
    // Check response length (analytical responses should be substantial)
    if (response.length < 100) {
      return {
        passed: false,
        reason: `Response too short for analytical query (${response.length} chars)`
      };
    }
    
    return {
      passed: true,
      reason: `Response contains analytical content and avoids generic fallbacks (${containsExpectedContent}/${testQuery.shouldContain.length} expected terms found)`
    };
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.trinityDir, this.queueDir, this.inputDir, this.outputDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Run complete test suite
   */
  async runAllTests() {
    console.log('Starting comprehensive complex query processing test suite...\n');
    
    try {
      await this.testAnalyticalRequests();
      await this.testMultiStepOperations();
      await this.testProfessionalTaskClassification();
      await this.testSimpleQueryPreservation();
      await this.testEndToEndComplexFlow();
      
      this.printTestResults();
      this.saveTestResults();
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('\n\n🏁 COMPLEX QUERY PROCESSING TEST RESULTS');
    console.log('==========================================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.reason}`);
        });
    }
    
    if (this.testResults.passed === this.testResults.total) {
      console.log('\n🎉 ALL TESTS PASSED - Complex query processing is working!');
    } else {
      console.log('\n🚨 COMPLEX QUERY PROCESSING ISSUES DETECTED');
      console.log('   Trinity MVP needs complex query processing implementation');
    }
  }

  /**
   * Save test results to file
   */
  saveTestResults() {
    const resultsPath = path.join(process.cwd(), 'test-results-complex-query-processing.json');
    const detailedResults = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      },
      details: this.testResults.details
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(detailedResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const testSuite = new ComplexQueryTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = ComplexQueryTestSuite;