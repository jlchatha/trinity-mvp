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
    this.realConversationMetrics = null; // Store real conversation metrics from renderer
    this.conversationHistory = []; // Track conversation for context awareness
    
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
    // Guard against non-Electron environments
    if (!ipcMain) {
      console.warn('[Trinity IPC] ipcMain not available - skipping IPC handler setup');
      return;
    }
    
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

    // Memory hierarchy APIs for UI integration
    ipcMain.handle('trinity:memory:getStats', async () => {
      if (!this.components.memory) {
        // Return demo data when memory component not available
        return {
          total: { files: 6, size: 97894 },
          tiers: {
            core: { files: 1, size: 15420 },
            working: { files: 2, size: 15090 },
            reference: { files: 2, size: 34450 },
            historical: { files: 1, size: 31200 }
          },
          lastUpdated: new Date().toISOString()
        };
      }
      return await this.components.memory.getStats();
    });

    ipcMain.handle('trinity:memory:getAllMemories', async () => {
      if (!this.components.memory) {
        // Return demo memories when memory component not available
        return [
          {
            id: 'mem_001',
            name: 'trinity-system-architecture.md',
            tier: 'core',
            preview: 'Trinity System overview and architectural principles - Multi-agent framework for complex problem solving...',
            relevance: 0.95,
            lastAccessed: new Date(Date.now() - 3600000),
            size: 15420
          },
          {
            id: 'mem_002', 
            name: 'mvp-implementation-plan.md',
            tier: 'working',
            preview: 'Implementation details for the Trinity MVP transformation from chat tool to professional AI assistant...',
            relevance: 0.92,
            lastAccessed: new Date(Date.now() - 1800000),
            size: 8340
          },
          {
            id: 'mem_003',
            name: 'chat-implementation-notes.md',
            tier: 'working',
            preview: 'Technical implementation details for chat interface enhancements and memory integration...',
            relevance: 0.87,
            lastAccessed: new Date(Date.now() - 7200000),
            size: 6750
          },
          {
            id: 'mem_004',
            name: 'ai-integration-patterns.md',
            tier: 'reference',
            preview: 'Common patterns for AI system integration and best practices for memory management...',
            relevance: 0.73,
            lastAccessed: new Date(Date.now() - 86400000),
            size: 22100
          },
          {
            id: 'mem_005',
            name: 'user-interface-guidelines.md',
            tier: 'reference',
            preview: 'UI/UX guidelines for professional assistant interfaces and component design patterns...',
            relevance: 0.68,
            lastAccessed: new Date(Date.now() - 172800000),
            size: 12350
          },
          {
            id: 'mem_006',
            name: 'project-discovery-report.md',
            tier: 'historical',
            preview: 'Initial discovery findings from Trinity System exploration and codebase analysis...',
            relevance: 0.45,
            lastAccessed: new Date(Date.now() - 604800000),
            size: 31200
          }
        ];
      }
      
      try {
        // Use retrieve() method with empty criteria to get all memories
        const allMemories = await this.components.memory.retrieve({});
        
        // Transform to UI-friendly format
        return allMemories.map(memory => ({
          id: memory.id,
          name: memory.metadata?.title || 'Untitled Memory',
          tier: memory.tier,
          preview: typeof memory.content === 'string' ? 
            memory.content.substring(0, 100) + '...' : 
            'Memory content preview...',
          relevance: 0.8, // Default relevance
          lastAccessed: memory.timestamps?.accessed || memory.timestamps?.modified,
          size: memory.size || 0
        }));
      } catch (error) {
        console.error('Failed to retrieve memories:', error);
        // Return demo data as fallback - just return the demo array directly
        return [
          {
            id: 'mem_001',
            name: 'trinity-system-architecture.md',
            tier: 'core',
            preview: 'Trinity System overview and architectural principles - Multi-agent framework for complex problem solving...',
            relevance: 0.95,
            lastAccessed: new Date(Date.now() - 3600000),
            size: 15420
          },
          {
            id: 'mem_002', 
            name: 'mvp-implementation-plan.md',
            tier: 'working',
            preview: 'Implementation details for the Trinity MVP transformation from chat tool to professional AI assistant...',
            relevance: 0.92,
            lastAccessed: new Date(Date.now() - 1800000),
            size: 8340
          }
        ];
      }
    });

    ipcMain.handle('trinity:memory:getMemoryDetails', async (event, memoryId) => {
      if (!this.components.memory) {
        // Return demo memory details - use the same demo data
        const demoMemories = [
          {
            id: 'mem_001',
            name: 'trinity-system-architecture.md',
            tier: 'core',
            preview: 'Trinity System overview and architectural principles - Multi-agent framework for complex problem solving...',
            relevance: 0.95,
            lastAccessed: new Date(Date.now() - 3600000),
            size: 15420,
            fullContent: 'Complete Trinity System architectural documentation with implementation details...'
          },
          // ... other demo memories with fullContent
        ];
        return demoMemories.find(m => m.id === memoryId) || null;
      }
      return await this.components.memory.getMemoryDetails(memoryId);
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

    // Context optimization operations
    ipcMain.handle('trinity:context:getMetrics', async () => {
      // Try to get real conversation metrics first
      if (this.realConversationMetrics) {
        console.log('[Trinity IPC] Returning real conversation metrics:', this.realConversationMetrics);
        return this.realConversationMetrics;
      }
      
      if (!this.components.autoCompact || !this.components.autoCompact.contextMeter) {
        // Return demo context metrics when not available
        return {
          contextPercentage: Math.floor(Math.random() * 30) + 35, // 35-65%
          totalInputTokens: Math.floor(Math.random() * 40000) + 20000,
          totalOutputTokens: Math.floor(Math.random() * 15000) + 8000,
          totalCost: Math.random() * 0.15 + 0.05,
          requestCount: Math.floor(Math.random() * 50) + 15,
          efficiency: Math.floor(Math.random() * 200) + 400,
          riskLevel: 'LOW',
          status: 'GOOD',
          sessionDuration: Math.floor(Math.random() * 7200) + 1800,
          estimatedRemainingRequests: Math.floor(Math.random() * 100) + 50,
          tokensRemaining: Math.floor(Math.random() * 30000) + 40000,
          formattedCost: `$${(Math.random() * 0.15 + 0.05).toFixed(4)}`
        };
      }
      return this.components.autoCompact.contextMeter.getMetrics();
    });

    ipcMain.handle('trinity:context:optimize', async () => {
      if (!this.components.autoCompact) {
        // Simulate optimization for demo
        return {
          success: true,
          timestamp: new Date(),
          trigger: 'manual',
          beforeOptimization: {
            contextUtilization: 75,
            totalTokens: 75000,
            cost: '$0.1200'
          },
          afterOptimization: {
            estimatedReduction: '30-40%',
            tokensSaved: 25000,
            costSaved: 0.04,
            newUtilization: 45
          }
        };
      }
      return await this.components.autoCompact.executeContextOptimization('manual');
    });

    ipcMain.handle('trinity:context:resetSession', async () => {
      if (!this.components.autoCompact || !this.components.autoCompact.contextMeter) {
        return { success: true, message: 'Session reset (demo mode)' };
      }
      this.components.autoCompact.contextMeter.resetSession();
      return { success: true, message: 'Context session reset successfully' };
    });
    
    // Update real conversation metrics from renderer
    ipcMain.handle('trinity:context:updateMetrics', async (event, metrics) => {
      console.log('[Trinity IPC] Updating real conversation metrics:', metrics);
      
      // Transform single window metrics to full context metrics format
      const contextWindowCapacity = 100000;
      const totalTokens = metrics.estimatedTokens || 0;
      const contextPercentage = metrics.contextPercentage || 0;
      const riskLevel = contextPercentage >= 85 ? 'HIGH' : contextPercentage >= 75 ? 'MEDIUM' : contextPercentage >= 50 ? 'LOW' : 'VERY LOW';
      const status = contextPercentage >= 85 ? 'CRITICAL' : contextPercentage >= 75 ? 'WARNING' : contextPercentage >= 50 ? 'OPTIMAL' : 'GOOD';
      
      this.realConversationMetrics = {
        contextPercentage: contextPercentage,
        totalInputTokens: Math.floor(totalTokens * 0.7),
        totalOutputTokens: Math.floor(totalTokens * 0.3),
        totalCost: totalTokens * 0.00000176, // Claude 3.5 Haiku: $0.80 input + $4.00 output (70/30 blend)
        requestCount: metrics.messageCount || 0,
        efficiency: Math.floor(totalTokens / Math.max(totalTokens * 0.00000176, 0.0001)),
        riskLevel: riskLevel,
        status: status,
        sessionDuration: metrics.sessionDuration || 0,
        estimatedRemainingRequests: Math.max(0, Math.floor((100 - contextPercentage) * 2)),
        tokensRemaining: metrics.tokensRemaining || Math.max(0, contextWindowCapacity - totalTokens),
        formattedCost: `$${(totalTokens * 0.00000176).toFixed(4)}`,
        isRealData: true,
        lastUpdated: Date.now()
      };
      
      return { success: true, message: 'Context metrics updated successfully' };
    });

    ipcMain.handle('trinity:autocompact:getStatus', async () => {
      if (!this.components.autoCompact) {
        // Return demo auto-compact status
        return {
          lastTimestamp: new Date(Date.now() - 3600000).toISOString(),
          recoveryNeeded: false,
          recoverySuccessful: true,
          environment: 'trinity-mvp',
          contextIntelligenceEnabled: true,
          predictiveMode: true,
          optimizationScheduled: false,
          features: [
            'Real-time context monitoring',
            'Cost-based optimization triggers',
            'Predictive auto-compact prevention',
            'Professional context dashboard'
          ]
        };
      }
      return this.components.autoCompact.getStatus();
    });

    // NOTE: overseer:sendMessage handler is in main.js with Claude SDK integration

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

  /**
   * Generate context-aware response for chat messages
   */
  async generateContextAwareResponse(message, conversationHistory) {
    const messageText = message.toLowerCase();
    
    // For simple queries, provide immediate responses
    if (messageText.includes('your name') || messageText.includes('what\'s your name')) {
      return this.handleNameQuery(conversationHistory);
    }
    
    if (messageText.match(/^(hi|hello|hey|greetings)/)) {
      return this.handleGreeting(conversationHistory);
    }
    
    // For all other requests, forward to Claude Code with context
    return await this.forwardToClaudeCode(message, conversationHistory);
  }

  /**
   * Handle documentation update commands
   */
  handleDocumentationUpdate(message, history) {
    const recentContext = history.slice(-3);
    let response = "I understand you'd like me to update the Claude.md documentation. ";
    
    // Check for recent name context
    const nameContext = recentContext.find(msg => 
      msg.content && msg.content.toLowerCase().includes('synapse')
    );
    
    if (nameContext) {
      response += "I've noted that Trinity should be referred to as 'Synapse' and will incorporate this into the documentation updates. ";
    }
    
    response += "However, as the Trinity Assistant interface, I don't have direct file system access to modify the Claude.md file. ";
    response += "You would need to make those changes through your development environment or ask the system operator to update the documentation.";
    
    return response;
  }

  /**
   * Handle name-related queries
   */
  handleNameQuery(history) {
    // Check recent conversation for established name
    const recentMessages = history.slice(-5);
    const nameContext = recentMessages.find(msg => 
      msg.content && (msg.content.toLowerCase().includes('synapse') || 
                     msg.content.toLowerCase().includes('trinity'))
    );
    
    if (nameContext) {
      return "Based on our conversation, I understand you've chosen to call Trinity 'Synapse'. I'm the Trinity Professional Assistant interface, helping you with AI-powered tasks and system management.";
    }
    
    return "I'm the Trinity Professional Assistant - an AI-powered interface designed to help you with development tasks, system management, and intelligent conversation. You can call me Trinity, or choose whatever name feels right for our interaction.";
  }

  /**
   * Handle greeting messages
   */
  handleGreeting(history) {
    if (history.length > 2) {
      return "Hello again! How can I continue to assist you today?";
    }
    return "Hello! I'm Trinity, your professional AI assistant. I'm here to help you with development tasks, system management, and intelligent conversation. How can I assist you today?";
  }

  /**
   * Forward request to Claude Code with conversation context
   */
  async forwardToClaudeCode(message, conversationHistory) {
    try {
      // Build context from conversation history
      const contextMessages = conversationHistory.slice(-6).map(entry => ({
        role: entry.role,
        content: entry.content
      }));
      
      // Add current message
      contextMessages.push({
        role: 'user',
        content: message
      });
      
      // Use the main Trinity app's Claude SDK if available
      const mainWindow = this.mainWindow;
      if (mainWindow && mainWindow.webContents) {
        // Send request to main process to handle via Claude Code
        const response = await mainWindow.webContents.executeJavaScript(`
          (async () => {
            try {
              if (window.trinityAPI && window.trinityAPI.claudeCode) {
                return await window.trinityAPI.claudeCode.sendMessage('${message.replace(/'/g, "\\'")}');
              }
              return null;
            } catch (error) {
              console.error('Claude Code execution failed:', error);
              return null;
            }
          })()
        `);
        
        if (response && response.response) {
          return response.response;
        }
      }
      
      // Fallback if Claude Code integration not available
      return this.buildContextualFallback(message, conversationHistory);
      
    } catch (error) {
      console.error('[Trinity IPC] Error forwarding to Claude Code:', error);
      return this.buildContextualFallback(message, conversationHistory);
    }
  }

  /**
   * Build contextual fallback response when Claude Code unavailable
   */
  buildContextualFallback(message, history) {
    const recentContext = history.slice(-3);
    
    // Check for action requests
    if (message.toLowerCase().includes('asking you to do') || 
        message.toLowerCase().includes('please do') ||
        message.toLowerCase().includes('can you create') ||
        message.toLowerCase().includes('compose') ||
        message.toLowerCase().includes('generate')) {
      
      let response = "I understand you're asking me to take action: " + message + ". ";
      response += "I'm currently working to integrate with Claude Code for full functionality. ";
      response += "In the meantime, I can help you understand how to approach this task or provide guidance on the steps involved. ";
      response += "What specific aspect would you like me to help you think through?";
      return response;
    }
    
    // Default contextual response
    let response = "I understand you're asking about: " + message + ". ";
    
    if (recentContext.length > 1) {
      response += "Based on our ongoing conversation, I'll do my best to provide a helpful response that takes into account our previous discussion. ";
    }
    
    response += "As Trinity's professional assistant interface, I can help you with development tasks, system management, documentation, and intelligent conversation. ";
    response += "What specific aspect would you like me to focus on?";
    
    return response;
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