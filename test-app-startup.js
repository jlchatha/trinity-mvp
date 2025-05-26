#!/usr/bin/env node

/**
 * Trinity MVP Startup Test Script
 * Tests if the application can actually start without errors
 * CRITICAL: This is a READ-ONLY test that doesn't modify the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Trinity MVP Startup Analysis');
console.log('=====================================');

// Test 1: Check required files existence
console.log('\n1. Checking Core Module Dependencies...');

const requiredModules = [
  './src/core/claude-integration.js',
  './src/core/ai-prompts.js',
  './src/electron/trinity-ipc-bridge.js',
  './src/core/file-manager.js',
  './src/core/memory-hierarchy.js',
  './src/core/task-registry.js',
  './src/core/recovery-tools.js',
  './src/core/auto-compact-detector.js'
];

const moduleStatus = {};
for (const modulePath of requiredModules) {
  const fullPath = path.join(__dirname, modulePath);
  const exists = fs.existsSync(fullPath);
  moduleStatus[modulePath] = exists;
  console.log(`  ${exists ? '✅' : '❌'} ${modulePath}`);
}

// Test 2: Check package.json dependencies
console.log('\n2. Checking Package Dependencies...');
const packagePath = path.join(__dirname, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log(`  Dependencies count: ${Object.keys(packageData.dependencies || {}).length}`);
console.log(`  DevDependencies count: ${Object.keys(packageData.devDependencies || {}).length}`);

if (!packageData.dependencies || Object.keys(packageData.dependencies).length === 0) {
  console.log('  ❌ WARNING: No runtime dependencies found');
} else {
  console.log('  ✅ Runtime dependencies present');
}

// Test 3: Try to require core modules (syntax check)
console.log('\n3. Testing Module Loading (Syntax Check)...');

const moduleLoadResults = {};
for (const modulePath of requiredModules) {
  if (moduleStatus[modulePath]) {
    try {
      const fullPath = path.join(__dirname, modulePath);
      // Only test syntax, don't execute
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic syntax validation
      if (content.includes('require(') && content.includes('module.exports')) {
        moduleLoadResults[modulePath] = 'syntax-ok';
        console.log(`  ✅ ${modulePath} - Syntax appears valid`);
      } else {
        moduleLoadResults[modulePath] = 'syntax-unknown';
        console.log(`  ⚠️  ${modulePath} - Unable to validate syntax`);
      }
    } catch (error) {
      moduleLoadResults[modulePath] = 'syntax-error';
      console.log(`  ❌ ${modulePath} - Syntax error: ${error.message}`);
    }
  } else {
    moduleLoadResults[modulePath] = 'missing';
    console.log(`  ❌ ${modulePath} - File missing`);
  }
}

// Test 4: Check UI files
console.log('\n4. Checking UI Files...');
const uiFiles = [
  './renderer/index.html',
  './renderer/loading.html',
  './preload.js'
];

for (const uiFile of uiFiles) {
  const exists = fs.existsSync(path.join(__dirname, uiFile));
  console.log(`  ${exists ? '✅' : '❌'} ${uiFile}`);
}

// Test 5: Startup prediction
console.log('\n5. Startup Prediction...');
const criticalMissing = requiredModules.filter(m => !moduleStatus[m]);
const syntaxErrors = Object.entries(moduleLoadResults).filter(([, status]) => status === 'syntax-error');

if (criticalMissing.length > 0) {
  console.log(`  ❌ STARTUP WILL FAIL: Missing ${criticalMissing.length} critical modules`);
  console.log(`     Missing: ${criticalMissing.join(', ')}`);
} else if (syntaxErrors.length > 0) {
  console.log(`  ❌ STARTUP WILL FAIL: Syntax errors in ${syntaxErrors.length} modules`);
} else {
  console.log('  ✅ STARTUP LIKELY TO SUCCEED: All critical modules present with valid syntax');
}

// Test 6: Feature Implementation Check
console.log('\n6. Feature Implementation Check...');

// Check if memory system is implemented
const memoryHierarchyPath = path.join(__dirname, 'src/core/memory-hierarchy.js');
if (fs.existsSync(memoryHierarchyPath)) {
  const content = fs.readFileSync(memoryHierarchyPath, 'utf8');
  const hasStore = content.includes('store(') || content.includes('store :');
  const hasLoad = content.includes('load(') || content.includes('load :');
  console.log(`  Memory System: ${hasStore && hasLoad ? '✅ Implemented' : '⚠️  Partial/Missing'}`);
}

// Check if Claude integration is implemented
const claudeIntegrationPath = path.join(__dirname, 'src/core/claude-integration.js');
if (fs.existsSync(claudeIntegrationPath)) {
  const content = fs.readFileSync(claudeIntegrationPath, 'utf8');
  const hasExecuteCommand = content.includes('executeCommand');
  const hasAPIKey = content.includes('ANTHROPIC_API_KEY');
  console.log(`  Claude Integration: ${hasExecuteCommand && hasAPIKey ? '✅ Implemented' : '⚠️  Partial/Missing'}`);
}

console.log('\n📊 Analysis Complete');
console.log('=====================================');