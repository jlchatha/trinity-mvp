/**
 * File-based Communication Manager for Claude Code Integration
 * Handles request/response queues for Trinity MVP
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

class FileCommManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.baseDir = options.baseDir || path.join(os.homedir(), '.trinity-mvp');
    this.queueDir = path.join(this.baseDir, 'queue');
    this.inputDir = path.join(this.queueDir, 'input');
    this.outputDir = path.join(this.queueDir, 'output');
    this.processingDir = path.join(this.queueDir, 'processing');
    this.failedDir = path.join(this.queueDir, 'failed');
    this.sessionsDir = path.join(this.baseDir, 'sessions');
    this.logsDir = path.join(this.baseDir, 'logs');
    
    this.defaultTimeout = options.timeout || 70000; // 70s to allow 60s Claude Code + 10s buffer
    this.pollInterval = options.pollInterval || 100;
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    
    this.pendingRequests = new Map();
    this.sessions = new Map();
    
    this.log('info', 'FileCommManager initialized', {
      baseDir: this.baseDir,
      timeout: this.defaultTimeout
    });
  }

  /**
   * Initialize the file communication system
   */
  async initialize() {
    try {
      // Create directory structure
      await this.createDirectories();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.log('info', 'File communication system initialized');
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize file communication:', error);
      throw error;
    }
  }

  /**
   * Create the required directory structure
   * @private
   */
  async createDirectories() {
    const dirs = [
      this.inputDir,
      this.outputDir,
      this.processingDir,
      this.failedDir,
      this.sessionsDir,
      this.logsDir
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.log('info', 'Queue directories created successfully');
  }

  /**
   * Generate a unique request ID
   * @returns {string} - Unique request identifier
   */
  generateRequestId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    return `req-${timestamp}-${random}`;
  }

  /**
   * Generate a Trinity session ID
   * @returns {string} - Trinity-formatted session ID
   */
  generateSessionId() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '-')
      .split('.')[0];
    return `trinity-session-${timestamp}`;
  }

  /**
   * Send a request to Claude Code via file queue
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response from Claude Code
   */
  async sendRequest(prompt, options = {}) {
    const requestId = this.generateRequestId();
    const sessionId = options.sessionId || this.generateSessionId();
    
    // Ensure directories exist before sending request
    await this.createDirectories();
    
    const request = {
      id: requestId,
      sessionId,
      timestamp: new Date().toISOString(),
      prompt,
      options: {
        systemPrompt: options.systemPrompt,
        workingDirectory: options.workingDirectory || process.cwd(),
        allowedTools: options.allowedTools || ['Read', 'Write', 'Edit', 'Bash', 'LS', 'Glob', 'Grep'],
        maxTokens: options.maxTokens || 4096,
        model: options.model || 'claude-3-haiku-20240307'
      }
    };

    try {
      // Write request to input queue
      const requestFile = path.join(this.inputDir, `${requestId}.json`);
      await fs.writeFile(requestFile, JSON.stringify(request, null, 2));
      
      this.log('info', `Request queued: ${requestId}`, {
        sessionId,
        promptLength: prompt.length,
        workingDirectory: request.options.workingDirectory
      });

      // Wait for response
      const timeout = options.timeout || this.defaultTimeout;
      const response = await this.waitForResponse(requestId, timeout);
      
      return {
        success: true,
        ...response,
        requestId,
        sessionId
      };

    } catch (error) {
      this.log('error', `Request failed: ${requestId}`, error);
      
      // Clean up pending request
      this.pendingRequests.delete(requestId);
      
      throw error;
    }
  }

  /**
   * Wait for a response to a specific request
   * @param {string} requestId - Request identifier
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} - Response object
   * @private
   */
  async waitForResponse(requestId, timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Store pending request
      this.pendingRequests.set(requestId, { startTime, resolve, reject });
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out after ${timeout}ms`));
      }, timeout);

      // Start polling for response
      const pollForResponse = async () => {
        try {
          const outputFile = path.join(this.outputDir, `${requestId}.json`);
          
          // Check if response file exists
          try {
            await fs.access(outputFile);
            
            // Read and parse response
            const responseData = await fs.readFile(outputFile, 'utf8');
            const response = JSON.parse(responseData);
            
            // Clean up
            clearTimeout(timeoutId);
            this.pendingRequests.delete(requestId);
            
            // Remove response file
            await fs.unlink(outputFile).catch(() => {});
            
            const duration = Date.now() - startTime;
            this.log('info', `Response received: ${requestId}`, {
              duration,
              success: response.success
            });
            
            resolve(response);
            return;
            
          } catch (accessError) {
            // File doesn't exist yet, continue polling
          }
          
          // Check if still within timeout
          if (Date.now() - startTime < timeout) {
            setTimeout(pollForResponse, this.pollInterval);
          }
          
        } catch (error) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          reject(error);
        }
      };

      // Start polling
      pollForResponse();
    });
  }

  /**
   * Get session information
   * @param {string} sessionId - Session identifier
   * @returns {Object} - Session information
   */
  async getSessionInfo(sessionId) {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      const sessionData = await fs.readFile(sessionFile, 'utf8');
      return JSON.parse(sessionData);
    } catch (error) {
      return {
        sessionId,
        created: new Date().toISOString(),
        messages: [],
        active: false
      };
    }
  }

  /**
   * Update session information
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Updates to apply
   */
  async updateSession(sessionId, updates) {
    try {
      const sessionInfo = await this.getSessionInfo(sessionId);
      const updatedSession = {
        ...sessionInfo,
        ...updates,
        lastActivity: new Date().toISOString()
      };
      
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(updatedSession, null, 2));
      
    } catch (error) {
      this.log('error', `Failed to update session ${sessionId}:`, error);
    }
  }

  /**
   * Start cleanup timer for old files
   * @private
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldFiles().catch(error => {
        this.log('error', 'Cleanup failed:', error);
      });
    }, this.cleanupInterval);
  }

  /**
   * Clean up old files from queues
   * @private
   */
  async cleanupOldFiles() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    const dirs = [this.outputDir, this.failedDir, this.processingDir];
    
    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
              await fs.unlink(filePath);
              this.log('debug', `Cleaned up old file: ${file}`);
            }
          }
        }
      } catch (error) {
        this.log('error', `Cleanup failed for ${dir}:`, error);
      }
    }
  }

  /**
   * Get system status
   * @returns {Object} - System status information
   */
  async getStatus() {
    try {
      const [inputFiles, processingFiles, outputFiles, failedFiles] = await Promise.all([
        fs.readdir(this.inputDir),
        fs.readdir(this.processingDir),
        fs.readdir(this.outputDir),
        fs.readdir(this.failedDir)
      ]);

      return {
        queues: {
          input: inputFiles.filter(f => f.endsWith('.json')).length,
          processing: processingFiles.filter(f => f.endsWith('.json')).length,
          output: outputFiles.filter(f => f.endsWith('.json')).length,
          failed: failedFiles.filter(f => f.endsWith('.json')).length
        },
        pendingRequests: this.pendingRequests.size,
        baseDir: this.baseDir,
        uptime: process.uptime()
      };
    } catch (error) {
      this.log('error', 'Failed to get status:', error);
      return { error: error.message };
    }
  }

  /**
   * Shutdown the file communication system
   */
  async shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Reject all pending requests
    for (const [requestId, { reject }] of this.pendingRequests) {
      reject(new Error('System shutting down'));
    }
    this.pendingRequests.clear();
    
    this.log('info', 'File communication system shutdown');
  }

  /**
   * Logging utility
   * @private
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component: 'FileCommManager',
      message,
      ...(data && { data })
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data ? data : '');
    
    // Also emit for external logging
    this.emit('log', logEntry);
  }
}

module.exports = FileCommManager;