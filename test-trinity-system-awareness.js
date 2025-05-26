#!/usr/bin/env node

/**
 * Trinity System Awareness - Comprehensive Test Suite
 * 
 * Tests for Milestone 1: System Awareness Foundation
 * Validates TrinitySystemContext, CuriosityDrivenProblemSolver, and ClaudeCodeContextEnhancer
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Test modules
const TrinitySystemContext = require('./src/core/trinity-system-context');
const CuriosityDrivenProblemSolver = require('./src/core/curiosity-driven-problem-solver');
const ClaudeCodeContextEnhancer = require('./src/core/claude-code-context-enhancer');

class TrinitySystemAwarenessTests {
  constructor() {
    this.testResults = [];
    this.testSystemDir = path.join(os.tmpdir(), 'trinity-test-' + Date.now());
    
    // Ensure test directory exists
    fs.mkdirSync(this.testSystemDir, { recursive: true });
    
    console.log('🧪 Trinity System Awareness Test Suite Starting...');
    console.log(`📁 Test directory: ${this.testSystemDir}`);
  }
  
  /**
   * Log test result
   */
  logResult(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
    
    return passed;
  }
  
  /**
   * Run all Milestone 1 tests
   */
  async runAllTests() {
    console.log('\n=== MILESTONE 1: SYSTEM AWARENESS FOUNDATION ===\n');
    
    let allPassed = true;
    
    // Trinity System Context Tests
    allPassed &= await this.testTrinitySystemContext();
    allPassed &= await this.testSystemCapabilityDetection();
    allPassed &= await this.testUserEnvironmentDetection();
    allPassed &= await this.testTechnicalLevelDetection();
    allPassed &= await this.testProblemSolvingAnalysis();
    
    // Curiosity-Driven Problem Solver Tests
    allPassed &= await this.testCuriosityProblemSolver();
    allPassed &= await this.testGoalExtraction();
    allPassed &= await this.testComplexityAssessment();
    allPassed &= await this.testSolutionPathwayIdentification();
    allPassed &= await this.testCreativeAlternatives();
    allPassed &= await this.testExplorationOpportunities();
    
    // Claude Code Context Enhancer Tests
    allPassed &= await this.testContextEnhancer();
    allPassed &= await this.testEnhancementDecisionLogic();
    allPassed &= await this.testContextFileBehavior();
    allPassed &= await this.testIntegratedSystemAwareness();
    
    // Performance Tests
    allPassed &= await this.testPerformanceRequirements();
    
    // Integration Tests
    allPassed &= await this.testEndToEndIntegration();
    
    this.printTestSummary(allPassed);
    return allPassed;
  }
  
  /**
   * Test 1: Trinity System Context basic functionality
   */
  async testTrinitySystemContext() {
    try {
      const context = new TrinitySystemContext({ systemDir: this.testSystemDir });
      
      // Test basic initialization
      if (!context.systemCapabilities || !context.userEnvironment) {
        return this.logResult('Trinity System Context - Basic Init', false, 'Missing required properties');
      }
      
      // Test system context retrieval
      const systemContext = context.getSystemContext('test message', []);
      
      const hasRequiredFields = systemContext.capabilities && 
                                systemContext.environment && 
                                systemContext.technical_level && 
                                systemContext.problem_solving;
      
      return this.logResult('Trinity System Context - Basic Init', hasRequiredFields, 
        `Context fields: ${Object.keys(systemContext).join(', ')}`);
        
    } catch (error) {
      return this.logResult('Trinity System Context - Basic Init', false, error.message);
    }
  }
  
  /**
   * Test 2: System capability detection
   */
  async testSystemCapabilityDetection() {
    try {
      const context = new TrinitySystemContext({ systemDir: this.testSystemDir });
      const capabilities = context.getCapabilityContext();
      
      const requiredCapabilities = ['file_access', 'memory_system', 'local_processing', 'cross_session'];
      const hasAllCapabilities = requiredCapabilities.every(cap => capabilities[cap]);
      
      if (!hasAllCapabilities) {
        const missing = requiredCapabilities.filter(cap => !capabilities[cap]);
        return this.logResult('System Capability Detection', false, `Missing: ${missing.join(', ')}`);
      }
      
      // Test capability structure
      const fileAccess = capabilities.file_access;
      const hasValidStructure = fileAccess.description && fileAccess.examples && fileAccess.limitations;
      
      return this.logResult('System Capability Detection', hasValidStructure, 
        `Found ${requiredCapabilities.length} capabilities with complete metadata`);
        
    } catch (error) {
      return this.logResult('System Capability Detection', false, error.message);
    }
  }
  
  /**
   * Test 3: User environment detection
   */
  async testUserEnvironmentDetection() {
    try {
      const context = new TrinitySystemContext({ 
        systemDir: this.testSystemDir,
        workingDir: __dirname // Use current directory for testing
      });
      
      const environment = context.getUserEnvironmentContext();
      
      // Should detect Node.js project (package.json exists)
      const hasProjectContext = environment.project_context && environment.working_directory;
      const hasFilePermissions = environment.file_permissions;
      
      if (!hasProjectContext) {
        return this.logResult('User Environment Detection', false, 'Missing project context or working directory');
      }
      
      // Test specific project detection
      const isNodeProject = environment.project_context.type === 'nodejs';
      
      return this.logResult('User Environment Detection', hasProjectContext && hasFilePermissions, 
        `Detected: ${environment.project_context.type} project, permissions: ${JSON.stringify(environment.file_permissions)}`);
        
    } catch (error) {
      return this.logResult('User Environment Detection', false, error.message);
    }
  }
  
  /**
   * Test 4: Technical level detection
   */
  async testTechnicalLevelDetection() {
    try {
      const context = new TrinitySystemContext({ systemDir: this.testSystemDir });
      
      // Test technical message
      const technicalLevel = context.detectUserTechnicalLevel(
        'I need to optimize the API endpoint with better caching and implement async/await patterns', 
        [{ content: 'Working on Node.js microservices architecture' }]
      );
      
      // Test beginner message
      const beginnerLevel = context.detectUserTechnicalLevel(
        'I\'m new to this and confused about how to get started', 
        [{ content: 'I don\'t understand what API means' }]
      );
      
      // Test intermediate message
      const intermediateLevel = context.detectUserTechnicalLevel(
        'Help me configure the application settings', 
        []
      );
      
      const correctDetection = technicalLevel === 'technical' && 
                              beginnerLevel === 'beginner' && 
                              intermediateLevel === 'intermediate';
      
      return this.logResult('Technical Level Detection', correctDetection, 
        `technical: ${technicalLevel}, beginner: ${beginnerLevel}, intermediate: ${intermediateLevel}`);
        
    } catch (error) {
      return this.logResult('Technical Level Detection', false, error.message);
    }
  }
  
  /**
   * Test 5: Problem-solving analysis
   */
  async testProblemSolvingAnalysis() {
    try {
      const context = new TrinitySystemContext({ systemDir: this.testSystemDir });
      
      const problemAnalysis = context.analyzeProblemSolvingOpportunities(
        'I want to automate my deployment process and need help optimizing performance',
        []
      );
      
      const hasRequiredFields = problemAnalysis.goal_understanding && 
                               problemAnalysis.solution_pathways && 
                               problemAnalysis.creative_alternatives && 
                               problemAnalysis.curiosity_triggers;
      
      const hasExplorationOpportunity = problemAnalysis.has_exploration_opportunity;
      const hasGoals = problemAnalysis.goal_understanding.length > 0;
      
      return this.logResult('Problem-Solving Analysis', hasRequiredFields && hasExplorationOpportunity && hasGoals, 
        `Goals: ${problemAnalysis.goal_understanding.length}, Pathways: ${problemAnalysis.solution_pathways.length}`);
        
    } catch (error) {
      return this.logResult('Problem-Solving Analysis', false, error.message);
    }
  }
  
  /**
   * Test 6: Curiosity-driven problem solver
   */
  async testCuriosityProblemSolver() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      const systemContext = { capabilities: {}, environment: {} };
      
      const curiosityContext = await solver.enhanceWithCuriosity(
        'Help me build a creative solution for automating file processing',
        systemContext,
        []
      );
      
      // Should detect exploration opportunity and return context
      const hasContext = curiosityContext !== null;
      const isString = typeof curiosityContext === 'string';
      const hasGuidance = hasContext && curiosityContext.includes('Curiosity guidance');
      
      return this.logResult('Curiosity-Driven Problem Solver', hasContext && isString && hasGuidance, 
        `Context generated: ${hasContext}, Contains guidance: ${hasGuidance}`);
        
    } catch (error) {
      return this.logResult('Curiosity-Driven Problem Solver', false, error.message);
    }
  }
  
  /**
   * Test 7: Goal extraction
   */
  async testGoalExtraction() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      
      // Test explicit goal
      const explicitGoal = solver.extractPrimaryGoal('I want to create a new dashboard for monitoring');
      
      // Test implicit goal
      const implicitGoal = solver.extractPrimaryGoal('This code is broken and I\'m stuck');
      
      // Test guidance seeking
      const guidanceGoal = solver.extractPrimaryGoal('How do I optimize this database query?');
      
      const validExplicit = explicitGoal.type === 'explicit_desire' && explicitGoal.confidence === 'high';
      const validImplicit = implicitGoal.type === 'problem_solving';
      const validGuidance = guidanceGoal.type === 'guidance_seeking';
      
      return this.logResult('Goal Extraction', validExplicit && validImplicit && validGuidance, 
        `Explicit: ${explicitGoal.type}, Implicit: ${implicitGoal.type}, Guidance: ${guidanceGoal.type}`);
        
    } catch (error) {
      return this.logResult('Goal Extraction', false, error.message);
    }
  }
  
  /**
   * Test 8: Complexity assessment
   */
  async testComplexityAssessment() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      
      // Simple request
      const simpleComplexity = solver.assessComplexity('Help me save a file', []);
      
      // Complex request
      const complexMessage = 'I need to design a scalable microservices architecture with proper API gateway configuration, implement OAuth2 authentication, set up monitoring with Prometheus, and ensure the system can handle 10,000 concurrent users while maintaining sub-200ms response times';
      const complexComplexity = solver.assessComplexity(complexMessage, []);
      
      // Medium complexity
      const mediumComplexity = solver.assessComplexity('Help me automate my deployment process and also set up monitoring', []);
      
      const correctAssessment = simpleComplexity === 'low' && 
                               complexComplexity === 'high' && 
                               mediumComplexity === 'medium';
      
      return this.logResult('Complexity Assessment', correctAssessment, 
        `Simple: ${simpleComplexity}, Medium: ${mediumComplexity}, Complex: ${complexComplexity}`);
        
    } catch (error) {
      return this.logResult('Complexity Assessment', false, error.message);
    }
  }
  
  /**
   * Test 9: Solution pathway identification
   */
  async testSolutionPathwayIdentification() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      const systemContext = { capabilities: {} };
      
      // File-related request
      const filePathways = solver.identifyPossibleSolutions('Help me organize my project files', systemContext);
      
      // Analysis request
      const analysisPathways = solver.identifyPossibleSolutions('Analyze this codebase for performance issues', systemContext);
      
      // Creative request
      const creativePathways = solver.identifyPossibleSolutions('Generate innovative ideas for user engagement', systemContext);
      
      const hasFilePathway = filePathways.some(p => p.category === 'file_manipulation');
      const hasAnalysisPathway = analysisPathways.some(p => p.category === 'analysis_and_insight');
      const hasCreativePathway = creativePathways.some(p => p.category === 'creative_generation');
      
      return this.logResult('Solution Pathway Identification', hasFilePathway && hasAnalysisPathway && hasCreativePathway, 
        `File: ${hasFilePathway}, Analysis: ${hasAnalysisPathway}, Creative: ${hasCreativePathway}`);
        
    } catch (error) {
      return this.logResult('Solution Pathway Identification', false, error.message);
    }
  }
  
  /**
   * Test 10: Creative alternatives generation
   */
  async testCreativeAlternatives() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      const systemContext = { capabilities: {} };
      
      // Request mentioning standard approach
      const standardAlternatives = solver.generateCreativeOptions('I need the standard approach to handle this', systemContext);
      
      // Frustrated user
      const frustratedAlternatives = solver.generateCreativeOptions('I\'m really stuck and frustrated with this problem', systemContext);
      
      // Efficiency seeking
      const efficiencyAlternatives = solver.generateCreativeOptions('I need a faster and more efficient solution', systemContext);
      
      const hasStandardAlternative = standardAlternatives.some(alt => alt.type === 'non_standard_approach');
      const hasFrustratedAlternative = frustratedAlternatives.some(alt => alt.type === 'reframe_problem');
      const hasEfficiencyAlternative = efficiencyAlternatives.some(alt => alt.type === 'optimization_focused');
      
      return this.logResult('Creative Alternatives Generation', hasStandardAlternative && hasFrustratedAlternative && hasEfficiencyAlternative, 
        `Standard: ${hasStandardAlternative}, Frustrated: ${hasFrustratedAlternative}, Efficiency: ${hasEfficiencyAlternative}`);
        
    } catch (error) {
      return this.logResult('Creative Alternatives Generation', false, error.message);
    }
  }
  
  /**
   * Test 11: Exploration opportunities
   */
  async testExplorationOpportunities() {
    try {
      const solver = new CuriosityDrivenProblemSolver();
      const systemContext = { capabilities: {} };
      
      const opportunities = solver.detectExplorationNeeds('How can I improve this system?', systemContext);
      
      const hasOpportunities = opportunities.length > 0;
      const hasQuestionExploration = opportunities.includes('answer_exploration');
      
      return this.logResult('Exploration Opportunities', hasOpportunities && hasQuestionExploration, 
        `Found ${opportunities.length} opportunities: ${opportunities.join(', ')}`);
        
    } catch (error) {
      return this.logResult('Exploration Opportunities', false, error.message);
    }
  }
  
  /**
   * Test 12: Context enhancer basic functionality
   */
  async testContextEnhancer() {
    try {
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      // Test enhancement decision
      const simpleMessage = 'Hi';
      const complexMessage = 'Help me build a project management system';
      
      const simpleNeedsEnhancement = enhancer.needsEnhancedContext(simpleMessage);
      const complexNeedsEnhancement = enhancer.needsEnhancedContext(complexMessage);
      
      const correctDecision = !simpleNeedsEnhancement && complexNeedsEnhancement;
      
      return this.logResult('Context Enhancer - Basic Functionality', correctDecision, 
        `Simple needs enhancement: ${simpleNeedsEnhancement}, Complex needs enhancement: ${complexNeedsEnhancement}`);
        
    } catch (error) {
      return this.logResult('Context Enhancer - Basic Functionality', false, error.message);
    }
  }
  
  /**
   * Test 13: Enhancement decision logic
   */
  async testEnhancementDecisionLogic() {
    try {
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      const testCases = [
        { message: 'help me understand', expected: true },
        { message: 'I have a problem with my code', expected: true },
        { message: 'can you analyze this project?', expected: true },
        { message: 'yes', expected: false },
        { message: 'thanks', expected: false }
      ];
      
      let allCorrect = true;
      const results = [];
      
      for (const testCase of testCases) {
        const actual = enhancer.needsEnhancedContext(testCase.message);
        const correct = actual === testCase.expected;
        allCorrect &= correct;
        results.push(`"${testCase.message}": ${actual}`);
      }
      
      return this.logResult('Enhancement Decision Logic', allCorrect, 
        `Results: ${results.join(', ')}`);
        
    } catch (error) {
      return this.logResult('Enhancement Decision Logic', false, error.message);
    }
  }
  
  /**
   * Test 14: Context file behavior
   */
  async testContextFileBehavior() {
    try {
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      const enhancedMessage = await enhancer.enhanceWithSystemAwareness(
        'Help me optimize my development workflow',
        [],
        { forceEnhancement: true }
      );
      
      const hasContextReference = enhancedMessage.includes('[Trinity Context Enhancement Available:');
      const hasContextFile = enhancedMessage !== 'Help me optimize my development workflow';
      
      // Check if context file was actually created
      const files = fs.readdirSync(this.testSystemDir).filter(f => f.startsWith('enhanced-context'));
      const contextFileCreated = files.length > 0;
      
      return this.logResult('Context File Behavior', hasContextReference && hasContextFile && contextFileCreated, 
        `Has reference: ${hasContextReference}, File created: ${contextFileCreated}, Files: ${files.length}`);
        
    } catch (error) {
      return this.logResult('Context File Behavior', false, error.message);
    }
  }
  
  /**
   * Test 15: Integrated system awareness
   */
  async testIntegratedSystemAwareness() {
    try {
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      const enhancedMessage = await enhancer.enhanceWithSystemAwareness(
        'I need help with my Node.js project',
        [{ content: 'I\'m working on API development' }],
        { forceEnhancement: true }
      );
      
      // Extract context file path
      const contextMatch = enhancedMessage.match(/\[Trinity Context Enhancement Available: (.+?)\]/);
      
      if (!contextMatch) {
        return this.logResult('Integrated System Awareness', false, 'No context file reference found');
      }
      
      const contextFile = contextMatch[1];
      
      if (!fs.existsSync(contextFile)) {
        return this.logResult('Integrated System Awareness', false, 'Context file not found');
      }
      
      const contextContent = fs.readFileSync(contextFile, 'utf8');
      
      const hasSystemCapabilities = contextContent.includes('SYSTEM CAPABILITIES AVAILABLE');
      const hasUserEnvironment = contextContent.includes('USER ENVIRONMENT CONTEXT');
      const hasCommunicationAdaptation = contextContent.includes('COMMUNICATION ADAPTATION');
      const hasTrinityGuidance = contextContent.includes('TRINITY ASSISTANT GUIDANCE');
      
      const isComplete = hasSystemCapabilities && hasUserEnvironment && hasCommunicationAdaptation && hasTrinityGuidance;
      
      return this.logResult('Integrated System Awareness', isComplete, 
        `Capabilities: ${hasSystemCapabilities}, Environment: ${hasUserEnvironment}, Communication: ${hasCommunicationAdaptation}, Guidance: ${hasTrinityGuidance}`);
        
    } catch (error) {
      return this.logResult('Integrated System Awareness', false, error.message);
    }
  }
  
  /**
   * Test 16: Performance requirements (<100ms total context overhead)
   */
  async testPerformanceRequirements() {
    try {
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      const startTime = Date.now();
      
      // Perform 5 enhancement cycles to get average
      const iterations = 5;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const iterStart = Date.now();
        
        await enhancer.enhanceWithSystemAwareness(
          `Test message ${i} - help me with my development project`,
          [{ content: 'Previous conversation context' }],
          { forceEnhancement: true }
        );
        
        times.push(Date.now() - iterStart);
      }
      
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const meetsRequirement = averageTime < 100 && maxTime < 150; // Allow some buffer for max
      
      return this.logResult('Performance Requirements', meetsRequirement, 
        `Average: ${averageTime.toFixed(1)}ms, Max: ${maxTime}ms (target: <100ms avg)`);
        
    } catch (error) {
      return this.logResult('Performance Requirements', false, error.message);
    }
  }
  
  /**
   * Test 17: End-to-end integration test
   */
  async testEndToEndIntegration() {
    try {
      // Simulate the full pipeline that would happen in claude-watcher.js
      const context = new TrinitySystemContext({ 
        systemDir: this.testSystemDir,
        workingDir: __dirname 
      });
      
      const solver = new CuriosityDrivenProblemSolver();
      const enhancer = new ClaudeCodeContextEnhancer({ systemDir: this.testSystemDir });
      
      const userMessage = 'I want to create an automated testing framework for my Node.js application';
      const conversationHistory = [
        { content: 'I\'m working on a Node.js project with Express' },
        { content: 'I need better test coverage' }
      ];
      
      // Step 1: Get system context
      const systemContext = context.getSystemContext(userMessage, conversationHistory);
      
      // Step 2: Get curiosity enhancement
      const curiosityContext = await solver.enhanceWithCuriosity(userMessage, systemContext, conversationHistory);
      
      // Step 3: Apply full enhancement
      const enhancedMessage = await enhancer.enhanceWithSystemAwareness(userMessage, conversationHistory, { forceEnhancement: true });
      
      // Validate results
      const hasSystemContext = systemContext && systemContext.technical_level; // Should have technical level detected
      const hasCuriosityContext = curiosityContext && curiosityContext.includes('Solution Approaches');
      const hasEnhancement = enhancedMessage !== userMessage;
      
      const endToEndSuccess = hasSystemContext && hasCuriosityContext && hasEnhancement;
      
      return this.logResult('End-to-End Integration', endToEndSuccess, 
        `System: ${hasSystemContext}, Curiosity: ${hasCuriosityContext}, Enhanced: ${hasEnhancement}`);
        
    } catch (error) {
      return this.logResult('End-to-End Integration', false, error.message);
    }
  }
  
  /**
   * Print comprehensive test summary
   */
  printTestSummary(allPassed) {
    console.log('\n=== TEST SUMMARY ===');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Tests Run: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (passed === total) {
      console.log('\n🎉 MILESTONE 1: SYSTEM AWARENESS FOUNDATION - ALL TESTS PASSED!');
      console.log('✅ TrinitySystemContext class operational with capability detection');
      console.log('✅ System context integration working');
      console.log('✅ Agent demonstrates understanding of local file access capabilities');
      console.log('✅ Agent aware of memory system and conversation continuity');
      console.log('✅ Integration maintains existing MVP architecture performance');
    } else {
      console.log('\n❌ SOME TESTS FAILED - Review implementation');
      console.log('\nFailed tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.testName}: ${r.details}`));
    }
    
    // Cleanup test directory
    try {
      fs.rmSync(this.testSystemDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Could not clean up test directory: ${error.message}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new TrinitySystemAwarenessTests();
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = TrinitySystemAwarenessTests;