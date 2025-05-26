#!/usr/bin/env node

/**
 * Consolidated Memory Integration Test Suite
 * Tests all aspects of the existing memory system to identify why it's not working as expected
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Import existing components
const TrinityNativeMemory = require('./src/core/trinity-native-memory');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector');

class ConsolidatedMemoryTestSuite {
  constructor() {
    this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message) {
    console.log(`[TEST] ${message}`);
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    this.log(`\n=== TEST ${this.results.total}: ${testName} ===`);
    
    try {
      const result = await testFunction();
      if (result.success) {
        this.results.passed++;
        this.log(`✅ PASSED: ${result.message}`);
      } else {
        this.results.failed++;
        this.log(`❌ FAILED: ${result.message}`);
      }
      
      this.results.tests.push({
        name: testName,
        passed: result.success,
        message: result.message,
        details: result.details
      });
      
    } catch (error) {
      this.results.failed++;
      this.log(`❌ ERROR: ${error.message}`);
      this.results.tests.push({
        name: testName,
        passed: false,
        message: error.message,
        details: error.stack
      });
    }
  }

  // Test 1: Basic Conversation Storage Verification
  async testConversationStorage() {
    const conversationsDir = path.join(this.trinityDir, 'memory', 'conversations');
    
    if (!fs.existsSync(conversationsDir)) {
      return {
        success: false,
        message: "Conversations directory doesn't exist",
        details: `Expected: ${conversationsDir}`
      };
    }
    
    const files = fs.readdirSync(conversationsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      return {
        success: false,
        message: "No conversation files found",
        details: `Directory: ${conversationsDir}`
      };
    }
    
    // Check a recent conversation file
    const recentFile = jsonFiles[jsonFiles.length - 1];
    const filePath = path.join(conversationsDir, recentFile);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const hasRequiredFields = content.userMessage && content.assistantResponse && content.timestamp;
    
    return {
      success: hasRequiredFields,
      message: hasRequiredFields ? 
        `Found ${jsonFiles.length} conversation files with valid structure` :
        `Conversation files missing required fields`,
      details: {
        totalFiles: jsonFiles.length,
        sampleFile: recentFile,
        sampleContent: Object.keys(content)
      }
    };
  }

  // Test 2: Memory Context Loading
  async testMemoryLoading() {
    const memory = new TrinityNativeMemory();
    await memory.initialize();
    
    // Test with a line query that should trigger memory loading
    const testQuery = "what was the 3rd line in poem for dad?";
    const contextResult = await memory.buildContextForClaude(testQuery);
    
    const hasContext = contextResult.contextText && contextResult.contextText.length > 0;
    const hasConversations = contextResult.relevantConversations > 0;
    
    return {
      success: hasContext && hasConversations,
      message: hasContext ? 
        `Memory context loaded successfully: ${contextResult.relevantConversations} conversations` :
        `Memory context loading failed`,
      details: {
        contextLength: contextResult.contextText?.length || 0,
        conversations: contextResult.relevantConversations,
        summary: contextResult.summary
      }
    };
  }

  // Test 3: Line Counting Accuracy
  async testLineCountingAccuracy() {
    const memory = new TrinityNativeMemory();
    await memory.initialize();
    
    // Test specific line query
    const lineQuery = "what was the 3rd line in poem for dad?";
    const contextResult = await memory.buildContextForClaude(lineQuery);
    
    // Check if the context contains the dad poem
    const hasDadPoem = contextResult.contextText.includes('Strong hands that fixed what broke');
    const hasCorrectThirdLine = contextResult.contextText.includes('Patient teacher, steady guide');
    
    // Check context structure for source hierarchy
    const hasAuthoritativeSection = contextResult.contextText.includes('AUTHORITATIVE CONTENT');
    const hasInstructions = contextResult.contextText.includes('INSTRUCTION:');
    
    return {
      success: hasDadPoem && hasCorrectThirdLine && hasAuthoritativeSection,
      message: hasDadPoem ? 
        `Line counting context properly structured with source hierarchy` :
        `Dad poem not found in context or missing line counting fixes`,
      details: {
        hasDadPoem,
        hasCorrectThirdLine,
        hasAuthoritativeSection,
        hasInstructions,
        contextPreview: contextResult.contextText.substring(0, 200) + '...'
      }
    };
  }

  // Test 4: Memory Reference Detection
  async testMemoryReferenceDetection() {
    const detector = new MemoryReferenceDetector();
    
    const testCases = [
      { query: "what was the 3rd line in poem for dad?", shouldDetect: true },
      { query: "what are rats fiercest predator?", shouldDetect: false },
      { query: "show me that poem again", shouldDetect: true },
      { query: "what's the weather like?", shouldDetect: false }
    ];
    
    let allCorrect = true;
    const results = [];
    
    for (const testCase of testCases) {
      const detected = detector.detectsMemoryReference(testCase.query);
      const correct = detected === testCase.shouldDetect;
      allCorrect = allCorrect && correct;
      
      results.push({
        query: testCase.query,
        expected: testCase.shouldDetect,
        detected,
        correct
      });
    }
    
    return {
      success: allCorrect,
      message: allCorrect ? 
        `All memory reference detection tests passed` :
        `Some memory reference detection tests failed`,
      details: results
    };
  }

  // Test 5: File System Integration
  async testFileSystemIntegration() {
    const requiredDirs = [
      path.join(this.trinityDir, 'memory'),
      path.join(this.trinityDir, 'memory', 'conversations'),
      path.join(this.trinityDir, 'queue'),
      path.join(this.trinityDir, 'queue', 'input'),
      path.join(this.trinityDir, 'queue', 'output')
    ];
    
    const missingDirs = [];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        missingDirs.push(dir);
      }
    }
    
    return {
      success: missingDirs.length === 0,
      message: missingDirs.length === 0 ? 
        `All required directories exist` :
        `Missing ${missingDirs.length} required directories`,
      details: {
        requiredDirs,
        missingDirs
      }
    };
  }

  // Test 6: Claude-Watcher Memory Integration
  async testClaudeWatcherIntegration() {
    // Check if claude-watcher.js has the expected memory integration
    const claudeWatcherPath = path.join(__dirname, 'claude-watcher.js');
    
    if (!fs.existsSync(claudeWatcherPath)) {
      return {
        success: false,
        message: "claude-watcher.js not found",
        details: { expectedPath: claudeWatcherPath }
      };
    }
    
    const content = fs.readFileSync(claudeWatcherPath, 'utf8');
    
    const hasMemoryImport = content.includes('TrinityNativeMemory');
    const hasStoreResponse = content.includes('storeResponse');
    const hasBuildContext = content.includes('buildContextForClaude');
    const hasMemoryDetector = content.includes('MemoryReferenceDetector');
    
    const allIntegrationsPresent = hasMemoryImport && hasStoreResponse && hasBuildContext && hasMemoryDetector;
    
    return {
      success: allIntegrationsPresent,
      message: allIntegrationsPresent ? 
        `Claude-watcher has all memory integrations` :
        `Claude-watcher missing some memory integrations`,
      details: {
        hasMemoryImport,
        hasStoreResponse,
        hasBuildContext,
        hasMemoryDetector
      }
    };
  }

  // Main test runner
  async runAllTests() {
    this.log("🧪 CONSOLIDATED MEMORY INTEGRATION TEST SUITE");
    this.log("Testing existing memory system to identify issues...\n");
    
    await this.runTest("Conversation Storage Verification", () => this.testConversationStorage());
    await this.runTest("Memory Context Loading", () => this.testMemoryLoading());
    await this.runTest("Line Counting Accuracy", () => this.testLineCountingAccuracy());
    await this.runTest("Memory Reference Detection", () => this.testMemoryReferenceDetection());
    await this.runTest("File System Integration", () => this.testFileSystemIntegration());
    await this.runTest("Claude-Watcher Integration", () => this.testClaudeWatcherIntegration());
    
    this.printSummary();
    
    return this.results;
  }

  printSummary() {
    this.log("\n" + "=".repeat(50));
    this.log("📊 TEST SUMMARY");
    this.log("=".repeat(50));
    this.log(`Total Tests: ${this.results.total}`);
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed > 0) {
      this.log("\n🔍 FAILED TESTS:");
      this.results.tests.filter(t => !t.passed).forEach(test => {
        this.log(`  ❌ ${test.name}: ${test.message}`);
      });
    }
    
    this.log("\n🎯 NEXT STEPS:");
    if (this.results.failed === 0) {
      this.log("  All tests passed! Memory system is functional.");
      this.log("  Issue may be in UI integration or user workflow.");
    } else {
      this.log("  Fix failed tests to restore memory functionality.");
      this.log("  Focus on highest priority failures first.");
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ConsolidatedMemoryTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = ConsolidatedMemoryTestSuite;