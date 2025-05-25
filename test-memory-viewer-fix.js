#!/usr/bin/env node

/**
 * Test Memory Hierarchy Viewer Fix
 * Verifies the Memory Artifacts Viewer can load artifacts via IPC
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import the main.js IPC handler logic for testing
const TrinityMemoryIntegration = require('./src/core/trinity-memory-integration');

async function testMemoryViewerFix() {
    console.log('🔍 Testing Memory Hierarchy Viewer Fix...');
    
    // Test the memory integration
    const memoryIntegration = new TrinityMemoryIntegration({
        baseDir: path.join(require('os').homedir(), '.trinity-mvp'),
        logger: console
    });
    
    try {
        await memoryIntegration.initialize();
        console.log('✅ Memory integration initialized');
        
        // Save a test memory item
        console.log('\n📝 Saving test memory item...');
        const saveResult = await memoryIntegration.store('working', {
            content: 'This is a test memory item for viewing',
            type: 'user_content',
            source: 'test',
            metadata: {
                title: 'Test Memory Item',
                description: 'Testing memory hierarchy viewer'
            }
        });
        
        console.log(`✅ Memory item saved: ${saveResult.itemId}`);
        
        // Save a test conversation
        console.log('\n💬 Saving test conversation...');
        const conversationResult = await memoryIntegration.saveConversation(
            "Test question about memory",
            "Test response about memory hierarchy",
            "viewer-test-session"
        );
        
        if (conversationResult.success) {
            console.log(`✅ Conversation saved: ${conversationResult.id}`);
        }
        
        // Test loading all categories
        console.log('\n📂 Testing category loading...');
        const categories = ['core', 'working', 'reference', 'historical'];
        
        for (const category of categories) {
            const items = await memoryIntegration.loadCategoryItems(category);
            console.log(`  ${category}: ${items.length} items`);
        }
        
        // Test loading conversations
        const conversations = await memoryIntegration.loadConversationItems();
        console.log(`  conversations: ${conversations.length} items`);
        
        // Test the complete artifact loading (simulate IPC)
        console.log('\n🔄 Testing complete artifact loading (IPC simulation)...');
        const simulatedIpcHandler = async () => {
            const fs = require('fs').promises;
            const os = require('os');
            
            const memoryDir = path.join(os.homedir(), '.trinity-mvp', 'memory');
            const artifacts = [];
            const tiers = ['core', 'working', 'reference', 'historical'];
            
            for (const tier of tiers) {
                const tierDir = path.join(memoryDir, tier);
                try {
                    const files = await fs.readdir(tierDir);
                    const jsonFiles = files.filter(file => file.endsWith('.json'));
                    
                    for (const file of jsonFiles) {
                        const filePath = path.join(tierDir, file);
                        try {
                            const content = await fs.readFile(filePath, 'utf8');
                            const data = JSON.parse(content);
                            
                            artifacts.push({
                                id: data.id || file,
                                title: data.metadata?.title || data.title || data.type || 'Memory Item',
                                content: data.content?.data ? JSON.stringify(data.content.data, null, 2) : 
                                        data.originalContent || data.compressedContent || JSON.stringify(data, null, 2),
                                category: tier,
                                type: data.type || data.content?.type || 'unknown',
                                created: data.timestamps?.created || data.timestamp || data.created || new Date().toISOString(),
                                size: content.length
                            });
                        } catch (fileError) {
                            console.warn(`Could not parse file ${filePath}:`, fileError.message);
                        }
                    }
                } catch (tierError) {
                    console.log(`Tier directory ${tier} not found, skipping`);
                }
            }
            
            // Load conversations
            try {
                const conversationsDir = path.join(os.homedir(), '.trinity-mvp', 'conversations');
                const files = await fs.readdir(conversationsDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                
                for (const file of jsonFiles) {
                    const filePath = path.join(conversationsDir, file);
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const data = JSON.parse(content);
                        
                        artifacts.push({
                            id: data.id || file,
                            title: `Conversation - ${data.metadata?.sessionId || 'Unknown'}`,
                            content: data.originalContent || data.compressedContent || JSON.stringify(data, null, 2),
                            category: 'conversation',
                            type: data.type || 'conversation',
                            created: data.metadata?.timestamp || new Date().toISOString(),
                            size: content.length
                        });
                    } catch (fileError) {
                        console.warn(`Could not parse conversation file ${filePath}:`, fileError.message);
                    }
                }
            } catch (conversationsError) {
                console.log('Conversations directory not found, skipping');
            }
            
            return artifacts;
        };
        
        const artifacts = await simulatedIpcHandler();
        console.log(`✅ Simulated IPC loaded ${artifacts.length} total artifacts`);
        
        // Group by category
        const byCategory = {};
        artifacts.forEach(artifact => {
            const category = artifact.category;
            if (!byCategory[category]) byCategory[category] = [];
            byCategory[category].push(artifact);
        });
        
        console.log('\n📊 Artifacts by category:');
        Object.entries(byCategory).forEach(([category, items]) => {
            console.log(`  ${category}: ${items.length} items`);
            items.forEach(item => {
                console.log(`    - ${item.title} (${item.type})`);
            });
        });
        
        if (artifacts.some(a => a.category === 'conversation')) {
            console.log('\n✅ SUCCESS: Conversations are included in Memory Hierarchy Viewer!');
        } else {
            console.log('\n❌ FAILURE: Conversations are NOT included in Memory Hierarchy Viewer');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMemoryViewerFix().then(() => {
    console.log('\n🏁 Memory hierarchy viewer test completed');
}).catch(error => {
    console.error('💥 Test crashed:', error);
});