#!/usr/bin/env node

/**
 * TEST: Compression Fix Validation
 * Verify that conversations are no longer being compressed and corrupted
 */

const IntelligentCompressor = require('./src/core/intelligent-compressor');

function testCompressionFix() {
    console.log('🔧 TESTING COMPRESSION FIX');
    console.log('============================');
    
    const compressor = new IntelligentCompressor({
        logger: {
            info: (msg) => console.log(`[COMPRESSOR] ${msg}`)
        }
    });
    
    // Test the problematic conversation that was getting corrupted
    console.log('\n📝 TEST: Previously Corrupted Conversation');
    const problematicConversation = `User: What was the 2nd line in your poem?

A: The 2nd line in my poem was:

"While seagulls dance in ocean's embrace."`;
    
    console.log('Original content:');
    console.log(`"${problematicConversation}"`);
    
    const result = compressor.compressContent(problematicConversation, 'conversation');
    
    console.log('\n✅ COMPRESSION FIX RESULT:');
    console.log(`Original length: ${result.originalLength}`);
    console.log(`Compressed content: "${result.compressedContent}"`);
    console.log(`Compression ratio: ${result.compressionRatio}`);
    console.log(`Tokens saved: ${result.tokensSaved}`);
    
    // Validation
    const isContentPreserved = result.compressedContent === problematicConversation;
    const isNotCompressed = result.compressionRatio === 1.0;
    const noTokensLost = result.tokensSaved === 0;
    
    console.log('\n🔍 VALIDATION RESULTS:');
    console.log(`✅ Content preserved: ${isContentPreserved ? 'YES' : 'NO'}`);
    console.log(`✅ No compression applied: ${isNotCompressed ? 'YES' : 'NO'}`);
    console.log(`✅ No data loss: ${noTokensLost ? 'YES' : 'NO'}`);
    
    if (isContentPreserved && isNotCompressed && noTokensLost) {
        console.log('\n🎉 SUCCESS: Conversation compression fix is working!');
        console.log('Conversations will now preserve full context and structure.');
    } else {
        console.log('\n❌ FAILURE: Fix is not working correctly');
    }
    
    // Test that other content types still get compressed
    console.log('\n\n📄 TEST: Non-Conversation Content Still Compressed');
    const documentContent = `This is a long document with multiple sentences. It contains various information that could be compressed. The compression algorithm should still work for documents and other content types. This sentence provides additional content for testing compression ratios.`;
    
    const docResult = compressor.compressContent(documentContent, 'reference');
    console.log(`Document compression ratio: ${docResult.compressionRatio}`);
    console.log(`Document was compressed: ${docResult.compressionRatio < 1.0 ? 'YES' : 'NO'}`);
    
    if (docResult.compressionRatio < 1.0) {
        console.log('✅ SUCCESS: Non-conversation content still gets compressed');
    } else {
        console.log('⚠️  WARNING: Document compression may not be working as expected');
    }
}

testCompressionFix();