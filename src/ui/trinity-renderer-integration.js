/**
 * Trinity Renderer Integration
 * 
 * Connects Trinity Status Bar with Trinity IPC Bridge
 * Provides seamless UI updates and component interaction
 */

const { TrinityRendererAPI } = require('../electron/trinity-ipc-bridge');

class TrinityRendererIntegration {
  constructor() {
    this.api = new TrinityRendererAPI();
    this.statusBar = null;
    this.isInitialized = false;
    
    this.setupEventListeners();
    this.waitForTrinityReady();
  }

  /**
   * Setup event listeners for Trinity events
   */
  setupEventListeners() {
    // Trinity system ready
    window.addEventListener('trinity-ready', (event) => {
      console.log('[Trinity UI] Trinity system ready:', event.detail);
      this.handleTrinityReady(event.detail);
    });

    // Memory events
    window.addEventListener('trinity-memory-event', (event) => {
      console.log('[Trinity UI] Memory event:', event.detail);
      this.handleMemoryEvent(event.detail);
    });

    // Task events
    window.addEventListener('trinity-task-event', (event) => {
      console.log('[Trinity UI] Task event:', event.detail);
      this.handleTaskEvent(event.detail);
    });

    // Recovery events
    window.addEventListener('trinity-recovery-event', (event) => {
      console.log('[Trinity UI] Recovery event:', event.detail);
      this.handleRecoveryEvent(event.detail);
    });

    // DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeUI();
      });
    } else {
      this.initializeUI();
    }
  }

  /**
   * Wait for Trinity system to be ready
   */
  async waitForTrinityReady() {
    // Check if Trinity is already ready
    try {
      const status = await this.api.getStatus();
      if (status.initialized) {
        this.handleTrinityReady({ 
          timestamp: status.lastUpdate,
          components: status.components 
        });
      }
    } catch (error) {
      console.log('[Trinity UI] Waiting for Trinity to initialize...');
    }
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Import and initialize status bar
    if (typeof window.trinityStatusBar !== 'undefined') {
      this.statusBar = window.trinityStatusBar;
      this.setupStatusBarIntegration();
    } else {
      // Wait for status bar to be loaded
      setTimeout(() => this.initializeUI(), 100);
    }
  }

  /**
   * Setup status bar integration with Trinity API
   */
  setupStatusBarIntegration() {
    if (!this.statusBar) return;

    // Override status bar methods to use Trinity API
    this.statusBar.updateAmbientDisplay = async () => {
      await this.updateStatusBarWithTrinityData();
    };

    // Override component actions to use Trinity API
    this.statusBar.triggerOptimization = async () => {
      try {
        this.statusBar.showNotification('Trinity: Optimization starting...', 'info');
        
        const result = await this.api.optimizeMemory('default-user', 'current-project', 'manual-optimization');
        
        this.statusBar.showNotification(
          `Trinity: Context optimized (${Math.round(result.metadata.efficiency * 100)}% efficiency)`,
          'success'
        );
        
        await this.updateStatusBarWithTrinityData();
      } catch (error) {
        this.statusBar.showNotification(`Optimization failed: ${error.message}`, 'error');
      }
    };

    this.statusBar.createQuickCheckpoint = async () => {
      try {
        const checkpoint = await this.api.createCheckpoint({
          context: { source: 'quick-action', manual: true },
          keyDecisions: ['Manual checkpoint from status bar'],
          nextSteps: ['Continue work with saved context']
        });
        
        this.statusBar.showNotification(
          `Trinity: Checkpoint created (${checkpoint.id.slice(-8)})`,
          'success'
        );
      } catch (error) {
        this.statusBar.showNotification(`Checkpoint failed: ${error.message}`, 'error');
      }
    };

    this.statusBar.createTestTask = async () => {
      try {
        const testTask = await this.api.createTask({
          title: 'Dashboard Test Task',
          description: 'Task created from Trinity Dashboard',
          type: 'test',
          assignedTo: 'worker',
          priority: 'low'
        });
        
        this.statusBar.showNotification(
          `Trinity: Test task created (${testTask.id.slice(-8)})`,
          'success'
        );
        
        await this.updateStatusBarWithTrinityData();
      } catch (error) {
        this.statusBar.showNotification(`Task creation failed: ${error.message}`, 'error');
      }
    };

    // Override file processing to use Trinity API
    this.statusBar.processFileWithTrinity = async (file, category) => {
      try {
        // For File API objects, we need to read the content first
        const fileContent = await this.readFileContent(file);
        
        // Extract tasks using Trinity API
        const extractedTasks = await this.api.extractTasks(fileContent, file.name);
        
        // Create tasks if found
        const createdTasks = [];
        for (const taskData of extractedTasks) {
          const task = await this.api.createTask({
            title: taskData.title,
            description: taskData.description,
            type: 'extracted',
            assignedTo: 'worker',
            priority: 'medium',
            context: { 
              sourceFile: file.name,
              sourceLine: taskData.sourceLine
            }
          });
          createdTasks.push(task);
        }
        
        // Store in memory
        const tier = this.statusBar.categoryToTier(category);
        await this.api.storeInMemory(tier, {
          type: 'file_context',
          content: fileContent,
          fileName: file.name,
          fileType: file.type,
          processedAt: new Date().toISOString()
        }, {
          title: file.name,
          description: `File processed: ${category}`,
          tags: ['file', 'processed', tier]
        });
        
        return {
          action: extractedTasks.length > 0 ? `${extractedTasks.length} tasks extracted` : 'stored in memory',
          category,
          tasksFound: extractedTasks.length
        };
        
      } catch (error) {
        console.error('[Trinity UI] File processing failed:', error);
        throw error;
      }
    };

    console.log('[Trinity UI] Status bar integration complete');
  }

  /**
   * Update status bar with Trinity data
   */
  async updateStatusBarWithTrinityData() {
    if (!this.statusBar) return;

    try {
      // Get stats from Trinity components
      const [memoryStats, taskStats] = await Promise.all([
        this.api.getMemoryStats().catch(() => null),
        this.api.getTaskStats().catch(() => null)
      ]);

      // Update memory status
      if (memoryStats) {
        const memoryEl = document.getElementById('memory-value');
        if (memoryEl) {
          memoryEl.textContent = `${memoryStats.total || 0} items`;
          memoryEl.className = 'trinity-value success';
        }
      }

      // Update tasks status
      if (taskStats) {
        const tasksEl = document.getElementById('tasks-value');
        if (tasksEl) {
          const active = (taskStats.byStatus?.pending || 0) + (taskStats.byStatus?.in_progress || 0);
          tasksEl.textContent = `${active} active`;
          tasksEl.className = active > 0 ? 'trinity-value success' : 'trinity-value';
        }
      }

      // Update recovery status
      const recoveryEl = document.getElementById('recovery-value');
      if (recoveryEl) {
        recoveryEl.textContent = 'Ready';
        recoveryEl.className = 'trinity-value success';
      }

      // Update context status
      const contextEl = document.getElementById('context-value');
      if (contextEl) {
        contextEl.textContent = 'Active';
        contextEl.className = 'trinity-value success';
      }

    } catch (error) {
      console.error('[Trinity UI] Status update failed:', error);
    }
  }

  /**
   * Handle Trinity system ready event
   */
  handleTrinityReady(data) {
    console.log('[Trinity UI] Trinity system is ready with components:', data.components);
    
    this.isInitialized = true;
    
    // Update status bar if available
    if (this.statusBar) {
      this.statusBar.showNotification('Trinity: System initialized and ready', 'success');
      this.updateStatusBarWithTrinityData();
    }
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('trinity-ui-ready', { 
      detail: { 
        api: this.api,
        integration: this
      }
    }));
  }

  /**
   * Handle memory events
   */
  handleMemoryEvent(event) {
    const { type, data } = event;
    
    switch (type) {
      case 'context-optimized':
        if (this.statusBar) {
          this.statusBar.showNotification(
            `Trinity: Context optimized (${Math.round(data.efficiency * 100)}% efficiency)`,
            'success'
          );
          this.updateStatusBarWithTrinityData();
        }
        break;
        
      case 'error':
        if (this.statusBar) {
          this.statusBar.showNotification(`Memory error: ${data.error}`, 'error');
        }
        break;
    }
  }

  /**
   * Handle task events
   */
  handleTaskEvent(event) {
    const { type, data } = event;
    
    switch (type) {
      case 'created':
        if (this.statusBar) {
          this.statusBar.showNotification(
            `Trinity: Task created - ${data.title}`,
            'success'
          );
          this.updateStatusBarWithTrinityData();
        }
        break;
        
      case 'updated':
        if (this.statusBar) {
          this.statusBar.showNotification(
            `Trinity: Task ${data.status} - ${data.title}`,
            'info'
          );
          this.updateStatusBarWithTrinityData();
        }
        break;
        
      case 'error':
        if (this.statusBar) {
          this.statusBar.showNotification(`Task error: ${data.error}`, 'error');
        }
        break;
    }
  }

  /**
   * Handle recovery events
   */
  handleRecoveryEvent(event) {
    const { type, data } = event;
    
    switch (type) {
      case 'checkpoint-created':
        if (this.statusBar) {
          this.statusBar.showNotification(
            `Trinity: Checkpoint saved (${data.id.slice(-8)})`,
            'success'
          );
        }
        break;
        
      case 'checkpoint-loaded':
        if (this.statusBar) {
          this.statusBar.showNotification(
            `Trinity: Session restored (${data.id.slice(-8)})`,
            'info'
          );
        }
        break;
        
      case 'error':
        if (this.statusBar) {
          this.statusBar.showNotification(`Recovery error: ${data.error}`, 'error');
        }
        break;
    }
  }

  /**
   * Read file content from File API object
   */
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get Trinity API for external use
   */
  getAPI() {
    return this.api;
  }

  /**
   * Get initialization status
   */
  isReady() {
    return this.isInitialized;
  }
}

// Initialize Trinity UI integration
window.trinityIntegration = new TrinityRendererIntegration();

module.exports = TrinityRendererIntegration;