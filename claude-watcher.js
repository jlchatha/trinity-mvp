#!/usr/bin/env node

/**
 * Trinity MVP - Claude Code Queue Watcher
 * Monitors file queue and processes requests with Claude Code via WSL
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class ClaudeWatcher {
  constructor() {
    this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
    this.queueDir = path.join(this.trinityDir, 'queue');
    this.inputDir = path.join(this.queueDir, 'input');
    this.processingDir = path.join(this.queueDir, 'processing');
    this.outputDir = path.join(this.queueDir, 'output');
    this.failedDir = path.join(this.queueDir, 'failed');
    this.logsDir = path.join(this.trinityDir, 'logs');
    
    this.logFile = path.join(this.logsDir, `claude-watcher-${new Date().toISOString().split('T')[0]}.log`);
    this.isRunning = false;
    this.pollInterval = 1000; // Check every second
    
    this.log('Claude Watcher starting up...');
    this.ensureDirectories();
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(`[WATCHER] ${message}`);
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  ensureDirectories() {
    const dirs = [this.inputDir, this.processingDir, this.outputDir, this.failedDir, this.logsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    this.log('Queue directories verified');
  }
  
  async start() {
    this.isRunning = true;
    this.log('Claude Watcher started - monitoring queue...');
    
    while (this.isRunning) {
      try {
        await this.processQueue();
        await this.sleep(this.pollInterval);
      } catch (error) {
        this.log(`Error in main loop: ${error.message}`);
        await this.sleep(this.pollInterval * 2);
      }
    }
  }
  
  async processQueue() {
    const files = fs.readdirSync(this.inputDir).filter(f => f.endsWith('.json'));
    
    for (const filename of files) {
      if (!this.isRunning) break;
      
      const inputPath = path.join(this.inputDir, filename);
      const processingPath = path.join(this.processingDir, filename);
      
      try {
        // Move to processing
        fs.renameSync(inputPath, processingPath);
        this.log(`Processing request: ${filename}`);
        
        // Process the request
        await this.processRequest(processingPath, filename);
        
      } catch (error) {
        this.log(`Error processing ${filename}: ${error.message}`);
        
        // Move to failed directory
        try {
          const failedPath = path.join(this.failedDir, filename);
          if (fs.existsSync(processingPath)) {
            fs.renameSync(processingPath, failedPath);
          }
        } catch (moveError) {
          this.log(`Failed to move error file: ${moveError.message}`);
        }
      }
    }
  }
  
  async processRequest(requestPath, filename) {
    // Read the request
    const requestData = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
    this.log(`Request data: ${JSON.stringify(requestData, null, 2)}`);
    
    const { sessionId, prompt, options = {} } = requestData;
    const workingDirectory = options.workingDirectory;
    const userContext = options.userContext || {};
    
    // Execute Claude Code via WSL
    const result = await this.executeClaudeCode(prompt, workingDirectory, userContext);
    
    // Create response (matching file manager expected format)
    const responseData = {
      requestId: filename.replace('.json', ''),
      sessionId,
      timestamp: new Date().toISOString(),
      success: result.success,
      content: result.output, // File manager expects 'content' field
      output: result.output,  // Keep both for compatibility
      error: result.error,
      executionTime: result.executionTime,
      duration_ms: result.executionTime // Alternative field name
    };
    
    // Write response file (same name as request for file manager compatibility)
    const outputPath = path.join(this.outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(responseData, null, 2));
    
    // Remove from processing
    fs.unlinkSync(requestPath);
    
    this.log(`Request ${filename} completed successfully`);
  }
  
  async executeClaudeCode(prompt, workingDirectory, userContext = {}) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        // Prepare Claude Code command
        const wslWorkingDir = this.windowsToWSLPath(workingDirectory || process.cwd());
        
        // Build the command
        const claudeCommand = `cd "${wslWorkingDir}" && echo '${prompt}' | claude`;
        const fullCommand = ['bash', '-c', claudeCommand];
        
        this.log(`Executing: wsl ${fullCommand.join(' ')}`);
        
        // Execute via WSL
        const proc = spawn('wsl', ['-d', 'Ubuntu-22.04', '-e'].concat(fullCommand), {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
          }
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
          const executionTime = Date.now() - startTime;
          
          if (code === 0) {
            resolve({
              success: true,
              output: stdout.trim(),
              error: null,
              executionTime
            });
          } else {
            resolve({
              success: false,
              output: stdout.trim(),
              error: stderr.trim() || `Process exited with code ${code}`,
              executionTime
            });
          }
        });
        
        proc.on('error', (error) => {
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: '',
            error: `Failed to spawn process: ${error.message}`,
            executionTime
          });
        });
        
        // Timeout after 25 seconds (less than Trinity's 30-second timeout)
        setTimeout(() => {
          proc.kill('SIGTERM');
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: stdout.trim(),
            error: 'Claude Code execution timeout (25s)',
            executionTime
          });
        }, 25000);
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        resolve({
          success: false,
          output: '',
          error: `Execution error: ${error.message}`,
          executionTime
        });
      }
    });
  }
  
  windowsToWSLPath(windowsPath) {
    if (!windowsPath || typeof windowsPath !== 'string') return '/tmp';
    
    // Convert Windows path to WSL path
    // C:\Users\... -> /mnt/c/Users/...
    const normalized = windowsPath.replace(/\\/g, '/');
    if (normalized.match(/^[A-Za-z]:/)) {
      const drive = normalized.charAt(0).toLowerCase();
      const pathWithoutDrive = normalized.substring(2);
      return `/mnt/${drive}${pathWithoutDrive}`;
    }
    return normalized;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  stop() {
    this.isRunning = false;
    this.log('Claude Watcher stopping...');
  }
}

// Handle graceful shutdown
const watcher = new ClaudeWatcher();

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  watcher.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  watcher.stop();
  process.exit(0);
});

// Start the watcher
watcher.start().catch(error => {
  console.error('Claude Watcher crashed:', error);
  process.exit(1);
});