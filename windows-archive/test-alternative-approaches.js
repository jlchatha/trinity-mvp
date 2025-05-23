#!/usr/bin/env node

/**
 * Test alternative approaches to Claude Code execution
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function testApproach(description, testFunc) {
  return new Promise(async (resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log('=' .repeat(50));
    
    try {
      const result = await testFunc();
      resolve(result);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
}

// Approach 1: Direct API call (bypass Claude Code entirely)
function testDirectAPICall() {
  return new Promise((resolve) => {
    console.log('Testing direct Anthropic API call...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('❌ No API key available');
      return resolve({ success: false });
    }
    
    // Test with curl to Anthropic API
    const curlCommand = [
      'curl', '-X', 'POST', 'https://api.anthropic.com/v1/messages',
      '-H', 'Content-Type: application/json',
      '-H', `x-api-key: ${apiKey}`,
      '-H', 'anthropic-version: 2023-06-01',
      '-d', JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello! Please respond with: Direct API working!'
          }
        ]
      })
    ];
    
    console.log('Executing direct API call...');
    
    const proc = spawn('curl', curlCommand.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      console.log(`Exit code: ${code}`);
      
      if (code === 0 && stdout.includes('content')) {
        console.log('✅ Direct API call works!');
        try {
          const response = JSON.parse(stdout);
          if (response.content && response.content[0] && response.content[0].text) {
            console.log(`Response: ${response.content[0].text}`);
            return resolve({ success: true, method: 'direct-api', response: response.content[0].text });
          }
        } catch (e) {
          console.log('⚠️  Got response but parsing failed');
        }
      }
      
      console.log(`Stdout: ${stdout.substring(0, 200)}...`);
      console.log(`Stderr: ${stderr}`);
      resolve({ success: false });
    });
    
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 15 seconds');
      resolve({ success: false, timeout: true });
    }, 15000);
  });
}

// Approach 2: WSL with input file
function testWSLInputFile() {
  return new Promise((resolve) => {
    console.log('Testing WSL with input file approach...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return resolve({ success: false });
    }
    
    // Create a temporary input file
    const tempDir = path.join(os.tmpdir(), 'trinity-test');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const inputFile = path.join(tempDir, 'test-input.txt');
    fs.writeFileSync(inputFile, 'Hello! Please respond with: File input working!\n');
    
    // Convert Windows path to WSL path
    const wslInputFile = inputFile.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    
    const command = `export ANTHROPIC_API_KEY='${apiKey}' && cat '${wslInputFile}' | claude`;
    
    console.log(`WSL command: wsl -d Ubuntu-22.04 -e bash -c "${command}"`);
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`📤 Output: ${data.toString()}`);
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`📤 Error: ${data.toString()}`);
    });
    
    proc.on('close', (code) => {
      console.log(`Exit code: ${code}`);
      
      // Cleanup
      try {
        fs.unlinkSync(inputFile);
      } catch (e) {}
      
      if (code === 0 && stdout.includes('File input working')) {
        console.log('✅ WSL file input approach works!');
        return resolve({ success: true, method: 'wsl-file', response: stdout.trim() });
      }
      
      resolve({ success: false, stdout, stderr });
    });
    
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 20 seconds');
      resolve({ success: false, timeout: true });
    }, 20000);
  });
}

// Approach 3: Claude Code with heredoc
function testHeredocApproach() {
  return new Promise((resolve) => {
    console.log('Testing heredoc approach...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return resolve({ success: false });
    }
    
    const command = `export ANTHROPIC_API_KEY='${apiKey}' && claude <<< "Hello! Please respond with: Heredoc working!"`;
    
    console.log(`Command: wsl -d Ubuntu-22.04 -e bash -c "${command}"`);
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`📤 Output: ${data.toString()}`);
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`📤 Error: ${data.toString()}`);
    });
    
    proc.on('close', (code) => {
      console.log(`Exit code: ${code}`);
      
      if (code === 0 && stdout.includes('Heredoc working')) {
        console.log('✅ Heredoc approach works!');
        return resolve({ success: true, method: 'heredoc', response: stdout.trim() });
      }
      
      resolve({ success: false, stdout, stderr });
    });
    
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 20 seconds');
      resolve({ success: false, timeout: true });
    }, 20000);
  });
}

async function testAllApproaches() {
  console.log('🔍 Testing Alternative Claude Code Approaches');
  console.log('=' .repeat(60));
  
  const results = [];
  
  results.push(await testApproach('Direct Anthropic API Call', testDirectAPICall));
  results.push(await testApproach('WSL with Input File', testWSLInputFile));
  results.push(await testApproach('Heredoc Input Approach', testHeredocApproach));
  
  console.log('\n📊 FINAL RESULTS');
  console.log('=' .repeat(60));
  
  let workingSolution = null;
  
  results.forEach((result, index) => {
    const approaches = ['Direct API', 'WSL File Input', 'Heredoc Input'];
    const status = result.success ? '✅ WORKS' : '❌ FAILED';
    console.log(`${approaches[index].padEnd(20)} | ${status}`);
    
    if (result.success && !workingSolution) {
      workingSolution = result;
    }
  });
  
  if (workingSolution) {
    console.log(`\n🎉 SOLUTION FOUND: ${workingSolution.method}`);
    console.log('✅ Can implement Trinity MVP with this approach!');
    console.log(`📝 Response preview: ${workingSolution.response?.substring(0, 100)}...`);
  } else {
    console.log('\n❌ No working solutions found');
    console.log('💡 May need to investigate Claude Code installation or WSL environment');
  }
}

testAllApproaches().catch(console.error);