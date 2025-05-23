#!/usr/bin/env node

/**
 * Test Claude Code with --allow-tools flag - THE SOLUTION
 */

const { spawn } = require('child_process');

function testWithAllowTools(description, allowTools, prompt, useJson = false) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log('=' .repeat(50));
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('❌ No API key available');
      return resolve({ success: false });
    }
    
    const outputFormat = useJson ? '--output-format json' : '';
    const claudeCommand = `claude -p "${prompt}" --allow-tools "${allowTools}" ${outputFormat}`.trim();
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
        console.log('✅ SUCCESS! This combination works!');
        
        if (useJson) {
          try {
            const parsed = JSON.parse(stdout.trim());
            console.log('📋 Parsed JSON response:', parsed);
            return resolve({ success: true, stdout, stderr, json: parsed, allowTools });
          } catch (e) {
            console.log('⚠️  Got output but not valid JSON');
          }
        }
        
        return resolve({ success: true, stdout, stderr, allowTools });
      } else if (gotOutput) {
        console.log('⚠️  Got output but with error code');
        return resolve({ success: false, stdout, stderr, gotOutput: true });
      } else {
        console.log('❌ No output received');
        return resolve({ success: false, stdout, stderr });
      }
    });
    
    // 20 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 20 seconds');
      resolve({ success: false, timeout: true, stdout, stderr });
    }, 20000);
  });
}

async function testAllowToolsSolutions() {
  console.log('🎯 Testing Claude Code --allow-tools Solution');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      description: 'Basic Read Permission',
      allowTools: 'Read',
      prompt: 'Hello! Please respond with: Allow-tools test working!',
      useJson: false
    },
    {
      description: 'Basic Read with JSON Output',
      allowTools: 'Read',
      prompt: 'Hello! Please respond with: JSON test working!',
      useJson: true
    },
    {
      description: 'Multiple Tools',
      allowTools: 'Read,Write,Bash',
      prompt: 'Hello! Please respond with: Multiple tools test working!',
      useJson: false
    },
    {
      description: 'All Trinity Tools',
      allowTools: 'Read,Write,Edit,Bash,LS,Glob,Grep',
      prompt: 'You are the Trinity MVP Overseer. Please respond with: Trinity MVP integration complete!',
      useJson: false
    },
    {
      description: 'All Trinity Tools with JSON',
      allowTools: 'Read,Write,Edit,Bash,LS,Glob,Grep',
      prompt: 'You are the Trinity MVP Overseer. Please respond with: Trinity MVP JSON integration complete!',
      useJson: true
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testWithAllowTools(test.description, test.allowTools, test.prompt, test.useJson);
    results.push({ ...test, ...result });
  }
  
  console.log('\n📊 FINAL RESULTS');
  console.log('=' .repeat(60));
  
  let workingSolution = null;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ WORKS' : (result.gotOutput ? '⚠️  PARTIAL' : '❌ FAILED');
    console.log(`Test ${index + 1}: ${status} - ${result.description}`);
    
    if (result.success && !workingSolution) {
      workingSolution = result;
    }
  });
  
  if (workingSolution) {
    console.log(`\n🎉 BREAKTHROUGH ACHIEVED!`);
    console.log(`✅ Working tools: ${workingSolution.allowTools}`);
    console.log(`✅ JSON support: ${workingSolution.useJson ? 'YES' : 'NO'}`);
    console.log('🔧 Ready to update claude-watcher.js with --allow-tools flag!');
    console.log('\n🚀 TRINITY MVP 100% FUNCTIONALITY IS NOW ACHIEVABLE!');
  } else {
    console.log('\n❌ --allow-tools approach also failed');
    console.log('💡 May need to investigate Claude Code installation or configuration');
  }
}

testAllowToolsSolutions().catch(console.error);