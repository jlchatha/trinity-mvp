#!/usr/bin/env node

/**
 * Trinity MVP Feature Verification Test
 * Verifies if promised website features are actually implemented
 * CRITICAL: This is a READ-ONLY test that doesn't modify the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Trinity MVP Feature Verification');
console.log('====================================');

// Website promises to verify
const websitePromises = {
  'Persistent Memory Across Sessions': {
    description: 'Claims to remember projects and preferences across sessions',
    testFiles: ['src/core/memory-hierarchy.js', 'src/core/trinity-memory-integration.js'],
    requiredMethods: ['store', 'retrieve', 'loadRelevantContext']
  },
  'Local File System Integration': {
    description: 'Can read/write/modify local files',
    testFiles: ['src/core/file-manager.js'],
    requiredMethods: ['read', 'write', 'modify']
  },
  'Claude Code Integration': {
    description: '4-6 second response times with local system access',
    testFiles: ['src/core/claude-integration.js'],
    requiredMethods: ['executeCommand', 'executeBackgroundTask']
  },
  'Real-time Memory Usage': {
    description: 'Shows real-time memory usage and conversation accuracy',
    testFiles: ['src/ui/memory-explorer-panel.js'],
    requiredMethods: ['getMemoryStats', 'loadMemoryArtifacts']
  },
  'Context Optimization': {
    description: 'Real-time token usage analytics with intelligent optimization',
    testFiles: ['src/core/context-meter.js', 'src/ui/context-optimization-panel.js'],
    requiredMethods: ['optimize', 'getMetrics']
  },
  'Professional Interface': {
    description: 'Unified dashboard with memory explorer',
    testFiles: ['renderer/index.html', 'src/ui/trinity-single-window.js'],
    requiredElements: ['chat', 'memory-explorer', 'status']
  }
};

console.log('\n🧪 Testing Promised Features...\n');

const results = {};

for (const [featureName, feature] of Object.entries(websitePromises)) {
  console.log(`📋 Testing: ${featureName}`);
  console.log(`   Promise: ${feature.description}`);
  
  const featureResult = {
    filesFound: 0,
    totalFiles: feature.testFiles.length,
    methodsFound: 0,
    totalMethods: feature.requiredMethods?.length || 0,
    elementsFound: 0,
    totalElements: feature.requiredElements?.length || 0,
    implementation: 'none'
  };
  
  // Test file existence and content
  for (const testFile of feature.testFiles) {
    const filePath = path.join(__dirname, testFile);
    if (fs.existsSync(filePath)) {
      featureResult.filesFound++;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for required methods
      if (feature.requiredMethods) {
        for (const method of feature.requiredMethods) {
          if (content.includes(method + '(') || content.includes(method + ' (') || content.includes(method + ':')) {
            featureResult.methodsFound++;
          }
        }
      }
      
      // Check for required elements (HTML)
      if (feature.requiredElements) {
        for (const element of feature.requiredElements) {
          if (content.includes(element) || content.includes(element.replace('-', '_'))) {
            featureResult.elementsFound++;
          }
        }
      }
      
      console.log(`   ✅ Found file: ${testFile}`);
    } else {
      console.log(`   ❌ Missing file: ${testFile}`);
    }
  }
  
  // Calculate implementation level
  const fileCompleteness = featureResult.filesFound / featureResult.totalFiles;
  const methodCompleteness = featureResult.totalMethods > 0 ? featureResult.methodsFound / featureResult.totalMethods : 1;
  const elementCompleteness = featureResult.totalElements > 0 ? featureResult.elementsFound / featureResult.totalElements : 1;
  
  const overallCompleteness = (fileCompleteness + methodCompleteness + elementCompleteness) / 3;
  
  if (overallCompleteness >= 0.8) {
    featureResult.implementation = 'implemented';
    console.log(`   ✅ IMPLEMENTED (${Math.round(overallCompleteness * 100)}%)`);
  } else if (overallCompleteness >= 0.4) {
    featureResult.implementation = 'partial';
    console.log(`   ⚠️  PARTIAL (${Math.round(overallCompleteness * 100)}%)`);
  } else {
    featureResult.implementation = 'missing';
    console.log(`   ❌ MISSING/BROKEN (${Math.round(overallCompleteness * 100)}%)`);
  }
  
  console.log(`   📊 Files: ${featureResult.filesFound}/${featureResult.totalFiles}, Methods: ${featureResult.methodsFound}/${featureResult.totalMethods}, Elements: ${featureResult.elementsFound}/${featureResult.totalElements}\n`);
  
  results[featureName] = featureResult;
}

// Summary report
console.log('📊 FEATURE IMPLEMENTATION SUMMARY');
console.log('==================================');

const implemented = Object.values(results).filter(r => r.implementation === 'implemented').length;
const partial = Object.values(results).filter(r => r.implementation === 'partial').length;
const missing = Object.values(results).filter(r => r.implementation === 'missing').length;
const total = Object.keys(results).length;

console.log(`✅ Fully Implemented: ${implemented}/${total} (${Math.round(implemented/total * 100)}%)`);
console.log(`⚠️  Partially Implemented: ${partial}/${total} (${Math.round(partial/total * 100)}%)`);
console.log(`❌ Missing/Broken: ${missing}/${total} (${Math.round(missing/total * 100)}%)`);

console.log('\n🎯 FEATURE-BY-FEATURE BREAKDOWN:');
for (const [featureName, result] of Object.entries(results)) {
  const icon = result.implementation === 'implemented' ? '✅' : 
               result.implementation === 'partial' ? '⚠️' : '❌';
  console.log(`${icon} ${featureName}: ${result.implementation.toUpperCase()}`);
}

// Critical gaps analysis
console.log('\n⚠️ CRITICAL GAPS IDENTIFIED:');
const criticalFeatures = ['Persistent Memory Across Sessions', 'Claude Code Integration', 'Professional Interface'];
const criticalIssues = [];

for (const criticalFeature of criticalFeatures) {
  const result = results[criticalFeature];
  if (result && result.implementation !== 'implemented') {
    criticalIssues.push(`${criticalFeature}: ${result.implementation}`);
  }
}

if (criticalIssues.length === 0) {
  console.log('✅ No critical gaps found - core features are implemented');
} else {
  console.log('❌ Critical gaps found:');
  criticalIssues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n🏁 Analysis Complete');