const { app, BrowserWindow, ipcMain, Menu, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ClaudeCodeSDK = require('./src/core/claude-integration');
const AGENT_PROMPTS = require('./src/core/ai-prompts');
const { TrinityIPCBridge } = require('./src/electron/trinity-ipc-bridge');

// Setup debug logging
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `trinity-mvp-${new Date().toISOString().split('T')[0]}.log`);
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function writeLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    // Fallback to original console if file writing fails
    originalConsoleError('Failed to write to log file:', err);
  }
}

// Override console methods to include file logging
console.log = (...args) => {
  originalConsoleLog(...args);
  writeLog('INFO', ...args);
};

console.error = (...args) => {
  originalConsoleError(...args);
  writeLog('ERROR', ...args);
};

console.warn = (...args) => {
  originalConsoleWarn(...args);
  writeLog('WARN', ...args);
};

// Log GPU errors specifically
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

class TrinityMVPApp {
  constructor() {
    this.mainWindow = null;
    this.isReady = false;
    this.claudeWatcherProcess = null;
    this.trinityBridge = null;
    
    // Initialize Claude Code SDK
    this.claudeSDK = new ClaudeCodeSDK({
      workingDirectory: __dirname,
      debugMode: process.env.NODE_ENV === 'development',
      logLevel: 'info'
    });
    
    // Setup SDK event listeners
    this.setupSDKEventListeners();
    
    // Start Claude Watcher daemon for queue processing
    this.startClaudeWatcher();
    
    console.log('Trinity MVP App initialized with Claude Code SDK and Claude Watcher');
  }
  
  setupSDKEventListeners() {
    this.claudeSDK.on('backgroundTaskProgress', (data) => {
      console.log(`Background task ${data.taskId} progress:`, data.output.substring(0, 100));
      
      // Send progress to renderer if window exists
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('worker:taskUpdate', {
          taskId: data.taskId,
          type: 'progress',
          data: data.output
        });
      }
    });
    
