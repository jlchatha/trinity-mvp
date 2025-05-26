#!/usr/bin/env node

/**
 * Focused Trinity MVP Conversation Test
 * Tests key scenarios including memory persistence
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

async function runFocusedTests() {
    console.log('=== Focused Trinity MVP Conversation Test Suite ===\n');
    
    const trinityDir = path.join(os.homedir(), '.trinity-mvp');
    const inputDir = path.join(trinityDir, 'queue', 'input');
    const outputDir = path.join(trinityDir, 'queue', 'output');
    
    // Ensure directories exist
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
    }
    
    const testScenarios = [
        {
            id: 'factual',
            prompt: 'What is the capital of France?',
            expected: 'paris',
            description: 'Basic factual question'
        },
        {
            id: 'math',
            prompt: 'What is 25 + 17?',
            expected: '42',
            description: 'Simple math calculation'
        },
        {
            id: 'memory_store',
            prompt: 'Remember that my favorite programming language is JavaScript.',
            expected: 'remember',
            description: 'Memory storage test'
        },
        {
            id: 'memory_recall',
            prompt: 'What is my favorite programming language?',
            expected: 'javascript',
            description: 'Memory recall test'
        },
        {
            id: 'reasoning',
            prompt: 'Why is the sky blue? Give a brief scientific explanation.',
            expected: 'light',
            description: 'Scientific reasoning'
        }
    ];
    
    console.log('🚀 Starting Claude Watcher...');
    
    // Start Claude Watcher
    const watcherProcess = spawn('node', ['claude-watcher.js'], {
        stdio: 'pipe',
        env: {
            ...process.env,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
        }
    });
    
    let watcherOutput = '';
    watcherProcess.stdout.on('data', (data) => {
        watcherOutput += data.toString();
    });
    
    // Give watcher time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const test = testScenarios[i];
        console.log(`\n${i + 1}. Testing: ${test.description}`);
        console.log(`   Prompt: "${test.prompt}"`);
        
        try {
            // Create test request
            const testId = `focused-${test.id}-${Date.now()}`;
            const testRequest = {
                id: testId,
                prompt: test.prompt,
                timestamp: new Date().toISOString(),
                sessionId: 'focused-test'
            };
            
            const requestFile = path.join(inputDir, `${testId}.json`);
            fs.writeFileSync(requestFile, JSON.stringify(testRequest, null, 2));
            
            // Wait for processing
            console.log('   ⏳ Processing...');
            await new Promise(resolve => setTimeout(resolve, 12000));
            
            // Check for response
            if (fs.existsSync(outputDir)) {
                const outputFiles = fs.readdirSync(outputDir);
                const responseFile = outputFiles.find(f => f.includes(testId));
                
                if (responseFile) {
                    const response = JSON.parse(fs.readFileSync(path.join(outputDir, responseFile), 'utf8'));
                    
                    const isFallback = response.content && response.content.includes("I'm Trinity");
                    const hasExpected = response.content && 
                        response.content.toLowerCase().includes(test.expected.toLowerCase());
                    
                    const result = {
                        test: test.description,
                        prompt: test.prompt,
                        expected: test.expected,
                        success: response.success,
                        isFallback,
                        hasExpected,
                        passed: response.success && !isFallback && hasExpected,
                        response: response.content ? response.content.substring(0, 200) : 'No content',
                        executionTime: response.executionTime || 0
                    };
                    
                    results.push(result);
                    
                    if (result.passed) {
                        console.log(`   ✅ PASSED (${result.executionTime}ms)`);
                        console.log(`   Response: "${result.response}${result.response.length >= 200 ? '...' : ''}"`);
                    } else {
                        console.log(`   ❌ FAILED`);
                        if (isFallback) console.log(`   → Fallback response detected`);
                        if (!hasExpected) console.log(`   → Expected '${test.expected}' not found`);
                        console.log(`   Response: "${result.response}${result.response.length >= 200 ? '...' : ''}"`);
                    }
                } else {
                    console.log(`   ❌ FAILED - No response file found`);
                    results.push({
                        test: test.description,
                        passed: false,
                        error: 'No response file'
                    });
                }
            } else {
                console.log(`   ❌ FAILED - Output directory not found`);
                results.push({
                    test: test.description,
                    passed: false,
                    error: 'No output directory'
                });
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.push({
                test: test.description,
                passed: false,
                error: error.message
            });
        }
    }
    
    // Stop watcher
    watcherProcess.kill();
    
    // Generate summary
    console.log('\n=== TEST RESULTS SUMMARY ===');
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const fallbackCount = results.filter(r => r.isFallback).length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Fallback Responses: ${fallbackCount}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // Memory persistence check
    const memoryStoreTest = results.find(r => r.test.includes('Memory storage'));
    const memoryRecallTest = results.find(r => r.test.includes('Memory recall'));
    const memoryPersistent = memoryStoreTest && memoryRecallTest && 
                            memoryStoreTest.passed && memoryRecallTest.passed;
    
    console.log(`Memory Persistent: ${memoryPersistent ? 'YES ✅' : 'NO ❌'}`);
    
    // Overall verdict
    let verdict;
    if (passedTests === totalTests && fallbackCount === 0 && memoryPersistent) {
        verdict = 'EXCELLENT - All conversation flows working perfectly!';
    } else if (passedTests >= totalTests * 0.8 && fallbackCount <= 1) {
        verdict = 'GOOD - Most conversation flows working with minor issues';
    } else if (passedTests >= totalTests * 0.6) {
        verdict = 'FAIR - Some conversation flows working but needs improvement';
    } else {
        verdict = 'POOR - Significant conversation flow problems remain';
    }
    
    console.log(`\n🎯 VERDICT: ${verdict}`);
    
    // Save detailed results
    const reportPath = path.join(process.cwd(), 'focused-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            passedTests,
            failedTests,
            fallbackCount,
            successRate: (passedTests / totalTests) * 100,
            memoryPersistent
        },
        verdict,
        results
    }, null, 2));
    
    console.log(`\nDetailed results saved to: focused-test-results.json`);
    
    return {
        success: passedTests >= totalTests * 0.8 && fallbackCount === 0,
        passedTests,
        totalTests,
        memoryPersistent
    };
}

runFocusedTests()
    .then(summary => {
        if (summary.success) {
            console.log('\n🎉 Focused test suite PASSED - Trinity MVP working well!');
            process.exit(0);
        } else {
            console.log('\n⚠️ Focused test suite completed with issues - check results for details');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\nFocused test suite error:', error);
        process.exit(1);
    });