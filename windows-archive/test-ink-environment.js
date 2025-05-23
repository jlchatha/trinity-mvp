#!/usr/bin/env node

/**
 * Test Claude Code with proper environment variables for Ink non-interactive mode
 */

const { spawn } = require('child_process');

function testWithEnvironment(description, envVars, useStdin = false) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log('=' .repeat(50));
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('❌ No API key available');
      return resolve({ success: false });
    }
    
    const prompt = 'Hello! Please respond with: Environment test working!';
    
    let command;
    if (useStdin) {
      command = `export ANTHROPIC_API_KEY='${apiKey}' && echo '${prompt}' | claude`;
    } else {
      command = `export ANTHROPIC_API_KEY='${apiKey}' && claude -p '${prompt}'`;
    }
    
    // Add environment variables to the command
    const envSetup = Object.entries(envVars)
      .map(([key, value]) => `export ${key}='${value}'`)
      .join(' && ');
    
    if (envSetup) {
      command = `${envSetup} && ${command}`;
    }
    
    console.log(`Environment vars: ${JSON.stringify(envVars)}`);
    console.log(`Command: wsl -d Ubuntu-22.04 -e bash -c "${command}"`);
    console.log('Executing...');
    
    const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e', 'bash', '-c', command], {
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
      
      if (code === 0 && gotOutput && stdout.includes('Environment test working')) {
        console.log('✅ SUCCESS! This environment configuration works!');
        return resolve({ success: true, stdout, stderr, envVars });
      } else if (gotOutput) {
        console.log('⚠️  Got output but not the expected response');
        return resolve({ success: false, stdout, stderr, gotOutput: true });
      } else {
        console.log('❌ No output received');
        return resolve({ success: false, stdout, stderr });
      }
    });
    
    // 25 second timeout
    setTimeout(() => {
      proc.kill('SIGTERM');
      console.log('⏰ Timeout after 25 seconds');
      resolve({ success: false, timeout: true, stdout, stderr });
    }, 25000);
  });
}

async function testInkEnvironments() {
  console.log('🔍 Testing Claude Code with Ink Environment Variables');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      description: 'CI Environment (disable interactive)',
      envVars: { CI: 'true' },
      useStdin: false
    },
    {
      description: 'Non-TTY Environment',
      envVars: { TERM: 'dumb' },
      useStdin: false
    },
    {
      description: 'Disable Ink Raw Mode',
      envVars: { INK_NO_RAW_MODE: 'true' },
      useStdin: false
    },
    {
      description: 'Force Non-Interactive',
      envVars: { FORCE_NON_INTERACTIVE: 'true' },
      useStdin: false
    },
    {
      description: 'No Color + CI',
      envVars: { NO_COLOR: '1', CI: 'true' },
      useStdin: false
    },
    {
      description: 'Headless Environment',
      envVars: { HEADLESS: 'true', CI: 'true', TERM: 'dumb' },
      useStdin: false
    },
    {
      description: 'Stdin Pipe with CI',
      envVars: { CI: 'true' },
      useStdin: true
    },
    {
      description: 'Stdin Pipe with No TTY',
      envVars: { TERM: 'dumb', NO_COLOR: '1' },
      useStdin: true
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testWithEnvironment(test.description, test.envVars, test.useStdin);
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
    console.log(`\n🎉 SOLUTION FOUND!`);
    console.log(`✅ Environment: ${JSON.stringify(workingSolution.envVars)}`);
    console.log(`✅ Use stdin: ${workingSolution.useStdin}`);
    console.log('🔧 Ready to implement in claude-watcher.js!');
  } else {
    console.log('\n❌ No complete solutions found');
    
    // Check for partial solutions
    const partialSolutions = results.filter(r => r.gotOutput && !r.success);
    if (partialSolutions.length > 0) {
      console.log('\n⚠️  Partial solutions (got output but wrong format):');
      partialSolutions.forEach(r => {
        console.log(`- ${r.description}: ${JSON.stringify(r.envVars)}`);
      });
    }
  }
}

testInkEnvironments().catch(console.error);