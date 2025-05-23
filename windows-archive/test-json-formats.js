#!/usr/bin/env node

/**
 * Test JSON output formats for Claude Code
 */

const { spawn } = require('child_process');

function testFormat(format, description) {
  return new Promise((resolve) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log(`\n🧪 Testing ${description}`);
    console.log('=' .repeat(40));
    
    const prompt = 'Hello! Please respond with: Working perfectly!';
    const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
    const claudeCommand = `claude -p --output-format ${format} '${escapedPrompt}'`;
    const fullCommand = `export ANTHROPIC_API_KEY='${apiKey}' && ${claudeCommand}`;
    
    console.log(`Command: wsl -d Ubuntu-22.04 -e bash -c "${fullCommand}"`);
    console.log('Executing...');
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', fullCommand], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let outputReceived = false;
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      outputReceived = true;
      console.log(`📤 STDOUT: ${output}`);
    });
    
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log(`📤 STDERR: ${output}`);
    });
    
    proc.on('close', (code) => {
      console.log(`🏁 Exit code: ${code}`);
      
      if (code === 0 && outputReceived) {
        console.log('✅ SUCCESS! This format works!');
        try {
          if (format === 'json' || format === 'stream-json') {
            const parsed = JSON.parse(stdout.trim());
            console.log('📋 Parsed JSON:', parsed);
          }
        } catch (e) {
          console.log('⚠️  Output received but not valid JSON');
        }
      } else if (outputReceived) {
        console.log('⚠️  Got output but with error code');
      } else {
        console.log('❌ No output received');
      }
      
      resolve({ format, success: code === 0 && outputReceived, stdout, stderr });
    });
    
    // 30 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 30 seconds');
      resolve({ format, success: false, stdout, stderr, timeout: true });
    }, 30000);
  });
}

async function testAllJsonFormats() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No ANTHROPIC_API_KEY found');
    return;
  }
  
  console.log('🎯 Testing Claude Code JSON Output Formats');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Test all three formats
  results.push(await testFormat('text', 'Text Format (baseline)'));
  results.push(await testFormat('json', 'JSON Format (single result)'));
  results.push(await testFormat('stream-json', 'Stream JSON Format (realtime)'));
  
  console.log('\n📊 SUMMARY RESULTS');
  console.log('=' .repeat(50));
  
  let workingFormat = null;
  
  results.forEach(result => {
    const status = result.success ? '✅ WORKS' : (result.timeout ? '⏰ TIMEOUT' : '❌ FAILED');
    console.log(`${result.format.padEnd(12)} | ${status}`);
    
    if (result.success && !workingFormat) {
      workingFormat = result.format;
    }
  });
  
  if (workingFormat) {
    console.log(`\n🎉 SOLUTION FOUND: Use --output-format ${workingFormat}`);
    console.log('✅ Trinity MVP integration can now be completed!');
  } else {
    console.log('\n❌ All formats failed - may need alternative approach');
    console.log('💡 Consider: API direct calls, different Claude Code version, or WSL configuration');
  }
}

testAllJsonFormats().catch(console.error);