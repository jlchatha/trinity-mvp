#!/usr/bin/env node

// Trinity MVP Health Check Script
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const TRINITY_DIR = path.join(os.homedir(), '.trinity-mvp');

class HealthCheck {
  constructor() {
    this.checks = [];
    this.results = {};
  }

  async run() {
    console.log('Trinity MVP Health Check');
    console.log('========================\n');

    await this.checkNodeVersion();
    await this.checkTrinityDirectories();
    await this.checkClaudeCode();
    await this.checkAPIKey();
    await this.checkDependencies();

    this.printSummary();
  }

  async checkNodeVersion() {
    console.log('Checking Node.js version...');
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      this.pass('Node.js', `${version} (>=18 required)`);
    } else {
      this.fail('Node.js', `${version} - Please upgrade to Node.js 18+`);
    }
  }

  async checkTrinityDirectories() {
    console.log('Checking Trinity directories...');
    const requiredDirs = [
      'queue/input',
      'queue/processing', 
      'queue/output',
      'queue/failed',
      'sessions',
      'logs'
    ];

    let allExist = true;
    for (const dir of requiredDirs) {
      const fullPath = path.join(TRINITY_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        allExist = false;
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`  Created: ${fullPath}`);
        } catch (error) {
          this.fail('Directories', `Cannot create ${fullPath}: ${error.message}`);
          return;
        }
      }
    }

    if (allExist) {
      this.pass('Directories', 'All required directories exist');
    } else {
      this.pass('Directories', 'Missing directories created');
    }
  }

  async checkClaudeCode() {
    console.log('Checking Claude Code installation...');
    
    return new Promise((resolve) => {
      const command = process.platform === 'win32' ? 'wsl claude --version' : 'claude --version';
      
      const proc = spawn('sh', ['-c', command], { stdio: 'pipe' });
      
      let output = '';
      proc.stdout.on('data', (data) => output += data.toString());
      proc.stderr.on('data', (data) => output += data.toString());
      
      proc.on('close', (code) => {
        if (code === 0) {
          this.pass('Claude Code', `Installed and accessible`);
        } else {
          this.fail('Claude Code', 'Not found or not accessible');
        }
        resolve();
      });
      
      setTimeout(() => {
        proc.kill();
        this.fail('Claude Code', 'Check timed out');
        resolve();
      }, 5000);
    });
  }

  async checkAPIKey() {
    console.log('Checking API key configuration...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      if (apiKey.startsWith('sk-')) {
        this.pass('API Key', 'Properly configured');
      } else {
        this.fail('API Key', 'Invalid format (should start with sk-)');
      }
    } else {
      this.fail('API Key', 'ANTHROPIC_API_KEY not set');
    }
  }

  async checkDependencies() {
    console.log('Checking package dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const nodeModules = fs.existsSync('node_modules');
      
      if (nodeModules) {
        this.pass('Dependencies', 'node_modules exists');
      } else {
        this.fail('Dependencies', 'Run "npm install" to install dependencies');
      }
    } catch (error) {
      this.fail('Dependencies', `Cannot read package.json: ${error.message}`);
    }
  }

  pass(check, message) {
    console.log(`  ✅ ${check}: ${message}`);
    this.results[check] = { status: 'pass', message };
  }

  fail(check, message) {
    console.log(`  ❌ ${check}: ${message}`);
    this.results[check] = { status: 'fail', message };
  }

  printSummary() {
    console.log('\nHealth Check Summary');
    console.log('===================');
    
    const passed = Object.values(this.results).filter(r => r.status === 'pass').length;
    const total = Object.keys(this.results).length;
    
    console.log(`\nPassed: ${passed}/${total} checks`);
    
    const failed = Object.entries(this.results).filter(([, r]) => r.status === 'fail');
    if (failed.length > 0) {
      console.log('\nFailed checks:');
      failed.forEach(([check, result]) => {
        console.log(`  - ${check}: ${result.message}`);
      });
    }
    
    if (passed === total) {
      console.log('\n🎉 Trinity MVP is ready to use!');
    } else {
      console.log('\n⚠️  Please resolve the failed checks before using Trinity MVP');
    }
  }
}

const healthCheck = new HealthCheck();
healthCheck.run().catch(console.error);
