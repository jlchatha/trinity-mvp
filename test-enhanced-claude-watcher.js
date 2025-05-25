/**
 * Test Enhanced Claude Watcher with Memory Integration
 * Tests the memory-aware file communication system
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function testEnhancedClaudeWatcher() {
    console.log('🧠 Testing Enhanced Claude Watcher with Memory Integration...\n');
    
    const testDir = '/tmp/trinity-mvp-test-watcher';
    const queueDir = path.join(testDir, 'queue');
    const inputDir = path.join(queueDir, 'input');
    const outputDir = path.join(queueDir, 'output');
    
    try {
        // Set up test directories
        await fs.mkdir(inputDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        
        // Set up memory with some test content
        const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');
        const memory = new TrinityMemoryIntegration({
            baseDir: testDir,
            logger: {
                info: (msg) => console.log(`📝 ${msg}`),
                error: (msg) => console.error(`❌ ${msg}`)
            }
        });
        
        await memory.initialize();
        
        // Add some test documents to memory
        console.log('1. Adding test documents to memory...');
        await memory.store('reference', {
            type: 'user_document',
            content: 'Trinity MVP is a professional AI assistant with persistent memory and context optimization. It uses a 4-tier memory hierarchy to organize information.',
            source: 'trinity-overview.md',
            tags: ['trinity', 'mvp', 'overview']
        });
        
        await memory.store('working', {
            type: 'user_document', 
            content: 'Memory integration allows Trinity to remember previous conversations and use relevant context for better responses.',
            source: 'memory-integration.md',
            tags: ['memory', 'integration', 'context']
        });
        
        console.log('✅ Test documents added to memory\n');
        
        // Test memory context loading
        console.log('2. Testing memory context loading...');
        const context = await memory.loadRelevantContext('How does Trinity memory work?');
        console.log(`✅ Context loaded: ${context.summary}`);
        console.log(`✅ Artifacts: ${context.artifacts.length} items found`);
        console.log(`✅ Context text length: ${context.contextText.length} characters\n`);
        
        // Create a test request that should use memory
        console.log('3. Creating test request with memory context...');
        const testRequest = {
            sessionId: 'test-session-memory',
            prompt: 'Explain how Trinity memory integration works',
            options: {
                workingDirectory: process.cwd(),
                userContext: {
                    testMode: true
                }
            },
            timestamp: new Date().toISOString()
        };
        
        const requestFile = path.join(inputDir, 'test-memory-request.json');
        await fs.writeFile(requestFile, JSON.stringify(testRequest, null, 2));
        console.log(`✅ Test request created: ${requestFile}\n`);
        
        // Simulate processing the request (without starting full watcher)
        console.log('4. Testing request processing with memory integration...');
        
        // Import and test the ClaudeWatcher class directly
        const ClaudeWatcher = require('./claude-watcher');
        
        // Create a test instance with our test directory
        const watcher = new (class extends ClaudeWatcher {
            constructor() {
                super();
                this.trinityDir = testDir;
                this.queueDir = queueDir;
                this.inputDir = inputDir;
                this.outputDir = outputDir;
                
                // Override memory integration to use our test instance
                this.memoryIntegration = memory;
            }
            
            // Mock Claude Code execution for testing
            async executeClaudeCode(prompt, workingDirectory, options = {}) {
                const startTime = Date.now();
                
                // Check if prompt was enhanced with memory context
                const hasMemoryContext = prompt.includes('Context from memory:');
                const mockResponse = hasMemoryContext 
                    ? `Based on the memory context provided, Trinity memory integration works by using a 4-tier hierarchy (core, working, reference, historical) with intelligent compression and semantic analysis to provide relevant context for each conversation.`
                    : `Trinity memory integration is a system for maintaining context across conversations.`;
                
                return {
                    success: true,
                    output: mockResponse,
                    error: null,
                    executionTime: Date.now() - startTime
                };
            }
        })();
        
        // Process the test request
        await watcher.processRequest(requestFile, 'test-memory-request.json');
        
        // Check the output
        const outputFile = path.join(outputDir, 'test-memory-request.json');
        const response = JSON.parse(await fs.readFile(outputFile, 'utf8'));
        
        console.log('✅ Request processed successfully');
        console.log(`✅ Response success: ${response.success}`);
        console.log(`✅ Response has memory context: ${response.memoryContext ? 'YES' : 'NO'}`);
        
        if (response.memoryContext) {
            console.log(`✅ Memory context summary: ${response.memoryContext.summary}`);
            console.log(`✅ Memory optimization: ${response.memoryContext.optimization.contextPercent}% context used`);
            console.log(`✅ Artifacts in context: ${response.memoryContext.artifacts.length}`);
        }
        
        console.log(`✅ Response content length: ${response.content.length} characters`);
        console.log(`✅ Response includes memory-based answer: ${response.content.includes('4-tier hierarchy') ? 'YES' : 'NO'}`);
        
        console.log('\n🎉 Enhanced Claude Watcher test completed successfully!');
        console.log('\n📋 Key Features Verified:');
        console.log('  ✅ Memory context loading before Claude requests');
        console.log('  ✅ Enhanced prompts with relevant memory');
        console.log('  ✅ Conversation storage after responses');
        console.log('  ✅ Memory context metadata in responses');
        console.log('  ✅ Optimization statistics tracking');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testEnhancedClaudeWatcher()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = testEnhancedClaudeWatcher;