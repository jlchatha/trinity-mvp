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
    const result = await this.executeClaudeCode(prompt, workingDirectory, options);
    
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
  
  async executeClaudeCode(prompt, workingDirectory, options = {}) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        // Get API key with development fallback
        let apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        
        // Development fallback: Trinity agent key (never shipped to production)
        if (!apiKey && process.env.NODE_ENV === 'development') {
          try {
            const optimus_config_path = path.join(__dirname, '../agents/optimus_001/config/config.json');
            if (fs.existsSync(optimus_config_path)) {
              const config = JSON.parse(fs.readFileSync(optimus_config_path, 'utf8'));
              if (config.api_key) {
                apiKey = config.api_key;
                this.log('Using Trinity development API key from optimus_001 config');
              }
            }
          } catch (error) {
            this.log('Failed to load Trinity dev key:', error.message);
          }
        }
        
        if (!apiKey) {
          this.log('ERROR: No ANTHROPIC_API_KEY found in environment');
          return resolve({
            success: false,
            output: '',
            error: 'No ANTHROPIC_API_KEY environment variable found',
            executionTime: Date.now() - startTime
          });
        }
        
        // Build Claude Code command using working mvp-dev format
        // Start with basic command (--continue will be tried in retry logic)
        const claudeArgs = ['--print', '--output-format', 'json', prompt];
        
        this.log(`Executing: claude ${claudeArgs.join(' ')}`);
        this.log(`API Key present: ${apiKey ? 'YES' : 'NO'} (length: ${apiKey?.length || 0})`);
        this.log(`Working directory: ${workingDirectory || process.cwd()}`);
        
        const proc = spawn('/home/alreadyinuse/.claude/local/claude', claudeArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: workingDirectory || process.cwd(),
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: apiKey,
            CLAUDE_MODEL: options.model || 'claude-3-haiku-20240307'
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
          clearTimeout(timeoutId);
          const executionTime = Date.now() - startTime;
          
          this.log(`Claude Code process finished with exit code: ${code}`);
          this.log(`Claude Code stdout: ${stdout.trim()}`);
          this.log(`Claude Code stderr: ${stderr.trim()}`);
          
          // Claude Code returns 0 for success, but we should also check if we got actual output
          const hasOutput = stdout.trim().length > 0;
          const isSuccess = code === 0 && hasOutput;
          
          if (isSuccess) {
            // Parse JSON response like mvp-dev
            try {
              const jsonResponse = JSON.parse(stdout.trim());
              resolve({
                success: true,
                output: jsonResponse.result || jsonResponse.content || stdout.trim(),
                error: null,
                executionTime,
                cost: jsonResponse.cost_usd,
                sessionId: jsonResponse.session_id
              });
            } catch (parseError) {
              // Fallback to raw output if JSON parsing fails
              resolve({
                success: true,
                output: stdout.trim(),
                error: null,
                executionTime
              });
            }
          } else {
            resolve({
              success: false,
              output: stdout.trim(),
              error: stderr.trim() || `Process exited with code ${code}, no output received`,
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
        const timeoutId = setTimeout(() => {
          console.log(`[${new Date().toISOString()}] TIMEOUT: Claude Code execution exceeded 25s, killing process`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Command args: ${claudeArgs.join(' ')}`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Current stdout: "${stdout}"`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Current stderr: "${stderr}"`);
          proc.kill('SIGTERM');
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: stdout.trim(),
            error: 'Claude Code execution timeout (25s) - Process was killed',
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
  
  // WSL path conversion removed - Trinity now uses native Claude Code execution
  
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