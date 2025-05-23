#!/usr/bin/env node

/**
 * Test different Claude Code command flags to find working syntax
 */

const { spawn } = require('child_process');

function testClaudeFlag(description, args, input = null) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`Command: wsl -d Ubuntu-22.04 -e ${args.join(' ')}`);
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e'].concat(args), {
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
    
    // Send input if provided
    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
    
    proc.on('close', (code) => {
      console.log(`Exit code: ${code || 'null'}`);
      console.log(`Stdout: "${stdout.trim()}"`);
      console.log(`Stderr: "${stderr.trim()}"`);
      
      if (code === 0 && stdout.includes('Hello')) {
        console.log('✅ SUCCESS - This method works!');
      } else if (stdout.length > 0) {
        console.log('⚠️  Got output but may need refinement');
      } else {
        console.log('❌ No useful output');
      }
      
      resolve();
    });
    
    // 15 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 15 seconds');
      resolve();
    }, 15000);
  });
}

async function testAllFlags() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No ANTHROPIC_API_KEY found');
    return;
  }
  
  console.log('🔍 Testing Claude Code Command Flags');
  console.log('=' .repeat(50));
  
  const testPrompt = 'Hello, respond briefly with "Working!"';
  const envSetup = `export ANTHROPIC_API_KEY='${apiKey}'`;
  
  // Test 1: Help flag to see available options
  await testClaudeFlag('Help flag', ['claude', '--help']);
  
  // Test 2: Current approach with -p
  await testClaudeFlag('Current -p approach', 
    ['bash', '-c', `${envSetup} && claude -p '${testPrompt}'`]);
  
  // Test 3: Stdin pipe approach
  await testClaudeFlag('Stdin pipe approach', 
    ['bash', '-c', `${envSetup} && echo '${testPrompt}' | claude`]);
  
  // Test 4: Direct command approach
  await testClaudeFlag('Direct command approach', 
    ['bash', '-c', `${envSetup} && claude '${testPrompt}'`]);
  
  // Test 5: Non-interactive flag
  await testClaudeFlag('Non-interactive flag', 
    ['bash', '-c', `${envSetup} && claude --non-interactive '${testPrompt}'`]);
  
  // Test 6: Batch mode
  await testClaudeFlag('Batch mode approach', 
    ['bash', '-c', `${envSetup} && claude --batch '${testPrompt}'`]);
  
  console.log('\n🏁 All tests completed');
}

testAllFlags().catch(console.error);