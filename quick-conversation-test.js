#!/usr/bin/env node

/**
 * Quick Trinity MVP Conversation Test
 * Tests basic conversation flow to verify fixes
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

async function quickTest() {
    console.log('=== Quick Trinity MVP Conversation Test ===\n');
    
    const trinityDir = path.join(os.homedir(), '.trinity-mvp');
    const inputDir = path.join(trinityDir, 'queue', 'input');
    const outputDir = path.join(trinityDir, 'queue', 'output');
    
    // Ensure directories exist
    if (!fs.existsSync(inputDir)) {
        fs.mkdirSync(inputDir, { recursive: true });
    }
    
    // Create test request
    const testId = `quick-test-${Date.now()}`;
    const testRequest = {
        id: testId,
        prompt: 'What is the capital of France?',
        timestamp: new Date().toISOString(),
        sessionId: 'quick-test'
    };
    
    const requestFile = path.join(inputDir, `${testId}.json`);
    fs.writeFileSync(requestFile, JSON.stringify(testRequest, null, 2));
    
    console.log('1. ✅ Created test request');
    console.log('2. 🚀 Starting Claude Watcher...');
    
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
    
    let watcherError = '';
    watcherProcess.stderr.on('data', (data) => {
        watcherError += data.toString();
    });
    
    // Wait for processing
    console.log('3. ⏳ Waiting for response...');
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Stop watcher
    watcherProcess.kill();
    
    // Check for response
    console.log('4. 🔍 Checking for response...');
    
    if (fs.existsSync(outputDir)) {
        const outputFiles = fs.readdirSync(outputDir);
        const responseFile = outputFiles.find(f => f.includes(testId));
        
        if (responseFile) {
            const response = JSON.parse(fs.readFileSync(path.join(outputDir, responseFile), 'utf8'));
            
            console.log('5. ✅ Response received!');
            console.log('\n=== RESPONSE ANALYSIS ===');
            console.log(`Success: ${response.success}`);
            console.log(`Content Length: ${response.content ? response.content.length : 0}`);
            console.log(`Execution Time: ${response.executionTime || 0}ms`);
            
            if (response.error) {
                console.log(`❌ Error: ${response.error}`);
            }
            
            if (response.content) {
                const isFallback = response.content.includes("I'm Trinity");
                const hasExpected = response.content.toLowerCase().includes('paris');
                
                console.log(`Is Fallback: ${isFallback ? 'YES ❌' : 'NO ✅'}`);
                console.log(`Has Expected Content: ${hasExpected ? 'YES ✅' : 'NO ❌'}`);
                
                console.log('\n=== RESPONSE CONTENT ===');
                console.log(response.content);
                
                if (!isFallback && hasExpected) {
                    console.log('\n🎉 SUCCESS: Trinity is returning proper Claude AI responses!');
                    return true;
                } else if (isFallback) {
                    console.log('\n⚠️  ISSUE: Still receiving fallback responses');
                    return false;
                } else {
                    console.log('\n⚠️  ISSUE: Response received but unexpected content');
                    return false;
                }
            }
        } else {
            console.log('❌ No response file found');
        }
    } else {
        console.log('❌ Output directory not found');
    }
    
    // Show watcher output for debugging
    if (watcherOutput || watcherError) {
        console.log('\n=== WATCHER DEBUG OUTPUT ===');
        if (watcherOutput) console.log('STDOUT:', watcherOutput.substring(0, 500));
        if (watcherError) console.log('STDERR:', watcherError.substring(0, 500));
    }
    
    return false;
}

quickTest()
    .then(success => {
        if (success) {
            console.log('\n✅ Quick test PASSED - Fixes are working!');
            process.exit(0);
        } else {
            console.log('\n❌ Quick test FAILED - Additional investigation needed');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('Quick test error:', error);
        process.exit(1);
    });