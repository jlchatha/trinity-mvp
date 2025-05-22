const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ClaudeCodeSDK = require('./src/core/claude-integration');
const AGENT_PROMPTS = require('./src/core/ai-prompts');

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
    
    // Initialize Claude Code SDK
    this.claudeSDK = new ClaudeCodeSDK({
      workingDirectory: __dirname,
      debugMode: process.env.NODE_ENV === 'development',
      logLevel: 'info'
    });
    
    // Setup SDK event listeners
    this.setupSDKEventListeners();
    
    console.log('Trinity MVP App initialized with Claude Code SDK');
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

  createWindow() {
    console.log('Creating Trinity MVP window...');
    
    // Create the browser window with professional styling
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
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
      // TODO: Initialize Trinity MVP components
      // - MCP Server connection
      // - Memory hierarchy
      // - Task registry
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
  }

  handleWindowAllClosed() {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }
  
  cleanup() {
    console.log('Cleaning up Trinity MVP resources...');
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
  
  // Overseer handlers (using Claude Code SDK with Haiku-optimized prompts)
  ipcMain.handle('overseer:sendMessage', async (event, message) => {
    console.log('Overseer message received:', message);
    
    try {
      // Process message through Claude Code SDK with Trinity-optimized prompt
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
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Overseer message processing failed:', error);
      return {
        status: 'error',
        error: error.message,
        fallbackResponse: AGENT_PROMPTS.RECOVERY.fallbackResponse
      };
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