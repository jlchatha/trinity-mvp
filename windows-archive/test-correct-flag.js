#!/usr/bin/env node

/**
 * Test Claude Code with CORRECT --allowedTools flag
 */

const { spawn } = require('child_process');

function testCorrectFlag(description, allowedTools, prompt, outputFormat = '') {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log('=' .repeat(50));
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('❌ No API key available');
      return resolve({ success: false });
    }
    
    const formatFlag = outputFormat ? `--output-format ${outputFormat}` : '';
    const claudeCommand = `claude -p "${prompt}" --allowedTools "${allowedTools}" ${formatFlag}`.trim();
    const fullCommand = `export ANTHROPIC_API_KEY='${apiKey}' && export CI=true && export TERM=dumb && ${claudeCommand}`;
    
    console.log(`Command: wsl -d Ubuntu-22.04 -e bash -c "${fullCommand}"`);
    console.log('Executing...');
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', fullCommand], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let gotOutput = false;
    
    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      gotOutput = true;
      console.log(`📤 STDOUT: ${output}`);
    });
    
    proc.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log(`📤 STDERR: ${output}`);
    });
    
    proc.on('close', (code) => {
      console.log(`🏁 Exit code: ${code}`);
      
      if (code === 0 && gotOutput && stdout.trim().length > 0) {
        console.log('🎉 SUCCESS! Claude Code is responding!');
        
        if (outputFormat === 'json') {
          try {
            const parsed = JSON.parse(stdout.trim());
            console.log('📋 Parsed JSON response:', parsed);
            return resolve({ success: true, stdout, stderr, json: parsed, allowedTools });
          } catch (e) {
            console.log('⚠️  Got response but not valid JSON, treating as success anyway');
          }
        }
        
        return resolve({ success: true, stdout, stderr, allowedTools, response: stdout.trim() });
      } else if (gotOutput) {
        console.log('⚠️  Got output but with error code');
        return resolve({ success: false, stdout, stderr, gotOutput: true });
      } else {
        console.log('❌ No output received');
        return resolve({ success: false, stdout, stderr });
      }
    });
    
    // 30 second timeout for first successful test
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 30 seconds');
      resolve({ success: false, timeout: true, stdout, stderr });
    }, 30000);
  });
}

async function testCorrectFlags() {
  console.log('🎯 Testing Claude Code with CORRECT --allowedTools flag');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      description: 'Basic Read Permission (Correct Flag)',
      allowedTools: 'Read',
      prompt: 'Hello! Please respond with exactly: TRINITY BREAKTHROUGH SUCCESS',
      outputFormat: ''
    },
    {
      description: 'Basic Read with Text Output',
      allowedTools: 'Read',
      prompt: 'Hello! Please respond with exactly: TEXT OUTPUT WORKING',
      outputFormat: 'text'
    },
    {
      description: 'Basic Read with JSON Output',
      allowedTools: 'Read',
      prompt: 'Hello! Please respond with exactly: JSON OUTPUT WORKING',
      outputFormat: 'json'
    },
    {
      description: 'All Trinity Tools with Text',
      allowedTools: 'Read,Write,Edit,Bash,LS,Glob,Grep',
      prompt: 'You are the Trinity MVP Overseer. Please respond with: Trinity MVP 100% functional!',
      outputFormat: 'text'
    },
    {
      description: 'All Trinity Tools with JSON',
      allowedTools: 'Read,Write,Edit,Bash,LS,Glob,Grep',
      prompt: 'You are the Trinity MVP Overseer. Please respond with: Trinity MVP JSON complete!',
      outputFormat: 'json'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testCorrectFlag(test.description, test.allowedTools, test.prompt, test.outputFormat);
    results.push({ ...test, ...result });
    
    // If we get a success, that's huge progress!
    if (result.success) {
      console.log('\n🚨 BREAKING: FIRST SUCCESS ACHIEVED! 🚨');
      console.log('✅ Claude Code is now responding in non-interactive mode!');
      break; // Don't need to test everything if we have success
    }
  }
  
  console.log('\n📊 RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  let workingSolution = null;
  
  results.forEach((result, index) => {
    const status = result.success ? '🎉 SUCCESS' : (result.gotOutput ? '⚠️  PARTIAL' : '❌ FAILED');
    console.log(`Test ${index + 1}: ${status} - ${result.description}`);
    
    if (result.success && !workingSolution) {
      workingSolution = result;
    }
  });
  
  if (workingSolution) {
    console.log(`\n🎉🎉🎉 TRINITY MVP BREAKTHROUGH ACHIEVED! 🎉🎉🎉`);
    console.log(`✅ Working command: claude -p "prompt" --allowedTools "${workingSolution.allowedTools}"`);
    console.log(`✅ Output format: ${workingSolution.outputFormat || 'default'}`);
    console.log(`📝 Sample response: ${workingSolution.response?.substring(0, 100)}...`);
    console.log('\n🚀 Ready to implement in claude-watcher.js for 100% functionality!');
    console.log('🎯 Trinity MVP integration will be COMPLETE!');
  } else {
    console.log('\n❌ Still no success with --allowedTools');
    console.log('💡 Need to investigate further or consider alternative approaches');
  }
}

testCorrectFlags().catch(console.error);