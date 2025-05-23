const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');
const FileCommManager = require('./file-manager');

/**
 * Claude Code SDK Integration for Trinity MVP
 * Provides direct interface to Claude Code for background task execution
 * and session management with Trinity-style context preservation
 */
class ClaudeCodeSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Set up logs directory first
    this.logsDir = path.join(__dirname, '..', 'logs', 'claude-sdk');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.config = {
      model: 'claude-3-haiku-20240307', // MVP uses Haiku for cost efficiency
      apiKey: this.getAPIKey(config.apiKey),
      outputFormat: 'json',
      debugMode: false,
      workingDirectory: process.cwd(),
      sessionTimeout: 3600000, // 1 hour
      maxRetries: 3,
      logLevel: 'info',
      ...config
    };
    
    // Initialize file communication manager
    this.fileComm = new FileCommManager({
      baseDir: config.baseDir,
      timeout: config.timeout || 30000,
      pollInterval: config.pollInterval || 100
    });
    
    // Session and task tracking (legacy support)
    this.activeSessions = new Map();
    this.backgroundTasks = new Map();
    this.sessionHistory = new Map();
    
    // Initialize file communication
    this.fileComm.initialize().catch(error => {
      this.log('error', 'Failed to initialize file communication:', error);
    });
    
    console.log('Claude Code SDK initialized with file communication');
    this.log('info', 'Claude Code SDK initialized with config:', {
      ...this.config,
      apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 8)}...` : 'NOT SET',
      fileCommEnabled: true
    });
  }

  /**
   * Get API key from multiple sources
   * @private
   */
  getAPIKey(providedKey) {
    // Priority order: provided key, environment variable, Trinity dev key
    if (providedKey) {
      return providedKey;
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY;
    }
    
    if (process.env.CLAUDE_API_KEY) {
      return process.env.CLAUDE_API_KEY;
    }
    
    // No fallback API key - users must provide their own
    this.log('error', 'No ANTHROPIC_API_KEY found. Please set your API key in environment variables.');
    throw new Error('ANTHROPIC_API_KEY environment variable is required. Please set your Claude API key.');
  }

  /**
   * Execute a command through Claude Code with session management via file communication
   * @param {string} prompt - The prompt/command to execute
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Result object with status and content
   */
  async executeCommand(prompt, options = {}) {
    const sessionId = options.sessionId || this.generateSessionId();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', `Executing command in session ${sessionId}:`, prompt.substring(0, 100));
    
    try {
      // Get system prompt from agent prompts if not provided
      let systemPrompt = options.systemPrompt;
      if (!systemPrompt) {
        const agentPrompts = require('./agent-prompts');
        systemPrompt = options.role === 'OVERSEER' ? 
          agentPrompts.OVERSEER.systemPrompt : 
          agentPrompts.WORKER.systemPrompt;
      }
      
      // Send request via file communication
      const result = await this.fileComm.sendRequest(prompt, {
        sessionId,
        systemPrompt,
        workingDirectory: options.workingDirectory || this.config.workingDirectory,
        allowedTools: options.allowedTools,
        maxTokens: options.maxTokens || 4096,
        model: this.config.model,
        timeout: options.timeout || 30000
      });
      
      // Update session history (legacy support)
      this.updateSessionHistory(sessionId, {
        prompt,
        result: result.content,
        timestamp: new Date(),
        taskId
      });
      
      return {
        success: result.success,
        result: result.content,
        content: result.content, // Alternative field name
        sessionId: result.sessionId,
        taskId,
        timestamp: new Date(),
        usage: result.usage,
        duration_ms: result.duration_ms
      };
      
    } catch (error) {
      this.log('error', `Command execution failed for session ${sessionId}:`, error);
      
      return {
        success: false,
        error: error.message,
        sessionId,
        taskId,
        timestamp: new Date()
      };
    }
  }

  /**
   * Execute a background task that continues without blocking
   * Perfect for Worker Agent long-running tasks
   * @param {Object} task - Task configuration
   * @returns {Promise<Object>} - Task tracking information
   */
  async executeBackgroundTask(task) {
    const sessionId = task.sessionId || this.generateSessionId();
    const taskId = `bg-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', `Starting background task ${taskId} in session ${sessionId}`);
    
    // Create system prompt for background execution
    const backgroundPrompt = `You are operating in background mode for the Trinity MVP system.
    
TASK CONTEXT:
- Task ID: ${taskId}
- Session: ${sessionId}
- User Context: ${JSON.stringify(task.userContext || {})}
- Working Directory: ${task.workingDirectory || this.config.workingDirectory}

EXECUTION PARAMETERS:
- Continue working independently without user interaction
- Save progress to session context regularly
- Handle errors gracefully and continue when possible
- Report status through structured logging

TASK PROMPT:
${task.prompt}`;

    try {
      const args = [
        '-p',                                    // Non-interactive mode
        `"${this.escapePrompt(backgroundPrompt)}"`,   // Task prompt
        '--output-format', 'json'
      ];
      
      if (sessionId) {
        args.push('--resume', sessionId);
      }
      
      if (task.allowedTools) {
        args.push('--allowed-tools', task.allowedTools.join(','));
      }
      
      // Set environment variables for background tasks
      const env = {
        ...process.env,
        ANTHROPIC_API_KEY: this.config.apiKey,
        ANTHROPIC_MODEL: this.config.model
      };
      
      // Spawn detached process for true background execution
      const claudeProcess = spawn('claude', args, {
        shell: true,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: task.workingDirectory || this.config.workingDirectory,
        env: env
      });
      
      // Track background task
      this.trackBackgroundTask(taskId, {
        process: claudeProcess,
        sessionId,
        startTime: new Date(),
        task,
        status: 'running'
      });
      
      // Setup output handling
      this._setupBackgroundTaskHandling(taskId, claudeProcess);
      
      // Unref to allow parent to exit
      claudeProcess.unref();
      
      return {
        taskId,
        sessionId,
        status: 'running',
        startTime: new Date()
      };
      
    } catch (error) {
      this.log('error', `Failed to start background task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get status of a background task
   * @param {string} taskId - Task identifier
   * @returns {Object} - Task status information
   */
  getBackgroundTaskStatus(taskId) {
    const task = this.backgroundTasks.get(taskId);
    if (!task) {
      return { status: 'not_found' };
    }
    
    return {
      taskId,
      sessionId: task.sessionId,
      status: task.status,
      startTime: task.startTime,
      lastUpdate: task.lastUpdate,
      output: task.output ? task.output.slice(-1000) : null // Last 1000 chars
    };
  }

  /**
   * Get session information and history
   * @param {string} sessionId - Session identifier
   * @returns {Object} - Session information
   */
  getSessionInfo(sessionId) {
    const session = this.activeSessions.get(sessionId);
    const history = this.sessionHistory.get(sessionId) || [];
    
    return {
      sessionId,
      active: !!session,
      created: session?.created,
      lastActivity: session?.lastActivity,
      taskCount: history.length,
      recentTasks: history.slice(-5) // Last 5 tasks
    };
  }

  /**
   * Private method to execute Claude command
   * @private
   */
  async _executeClaudeCommand(prompt, options) {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', `"${this.escapePrompt(prompt)}"`,
        '--output-format', 'json'
      ];
      
      if (options.sessionId) {
        args.push('--resume', options.sessionId);
      }
      
      if (options.systemPrompt) {
        args.push('--system-prompt', `"${this.escapePrompt(options.systemPrompt)}"`);
      }
      
      if (options.allowedTools) {
        args.push('--allowed-tools', options.allowedTools.join(','));
      }
      
      // Set environment variables for Claude Code
      const env = {
        ...process.env,
        ANTHROPIC_API_KEY: this.config.apiKey,
        ANTHROPIC_MODEL: this.config.model
      };
      
      const claudeProcess = spawn('claude', args, {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: options.workingDirectory || this.config.workingDirectory,
        env: env
      });
      
      let stdout = '';
      let stderr = '';
      
      claudeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      claudeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      claudeProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            // If JSON parsing fails, return raw output
            resolve({ content: stdout, rawOutput: true });
          }
        } else {
          reject(new Error(`Claude process exited with code ${code}: ${stderr}`));
        }
      });
      
      claudeProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn Claude process: ${error.message}`));
      });
    });
  }

  /**
   * Setup handling for background task output
   * @private
   */
  _setupBackgroundTaskHandling(taskId, process) {
    const task = this.backgroundTasks.get(taskId);
    if (!task) return;
    
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
      task.output = output;
      task.lastUpdate = new Date();
      
      // Emit progress event
      this.emit('backgroundTaskProgress', {
        taskId,
        output: data.toString(),
        timestamp: new Date()
      });
    });
    
    process.stderr.on('data', (data) => {
      this.log('warn', `Background task ${taskId} stderr:`, data.toString());
    });
    
    process.on('close', (code) => {
      task.status = code === 0 ? 'completed' : 'failed';
      task.endTime = new Date();
      
      this.emit('backgroundTaskComplete', {
        taskId,
        status: task.status,
        output: task.output,
        exitCode: code
      });
      
      this.log('info', `Background task ${taskId} completed with code ${code}`);
    });
    
    process.on('error', (error) => {
      task.status = 'error';
      task.error = error.message;
      task.endTime = new Date();
      
      this.emit('backgroundTaskError', {
        taskId,
        error: error.message,
        timestamp: new Date()
      });
      
      this.log('error', `Background task ${taskId} error:`, error);
    });
  }

  /**
   * Track a background task
   * @private
   */
  trackBackgroundTask(taskId, taskInfo) {
    this.backgroundTasks.set(taskId, taskInfo);
    
    // Update session tracking
    if (!this.activeSessions.has(taskInfo.sessionId)) {
      this.activeSessions.set(taskInfo.sessionId, {
        created: new Date(),
        lastActivity: new Date(),
        taskIds: []
      });
    }
    
    const session = this.activeSessions.get(taskInfo.sessionId);
    session.taskIds.push(taskId);
    session.lastActivity = new Date();
  }

  /**
   * Update session history for context preservation
   * @private
   */
  updateSessionHistory(sessionId, entry) {
    if (!this.sessionHistory.has(sessionId)) {
      this.sessionHistory.set(sessionId, []);
    }
    
    const history = this.sessionHistory.get(sessionId);
    history.push(entry);
    
    // Keep last 50 entries per session
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    // Update active session tracking
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        created: new Date(),
        lastActivity: new Date(),
        taskIds: []
      });
    }
    
    this.activeSessions.get(sessionId).lastActivity = new Date();
  }

  /**
   * Generate unique session ID (UUID format for Claude Code)
   * @private
   */
  generateSessionId() {
    // Generate a simple UUID v4 format that Claude Code accepts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Escape prompt for shell execution
   * @private
   */
  escapePrompt(prompt) {
    return prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Enhanced logging with file output
   * @private
   */
  log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}\n`;
    
    // Console output
    console[level === 'error' ? 'error' : 'log'](message, ...args);
    
    // File output
    const logFile = path.join(this.logsDir, `claude-sdk-${new Date().toISOString().split('T')[0]}.log`);
    try {
      fs.appendFileSync(logFile, logEntry);
    } catch (err) {
      console.error('Failed to write to Claude SDK log file:', err);
    }
  }

  /**
   * Clean up resources
   */
  async destroy() {
    this.log('info', 'Shutting down Claude Code SDK');
    
    // Shutdown file communication manager
    if (this.fileComm) {
      await this.fileComm.shutdown();
    }
    
    // Terminate any running background tasks
    for (const [taskId, task] of this.backgroundTasks) {
      if (task.process && task.status === 'running') {
        this.log('info', `Terminating background task ${taskId}`);
        task.process.kill();
      }
    }
    
    // Clear maps
    this.activeSessions.clear();
    this.backgroundTasks.clear();
    this.sessionHistory.clear();
    
    this.removeAllListeners();
  }
}

module.exports = ClaudeCodeSDK;