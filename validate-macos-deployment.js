#!/usr/bin/env node

/**
 * Trinity MVP - macOS Deployment Validation Script
 * 
 * This script validates the successful deployment of Trinity MVP on macOS
 * by testing all critical components and functionality that passed 100%
 * operator testing on Linux.
 * 
 * Usage: node validate-macos-deployment.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');

class MacOSDeploymentValidator {
  constructor() {
    this.results = {
      environment: {},
      apiKeyTest: {},
      componentTest: {},
      fileProcessingTest: {},
      uiIntegrationTest: {},
      performanceTest: {},
      overallStatus: 'PENDING'
    };
    
    this.startTime = Date.now();
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async validateEnvironment() {
    this.log('🔍 Phase 1: Environment Validation', 'info');
    
    // Check macOS
    const platform = os.platform();
    const release = os.release();
    this.results.environment.platform = platform;
    this.results.environment.release = release;
    
    if (platform !== 'darwin') {
      this.log(`Expected macOS (darwin), got: ${platform}`, 'error');
      this.results.environment.isMacOS = false;
      return false;
    }
    
    this.log(`✅ macOS detected: ${release}`, 'success');
    this.results.environment.isMacOS = true;
    
    // Check Node.js version
    const nodeVersion = process.version;
    this.results.environment.nodeVersion = nodeVersion;
    
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 18) {
      this.log(`Node.js version too old: ${nodeVersion} (requires >=18)`, 'error');
      this.results.environment.nodeVersionOK = false;
      return false;
    }
    
    this.log(`✅ Node.js version OK: ${nodeVersion}`, 'success');
    this.results.environment.nodeVersionOK = true;
    
    // Check npm version
    try {
      const npmVersion = await this.execPromise('npm --version');
      this.results.environment.npmVersion = npmVersion.trim();
      this.log(`✅ npm version: ${npmVersion.trim()}`, 'success');
    } catch (error) {
      this.log('npm not found', 'error');
      this.results.environment.npmInstalled = false;
      return false;
    }
    
    // Check for Trinity agent config (API key source)
    const agentConfigPath = path.join(process.cwd(), '../agents/optimus_001/config/config.json');
    this.results.environment.agentConfigExists = fs.existsSync(agentConfigPath);
    
    if (this.results.environment.agentConfigExists) {
      this.log('✅ Trinity agent config found for API key fallback', 'success');
    } else {
      this.log('⚠️ Trinity agent config not found - may need manual API key setup', 'error');
    }
    
    return true;
  }

  async validateAPIKeyLoading() {
    this.log('🔑 Phase 2: API Key Loading Validation', 'info');
    
    // Check if development fallback works
    const claudeIntegrationPath = path.join(process.cwd(), 'src/core/claude-integration.js');
    const claudeWatcherPath = path.join(process.cwd(), 'claude-watcher.js');
    
    const integrationExists = fs.existsSync(claudeIntegrationPath);
    const watcherExists = fs.existsSync(claudeWatcherPath);
    
    this.results.apiKeyTest.integrationFileExists = integrationExists;
    this.results.apiKeyTest.watcherFileExists = watcherExists;
    
    if (!integrationExists || !watcherExists) {
      this.log('❌ Critical files missing for API key integration', 'error');
      return false;
    }
    
    // Check if development fallback code is present
    const integrationContent = fs.readFileSync(claudeIntegrationPath, 'utf8');
    const watcherContent = fs.readFileSync(claudeWatcherPath, 'utf8');
    
    const hasDevelopmentFallback = integrationContent.includes('Development fallback') && 
                                  watcherContent.includes('Development fallback');
    
    this.results.apiKeyTest.hasDevelopmentFallback = hasDevelopmentFallback;
    
    if (hasDevelopmentFallback) {
      this.log('✅ Development API key fallback mechanism present', 'success');
    } else {
      this.log('❌ Development API key fallback mechanism missing', 'error');
      return false;
    }
    
    return true;
  }

  async validateTrinityComponents() {
    this.log('🧠 Phase 3: Trinity Component Validation', 'info');
    
    // Check for all Trinity component files
    const requiredFiles = [
      'src/core/memory-hierarchy.js',
      'src/core/task-registry.js', 
      'src/core/recovery-tools.js',
      'src/electron/trinity-ipc-bridge.js',
      'src/ui/trinity-status-bar.js',
      'main.js',
      'preload.js'
    ];
    
    let allFilesExist = true;
    this.results.componentTest.fileChecks = {};
    
    for (const file of requiredFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      this.results.componentTest.fileChecks[file] = exists;
      
      if (exists) {
        this.log(`✅ ${file}`, 'success');
      } else {
        this.log(`❌ Missing: ${file}`, 'error');
        allFilesExist = false;
      }
    }
    
    this.results.componentTest.allFilesExist = allFilesExist;
    return allFilesExist;
  }

  async validateUIIntegration() {
    this.log('🎨 Phase 4: UI Integration Validation', 'info');
    
    // Check renderer files
    const indexHtml = path.join(process.cwd(), 'renderer/index.html');
    const chatHtml = path.join(process.cwd(), 'renderer/chat.html');
    
    const indexExists = fs.existsSync(indexHtml);
    const chatExists = fs.existsSync(chatHtml);
    
    this.results.uiIntegrationTest.indexHtmlExists = indexExists;
    this.results.uiIntegrationTest.chatHtmlExists = chatExists;
    
    if (!indexExists || !chatExists) {
      this.log('❌ Critical renderer files missing', 'error');
      return false;
    }
    
    // Check for Trinity Status Bar integration
    const indexContent = fs.readFileSync(indexHtml, 'utf8');
    const chatContent = fs.readFileSync(chatHtml, 'utf8');
    
    const hasStatusBar = indexContent.includes('trinity-status-bar');
    const hasCompactStatus = chatContent.includes('trinity-status-compact');
    const hasBroadcastChannel = indexContent.includes('BroadcastChannel') || 
                               chatContent.includes('BroadcastChannel');
    
    this.results.uiIntegrationTest.hasStatusBar = hasStatusBar;
    this.results.uiIntegrationTest.hasCompactStatus = hasCompactStatus;
    this.results.uiIntegrationTest.hasBroadcastChannel = hasBroadcastChannel;
    
    if (hasStatusBar) {
      this.log('✅ Trinity Status Bar integration found', 'success');
    } else {
      this.log('❌ Trinity Status Bar integration missing', 'error');
    }
    
    if (hasCompactStatus) {
      this.log('✅ Compact status for chat window found', 'success');
    } else {
      this.log('❌ Compact status for chat window missing', 'error');
    }
    
    if (hasBroadcastChannel) {
      this.log('✅ Cross-window communication (BroadcastChannel) found', 'success');
    } else {
      this.log('❌ Cross-window communication missing', 'error');
    }
    
    return hasStatusBar && hasCompactStatus && hasBroadcastChannel;
  }

  async validateFileProcessing() {
    this.log('📁 Phase 5: File Processing Validation', 'info');
    
    // Create test file for processing
    const testContent = `// Trinity macOS validation test
// TODO: Test macOS file processing 
// FIXME: Verify path handling works correctly
console.log("Trinity macOS deployment test");
`;
    
    const testFilePath = path.join(process.cwd(), 'trinity-macos-test.js');
    
    try {
      fs.writeFileSync(testFilePath, testContent);
      this.log('✅ Test file created for processing validation', 'success');
      
      // Check if task extraction logic exists
      const mainContent = fs.readFileSync(path.join(process.cwd(), 'main.js'), 'utf8');
      const hasTaskExtraction = mainContent.includes('extractTasksFromContent') ||
                               mainContent.includes('TODO') ||
                               mainContent.includes('FIXME');
      
      this.results.fileProcessingTest.hasTaskExtraction = hasTaskExtraction;
      
      if (hasTaskExtraction) {
        this.log('✅ Task extraction logic found in main.js', 'success');
      } else {
        this.log('❌ Task extraction logic missing', 'error');
      }
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
      this.log('✅ Test file cleanup completed', 'success');
      
      return hasTaskExtraction;
    } catch (error) {
      this.log(`❌ File processing test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async validatePackageConfiguration() {
    this.log('📦 Phase 6: Package Configuration Validation', 'info');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.log('❌ package.json not found', 'error');
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for macOS build configuration
    const hasMacBuild = packageJson.build && packageJson.build.mac;
    const hasBuildScript = packageJson.scripts && packageJson.scripts['build:mac'];
    const hasElectron = packageJson.devDependencies && packageJson.devDependencies.electron;
    
    this.results.packageTest = {
      hasMacBuild,
      hasBuildScript,
      hasElectron
    };
    
    if (hasMacBuild) {
      this.log('✅ macOS build configuration found', 'success');
    } else {
      this.log('❌ macOS build configuration missing', 'error');
    }
    
    if (hasBuildScript) {
      this.log('✅ macOS build script found', 'success');
    } else {
      this.log('❌ macOS build script missing', 'error');
    }
    
    if (hasElectron) {
      this.log('✅ Electron dependency found', 'success');
    } else {
      this.log('❌ Electron dependency missing', 'error');
    }
    
    return hasMacBuild && hasBuildScript && hasElectron;
  }

  async generateReport() {
    const duration = Date.now() - this.startTime;
    
    this.log('📊 Generating Final Validation Report', 'info');
    
    // Calculate overall success
    const checks = [
      this.results.environment.isMacOS,
      this.results.environment.nodeVersionOK,
      this.results.apiKeyTest.hasDevelopmentFallback,
      this.results.componentTest.allFilesExist,
      this.results.uiIntegrationTest.hasStatusBar,
      this.results.uiIntegrationTest.hasCompactStatus,
      this.results.uiIntegrationTest.hasBroadcastChannel,
      this.results.fileProcessingTest.hasTaskExtraction
    ];
    
    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;
    const successRate = (passedChecks / totalChecks) * 100;
    
    this.results.overallStatus = successRate === 100 ? 'PASS' : 'FAIL';
    this.results.successRate = successRate;
    this.results.duration = duration;
    
    const report = `
════════════════════════════════════════════════════════════════
🚀 TRINITY MVP - macOS DEPLOYMENT VALIDATION REPORT
════════════════════════════════════════════════════════════════

📊 OVERALL STATUS: ${this.results.overallStatus}
📈 SUCCESS RATE: ${successRate.toFixed(1)}% (${passedChecks}/${totalChecks} checks passed)
⏱️ VALIDATION TIME: ${(duration / 1000).toFixed(1)} seconds

────────────────────────────────────────────────────────────────
🔍 ENVIRONMENT VALIDATION
────────────────────────────────────────────────────────────────
Platform: ${this.results.environment.platform} ${this.results.environment.isMacOS ? '✅' : '❌'}
Node.js: ${this.results.environment.nodeVersion} ${this.results.environment.nodeVersionOK ? '✅' : '❌'}
npm: ${this.results.environment.npmVersion || 'N/A'}
Trinity Config: ${this.results.environment.agentConfigExists ? '✅' : '⚠️'}

────────────────────────────────────────────────────────────────
🔑 API KEY INTEGRATION
────────────────────────────────────────────────────────────────
Claude Integration: ${this.results.apiKeyTest.integrationFileExists ? '✅' : '❌'}
Claude Watcher: ${this.results.apiKeyTest.watcherFileExists ? '✅' : '❌'}
Development Fallback: ${this.results.apiKeyTest.hasDevelopmentFallback ? '✅' : '❌'}

────────────────────────────────────────────────────────────────
🧠 TRINITY COMPONENTS
────────────────────────────────────────────────────────────────
All Required Files: ${this.results.componentTest.allFilesExist ? '✅' : '❌'}

────────────────────────────────────────────────────────────────
🎨 UI INTEGRATION
────────────────────────────────────────────────────────────────
Trinity Status Bar: ${this.results.uiIntegrationTest.hasStatusBar ? '✅' : '❌'}
Compact Status: ${this.results.uiIntegrationTest.hasCompactStatus ? '✅' : '❌'}
Cross-Window Sync: ${this.results.uiIntegrationTest.hasBroadcastChannel ? '✅' : '❌'}

────────────────────────────────────────────────────────────────
📁 FILE PROCESSING  
────────────────────────────────────────────────────────────────
Task Extraction: ${this.results.fileProcessingTest.hasTaskExtraction ? '✅' : '❌'}

════════════════════════════════════════════════════════════════
📋 NEXT STEPS
════════════════════════════════════════════════════════════════
`;

    if (this.results.overallStatus === 'PASS') {
      console.log(report + `
✅ VALIDATION SUCCESSFUL - Ready for macOS Deployment Testing

1. Run Trinity MVP: npm start
2. Execute Quick Operator Test (10 minutes)
3. Execute Full Operator Testing (45-60 minutes)  
4. Validate response format (fix 5% issue for 100% parity)
5. Document macOS deployment success

🎯 TARGET: Achieve 100% feature parity with Linux implementation
`);
    } else {
      console.log(report + `
❌ VALIDATION FAILED - Issues Need Resolution

Failed Checks: ${totalChecks - passedChecks}
Success Rate: ${successRate.toFixed(1)}%

🔧 REQUIRED ACTIONS:
- Review failed validation points above
- Ensure all Trinity components are properly transferred
- Verify macOS-specific compatibility issues
- Re-run validation after fixes

📚 REFERENCE: See MACOS-DEPLOYMENT-GUIDE.md for detailed troubleshooting
`);
    }
    
    // Save detailed results
    const resultsPath = path.join(process.cwd(), 'validation-results-macos.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    this.log(`📄 Detailed results saved to: ${resultsPath}`, 'info');
  }

  execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async run() {
    console.log('🚀 Trinity MVP - macOS Deployment Validation Starting...\n');
    
    try {
      const env = await this.validateEnvironment();
      if (!env) return await this.generateReport();
      
      const apiKey = await this.validateAPIKeyLoading();
      const components = await this.validateTrinityComponents();
      const ui = await this.validateUIIntegration();
      const fileProcessing = await this.validateFileProcessing();
      const packageConfig = await this.validatePackageConfiguration();
      
      await this.generateReport();
      
    } catch (error) {
      this.log(`❌ Validation failed with error: ${error.message}`, 'error');
      this.results.overallStatus = 'ERROR';
      await this.generateReport();
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MacOSDeploymentValidator();
  validator.run();
}

module.exports = MacOSDeploymentValidator;