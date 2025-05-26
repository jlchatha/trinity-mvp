#!/usr/bin/env node

/**
 * Direct test of ComplexQueryProcessor
 * Tests the classification and enhancement logic
 */

const ComplexQueryProcessor = require('./src/core/complex-query-processor');

async function testComplexQueryProcessor() {
  console.log('🧪 Testing ComplexQueryProcessor directly...\n');
  
  const processor = new ComplexQueryProcessor({
    logger: {
      info: (msg) => console.log(`[INFO] ${msg}`),
      warn: (msg) => console.log(`[WARN] ${msg}`),
      error: (msg) => console.log(`[ERROR] ${msg}`)
    }
  });
  
  const testQueries = [
    {
      name: "Complex Analytical Query",
      query: "Review your codebase and assess what we are delivering vs what we are promising in README and elsewhere"
    },
    {
      name: "Simple Query",
      query: "What files are in the current directory?"
    },
    {
      name: "Multi-step Operation",
      query: "Analyze the project structure and identify gaps, then provide recommendations"
    }
  ];
  
  for (const test of testQueries) {
    console.log(`\n=== ${test.name} ===`);
    console.log(`Query: "${test.query}"`);
    
    // Test classification
    const needsComplex = processor.needsComplexProcessing(test.query);
    console.log(`Needs Complex Processing: ${needsComplex}`);
    
    if (needsComplex) {
      // Test full processing
      const result = await processor.processComplexQuery(test.query);
      console.log(`Enhanced: ${result.enhanced}`);
      console.log(`Operations: ${JSON.stringify(result.operations, null, 2)}`);
      console.log(`Enhanced Prompt Length: ${result.enhancedPrompt.length} chars`);
      
      if (result.enhancedPrompt.length > 200) {
        console.log(`Enhanced Prompt Preview: "${result.enhancedPrompt.substring(0, 200)}..."`);
      } else {
        console.log(`Enhanced Prompt: "${result.enhancedPrompt}"`);
      }
    }
  }
  
  console.log('\n✅ ComplexQueryProcessor direct test complete');
}

testComplexQueryProcessor().catch(console.error);