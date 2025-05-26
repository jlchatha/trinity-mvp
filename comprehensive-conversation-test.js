#!/usr/bin/env node

/**
 * Trinity MVP Comprehensive Conversation Test Suite
 * 
 * Tests wide array of conversational scenarios including:
 * - Basic Q&A (factual questions)
 * - Memory persistence across conversations
 * - Complex reasoning tasks
 * - Creative requests
 * - Technical questions
 * - Contextual follow-ups
 * - Error handling scenarios
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class ComprehensiveConversationTester {
    constructor() {
        this.trinityPath = process.cwd();
        this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
        this.inputDir = path.join(this.trinityDir, 'queue', 'input');
        this.outputDir = path.join(this.trinityDir, 'queue', 'output');
        this.testResults = [];
        this.sessionId = `test-session-${Date.now()}`;
        
        this.testScenarios = [
            // Basic Q&A Tests
            {
                category: 'Basic Q&A',
                tests: [
                    { id: 'basic_factual', prompt: 'What is the capital of France?', expectedType: 'factual', expectedContent: 'Paris' },
                    { id: 'basic_math', prompt: 'What is 15 + 27?', expectedType: 'calculation', expectedContent: '42' },
                    { id: 'basic_science', prompt: 'What is the chemical symbol for gold?', expectedType: 'factual', expectedContent: 'Au' },
                    { id: 'basic_geography', prompt: 'Which continent is Nigeria in?', expectedType: 'factual', expectedContent: 'Africa' }
                ]
            },
            
            // Memory Persistence Tests
            {
                category: 'Memory Persistence',
                tests: [
                    { id: 'memory_store', prompt: 'Remember that my favorite color is blue.', expectedType: 'acknowledgment', expectedContent: 'remember' },
                    { id: 'memory_recall', prompt: 'What is my favorite color?', expectedType: 'recall', expectedContent: 'blue', dependsOn: 'memory_store' },
                    { id: 'memory_context', prompt: 'Please create a poem about my favorite thing.', expectedType: 'creative', expectedContent: 'blue', dependsOn: 'memory_store' }
                ]
            },
            
            // Complex Reasoning Tests
            {
                category: 'Complex Reasoning',
                tests: [
                    { id: 'logic_puzzle', prompt: 'If all roses are flowers and some flowers are red, can we conclude that some roses are red?', expectedType: 'reasoning', expectedContent: 'logic' },
                    { id: 'problem_solving', prompt: 'How would you organize a team project with 5 people and 3 tasks of different complexities?', expectedType: 'strategy', expectedContent: 'organize' },
                    { id: 'analysis', prompt: 'Compare the advantages and disadvantages of remote work vs office work.', expectedType: 'analysis', expectedContent: 'advantages' }
                ]
            },
            
            // Creative Requests
            {
                category: 'Creative Requests',
                tests: [
                    { id: 'story_writing', prompt: 'Write a short story about a robot who discovers emotions.', expectedType: 'creative', expectedContent: 'robot' },
                    { id: 'poetry', prompt: 'Write a haiku about morning coffee.', expectedType: 'creative', expectedContent: 'coffee' },
                    { id: 'brainstorming', prompt: 'Give me 5 creative names for a tech startup focused on AI education.', expectedType: 'creative', expectedContent: 'AI' }
                ]
            },
            
            // Technical Questions
            {
                category: 'Technical Questions',
                tests: [
                    { id: 'programming', prompt: 'Explain the difference between synchronous and asynchronous programming.', expectedType: 'technical', expectedContent: 'synchronous' },
                    { id: 'debugging', prompt: 'What are common causes of memory leaks in JavaScript?', expectedType: 'technical', expectedContent: 'memory' },
                    { id: 'architecture', prompt: 'What are the benefits of microservices architecture?', expectedType: 'technical', expectedContent: 'microservices' }
                ]
            },
            
            // Contextual Follow-ups
            {
                category: 'Contextual Follow-ups',
                tests: [
                    { id: 'context_setup', prompt: 'I am planning a birthday party for my 8-year-old daughter.', expectedType: 'acknowledgment', expectedContent: 'party' },
                    { id: 'context_followup1', prompt: 'What activities would you recommend?', expectedType: 'suggestion', expectedContent: 'activities', dependsOn: 'context_setup' },
                    { id: 'context_followup2', prompt: 'How many guests should I invite?', expectedType: 'advice', expectedContent: 'guests', dependsOn: 'context_setup' }
                ]
            },
            
            // Error Handling Scenarios
            {
                category: 'Error Handling',
                tests: [
                    { id: 'unclear_request', prompt: 'Do the thing with the stuff.', expectedType: 'clarification', expectedContent: 'clarify' },
                    { id: 'impossible_request', prompt: 'Please change the laws of physics for me.', expectedType: 'limitation', expectedContent: 'cannot' },
                    { id: 'empty_request', prompt: '', expectedType: 'prompt', expectedContent: 'help' }
                ]
            }
        ];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }

    async setupTestEnvironment() {
        this.log('Setting up test environment...', 'SETUP');
        
        // Ensure directories exist
        if (!fs.existsSync(this.inputDir)) {
            fs.mkdirSync(this.inputDir, { recursive: true });
        }
        
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        // Clear any existing test files
        const existingFiles = fs.readdirSync(this.inputDir).filter(f => f.includes('test-'));
        existingFiles.forEach(file => {
            fs.unlinkSync(path.join(this.inputDir, file));
        });
        
        this.log('Test environment ready', 'SETUP');
    }

    async createTestRequest(testCase, categoryName) {
        const requestId = `${categoryName.toLowerCase().replace(/\s+/g, '_')}_${testCase.id}_${Date.now()}`;
        
        const request = {
            id: requestId,
            prompt: testCase.prompt,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            testCategory: categoryName,
            testId: testCase.id,
            expectedType: testCase.expectedType,
            expectedContent: testCase.expectedContent,
            dependsOn: testCase.dependsOn
        };
        
        const requestFile = path.join(this.inputDir, `${requestId}.json`);
        fs.writeFileSync(requestFile, JSON.stringify(request, null, 2));
        
        this.log(`Created test request: ${testCase.id}`, 'TEST');
        return requestId;
    }

    async startClaudeWatcher() {
        this.log('Starting Claude Watcher for testing...', 'WATCHER');
        
        return new Promise((resolve) => {
            const watcherProcess = spawn('node', ['claude-watcher.js'], {
                cwd: this.trinityPath,
                stdio: 'pipe',
                env: {
                    ...process.env,
                    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
                }
            });
            
            let watcherOutput = '';
            
            watcherProcess.stdout.on('data', (data) => {
                watcherOutput += data.toString();
                const output = data.toString();
                if (output.includes('Request') && output.includes('completed successfully')) {
                    this.log('Watcher processed a request', 'WATCHER');
                }
            });
            
            watcherProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (!error.includes('ExperimentalWarning')) {
                    this.log(`Watcher error: ${error}`, 'ERROR');
                }
            });
            
            watcherProcess.on('error', (error) => {
                this.log(`Watcher spawn error: ${error.message}`, 'ERROR');
            });
            
            // Return process control
            resolve({
                process: watcherProcess,
                output: () => watcherOutput
            });
        });
    }

    async waitForResponse(requestId, timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const outputFiles = fs.readdirSync(this.outputDir);
                const responseFile = outputFiles.find(f => f.includes(requestId));
                
                if (responseFile) {
                    const responsePath = path.join(this.outputDir, responseFile);
                    const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
                    return response;
                }
                
                // Wait 500ms before checking again
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                // Continue waiting
            }
        }
        
        throw new Error(`Timeout waiting for response to ${requestId}`);
    }

    analyzeResponse(response, testCase) {
        const analysis = {
            success: false,
            actualType: 'unknown',
            hasExpectedContent: false,
            isFallback: false,
            responseLength: 0,
            details: {}
        };
        
        if (!response) {
            analysis.details.error = 'No response received';
            return analysis;
        }
        
        analysis.success = response.success || false;
        analysis.responseLength = response.content ? response.content.length : 0;
        
        // Check if this is a fallback response
        if (response.content && typeof response.content === 'string') {
            analysis.isFallback = response.content.includes("I'm Trinity") || 
                                response.content.includes("professional assistant interface");
            
            // Check for expected content
            if (testCase.expectedContent) {
                analysis.hasExpectedContent = response.content.toLowerCase()
                    .includes(testCase.expectedContent.toLowerCase());
            }
            
            // Determine response type
            const content = response.content.toLowerCase();
            if (content.includes('remember') || content.includes('noted')) {
                analysis.actualType = 'acknowledgment';
            } else if (content.includes('cannot') || content.includes('unable')) {
                analysis.actualType = 'limitation';
            } else if (content.includes('clarify') || content.includes('specify')) {
                analysis.actualType = 'clarification';
            } else if (content.includes('creative') || content.includes('story') || content.includes('poem')) {
                analysis.actualType = 'creative';
            } else if (content.includes('technical') || content.includes('programming')) {
                analysis.actualType = 'technical';
            } else if (analysis.responseLength > 10 && !analysis.isFallback) {
                analysis.actualType = 'substantive';
            }
        }
        
        analysis.details = {
            responseSuccess: response.success,
            hasContent: !!response.content,
            contentLength: analysis.responseLength,
            executionTime: response.executionTime || 0,
            error: response.error
        };
        
        return analysis;
    }

    async runTestCategory(category) {
        this.log(`\n=== Testing Category: ${category.category} ===`, 'CATEGORY');
        
        const categoryResults = {
            category: category.category,
            tests: [],
            passed: 0,
            failed: 0,
            fallbackCount: 0
        };
        
        for (const testCase of category.tests) {
            this.log(`Running test: ${testCase.id}`, 'TEST');
            
            try {
                // Create test request
                const requestId = await this.createTestRequest(testCase, category.category);
                
                // Wait for response
                const response = await this.waitForResponse(requestId, 45000);
                
                // Analyze response
                const analysis = this.analyzeResponse(response, testCase);
                
                const testResult = {
                    testId: testCase.id,
                    prompt: testCase.prompt,
                    expectedType: testCase.expectedType,
                    expectedContent: testCase.expectedContent,
                    response: response.content,
                    analysis: analysis,
                    passed: analysis.success && analysis.hasExpectedContent && !analysis.isFallback,
                    timestamp: new Date().toISOString()
                };
                
                categoryResults.tests.push(testResult);
                
                if (testResult.passed) {
                    categoryResults.passed++;
                    this.log(`✅ ${testCase.id} PASSED`, 'PASS');
                } else {
                    categoryResults.failed++;
                    this.log(`❌ ${testCase.id} FAILED`, 'FAIL');
                    
                    if (analysis.isFallback) {
                        categoryResults.fallbackCount++;
                        this.log(`  → Fallback response detected`, 'WARN');
                    }
                    
                    if (!analysis.hasExpectedContent) {
                        this.log(`  → Expected content '${testCase.expectedContent}' not found`, 'WARN');
                    }
                }
                
                // Log response preview
                const preview = response.content ? response.content.substring(0, 100) + '...' : 'No content';
                this.log(`  Response: ${preview}`, 'DEBUG');
                
            } catch (error) {
                this.log(`❌ ${testCase.id} ERROR: ${error.message}`, 'ERROR');
                
                categoryResults.tests.push({
                    testId: testCase.id,
                    prompt: testCase.prompt,
                    error: error.message,
                    passed: false,
                    timestamp: new Date().toISOString()
                });
                
                categoryResults.failed++;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return categoryResults;
    }

    async runMemoryPersistenceTest() {
        this.log('\n=== Memory Persistence Deep Test ===', 'MEMORY');
        
        const memoryTests = [
            { prompt: 'Remember that I am working on a project called "Trinity MVP".', expected: 'trinity mvp' },
            { prompt: 'Also remember that I prefer technical explanations.', expected: 'technical' },
            { prompt: 'What project am I working on?', expected: 'trinity mvp' },
            { prompt: 'How should I explain things to you?', expected: 'technical' },
            { prompt: 'Create a summary of what you know about me.', expected: 'trinity mvp' }
        ];
        
        const memoryResults = { tests: [], persistent: false };
        
        for (let i = 0; i < memoryTests.length; i++) {
            const test = memoryTests[i];
            this.log(`Memory test ${i + 1}: ${test.prompt.substring(0, 50)}...`, 'MEMORY');
            
            try {
                const requestId = await this.createTestRequest({
                    id: `memory_${i}`,
                    prompt: test.prompt,
                    expectedContent: test.expected
                }, 'Memory Persistence');
                
                const response = await this.waitForResponse(requestId, 30000);
                const hasExpected = response.content && 
                    response.content.toLowerCase().includes(test.expected.toLowerCase());
                
                memoryResults.tests.push({
                    prompt: test.prompt,
                    response: response.content,
                    hasExpected,
                    passed: hasExpected && !response.content.includes("I'm Trinity")
                });
                
                this.log(`${hasExpected ? '✅' : '❌'} Memory test ${i + 1}`, hasExpected ? 'PASS' : 'FAIL');
                
            } catch (error) {
                this.log(`❌ Memory test ${i + 1} ERROR: ${error.message}`, 'ERROR');
                memoryResults.tests.push({
                    prompt: test.prompt,
                    error: error.message,
                    passed: false
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Check if memory persisted across multiple interactions
        const laterTests = memoryResults.tests.slice(2); // Tests that rely on earlier memory
        memoryResults.persistent = laterTests.some(test => test.passed);
        
        return memoryResults;
    }

    generateReport(allResults, memoryResults) {
        const report = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            summary: {
                totalCategories: allResults.length,
                totalTests: allResults.reduce((sum, cat) => sum + cat.tests.length, 0),
                totalPassed: allResults.reduce((sum, cat) => sum + cat.passed, 0),
                totalFailed: allResults.reduce((sum, cat) => sum + cat.failed, 0),
                totalFallbacks: allResults.reduce((sum, cat) => sum + cat.fallbackCount, 0),
                memoryPersistent: memoryResults.persistent
            },
            categories: allResults,
            memoryPersistence: memoryResults,
            verdict: null
        };
        
        const successRate = (report.summary.totalPassed / report.summary.totalTests) * 100;
        const fallbackRate = (report.summary.totalFallbacks / report.summary.totalTests) * 100;
        
        if (successRate >= 80 && fallbackRate < 20 && memoryResults.persistent) {
            report.verdict = 'EXCELLENT - Trinity MVP conversation flows working as expected';
        } else if (successRate >= 60 && fallbackRate < 50) {
            report.verdict = 'GOOD - Trinity MVP mostly functional with some issues';
        } else if (successRate >= 30) {
            report.verdict = 'POOR - Trinity MVP has significant conversation flow problems';
        } else {
            report.verdict = 'CRITICAL - Trinity MVP conversation flows fundamentally broken';
        }
        
        // Save detailed report
        const reportPath = path.join(this.trinityPath, 'comprehensive-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    async runAllTests() {
        this.log('Starting Trinity MVP Comprehensive Conversation Test Suite...', 'START');
        
        try {
            // Setup
            await this.setupTestEnvironment();
            
            // Start Claude Watcher
            const watcher = await this.startClaudeWatcher();
            
            // Give watcher time to initialize
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const allResults = [];
            
            // Run each test category
            for (const category of this.testScenarios) {
                const categoryResult = await this.runTestCategory(category);
                allResults.push(categoryResult);
            }
            
            // Run memory persistence test
            const memoryResults = await this.runMemoryPersistenceTest();
            
            // Stop watcher
            if (watcher.process) {
                watcher.process.kill();
            }
            
            // Generate report
            const report = this.generateReport(allResults, memoryResults);
            
            // Display summary
            this.log('\n=== COMPREHENSIVE TEST RESULTS ===', 'RESULTS');
            this.log(`Total Tests: ${report.summary.totalTests}`, 'RESULTS');
            this.log(`Passed: ${report.summary.totalPassed}`, 'RESULTS');
            this.log(`Failed: ${report.summary.totalFailed}`, 'RESULTS');
            this.log(`Fallback Responses: ${report.summary.totalFallbacks}`, 'RESULTS');
            this.log(`Success Rate: ${((report.summary.totalPassed / report.summary.totalTests) * 100).toFixed(1)}%`, 'RESULTS');
            this.log(`Memory Persistent: ${report.summary.memoryPersistent ? 'YES' : 'NO'}`, 'RESULTS');
            this.log(`\nVERDICT: ${report.verdict}`, 'VERDICT');
            
            return report;
            
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// Run the comprehensive test suite
if (require.main === module) {
    const tester = new ComprehensiveConversationTester();
    tester.runAllTests()
        .then(report => {
            console.log('\nTest suite completed successfully!');
            console.log(`Detailed report saved to: comprehensive-test-report.json`);
            
            if (report.summary.totalFallbacks > 0) {
                console.log('\n⚠️  Fallback responses detected - fixes may not be complete');
                process.exit(1);
            } else if (report.summary.totalPassed < report.summary.totalTests * 0.8) {
                console.log('\n⚠️  Low success rate - conversation flows need attention');
                process.exit(1);
            } else {
                console.log('\n✅ Trinity MVP conversation flows working well!');
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { ComprehensiveConversationTester };