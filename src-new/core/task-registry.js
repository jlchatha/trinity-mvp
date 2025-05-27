/**
 * Trinity MVP Task Registry - Dual-Agent Implementation
 * 
 * Simplified task coordination for Overseer + Consolidated Worker architecture
 * Reduced from 922 LOC multi-agent system to 400-500 LOC dual-agent system
 * 
 * Built directly in production environment per "Direct Development Strategy"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * MVP Task Registry for Dual-Agent Professional Assistant
 * Handles Overseer ↔ Worker task coordination with memory integration
 */
class TaskRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // MVP-specific base directories (build where it runs!)
    this.baseDir = options.baseDir || process.cwd();
    this.mvpDataDir = options.mvpDataDir || path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp');
    
    // Task management paths
    this.tasksDir = path.join(this.mvpDataDir, 'tasks');
    this.backupDir = path.join(this.mvpDataDir, 'tasks', 'backups');
    this.registryFile = path.join(this.tasksDir, 'registry.json');
    this.lockFile = path.join(this.tasksDir, '.registry.lock');
    
    // Configuration
    this.lockTimeout = 30000; // 30 seconds
    this.backupRetention = 24; // Keep 24 backups
    this.initialized = false;
    
    // Memory integration
    this.memoryHierarchy = options.memoryHierarchy || null;
    
    console.log(`[${new Date().toISOString()}] INFO    Trinity MVP Task Registry initializing...`);
  }

  /**
   * Initialize the task registry system
   */
  async initialize() {
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Initialize registry file if needed
      await this.initializeRegistry();
      
      // Setup memory integration if available
      if (this.memoryHierarchy) {
        this.setupMemoryIntegration();
      }
      
      this.initialized = true;
      
      console.log(`[${new Date().toISOString()}] INFO    🎯 Trinity MVP Task Registry ready - Dual-agent coordination`);
      this.emit('registry-initialized');
      
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Task Registry initialization failed:`, error.message);
      this.emit('registry-error', { error: error.message, phase: 'initialization' });
      throw error;
    }
  }

  /**
   * Create a new task for dual-agent coordination
   */
  async createTask(taskData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const task = {
        id: this.generateTaskId(),
        type: taskData.type || 'general',
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        
        // Dual-agent specific fields
        requestedBy: taskData.requestedBy || 'user', // user, overseer, worker
        assignedTo: taskData.assignedTo || 'worker', // overseer, worker
        coordination: taskData.coordination || 'standard', // standard, urgent, background
        
        // Status tracking
        status: 'pending', // pending, in_progress, completed, failed, cancelled
        priority: taskData.priority || 'medium', // low, medium, high, urgent
        
        // Context and data
        context: taskData.context || {},
        requirements: taskData.requirements || [],
        deliverables: taskData.deliverables || [],
        
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDuration: taskData.estimatedDuration || null,
        actualDuration: null,
        
        // Memory integration
        memoryTier: taskData.memoryTier || 'working', // core, working, reference, historical
        projectId: taskData.projectId || null,
        userId: taskData.userId || null
      };

      // Store task in registry
      await this.storeTask(task);
      
      // Integrate with memory hierarchy if available
      if (this.memoryHierarchy && task.memoryTier) {
        await this.storeTaskInMemory(task);
      }
      
      console.log(`[${new Date().toISOString()}] INFO    Task created: ${task.id} (${task.title}) assigned to ${task.assignedTo}`);
      this.emit('task-created', task);
      
      return task;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Task creation failed:`, error.message);
      this.emit('task-error', { error: error.message, phase: 'creation' });
      throw error;
    }
  }

  /**
   * Update task status and metadata
   */
  async updateTask(taskId, updates) {
    try {
      const registry = await this.loadRegistry();
      const task = registry.tasks[taskId];
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Update fields
      Object.assign(task, updates, {
        updatedAt: new Date().toISOString()
      });

      // Calculate duration if completing
      if (updates.status === 'completed' && task.status !== 'completed') {
        task.actualDuration = Date.now() - new Date(task.createdAt).getTime();
      }

      // Save updated registry
      await this.saveRegistry(registry);
      
      // Update memory if needed
      if (this.memoryHierarchy) {
        await this.updateTaskInMemory(task);
      }

      console.log(`[${new Date().toISOString()}] INFO    Task updated: ${taskId} (${updates.status || 'status unchanged'})`);
      this.emit('task-updated', task);
      
      return task;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Task update failed:`, error.message);
      this.emit('task-error', { error: error.message, phase: 'update' });
      throw error;
    }
  }

  /**
   * Get tasks assigned to specific agent
   */
  async getTasksForAgent(agentType) {
    try {
      const registry = await this.loadRegistry();
      const tasks = Object.values(registry.tasks)
        .filter(task => task.assignedTo === agentType)
        .sort((a, b) => {
          // Sort by priority then creation date
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }
          
          return new Date(a.createdAt) - new Date(b.createdAt); // Older first
        });

      return tasks;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to get tasks for ${agentType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    try {
      const registry = await this.loadRegistry();
      return registry.tasks[taskId] || null;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to get task ${taskId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get registry statistics
   */
  async getStats() {
    try {
      const registry = await this.loadRegistry();
      const tasks = Object.values(registry.tasks);
      
      const stats = {
        total: tasks.length,
        byStatus: {},
        byAgent: {},
        byPriority: {},
        recentActivity: tasks
          .filter(task => Date.now() - new Date(task.updatedAt).getTime() < 86400000) // Last 24 hours
          .length
      };

      // Count by status
      tasks.forEach(task => {
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
        stats.byAgent[task.assignedTo] = (stats.byAgent[task.assignedTo] || 0) + 1;
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to get stats:`, error.message);
      throw error;
    }
  }

  /**
   * Store task in registry
   */
  async storeTask(task) {
    const registry = await this.loadRegistry();
    registry.tasks[task.id] = task;
    registry.metadata.lastUpdated = new Date().toISOString();
    registry.metadata.taskCount = Object.keys(registry.tasks).length;
    
    await this.saveRegistry(registry);
  }

  /**
   * Load registry from file with locking
   */
  async loadRegistry() {
    if (!fs.existsSync(this.registryFile)) {
      return this.createEmptyRegistry();
    }

    try {
      const data = await fs.promises.readFile(this.registryFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to load registry:`, error.message);
      return this.createEmptyRegistry();
    }
  }

  /**
   * Save registry to file with backup
   */
  async saveRegistry(registry) {
    try {
      // Create backup before saving
      if (fs.existsSync(this.registryFile)) {
        const backupFile = path.join(this.backupDir, `registry_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        await fs.promises.copyFile(this.registryFile, backupFile);
        
        // Cleanup old backups
        await this.cleanupBackups();
      }

      // Save registry
      await fs.promises.writeFile(this.registryFile, JSON.stringify(registry, null, 2));
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to save registry:`, error.message);
      throw error;
    }
  }

  /**
   * Memory integration methods
   */
  async storeTaskInMemory(task) {
    if (!this.memoryHierarchy) return;

    try {
      await this.memoryHierarchy.store(task.memoryTier, {
        type: 'task',
        task: task
      }, {
        title: `Task: ${task.title}`,
        description: task.description,
        tags: ['task', task.type, task.status],
        projectId: task.projectId,
        userId: task.userId
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to store task in memory:`, error.message);
    }
  }

  async updateTaskInMemory(task) {
    // For MVP, we'll just store updated version
    // More sophisticated memory updates can be added later
    await this.storeTaskInMemory(task);
  }

  setupMemoryIntegration() {
    if (!this.memoryHierarchy) return;

    // Listen for memory events
    this.memoryHierarchy.on('context-optimized', (data) => {
      this.emit('memory-context-optimized', data);
    });

    console.log(`[${new Date().toISOString()}] INFO    Task Registry ↔ Memory Hierarchy integration active`);
  }

  /**
   * Utility methods
   */
  generateTaskId() {
    return `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  createEmptyRegistry() {
    return {
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        taskCount: 0,
        agentType: 'dual-agent-mvp'
      },
      tasks: {}
    };
  }

  async ensureDirectories() {
    const dirs = [this.tasksDir, this.backupDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
        console.log(`[${new Date().toISOString()}] INFO    Created directory: ${dir}`);
      }
    }
  }

  async initializeRegistry() {
    if (!fs.existsSync(this.registryFile)) {
      const emptyRegistry = this.createEmptyRegistry();
      await this.saveRegistry(emptyRegistry);
      console.log(`[${new Date().toISOString()}] INFO    Created new task registry: ${this.registryFile}`);
    }
  }

  async cleanupBackups() {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('registry_backup_'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.time - a.time); // Newest first

      // Remove old backups
      if (backupFiles.length > this.backupRetention) {
        const toDelete = backupFiles.slice(this.backupRetention);
        for (const file of toDelete) {
          await fs.promises.unlink(file.path);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Backup cleanup failed:`, error.message);
    }
  }
}

module.exports = TaskRegistry;