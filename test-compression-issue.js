#!/usr/bin/env node

/**
 * DEBUG: Compression Algorithm Analysis
 * Test the exact compression logic that's destroying conversation content
 */

const IntelligentCompressor = require('./src/core/intelligent-compressor');

function debugCompressionAlgorithm() {
    console.log('🔍 DEBUGGING COMPRESSION ALGORITHM');
    console.log('===================================');
    
    const compressor = new IntelligentCompressor({
        logger: {
            info: (msg) => console.log(`[COMPRESSOR] ${msg}`)
        }
    });
    
    // Test 1: Simple conversation that should NOT be compressed
    console.log('\n📝 TEST 1: Simple Conversation');
    const simpleConversation = "User: What's your name?\n\nAssistant: I'm Claude, an AI assistant created by Anthropic.";
    
    console.log('Original content:');
    console.log(`"${simpleConversation}"`);
    
    const result1 = compressor.compressContent(simpleConversation, 'conversation');
    console.log('\nCompression result:');
    console.log(`Original length: ${result1.originalLength}`);
    console.log(`Compressed content: "${result1.compressedContent}"`);
    console.log(`Compression ratio: ${result1.compressionRatio}`);
    console.log(`Tokens saved: ${result1.tokensSaved}`);
    
    // Test 2: Poem conversation that's getting corrupted
    console.log('\n\n📝 TEST 2: Poem Conversation (Actual corrupted case)');
    const poemConversation = `User: write a 3 line poem
A: Here's a 3-line poem for you:

Gentle waves embrace the shore,
Ocean whispers ancient lore,
Beauty vast forevermore.`;
    
    console.log('Original poem conversation:');
    console.log(`"${poemConversation}"`);
    
    const result2 = compressor.compressContent(poemConversation, 'conversation');
    console.log('\nCompression result:');
    console.log(`Original length: ${result2.originalLength}`);
    console.log(`Compressed content: "${result2.compressedContent}"`);
    console.log(`Compression ratio: ${result2.compressionRatio}`);
    console.log(`Tokens saved: ${result2.tokensSaved}`);
    
    // Test 3: Question about the poem
    console.log('\n\n📝 TEST 3: Question About Poem (The problematic case)');
    const poemQuestionConversation = `User: What was the 2nd line in your poem?

A: The 2nd line in my poem was:

"While seagulls dance in ocean's embrace."`;
    
    console.log('Original question conversation:');
    console.log(`"${poemQuestionConversation}"`);
    
    const result3 = compressor.compressContent(poemQuestionConversation, 'conversation');
    console.log('\nCompression result:');
    console.log(`Original length: ${result3.originalLength}`);
    console.log(`Compressed content: "${result3.compressedContent}"`);
    console.log(`Compression ratio: ${result3.compressionRatio}`);
    console.log(`Tokens saved: ${result3.tokensSaved}`);
    
    // Test 4: Analyze the sentence splitting logic
    console.log('\n\n🔧 TEST 4: Analyze Sentence Splitting Logic');
    console.log('This is what is DESTROYING the conversations!');
    
    const testContent = poemQuestionConversation;
    const sentences = testContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    console.log(`\nOriginal content split into ${sentences.length} sentences:`);
    sentences.forEach((sentence, idx) => {
        console.log(`  ${idx + 1}: "${sentence.trim()}"`);
    });
    
    // Test different compression ratios
    console.log('\n\n📊 TEST 5: Test Different Categories & Compression Ratios');
    
    const categories = ['core', 'working', 'reference', 'historical', 'conversation'];
    const testText = poemConversation;
    
    categories.forEach(category => {
        const result = compressor.compressContent(testText, category);
        console.log(`\n${category.toUpperCase()} category:`);
        console.log(`  Compression ratio: ${result.compressionRatio}`);
        console.log(`  Result length: ${result.compressedContent.length} / ${result.originalLength}`);
        console.log(`  Result preview: "${result.compressedContent.substring(0, 100)}..."`);
    });
}

debugCompressionAlgorithm();