    this.claudeSDK.on('backgroundTaskComplete', (data) => {
      console.log(`Background task ${data.taskId} completed with status:`, data.status);
      
      // Send completion to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('worker:taskUpdate', {
          taskId: data.taskId,
          type: 'complete',
          status: data.status,
          output: data.output
        });
      }
    });
    
    this.claudeSDK.on('backgroundTaskError', (data) => {
      console.error(`Background task ${data.taskId} error:`, data.error);
      
      // Send error to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('worker:taskUpdate', {
          taskId: data.taskId,
          type: 'error',
          error: data.error
        });
      }
    });
  }

  /**
   * Start the Claude Watcher daemon process for processing file queue
   */
  startClaudeWatcher() {
    console.log('Starting Claude Watcher daemon...');
    
    try {
      const claudeWatcherPath = path.join(__dirname, 'claude-watcher.js');
      
      // Start claude-watcher as a background process
      this.claudeWatcherProcess = exec(`node "${claudeWatcherPath}"`, {
        cwd: __dirname,
        detached: false, // Keep attached to main process
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Log claude-watcher output
      this.claudeWatcherProcess.stdout.on('data', (data) => {
        console.log('[Claude Watcher]:', data.toString().trim());
      });
      
      this.claudeWatcherProcess.stderr.on('data', (data) => {
        console.error('[Claude Watcher Error]:', data.toString().trim());
      });
      
      this.claudeWatcherProcess.on('close', (code) => {
        console.log(`Claude Watcher process exited with code ${code}`);
        this.claudeWatcherProcess = null;
        
        // Restart if exit was unexpected (not during app shutdown)
        if (code !== 0 && !this.isShuttingDown) {
          console.log('Restarting Claude Watcher daemon...');
          setTimeout(() => this.startClaudeWatcher(), 2000);
        }
      });
      
      this.claudeWatcherProcess.on('error', (error) => {
        console.error('Failed to start Claude Watcher:', error);
        this.claudeWatcherProcess = null;
      });
      
      console.log('Claude Watcher daemon started successfully');
      
    } catch (error) {
      console.error('Error starting Claude Watcher:', error);
    }
  }

  /**
   * Stop the Claude Watcher daemon process
   */
  stopClaudeWatcher() {
    if (this.claudeWatcherProcess) {
      console.log('Stopping Claude Watcher daemon...');
      this.isShuttingDown = true;
      
      try {
        this.claudeWatcherProcess.kill();
        this.claudeWatcherProcess = null;
        console.log('Claude Watcher daemon stopped');
      } catch (error) {
        console.error('Error stopping Claude Watcher:', error);
      }
    }
  }

  createWindow() {
    console.log('Creating Trinity MVP window...');
    
    // Create the browser window with professional styling
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      title: 'Trinity MVP - Professional AI Assistant', // Set proper window title
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        // GPU acceleration settings to reduce errors
        experimentalFeatures: false,
        enableBlinkFeatures: '',
        disableBlinkFeatures: 'Accelerated2dCanvas,AcceleratedSmallCanvases'
      },
      titleBarStyle: 'hiddenInset', // Professional macOS style
      frame: process.platform !== 'darwin', // Frameless on macOS
      show: false, // Don't show until ready
      backgroundColor: '#1a1a1a', // Professional dark background
      icon: path.join(__dirname, 'assets', 'icon.png')
    });

    // Load the loading screen
    this.mainWindow.loadFile('renderer/loading.html');

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Focus the window
      if (process.platform === 'darwin') {
        app.dock.show();
      }
      this.mainWindow.focus();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Simulate loading process (replace with actual initialization)
    setTimeout(() => {
      this.initializeApplication();
    }, 3000);
  }

  async initializeApplication() {
    try {
      console.log('Initializing Trinity MVP application...');
      
      // Initialize Trinity IPC Bridge and components
      console.log('Initializing Trinity components...');
      this.trinityBridge = new TrinityIPCBridge(this.mainWindow);
      
      // Wait for Trinity components to initialize
      // The bridge will handle component initialization and IPC setup automatically
      
      // Attach Trinity components to this instance for IPC handlers
      await this.waitForTrinityComponents();
      
      // Setup Claude project configuration for reliable command execution
      await this.setupClaudeProjectConfig();
      
      console.log('Trinity components initialized successfully');
      // - Agent communication
      
      console.log('Trinity MVP initializing...');
      
      // Check for accessibility mode via environment variable or command line
      const useAccessibleUI = process.env.TRINITY_ACCESSIBLE === 'true' || 
                             process.argv.includes('--accessible');
      
      // Load main application interface
      const indexFile = useAccessibleUI ? 'renderer/index-accessible.html' : 'renderer/index.html';
      await this.mainWindow.loadFile(indexFile);
      
      this.isReady = true;
      console.log(`Trinity MVP ready (${useAccessibleUI ? 'Accessible' : 'Standard'} UI)`);
      
    } catch (error) {
      console.error('Failed to initialize Trinity MVP:', error);
      // TODO: Show error screen
    }
  }

  handleAppReady() {
    this.createWindow();
    this.createApplicationMenu();
  }

  createApplicationMenu() {
    const template = [
      {
        label: 'Trinity MVP',
        submenu: [
          {
            label: 'About Trinity MVP',
            click: () => {
              dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'About Trinity MVP',
                message: 'Trinity MVP - Professional AI Assistant',
                detail: 'Version 1.0.0\nA context-efficient dual-agent AI system\nBuilt with Claude Code integration'
              });
            }
          },
          { type: 'separator' },
          {
            label: 'Check for Updates',
            click: () => this.checkForUpdates()
          },
          { type: 'separator' },
          {
            label: 'Send Feedback',
            click: () => this.sendFeedback()
          },
          { type: 'separator' },
          {
            label: 'Exit Trinity MVP',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template[3].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  async checkForUpdates() {
    console.log('Checking for Trinity MVP updates...');
    
    try {
      // Execute git pull
      const gitCommand = 'git pull origin main';
      const result = await new Promise((resolve, reject) => {
        exec(gitCommand, { cwd: __dirname }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });

      // Parse git pull result
      if (result.stdout.includes('Already up to date') || result.stdout.includes('Already up-to-date')) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Trinity MVP Updates',
          message: 'Trinity is up to date!',
          detail: 'You have the latest version of Trinity MVP.',
          buttons: ['OK']
        });
      } else {
        const updateResult = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Trinity MVP Updates',
          message: 'Trinity updated successfully!',
          detail: 'Trinity MVP has been updated to the latest version.\n\nWould you like to restart the application now?',
          buttons: ['Restart Now', 'Restart Later'],
          defaultId: 0
        });

        if (updateResult.response === 0) {
          app.relaunch();
          app.exit();
        }
      }

    } catch (error) {
      console.error('Update check failed:', error);
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates',
        detail: `Error: ${error.message}\n\nPlease check your internet connection and try again.`,
        buttons: ['OK']
      });
    }
  }

  async sendFeedback() {
    console.log('Preparing feedback package...');
    
    try {
      // Collect system information
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        appVersion: app.getVersion(),
        timestamp: new Date().toISOString()
      };

      // Get log files
      const logFiles = [];
      try {
        const logDir = path.join(__dirname, 'logs');
        if (fs.existsSync(logDir)) {
          const files = fs.readdirSync(logDir);
          files.forEach(file => {
            if (file.endsWith('.log')) {
              const content = fs.readFileSync(path.join(logDir, file), 'utf8');
              logFiles.push({ filename: file, content: content.slice(-5000) }); // Last 5KB
            }
          });
        }
      } catch (logError) {
        console.warn('Could not read log files:', logError);
      }

      // Collect queue system status
      const queueStatus = await this.getQueueSystemStatus();

      // Create feedback package
      const feedbackPackage = {
        systemInfo,
        logFiles,
        queueStatus,
        timestamp: new Date().toISOString(),
        userIssue: "Undefined responses from Trinity MVP - Claude Code integration issue"
      };

      const feedbackJSON = JSON.stringify(feedbackPackage, null, 2);

      // Show feedback options
      const result = await dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Send Feedback - Choose Method',
        message: 'How would you like to send the feedback?',
        detail: 'Choose the easiest method for you to send diagnostic information.',
        buttons: ['Copy to Clipboard', 'Save to Desktop', 'Submit to GitHub', 'Cancel'],
        defaultId: 0
      });

      switch (result.response) {
        case 0: // Copy to Clipboard
          clipboard.writeText(feedbackJSON);
          dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Feedback Copied!',
            message: 'Feedback has been copied to your clipboard.',
            detail: 'You can now paste it into an email, chat message, or text document.\n\nPress Cmd+V to paste anywhere.',
            buttons: ['OK']
          });
          break;

        case 1: // Save to Desktop
          const desktopPath = path.join(require('os').homedir(), 'Desktop');
          const feedbackFile = path.join(desktopPath, `trinity-mvp-feedback-${Date.now()}.json`);
          fs.writeFileSync(feedbackFile, feedbackJSON);
          
          const fileResult = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Feedback Saved to Desktop',
            message: 'Feedback package saved successfully!',
            detail: `File saved: ${path.basename(feedbackFile)}\n\nYou can attach this file to emails or messages.`,
            buttons: ['Open Desktop', 'OK'],
            defaultId: 1
          });

          if (fileResult.response === 0) {
            shell.showItemInFolder(feedbackFile);
          }
          break;

        case 2: // Submit to GitHub
          await this.submitFeedbackToGitHub(feedbackPackage);
          break;

        case 3: // Cancel
          return;
      }

    } catch (error) {
      console.error('Feedback package creation failed:', error);
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Feedback Package Failed',
        message: 'Could not create feedback package',
        detail: `Error: ${error.message}`,
        buttons: ['OK']
      });
    }
  }

  async getQueueSystemStatus() {
    try {
      const queueDir = path.join(require('os').homedir(), '.trinity-mvp', 'queue');
      const status = {
        queueDirectoryExists: fs.existsSync(queueDir),
        inputFiles: [],
        processingFiles: [],
        outputFiles: [],
        failedFiles: []
      };

      if (status.queueDirectoryExists) {
        const subDirs = ['input', 'processing', 'output', 'failed'];
        for (const subDir of subDirs) {
          const dirPath = path.join(queueDir, subDir);
          if (fs.existsSync(dirPath)) {
            status[`${subDir}Files`] = fs.readdirSync(dirPath);
          }
        }
      }

      return status;
    } catch (error) {
      return { error: error.message };
    }
  }

  async submitFeedbackToGitHub(feedbackPackage) {
    try {
      // Create issue content
      const issueTitle = `[macOS Bug Report] Undefined responses - ${new Date().toISOString().split('T')[0]}`;
      const issueBody = `## Issue Description
Trinity MVP is running successfully on macOS but returning undefined responses to user messages.

## System Information
- Platform: ${feedbackPackage.systemInfo.platform}
- Architecture: ${feedbackPackage.systemInfo.arch}
- Node.js: ${feedbackPackage.systemInfo.nodeVersion}
- Electron: ${feedbackPackage.systemInfo.electronVersion}
- Timestamp: ${feedbackPackage.timestamp}

## Queue System Status
\`\`\`json
${JSON.stringify(feedbackPackage.queueStatus, null, 2)}
\`\`\`

## Recent Logs
${feedbackPackage.logFiles.map(log => `### ${log.filename}\n\`\`\`\n${log.content.slice(-2000)}\n\`\`\``).join('\n\n')}

## Auto-Generated Report
This report was automatically generated by Trinity MVP's feedback system.`;

      // Try to create GitHub issue via git command
      const gitCommand = `cd ${__dirname} && git log --oneline -1`;
      const gitResult = await new Promise((resolve) => {
        exec(gitCommand, (error, stdout) => {
          resolve(stdout || 'Unable to get git info');
        });
      });

      // Show GitHub submission dialog
      const result = await dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Submit to GitHub',
        message: 'Ready to submit feedback to GitHub!',
        detail: `Issue Title: ${issueTitle}\n\nThis will copy the GitHub issue content to your clipboard. You can then paste it at:\nhttps://github.com/jlchatha/trinity-mvp/issues/new`,
        buttons: ['Copy Issue & Open GitHub', 'Copy Issue Only', 'Cancel'],
        defaultId: 0
      });

      if (result.response === 0) {
        // Copy and open GitHub
        clipboard.writeText(`${issueTitle}\n\n${issueBody}`);
        shell.openExternal('https://github.com/jlchatha/trinity-mvp/issues/new');
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'GitHub Issue Ready',
          message: 'Issue content copied to clipboard!',
          detail: 'GitHub should open in your browser. Paste the content (Cmd+V) into the issue description.',
          buttons: ['OK']
        });
      } else if (result.response === 1) {
        // Copy only
        clipboard.writeText(`${issueTitle}\n\n${issueBody}`);
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Issue Content Copied',
          message: 'GitHub issue content copied to clipboard!',
          detail: 'Visit github.com/jlchatha/trinity-mvp/issues/new to submit the issue.',
          buttons: ['OK']
        });
      }

    } catch (error) {
      console.error('GitHub submission failed:', error);
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'GitHub Submission Failed',
        message: 'Could not prepare GitHub submission',
        detail: `Error: ${error.message}\n\nTry "Copy to Clipboard" instead.`,
        buttons: ['OK']
      });
    }
  }

  handleWindowAllClosed() {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  /**
   * Wait for Trinity components to initialize and attach them to this instance
   */
  async waitForTrinityComponents() {
    return new Promise((resolve) => {
      // Check if bridge is already initialized
      if (this.trinityBridge && this.trinityBridge.isInitialized) {
        this.attachTrinityComponents();
        resolve();
        return;
      }
      
      // Wait for Trinity components to initialize
      const checkInterval = setInterval(() => {
        if (this.trinityBridge && this.trinityBridge.isInitialized) {
          clearInterval(checkInterval);
          this.attachTrinityComponents();
          resolve();
        }
      }, 100);
      
      // Timeout after 2 seconds for faster startup
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Trinity components initialization timeout (continuing anyway)');
        resolve();
      }, 2000);
    });
  }

  /**
   * Attach Trinity components from bridge to this instance for IPC handlers
   */
  attachTrinityComponents() {
    if (this.trinityBridge && this.trinityBridge.components) {
      this.memoryHierarchy = this.trinityBridge.components.memory;
      this.taskRegistry = this.trinityBridge.components.tasks;
      this.recoveryTools = this.trinityBridge.components.recovery;
      this.autoCompactDetector = this.trinityBridge.components.autoCompact;
      
      console.log('[Trinity IPC] ✅ IPC handlers connected to Trinity components');
    }
  }

  /**
   * Setup Claude project configuration for reliable command execution
   * Prevents hanging issues by configuring tool permissions properly
   */
  async setupClaudeProjectConfig() {
    try {
      console.log('[Trinity Setup] Checking Claude project settings...');
      
      const { spawn } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      // Check if Claude config already exists
      const claudeConfigPath = path.join(process.cwd(), '.claude');
      const configExists = fs.existsSync(claudeConfigPath);
      
      if (configExists) {
        console.log('[Trinity Setup] ✅ Claude config already exists');
        return;
      }
      
      // Skip config setup on startup to improve performance
      // Config will be handled by claude-watcher when needed
      console.log('[Trinity Setup] ⚡ Skipping config setup for faster startup');
      console.log('[Trinity Setup] ℹ️ Claude tools will be configured on first use');
      
    } catch (error) {
      console.warn('[Trinity Setup] ⚠️ Claude config check failed:', error.message);
    }
  }

  /**
   * Run a Claude config command and wait for completion
   */
  runClaudeConfigCommand(args) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const claudePath = '/home/alreadyinuse/.claude/local/claude';
      
      const proc = spawn(claudePath, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
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
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Claude config failed (${code}): ${stderr || stdout}`));
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        proc.kill();
        reject(new Error('Claude config command timeout'));
      }, 10000);
    });
  }

  /**
   * Extract tasks from file content (TODO, FIXME, HACK comments)
   */
  async extractTasksFromContent(content, filePath) {
    const tasks = [];
    const lines = content.split('\n');
    const fileName = require('path').basename(filePath);
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Match TODO, FIXME, HACK, NOTE comments
      const todoMatch = trimmedLine.match(/(TODO|FIXME|HACK|NOTE):\s*(.+)/i);
      if (todoMatch) {
        const type = todoMatch[1].toLowerCase();
        const description = todoMatch[2];
        
        tasks.push({
          title: `${type.toUpperCase()}: ${description}`,
          description: `From ${fileName}:${index + 1}\n${description}`,
          source: 'file-extraction',
          filePath: filePath,
          lineNumber: index + 1,
          priority: type === 'fixme' ? 'high' : type === 'hack' ? 'medium' : 'low',
          type: type,
          status: 'pending'
        });
      }
    });
    
    return tasks;
  }
  
  cleanup() {
    console.log('Cleaning up Trinity MVP resources...');
    
    // Stop Claude Watcher daemon
    this.stopClaudeWatcher();
    
    // Cleanup Claude SDK
    if (this.claudeSDK) {
      this.claudeSDK.destroy();
    }
  }

  handleActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }
}

// Setup IPC handlers for Trinity API
function setupTrinityAPIHandlers(trinityApp) {
  console.log('Setting up Trinity API handlers...');
  
  // System handlers
  ipcMain.handle('system:getInfo', async () => {
    return {
      platform: process.platform,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      appVersion: app.getVersion(),
      claudeSDKReady: !!trinityApp.claudeSDK,
      ready: true
    };
  });
  
  ipcMain.handle('system:checkConnectivity', async () => {
    // Check Claude Code availability
    try {
      const result = await trinityApp.claudeSDK.executeCommand('ping', {
        sessionId: 'connectivity-test'
      });
      return { 
        connected: true, 
        claudeSDK: result.success,
        mcpServer: false // TODO: Implement MCP server check
      };
    } catch (error) {
      return { 
        connected: false, 
        claudeSDK: false,
        mcpServer: false,
        error: error.message
      };
    }
  });
  
  // Application control handlers
  ipcMain.handle('app:minimize', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.minimize();
  });
  
  ipcMain.handle('app:maximize', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });
  
  ipcMain.handle('app:close', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
  });
  
  // Overseer handlers (using Claude Code SDK with direct API fallback)
  ipcMain.handle('overseer:sendMessage', async (event, message) => {
    console.log('Overseer message received:', message);
    
    try {
      // Try Claude Code SDK first
      const result = await trinityApp.claudeSDK.executeCommand(
        message,
        {
          sessionId: 'overseer-main',
          role: 'OVERSEER',
          systemPrompt: AGENT_PROMPTS.OVERSEER.systemPrompt
        }
      );
      
      return { 
        status: 'processed', 
        response: result.result,
        sessionId: result.sessionId,
        method: 'claude-code'
      };
    } catch (error) {
      console.warn('Claude Code failed, trying direct API fallback:', error.message);
      
      // Fallback to direct Claude API
      try {
        const directResponse = await trinityApp.executeDirectClaudeAPI(message);
        return {
          status: 'processed',
          response: directResponse,
          sessionId: 'direct-api-fallback',
          method: 'direct-api'
        };
      } catch (apiError) {
        console.error('Both Claude Code and direct API failed:', apiError);
        return {
          status: 'error',
          error: `Claude Code: ${error.message}, Direct API: ${apiError.message}`,
          fallbackResponse: `Hello! I'm Trinity Assistant. I'm currently experiencing some technical difficulties with my Claude Code integration, but I'm working to resolve them. 

Your message was: "${message}"

While I work on fixing the technical issues, I can tell you that I'm designed to be your intelligent assistant for complex problem solving, coding, documentation, and project management. Once the integration is restored, I'll be able to help you with a wide range of tasks using my full capabilities.

Is there anything specific you'd like to know about Trinity's features while I work on getting fully operational?`,
          method: 'fallback'
        };
      }
    }
  });
  
  ipcMain.handle('overseer:getStatus', async () => {
    return { 
      status: 'active', 
      ready: true,
      sdkConnected: !!trinityApp.claudeSDK
    };
  });
  
  // Worker handlers (using Claude Code SDK with Haiku-optimized prompts)
  ipcMain.handle('worker:executeTask', async (event, task) => {
    console.log('Worker task received:', task);
    
    try {
      // Create Trinity-optimized background task prompt
      const taskPrompt = AGENT_PROMPTS.WORKER.backgroundTaskPrompt(
        task.description || task.prompt,
        task.context || {}
      );
      
      // Execute as background task through Claude Code SDK
      const result = await trinityApp.claudeSDK.executeBackgroundTask({
        prompt: taskPrompt,
        userContext: task.context || {},
        allowedTools: ['bash', 'read', 'write', 'edit', 'glob', 'grep'],
        sessionId: `worker-${Date.now()}`
      });
      
      return { 
        status: 'started', 
        taskId: result.taskId,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Worker task execution failed:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  });
  
  ipcMain.handle('worker:getCapabilities', async () => {
    return {
      domains: ['architecture', 'development', 'documentation', 'testing', 'optimization'],
      ready: !!trinityApp.claudeSDK,
      backgroundTasks: true,
      sessionManagement: true
    };
  });

  // Trinity Component API handlers
  ipcMain.handle('trinity:healthCheck', async () => {
    try {
      // Check Trinity components health
      const components = {
        memory: trinityApp.memoryHierarchy ? 'healthy' : 'error',
        tasks: trinityApp.taskRegistry ? 'healthy' : 'error', 
        recovery: trinityApp.recoveryTools ? 'healthy' : 'error',
        autocompact: trinityApp.autoCompactDetector ? 'healthy' : 'error'
      };

      return {
        status: 'healthy',
        components,
        timestamp: new Date().toISOString(),
        ready: Object.values(components).every(status => status === 'healthy')
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        components: {
          memory: 'error',
          tasks: 'error', 
          recovery: 'error',
          autocompact: 'error'
        }
      };
    }
  });

  ipcMain.handle('trinity:getTaskStats', async () => {
    try {
      if (trinityApp.taskRegistry) {
        const stats = await trinityApp.taskRegistry.getStats();
        return {
          total: stats.total || 0,
          pending: stats.pending || 0,
          inProgress: stats.inProgress || 0,
          completed: stats.completed || 0
        };
      }
      return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    } catch (error) {
      console.error('Task stats error:', error);
      return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    }
  });

  ipcMain.handle('trinity:processFile', async (event, filePath, category) => {
    try {
      console.log(`[Trinity IPC] Processing file: ${filePath} → ${category} Memory`);
      
      // Read file content
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      
      return await processFileContentInternal(require('path').basename(filePath), content, category, filePath);
    } catch (error) {
      console.error('File processing error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('trinity:processFileContent', async (event, fileName, content, category) => {
    try {
      console.log(`[Trinity IPC] Processing file content: ${fileName} → ${category} Memory`);
      
      return await processFileContentInternal(fileName, content, category, fileName);
    } catch (error) {
      console.error('File content processing error:', error);
      return { success: false, error: error.message };
    }
  });

  // Internal helper function for file processing
  async function processFileContentInternal(fileName, content, category, filePath) {
    try {
      // Store in memory hierarchy
      if (trinityApp.memoryHierarchy) {
        const result = await trinityApp.memoryHierarchy.store(
          category.toLowerCase(), 
          content, 
          {
            title: `File: ${fileName}`,
            source: 'file-drop',
            filePath: filePath,
            timestamp: new Date().toISOString()
          }
        );
        
        let tasksExtracted = 0;
        
        // Extract tasks if it's a code file
        if (trinityApp.taskRegistry && ['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(fileName.split('.').pop()?.toLowerCase())) {
          const tasks = await trinityApp.extractTasksFromContent(content, filePath);
          for (const task of tasks) {
            await trinityApp.taskRegistry.createTask(task);
          }
          tasksExtracted = tasks.length;
        }
        
        return { 
          success: true, 
          category, 
          entryId: result.id,
          tasksExtracted: tasksExtracted
        };
      }
      
      return { success: false, error: 'Memory hierarchy not available' };
    } catch (error) {
      console.error('Internal file processing error:', error);
      return { success: false, error: error.message };
    }
  }

  ipcMain.handle('trinity:optimizeContext', async () => {
    try {
      console.log('[Trinity IPC] Running context optimization...');
      
      if (trinityApp.autoCompactDetector) {
        const result = await trinityApp.autoCompactDetector.optimizeContext();
        return { 
          success: true, 
          optimized: result.optimized,
          tokensReduced: result.tokensReduced || 0
        };
      }
      
      return { success: false, error: 'Auto-compact detector not available' };
    } catch (error) {
      console.error('Context optimization error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('trinity:createCheckpoint', async () => {
    try {
      console.log('[Trinity IPC] Creating checkpoint...');
      
      if (trinityApp.recoveryTools) {
        const result = await trinityApp.recoveryTools.createCheckpoint({
          source: 'user-action',
          timestamp: new Date().toISOString()
        });
        return { 
          success: true, 
          checkpointId: result.id,
          timestamp: result.timestamp
        };
      }
      
      return { success: false, error: 'Recovery tools not available' };
    } catch (error) {
      console.error('Checkpoint creation error:', error);
      return { success: false, error: error.message };
    }
  });

  // Trinity Event handlers for real-time updates
  ipcMain.handle('trinity:subscribeToEvents', async (event) => {
    // Set up event listeners to push updates to renderer
    if (trinityApp.memoryHierarchy) {
      trinityApp.memoryHierarchy.on('entry-added', (data) => {
        event.sender.send('trinity:memory-event', { type: 'context-optimized', data });
      });
    }
    
    if (trinityApp.taskRegistry) {
      trinityApp.taskRegistry.on('task-created', (data) => {
        event.sender.send('trinity:task-event', { type: 'created', data });
      });
    }
    
    return { success: true, subscribed: true };
  });
  
  // Background task management
  ipcMain.handle('worker:getTaskStatus', async (event, taskId) => {
    return trinityApp.claudeSDK.getBackgroundTaskStatus(taskId);
  });
  
  // Memory handlers (placeholder)
  ipcMain.handle('memory:save', async (event, key, data) => {
    console.log('Memory save:', key);
    // TODO: Implement actual memory persistence
    return { saved: true };
  });
  
  ipcMain.handle('memory:load', async (event, key) => {
    console.log('Memory load:', key);
    // TODO: Implement actual memory retrieval
    return null;
  });
  
  ipcMain.handle('memory:clear', async (event, key) => {
    console.log('Memory clear:', key);
    // TODO: Implement actual memory clearing
    return { cleared: true };
  });
}

// Initialize the application
const trinityApp = new TrinityMVPApp();

// Log application startup
console.log('Trinity MVP starting up...');
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);
console.log('Node version:', process.versions.node);
console.log('Chrome version:', process.versions.chrome);

// App event handlers
app.whenReady().then(() => {
  console.log('Electron app ready, setting up Trinity API...');
  setupTrinityAPIHandlers(trinityApp);
  console.log('Creating window...');
  trinityApp.handleAppReady();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  trinityApp.handleWindowAllClosed();
});

app.on('activate', () => {
  console.log('App activated');
  trinityApp.handleActivate();
});

app.on('before-quit', () => {
  console.log('App preparing to quit');
  trinityApp.cleanup();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});