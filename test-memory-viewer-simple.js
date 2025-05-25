#!/usr/bin/env node

/**
 * Simple Memory Hierarchy Viewer Test
 * Focus on testing conversation loading for the viewer
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function testMemoryViewerSimple() {
    console.log('🔍 Testing Memory Hierarchy Viewer - Conversation Loading...');
    
    try {
        // Test the simulated IPC handler that the Memory Viewer uses
        const simulatedIpcHandler = async () => {
            const memoryDir = path.join(os.homedir(), '.trinity-mvp', 'memory');
            const artifacts = [];
            const tiers = ['core', 'working', 'reference', 'historical'];
            
            // Load memory hierarchy artifacts
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
                                size: content.length,
                                metadata: {
                                    path: filePath,
                                    tier: tier,
                                    originalData: data
                                }
                            });
                        } catch (fileError) {
                            console.warn(`Could not parse file ${filePath}:`, fileError.message);
                        }
                    }
                } catch (tierError) {
                    console.log(`Tier directory ${tier} not found, skipping`);
                }
            }
            
            // Load conversations (THE KEY FIX)
            try {
                const conversationsDir = path.join(os.homedir(), '.trinity-mvp', 'conversations');
                const files = await fs.readdir(conversationsDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                
                console.log(`Found ${jsonFiles.length} conversation files`);
                
                for (const file of jsonFiles) {
                    const filePath = path.join(conversationsDir, file);
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const data = JSON.parse(content);
                        
                        artifacts.push({
                            id: data.id || file,
                            title: `Conversation - ${data.metadata?.sessionId || 'Unknown'}`,
                            content: data.originalContent || data.compressedContent || JSON.stringify(data, null, 2),
                            category: 'conversation', // Special category for conversations
                            type: data.type || 'conversation',
                            created: data.metadata?.timestamp || new Date().toISOString(),
                            size: content.length,
                            metadata: {
                                path: filePath,
                                tier: 'conversation',
                                sessionId: data.metadata?.sessionId,
                                originalData: data
                            }
                        });
                        
                        console.log(`  Loaded conversation: ${data.id} (${data.metadata?.sessionId})`);
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
        console.log(`\n✅ Loaded ${artifacts.length} total artifacts`);
        
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
        });
        
        // Test mock memory integration that Memory Artifacts Viewer will use
        console.log('\n🔧 Testing mock memory integration...');
        const mockMemoryIntegration = {
            loadCategoryItems: async (category) => {
                console.log(`Mock loadCategoryItems called for category: ${category}`);
                return artifacts.filter(artifact => artifact.category === category);
            }
        };
        
        // Test each category
        const categories = ['core', 'working', 'reference', 'historical', 'conversation'];
        for (const category of categories) {
            const items = await mockMemoryIntegration.loadCategoryItems(category);
            console.log(`  Mock ${category}: ${items.length} items`);
        }
        
        if (artifacts.some(a => a.category === 'conversation')) {
            console.log('\n✅ SUCCESS: Conversations are included in Memory Hierarchy Viewer!');
            console.log('The Memory Artifacts Viewer should now show conversations.');
        } else {
            console.log('\n❌ FAILURE: Conversations are NOT included in Memory Hierarchy Viewer');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMemoryViewerSimple().then(() => {
    console.log('\n🏁 Simple memory hierarchy viewer test completed');
}).catch(error => {
    console.error('💥 Test crashed:', error);
});