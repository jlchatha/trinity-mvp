/**
 * Trinity IPC Communication Bridge
 * 
 * Connects Trinity components (Main Process) with Electron UI (Renderer Process)
 * Enables real-time status updates and manual operation triggers
 */

const { ipcMain, ipcRenderer } = require('electron');
const path = require('path');

// Trinity Components
const MemoryHierarchy = require('../core/memory-hierarchy');
const TaskRegistry = require('../core/task-registry');
const RecoveryTools = require('../core/recovery-tools');
const AutoCompactDetector = require('../core/auto-compact-detector');

class TrinityIPCBridge {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.components = {};
    this.isInitialized = false;
    
    this.initializeComponents();
    this.setupIPCHandlers();
  }

  /**
   * Initialize Trinity components in main process
   */
  async initializeComponents() {
    try {
      console.log('[Trinity IPC] Initializing Trinity components...');
      
      const baseDir = process.cwd();
      const mvpDataDir = path.join(require('os').homedir(), '.trinity-mvp');
      
      // Initialize Memory Hierarchy
      this.components.memory = new MemoryHierarchy({
        baseDir,
        mvpDataDir
      });
      await this.components.memory.initialize();
      
      // Initialize Task Registry with Memory integration
      this.components.tasks = new TaskRegistry({
        baseDir,
        mvpDataDir,
        memoryHierarchy: this.components.memory
      });
      await this.components.tasks.initialize();
      
      // Initialize Recovery Tools with component integration
      this.components.recovery = new RecoveryTools({
        baseDir,
        mvpDataDir,
        memoryHierarchy: this.components.memory,
        taskRegistry: this.components.tasks
      });
      await this.components.recovery.initialize();
      
      // Initialize Auto-Compact Detector
      this.components.autoCompact = new AutoCompactDetector({
        baseDir,
        mvpDataDir
      });
      
      this.setupComponentEventListeners();
      this.isInitialized = true;
      
      console.log('[Trinity IPC] ✅ All Trinity components initialized');
      
      // Notify renderer that Trinity is ready
      this.sendToRenderer('trinity-ready', {
        timestamp: new Date().toISOString(),
        components: Object.keys(this.components)
      });
      
    } catch (error) {
      console.error('[Trinity IPC] ❌ Component initialization failed:', error);
      this.sendToRenderer('trinity-error', {
        error: error.message,
        phase: 'initialization'
      });
    }
  }

  /**
   * Setup IPC handlers for Trinity operations
   */
  setupIPCHandlers() {
    // Memory operations
    ipcMain.handle('trinity-memory-stats', async () => {
      if (!this.components.memory) throw new Error('Memory component not available');
      return await this.components.memory.getStats();
    });
    
    ipcMain.handle('trinity-memory-store', async (event, tier, content, metadata) => {
      if (!this.components.memory) throw new Error('Memory component not available');
      return await this.components.memory.store(tier, content, metadata);
    });
    
    ipcMain.handle('trinity-memory-retrieve', async (event, criteria) => {
      if (!this.components.memory) throw new Error('Memory component not available');
      return await this.components.memory.retrieve(criteria);
    });
    
    ipcMain.handle('trinity-memory-optimize', async (event, userId, projectId, requestType) => {
      if (!this.components.memory) throw new Error('Memory component not available');
      return await this.components.memory.buildOptimizedContext(userId, projectId, requestType);
    });

    // Task operations
    ipcMain.handle('trinity-tasks-stats', async () => {
      if (!this.components.tasks) throw new Error('Task component not available');
      return await this.components.tasks.getStats();
    });
    
    ipcMain.handle('trinity-tasks-create', async (event, taskData) => {
      if (!this.components.tasks) throw new Error('Task component not available');
      return await this.components.tasks.createTask(taskData);
    });
    
    ipcMain.handle('trinity-tasks-update', async (event, taskId, updates) => {
      if (!this.components.tasks) throw new Error('Task component not available');
      return await this.components.tasks.updateTask(taskId, updates);
    });
    
    ipcMain.handle('trinity-tasks-get', async (event, taskId) => {
      if (!this.components.tasks) throw new Error('Task component not available');
      return await this.components.tasks.getTask(taskId);
    });
    
    ipcMain.handle('trinity-tasks-for-agent', async (event, agentType) => {
      if (!this.components.tasks) throw new Error('Task component not available');
      return await this.components.tasks.getTasksForAgent(agentType);
    });

    // Recovery operations
    ipcMain.handle('trinity-recovery-checkpoint', async (event, sessionData) => {
      if (!this.components.recovery) throw new Error('Recovery component not available');
      return await this.components.recovery.createCheckpoint(sessionData);
    });
    
    ipcMain.handle('trinity-recovery-latest', async () => {
      if (!this.components.recovery) throw new Error('Recovery component not available');
      return await this.components.recovery.loadLatestCheckpoint();
    });
    
    ipcMain.handle('trinity-recovery-prompt', async (event, checkpoint) => {
      if (!this.components.recovery) throw new Error('Recovery component not available');
      return await this.components.recovery.generateRecoveryPrompt(checkpoint);
    });

    // File processing operations
    ipcMain.handle('trinity-process-file', async (event, filePath, category) => {
      return await this.processFileWithTrinity(filePath, category);
    });
    
    ipcMain.handle('trinity-extract-tasks', async (event, content, fileName) => {
      return this.extractTasksFromContent(content, fileName);
    });

    // System operations
    ipcMain.handle('trinity-status', async () => {
      return {
        initialized: this.isInitialized,
        components: Object.keys(this.components),
        lastUpdate: new Date().toISOString()
      };
    });
    
    ipcMain.handle('trinity-health-check', async () => {
      const health = {
        timestamp: new Date().toISOString(),
        components: {}
      };
      
      // Check each component health
      for (const [name, component] of Object.entries(this.components)) {
        try {
          if (component && typeof component.getStats === 'function') {
            await component.getStats();
            health.components[name] = 'healthy';
          } else {
            health.components[name] = 'available';
          }
        } catch (error) {
          health.components[name] = `error: ${error.message}`;
        }
      }
      
      return health;
    });

    console.log('[Trinity IPC] ✅ IPC handlers registered');
  }

  /**
   * Setup component event listeners for real-time updates
   */
  setupComponentEventListeners() {
    // Memory events
    if (this.components.memory) {
      this.components.memory.on('memory-initialized', (data) => {
        this.sendToRenderer('trinity-memory-event', { type: 'initialized', data });
      });
      
      this.components.memory.on('context-optimized', (data) => {
        this.sendToRenderer('trinity-memory-event', { type: 'context-optimized', data });
      });
      
      this.components.memory.on('memory-error', (data) => {
        this.sendToRenderer('trinity-memory-event', { type: 'error', data });
      });
    }

    // Task events
    if (this.components.tasks) {
      this.components.tasks.on('task-created', (task) => {
        this.sendToRenderer('trinity-task-event', { type: 'created', data: task });
      });
      
      this.components.tasks.on('task-updated', (task) => {
        this.sendToRenderer('trinity-task-event', { type: 'updated', data: task });
      });
      
      this.components.tasks.on('registry-error', (data) => {
        this.sendToRenderer('trinity-task-event', { type: 'error', data });
      });
    }

    // Recovery events
    if (this.components.recovery) {
      this.components.recovery.on('checkpoint-created', (checkpoint) => {
        this.sendToRenderer('trinity-recovery-event', { type: 'checkpoint-created', data: checkpoint });
      });
      
      this.components.recovery.on('checkpoint-loaded', (checkpoint) => {
        this.sendToRenderer('trinity-recovery-event', { type: 'checkpoint-loaded', data: checkpoint });
      });
      
      this.components.recovery.on('recovery-error', (data) => {
        this.sendToRenderer('trinity-recovery-event', { type: 'error', data });
      });
    }

    console.log('[Trinity IPC] ✅ Component event listeners setup');
  }

  /**
   * Process file with Trinity intelligence
   */
  async processFileWithTrinity(filePath, category) {
    try {
      const fs = require('fs').promises;
      const fileContent = await fs.readFile(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      // Extract tasks
      const extractedTasks = this.extractTasksFromContent(fileContent, fileName);
      
      // Create tasks if found
      const createdTasks = [];
      if (extractedTasks.length > 0 && this.components.tasks) {
        for (const taskData of extractedTasks) {
          const task = await this.components.tasks.createTask({
            title: taskData.title,
            description: taskData.description,
            type: 'extracted',
            assignedTo: 'worker',
            priority: 'medium',
            context: { 
              sourceFile: fileName,
              sourceLine: taskData.sourceLine
            }
          });
          createdTasks.push(task);
        }
      }
      
      // Store in memory
      let memoryResult = null;
      if (this.components.memory) {
        const tier = this.categoryToTier(category);
        memoryResult = await this.components.memory.store(tier, {
          type: 'file_context',
          content: fileContent,
          fileName: fileName,
          filePath: filePath,
          processedAt: new Date().toISOString()
        }, {
          title: fileName,
          description: `File processed: ${category}`,
          tags: ['file', 'processed', tier]
        });
      }
      
      return {
        success: true,
        fileName,
        category,
        tasksExtracted: extractedTasks.length,
        tasksCreated: createdTasks.length,
        memoryStored: !!memoryResult,
        tasks: createdTasks
      };
      
    } catch (error) {
      console.error('[Trinity IPC] File processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract tasks from content
   */
  extractTasksFromContent(content, fileName) {
    const tasks = [];
    const lines = content.split('\n');
    
    // Task extraction patterns
    const taskPatterns = [
      { pattern: /TODO:?\s*(.+)/i, type: 'todo' },
      { pattern: /FIXME:?\s*(.+)/i, type: 'fixme' },
      { pattern: /HACK:?\s*(.+)/i, type: 'hack' },
      { pattern: /BUG:?\s*(.+)/i, type: 'bug' },
      { pattern: /NOTE:?\s*(.+)/i, type: 'note' },
      { pattern: /\[ \]\s*(.+)/g, type: 'checkbox' }, // Markdown checkboxes
      { pattern: /\*\s*\[\s*\]\s*(.+)/g, type: 'checkbox' } // Alternative checkbox format
    ];
    
    lines.forEach((line, index) => {
      taskPatterns.forEach(({ pattern, type }) => {
        const match = line.match(pattern);
        if (match) {
          tasks.push({
            title: `${fileName}:${index + 1} - ${match[1].trim()}`,
            description: `${type.toUpperCase()} extracted from ${fileName} at line ${index + 1}`,
            type: type,
            sourceFile: fileName,
            sourceLine: index + 1,
            originalText: line.trim()
          });
        }
      });
    });
    
    return tasks;
  }

  /**
   * Convert category to memory tier
   */
  categoryToTier(category) {
    const mapping = {
      'Core Memory': 'core',
      'Working Memory': 'working',
      'Reference Memory': 'reference',
      'Historical Memory': 'historical'
    };
    return mapping[category] || 'working';
  }

  /**
   * Send message to renderer process
   */
  sendToRenderer(channel, data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Get component reference for direct access
   */
  getComponent(name) {
    return this.components[name];
  }

  /**
   * Get all components
   */
  getAllComponents() {
    return this.components;
  }
}

// Renderer-side Trinity API
class TrinityRendererAPI {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for Trinity events
    if (typeof window !== 'undefined' && window.require) {
      const { ipcRenderer } = window.require('electron');
      
      ipcRenderer.on('trinity-ready', (event, data) => {
        console.log('[Trinity UI] Trinity components ready:', data);
        window.dispatchEvent(new CustomEvent('trinity-ready', { detail: data }));
      });
      
      ipcRenderer.on('trinity-memory-event', (event, data) => {
        window.dispatchEvent(new CustomEvent('trinity-memory-event', { detail: data }));
      });
      
      ipcRenderer.on('trinity-task-event', (event, data) => {
        window.dispatchEvent(new CustomEvent('trinity-task-event', { detail: data }));
      });
      
      ipcRenderer.on('trinity-recovery-event', (event, data) => {
        window.dispatchEvent(new CustomEvent('trinity-recovery-event', { detail: data }));
      });
    }
  }

  // Memory operations
  async getMemoryStats() {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-memory-stats');
  }

  async storeInMemory(tier, content, metadata) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-memory-store', tier, content, metadata);
  }

  async retrieveFromMemory(criteria) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-memory-retrieve', criteria);
  }

  async optimizeMemory(userId, projectId, requestType) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-memory-optimize', userId, projectId, requestType);
  }

  // Task operations
  async getTaskStats() {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-tasks-stats');
  }

  async createTask(taskData) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-tasks-create', taskData);
  }

  async updateTask(taskId, updates) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-tasks-update', taskId, updates);
  }

  async getTask(taskId) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-tasks-get', taskId);
  }

  async getTasksForAgent(agentType) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-tasks-for-agent', agentType);
  }

  // Recovery operations
  async createCheckpoint(sessionData) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-recovery-checkpoint', sessionData);
  }

  async getLatestCheckpoint() {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-recovery-latest');
  }

  async generateRecoveryPrompt(checkpoint) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-recovery-prompt', checkpoint);
  }

  // File processing
  async processFile(filePath, category) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-process-file', filePath, category);
  }

  async extractTasks(content, fileName) {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-extract-tasks', content, fileName);
  }

  // System operations
  async getStatus() {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-status');
  }

  async healthCheck() {
    const { ipcRenderer } = window.require('electron');
    return await ipcRenderer.invoke('trinity-health-check');
  }
}

// Export both classes
module.exports = {
  TrinityIPCBridge,
  TrinityRendererAPI
};