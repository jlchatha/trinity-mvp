#!/usr/bin/env node

/**
 * Test the exact command that will be used in claude-watcher.js
 */

const { spawn } = require('child_process');

function testFinalCommand() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No ANTHROPIC_API_KEY found');
    return;
  }
  
  console.log('🎯 Testing Final Claude Code Command');
  console.log('=' .repeat(50));
  
  const prompt = 'Hello! Please respond with: Trinity MVP integration working perfectly!';
  const escapedPrompt = prompt.replace(/'/g, "'\"'\"'");
  const claudeCommand = `claude -p --output-format text '${escapedPrompt}'`;
  const fullCommand = `export ANTHROPIC_API_KEY='${apiKey}' && ${claudeCommand}`;
  
  console.log(`Testing command: wsl -d Ubuntu-22.04 -e bash -c "${fullCommand}"`);
  console.log('\nExecuting...');
  
  const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', fullCommand], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stdout = '';
  let stderr = '';
  
  proc.stdout.on('data', (data) => {
    const output = data.toString();
    stdout += output;
    console.log(`📤 STDOUT: ${output}`);
  });
  
  proc.stderr.on('data', (data) => {
    const output = data.toString();
    stderr += output;
    console.log(`📤 STDERR: ${output}`);
  });
  
  proc.on('close', (code) => {
    console.log(`\n🏁 Process finished with exit code: ${code}`);
    console.log(`📄 Final stdout: "${stdout.trim()}"`);
    console.log(`📄 Final stderr: "${stderr.trim()}"`);
    
    if (code === 0 && stdout.includes('Trinity MVP')) {
      console.log('🎉 SUCCESS! This command works perfectly!');
      console.log('✅ Claude Code integration is now ready for Trinity MVP');
    } else if (code === 0 && stdout.trim().length > 0) {
      console.log('✅ SUCCESS! Got response from Claude Code');
      console.log('🔧 Response format may need adjustment but communication works');
    } else {
      console.log('❌ Still having issues - may need different approach');
    }
  });
  
  // 45 second timeout
  setTimeout(() => {
    proc.kill('SIGTERM');
    console.log('\n⏰ Test timed out after 45 seconds');
    console.log('❌ Command still hanging - need alternative approach');
  }, 45000);
}

testFinalCommand();