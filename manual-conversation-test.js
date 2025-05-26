
const path = require('path');
const fs = require('fs');

async function testConversation() {
    try {
        // Test 1: Check if Trinity IPC Bridge exists and loads
        const bridgePath = './src/electron/trinity-ipc-bridge.js';
        if (!fs.existsSync(bridgePath)) {
            throw new Error('Trinity IPC Bridge not found');
        }
        
        console.log('Loading Trinity IPC Bridge...');
        const { TrinityIPCBridge } = require(bridgePath);
        
        console.log('Creating bridge instance...');
        const bridge = new TrinityIPCBridge();
        
        console.log('Testing forwardToClaudeCode method...');
        const result = await bridge.forwardToClaudeCode('What is the capital of France?');
        
        console.log('RESULT:', JSON.stringify(result, null, 2));
        
        // Check if this is a fallback response
        if (typeof result === 'string' && result.includes("I'm Trinity")) {
            console.log('❌ FALLBACK RESPONSE DETECTED');
            console.log('This means the error handling is being triggered');
        } else {
            console.log('✅ PROPER AI RESPONSE RECEIVED');
        }
        
        return result;
        
    } catch (error) {
        console.error('Manual test failed:', error);
        return null;
    }
}

testConversation().catch(console.error);
        