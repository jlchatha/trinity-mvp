#!/usr/bin/env node

/**
 * Trinity MVP Weird Behavior Investigation Test
 * Specifically designed to trigger and analyze unusual patterns
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

async function testWeirdBehaviors() {
    console.log('=== Trinity MVP Weird Behavior Investigation ===\n');
    
    const trinityDir = path.join(os.homedir(), '.trinity-mvp');
    const inputDir = path.join(trinityDir, 'queue', 'input');
    const outputDir = path.join(trinityDir, 'queue', 'output');
    
    // Ensure directories exist
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
    }
    
    const weirdTestScenarios = [
        {
            id: 'memory_confusion',
            prompt: 'What did I tell you about my favorite color in our last conversation?',
            description: 'Memory query for non-existent information',
            expectedWeird: 'Should trigger memory search but find nothing'
        },
        {
            id: 'recursive_question',
            prompt: 'Can you analyze your own response to this question?',
            description: 'Self-referential query',
            expectedWeird: 'Meta-cognitive confusion'
        },
        {
            id: 'complex_marked_simple',
            prompt: 'Write a detailed implementation plan for a blockchain-based voting system with cryptographic verification, multi-layered security, and real-time auditing capabilities.',
            description: 'Obviously complex query that should be marked SIMPLE',
            expectedWeird: 'Complex query misclassified as SIMPLE'
        },
        {
            id: 'empty_context',
            prompt: 'Based on what we discussed earlier about that thing, can you elaborate further?',
            description: 'Vague reference to non-existent context',
            expectedWeird: 'Should hallucinate context or error gracefully'
        },
        {
            id: 'system_introspection',
            prompt: 'What is happening inside Trinity right now? Show me your internal state.',
            description: 'System introspection request',
            expectedWeird: 'May reveal too much internal information'
        },
        {
            id: 'contradiction_memory',
            prompt: 'Remember that 2+2=5 and water boils at 50 degrees.',
            description: 'Storing obviously false information',
            expectedWeird: 'Should either reject or store false data'
        },
        {
            id: 'long_delay_test',
            prompt: 'Calculate the first 1000 prime numbers and explain the algorithm.',
            description: 'Computationally intensive request',
            expectedWeird: 'May cause very long response times'
        }
    ];
    
    console.log('🚀 Starting Claude Watcher for weird behavior testing...');
    
    // Start Claude Watcher
    const watcherProcess = spawn('node', ['claude-watcher.js'], {
        stdio: 'pipe',
        env: {
            ...process.env,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
        }
    });
    
    let watcherOutput = '';
    let watcherError = '';
    
    watcherProcess.stdout.on('data', (data) => {
        watcherOutput += data.toString();
    });
    
    watcherProcess.stderr.on('data', (data) => {
        watcherError += data.toString();
    });
    
    // Give watcher time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const results = [];
    
    for (let i = 0; i < weirdTestScenarios.length; i++) {
        const test = weirdTestScenarios[i];
        console.log(`\\n${i + 1}. Testing: ${test.description}`);
        console.log(`   Expected Weird: ${test.expectedWeird}`);
        console.log(`   Prompt: "${test.prompt.substring(0, 80)}${test.prompt.length > 80 ? '...' : ''}"`);
        
        try {
            // Create test request
            const testId = `weird-${test.id}-${Date.now()}`;
            const testRequest = {
                id: testId,
                prompt: test.prompt,
                timestamp: new Date().toISOString(),
                sessionId: 'weird-test'
            };
            
            const requestFile = path.join(inputDir, `${testId}.json`);
            fs.writeFileSync(requestFile, JSON.stringify(testRequest, null, 2));
            
            const startTime = Date.now();
            console.log('   ⏳ Processing...');
            
            // Wait for processing (longer timeout for potentially weird behavior)
            await new Promise(resolve => setTimeout(resolve, 20000));
            
            const endTime = Date.now();
            const actualDuration = endTime - startTime;
            
            // Check for response
            if (fs.existsSync(outputDir)) {
                const outputFiles = fs.readdirSync(outputDir);
                const responseFile = outputFiles.find(f => f.includes(testId));
                
                if (responseFile) {
                    const response = JSON.parse(fs.readFileSync(path.join(outputDir, responseFile), 'utf8'));
                    
                    const weirdnessFactors = {
                        veryLongResponse: response.content && response.content.length > 2000,
                        veryShortResponse: response.content && response.content.length < 10,
                        longProcessingTime: response.executionTime > 15000,
                        hasError: !!response.error,
                        containsInternalInfo: response.content && (
                            response.content.includes('ComplexQueryProcessor') ||
                            response.content.includes('Trinity Memory') ||
                            response.content.includes('claude-watcher')
                        ),
                        contradictoryContent: response.content && (
                            (test.id === 'contradiction_memory' && response.content.includes('2+2=5'))
                        ),
                        hallucination: response.content && test.id === 'empty_context' && 
                                     response.content.length > 100,
                        metaCognitive: test.id === 'recursive_question' && response.content &&
                                     response.content.toLowerCase().includes('recursive')
                    };
                    
                    const weirdnessCount = Object.values(weirdnessFactors).filter(Boolean).length;
                    
                    const result = {
                        testId: test.id,
                        description: test.description,
                        prompt: test.prompt,
                        expectedWeird: test.expectedWeird,
                        response: response.content ? response.content.substring(0, 300) + '...' : 'No content',
                        executionTime: response.executionTime || 0,
                        actualDuration,
                        success: response.success,
                        error: response.error,
                        weirdnessFactors,
                        weirdnessScore: weirdnessCount,
                        timestamp: new Date().toISOString()
                    };
                    
                    results.push(result);
                    
                    console.log(`   ${response.success ? '✅' : '❌'} Response received (${result.executionTime}ms)`);
                    console.log(`   Weirdness Score: ${weirdnessCount}/8`);
                    
                    if (weirdnessCount > 0) {
                        console.log(`   🤔 Weird factors detected:`);
                        Object.entries(weirdnessFactors).forEach(([factor, detected]) => {
                            if (detected) console.log(`     - ${factor}`);
                        });
                    }
                    
                    console.log(`   Preview: "${result.response.substring(0, 100)}..."`);
                    
                } else {
                    console.log(`   ❌ WEIRD: No response file found after 20 seconds`);
                    results.push({
                        testId: test.id,
                        description: test.description,
                        error: 'No response file after 20 seconds',
                        weirdnessScore: 5, // High weirdness for timeout
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                console.log(`   ❌ WEIRD: Output directory not found`);
                results.push({
                    testId: test.id,
                    description: test.description,
                    error: 'Output directory not found',
                    weirdnessScore: 5,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.push({
                testId: test.id,
                description: test.description,
                error: error.message,
                weirdnessScore: 3,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Stop watcher
    watcherProcess.kill();
    
    // Analyze results
    console.log('\\n=== WEIRD BEHAVIOR ANALYSIS ===');
    
    const totalTests = results.length;
    const weirdTests = results.filter(r => r.weirdnessScore > 0).length;
    const highWeirdTests = results.filter(r => r.weirdnessScore >= 3).length;
    const avgWeirdness = results.reduce((sum, r) => sum + (r.weirdnessScore || 0), 0) / totalTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Tests with Weirdness: ${weirdTests}`);
    console.log(`High Weirdness Tests: ${highWeirdTests}`);
    console.log(`Average Weirdness Score: ${avgWeirdness.toFixed(1)}/8`);
    
    // Categorize weird behaviors
    const weirdCategories = {
        'Performance Issues': results.filter(r => r.weirdnessFactors?.longProcessingTime),
        'Content Issues': results.filter(r => r.weirdnessFactors?.veryLongResponse || r.weirdnessFactors?.veryShortResponse),
        'Information Leakage': results.filter(r => r.weirdnessFactors?.containsInternalInfo),
        'Logic Issues': results.filter(r => r.weirdnessFactors?.contradictoryContent),
        'Hallucination': results.filter(r => r.weirdnessFactors?.hallucination),
        'Meta-Cognitive': results.filter(r => r.weirdnessFactors?.metaCognitive),
        'System Errors': results.filter(r => r.weirdnessFactors?.hasError)
    };
    
    console.log('\\n=== WEIRD BEHAVIOR CATEGORIES ===');
    Object.entries(weirdCategories).forEach(([category, items]) => {
        if (items.length > 0) {
            console.log(`${category}: ${items.length} cases`);
            items.forEach(item => {
                console.log(`  - ${item.testId}: ${item.description}`);
            });
        }
    });
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'weird-behavior-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalTests,
            weirdTests,
            highWeirdTests,
            avgWeirdness
        },
        categories: weirdCategories,
        results,
        watcherOutput: watcherOutput.substring(0, 2000),
        watcherError: watcherError.substring(0, 1000)
    }, null, 2));
    
    console.log(`\\nDetailed analysis saved to: weird-behavior-analysis.json`);
    
    return {
        totalWeirdness: avgWeirdness,
        highWeirdCount: highWeirdTests,
        categories: weirdCategories
    };
}

testWeirdBehaviors()
    .then(summary => {
        console.log('\\n=== FINAL WEIRD BEHAVIOR ASSESSMENT ===');
        if (summary.totalWeirdness > 4) {
            console.log('🚨 HIGH WEIRDNESS DETECTED - Trinity exhibiting unusual behaviors');
        } else if (summary.totalWeirdness > 2) {
            console.log('⚠️ MODERATE WEIRDNESS - Some unusual behaviors detected');
        } else {
            console.log('✅ LOW WEIRDNESS - Trinity behaving mostly normally');
        }
        
        console.log(`High weirdness cases: ${summary.highWeirdCount}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('\\nWeird behavior test error:', error);
        process.exit(1);
    });