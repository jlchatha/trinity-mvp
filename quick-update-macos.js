#!/usr/bin/env node

/**
 * Quick Update Script for macOS Trinity MVP
 * Manual update when git fails - copies critical files for Context Intelligence
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Trinity MVP Quick Update - Context Intelligence Breakthrough');
console.log('============================================================');
console.log('');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.log('❌ Error: Please run this script from the Trinity MVP root directory');
  console.log('Usage: node quick-update-macos.js');
  process.exit(1);
}

// Read package.json to confirm this is Trinity MVP
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.name !== 'trinity-mvp') {
    console.log('❌ Error: This doesn\'t appear to be Trinity MVP directory');
    process.exit(1);
  }
  console.log(`✅ Found Trinity MVP v${pkg.version}`);
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  process.exit(1);
}

console.log('');

// Define the updated file contents (Context Intelligence breakthrough)
const updatedFiles = {
  'package.json': {
    update: (content) => {
      const pkg = JSON.parse(content);
      pkg.version = '1.1.0'; // Bump version for Context Intelligence
      pkg.description = 'Professional AI assistant with real-time context intelligence and persistent memory';
      return JSON.stringify(pkg, null, 2);
    }
  }
};

// Function to update version and description
function updatePackageJson() {
  try {
    const content = fs.readFileSync('package.json', 'utf8');
    const pkg = JSON.parse(content);
    
    // Update version and description for Context Intelligence breakthrough
    pkg.version = '1.1.0';
    pkg.description = 'Professional AI assistant with real-time context intelligence and persistent memory';
    
    // Add new keywords for Context Intelligence
    if (!pkg.keywords.includes('context-intelligence')) {
      pkg.keywords.push('context-intelligence', 'real-time-metrics', 'token-tracking');
    }
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ Updated package.json to v1.1.0 (Context Intelligence)');
    return true;
  } catch (error) {
    console.log('❌ Failed to update package.json:', error.message);
    return false;
  }
}

// Check for Context Intelligence files
function checkContextIntelligenceFiles() {
  const criticalFiles = [
    'src/ui/context-optimization-panel.js',
    'src/ui/trinity-status-bar.js', 
    'src/ui/trinity-single-window.js',
    'src/electron/trinity-ipc-bridge.js',
    'preload.js'
  ];
  
  console.log('🔍 Checking Context Intelligence files:');
  
  let allFilesExist = true;
  let hasNewPricing = false;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
      
      // Check for new pricing in the file
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('0.00000176') || content.includes('568181') || content.includes('568,181')) {
          hasNewPricing = true;
        }
      } catch (error) {
        // Ignore read errors for binary files
      }
    } else {
      console.log(`❌ ${file} MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  
  if (!allFilesExist) {
    console.log('❌ CRITICAL FILES MISSING');
    console.log('Manual file copy required for Context Intelligence features');
    console.log('');
    console.log('📋 Required Actions:');
    console.log('1. Copy missing files from Linux Trinity installation');
    console.log('2. Restart Trinity MVP');
    console.log('3. Test Context Intelligence panel');
    return false;
  }
  
  if (!hasNewPricing) {
    console.log('⚠️  OLD PRICING DETECTED');
    console.log('Files exist but may not have Context Intelligence breakthrough');
    console.log('Token efficiency may show 66,666 instead of 568,181');
    return false;
  }
  
  console.log('🎉 CONTEXT INTELLIGENCE FILES DETECTED!');
  return true;
}

// Validate Context Intelligence features
function validateContextIntelligence() {
  console.log('🎯 Validating Context Intelligence Features:');
  
  const checks = [
    {
      name: 'Updated Pricing',
      check: () => {
        const files = ['src/ui/context-optimization-panel.js', 'src/electron/trinity-ipc-bridge.js'];
        return files.some(file => {
          if (!fs.existsSync(file)) return false;
          const content = fs.readFileSync(file, 'utf8');
          return content.includes('0.00000176');
        });
      }
    },
    {
      name: 'Real Data Detection',
      check: () => {
        if (!fs.existsSync('src/ui/context-optimization-panel.js')) return false;
        const content = fs.readFileSync('src/ui/context-optimization-panel.js', 'utf8');
        return content.includes('isRealData');
      }
    },
    {
      name: 'IPC Context Bridge',
      check: () => {
        if (!fs.existsSync('src/electron/trinity-ipc-bridge.js')) return false;
        const content = fs.readFileSync('src/electron/trinity-ipc-bridge.js', 'utf8');
        return content.includes('trinity:context:updateMetrics');
      }
    },
    {
      name: 'Context API Exposure',
      check: () => {
        if (!fs.existsSync('preload.js')) return false;
        const content = fs.readFileSync('preload.js', 'utf8');
        return content.includes('updateMetrics:');
      }
    }
  ];
  
  let passed = 0;
  checks.forEach(check => {
    if (check.check()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
    }
  });
  
  console.log('');
  console.log(`📊 Validation: ${passed}/${checks.length} tests passed (${Math.round(passed/checks.length*100)}%)`);
  
  return passed === checks.length;
}

// Main update process
console.log('🔄 Starting Trinity MVP Quick Update...');
console.log('');

// Step 1: Update package.json
updatePackageJson();
console.log('');

// Step 2: Check Context Intelligence files
const filesOk = checkContextIntelligenceFiles();
console.log('');

// Step 3: Validate features
const featuresOk = validateContextIntelligence();
console.log('');

// Summary
if (filesOk && featuresOk) {
  console.log('🎉 UPDATE SUCCESS!');
  console.log('==================');
  console.log('');
  console.log('✅ Context Intelligence breakthrough is installed');
  console.log('✅ Real-time metrics should work');
  console.log('✅ Token efficiency: ~568,181 tokens per $');
  console.log('✅ Accurate pricing enabled');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('1. Restart Trinity MVP');
  console.log('2. Click "Context" in right panel');
  console.log('3. Verify real metrics (not 0%)');
  console.log('4. Test "Optimize Now" button');
  console.log('');
  console.log('🎯 Expected: Token efficiency shows ~568K tokens/$ instead of 66K');
} else {
  console.log('⚠️  UPDATE INCOMPLETE');
  console.log('====================');
  console.log('');
  console.log('❌ Context Intelligence features may not work correctly');
  console.log('❌ Manual file copy from Linux version required');
  console.log('');
  console.log('📋 Manual Update Required:');
  console.log('1. Copy 5 critical files from Linux Trinity');
  console.log('2. Run this script again to validate');
  console.log('3. Restart Trinity and test features');
  console.log('');
  console.log('📞 Contact for assistance with manual file copy');
}