#!/usr/bin/env node

/**
 * Debug Claude Code WSL Integration
 * Tests Claude Code execution directly to identify issues
 */

const { spawn } = require('child_process');

function testClaudeCode() {
  console.log('🔍 Testing Claude Code WSL Integration');
  console.log('=' .repeat(50));
  
  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log(`API Key: ${apiKey ? 'Present' : 'Missing'} (length: ${apiKey?.length || 0})`);
  
  if (!apiKey) {
    console.log('❌ No ANTHROPIC_API_KEY found. Please set it first.');
    return;
  }
  
  // Test 1: Check Claude Code version
  console.log('\n1️⃣  Testing Claude Code version...');
  const versionProc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'claude', '--version'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let versionOutput = '';
  versionProc.stdout.on('data', (data) => {
    versionOutput += data.toString();
  });
  
  versionProc.on('close', (code) => {
    console.log(`Exit code: ${code}`);
    console.log(`Version output: "${versionOutput.trim()}"`);
    
    if (code === 0 && versionOutput.includes('Claude Code')) {
      console.log('✅ Claude Code is installed and accessible');
      testSimplePrompt();
    } else {
      console.log('❌ Claude Code not working properly');
    }
  });
}

function testSimplePrompt() {
  console.log('\n2️⃣  Testing simple prompt...');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const prompt = 'Hello! Please respond with exactly: TEST SUCCESSFUL';
  const command = `export ANTHROPIC_API_KEY='${apiKey}' && claude -p '${prompt}'`;
  
  console.log(`Command: wsl -d Ubuntu-22.04 -e bash -c "${command}"`);
  
  const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', command], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  proc.stdout.on('data', (data) => {
    stdout += data.toString();
    console.log(`STDOUT: ${data.toString()}`);
  });
  
  proc.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log(`STDERR: ${data.toString()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`\nProcess finished with exit code: ${code}`);
    console.log(`Final stdout: "${stdout.trim()}"`);
    console.log(`Final stderr: "${stderr.trim()}"`);
    
    if (code === 0 && stdout.includes('TEST SUCCESSFUL')) {
      console.log('🎉 Claude Code integration working perfectly!');
    } else if (code === 0) {
      console.log('⚠️  Claude Code responding but format may need adjustment');
    } else {
      console.log('❌ Claude Code execution failed');
    }
  });
  
  // Timeout after 30 seconds
  setTimeout(() => {
    proc.kill('SIGTERM');
    console.log('⏰ Test timed out after 30 seconds');
  }, 30000);
}

// Run the test
testClaudeCode();