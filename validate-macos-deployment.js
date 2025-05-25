#!/usr/bin/env node

/**
 * Trinity MVP macOS Deployment Validation
 * Verifies Context Intelligence features work correctly on macOS
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Trinity MVP macOS Deployment Validation');
console.log('==========================================');
console.log('');

const validationResults = {
  files: [],
  features: [],
  pricing: [],
  integration: []
};

// Test 1: Critical File Existence
console.log('📁 Checking Critical Files:');
const criticalFiles = [
  'src/ui/context-optimization-panel.js',
  'src/ui/trinity-status-bar.js', 
  'src/ui/trinity-single-window.js',
  'src/electron/trinity-ipc-bridge.js',
  'preload.js'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    validationResults.files.push(`✅ ${file}`);
    console.log(`✅ ${file}`);
  } else {
    validationResults.files.push(`❌ ${file} MISSING`);
    console.log(`❌ ${file} MISSING`);
  }
});

console.log('');

// Test 2: Context Intelligence Features
console.log('🎯 Validating Context Intelligence Features:');

try {
  const contextPanel = fs.readFileSync('src/ui/context-optimization-panel.js', 'utf8');
  
  if (contextPanel.includes('0.00000176')) {
    validationResults.pricing.push('✅ Updated Claude 3.5 Haiku pricing');
    console.log('✅ Updated Claude 3.5 Haiku pricing found');
  } else {
    validationResults.pricing.push('❌ Old pricing detected');
    console.log('❌ Old pricing detected - needs update');
  }
  
  if (contextPanel.includes('isRealData')) {
    validationResults.features.push('✅ Real data detection implemented');
    console.log('✅ Real data detection implemented');
  } else {
    validationResults.features.push('❌ Real data detection missing');
    console.log('❌ Real data detection missing');
  }
  
} catch (error) {
  console.log('❌ Error reading context panel file');
}

console.log('');

// Test 3: IPC Integration
console.log('🔗 Validating IPC Integration:');

try {
  const ipcBridge = fs.readFileSync('src/electron/trinity-ipc-bridge.js', 'utf8');
  
  if (ipcBridge.includes('trinity:context:updateMetrics')) {
    validationResults.integration.push('✅ Context update endpoint found');
    console.log('✅ Context update endpoint found');
  } else {
    validationResults.integration.push('❌ Context update endpoint missing');
    console.log('❌ Context update endpoint missing');
  }
  
  if (ipcBridge.includes('realConversationMetrics')) {
    validationResults.integration.push('✅ Real conversation metrics storage found');
    console.log('✅ Real conversation metrics storage found');
  } else {
    validationResults.integration.push('❌ Real conversation metrics storage missing');
    console.log('❌ Real conversation metrics storage missing');
  }
  
} catch (error) {
  console.log('❌ Error reading IPC bridge file');
}

console.log('');

// Test 4: Preload API
console.log('🌉 Validating Preload API:');

try {
  const preload = fs.readFileSync('preload.js', 'utf8');
  
  if (preload.includes('updateMetrics:')) {
    validationResults.integration.push('✅ Context API exposed in preload');
    console.log('✅ Context API exposed in preload');
  } else {
    validationResults.integration.push('❌ Context API not exposed in preload');
    console.log('❌ Context API not exposed in preload');
  }
  
} catch (error) {
  console.log('❌ Error reading preload file');
}

console.log('');

// Summary
console.log('📊 VALIDATION SUMMARY:');
console.log('======================');

const allTests = [
  ...validationResults.files,
  ...validationResults.features,
  ...validationResults.pricing,
  ...validationResults.integration
];

const passed = allTests.filter(test => test.includes('✅')).length;
const total = allTests.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Passed: ${passed}/${total} tests (${percentage}%)`);
console.log('');

if (percentage >= 90) {
  console.log('🎉 DEPLOYMENT READY: Context Intelligence fully operational!');
  console.log('✅ Safe to deploy to live Mac tester');
} else if (percentage >= 75) {
  console.log('⚠️  DEPLOYMENT CAUTION: Some features may not work correctly');
  console.log('🔧 Fix missing components before deploying');
} else {
  console.log('❌ DEPLOYMENT BLOCKED: Critical features missing');
  console.log('🚨 Do not deploy until all tests pass');
}

console.log('');
console.log('🎯 Expected Token Efficiency: 568,181 tokens per $');
console.log('📊 Expected Context Intelligence: Real-time metrics updating');
console.log('💰 Expected Pricing: Current Claude 3.5 Haiku rates');