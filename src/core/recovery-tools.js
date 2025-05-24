/**
 * Trinity MVP Recovery Tools - Basic Implementation
 * 
 * Essential recovery capabilities for dual-agent professional assistant
 * Simplified from complex multi-agent recovery to core MVP functionality
 * 
 * Built directly in production environment per "Direct Development Strategy"
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Basic Recovery Tools for Trinity MVP
 * Handles session restoration and context recovery for Overseer + Worker
 */
class RecoveryTools extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // MVP-specific base directories (build where it runs!)
    this.baseDir = options.baseDir || process.cwd();
    this.mvpDataDir = options.mvpDataDir || path.join(process.env.HOME || process.env.USERPROFILE, '.trinity-mvp');
    
    // Recovery system paths
    this.recoveryDir = path.join(this.mvpDataDir, 'recovery');
    this.checkpointsDir = path.join(this.recoveryDir, 'checkpoints');
    this.sessionsDir = path.join(this.recoveryDir, 'sessions');
    
    // Component integration
    this.memoryHierarchy = options.memoryHierarchy || null;
    this.taskRegistry = options.taskRegistry || null;
    
    // Configuration
    this.maxCheckpoints = 10; // Keep last 10 checkpoints
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.initialized = false;
    
    console.log(`[${new Date().toISOString()}] INFO    Trinity MVP Recovery Tools initializing...`);
  }

  /**
   * Initialize recovery system
   */
  async initialize() {
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Setup component integration
      this.setupComponentIntegration();
      
      this.initialized = true;
      
      console.log(`[${new Date().toISOString()}] INFO    🔄 Trinity MVP Recovery Tools ready - Session continuity`);
      this.emit('recovery-initialized');
      
      return true;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Recovery Tools initialization failed:`, error.message);
      this.emit('recovery-error', { error: error.message, phase: 'initialization' });
      throw error;
    }
  }

  /**
   * Create a recovery checkpoint
   */
  async createCheckpoint(sessionData = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const timestamp = new Date().toISOString();
      const checkpointId = `checkpoint_${Date.now()}`;
      
      const checkpoint = {
        id: checkpointId,
        timestamp: timestamp,
        version: '1.0.0',
        agentType: 'dual-agent-mvp',
        
        // Session context
        session: {
          id: sessionData.sessionId || this.generateSessionId(),
          user: sessionData.user || 'default',
          project: sessionData.project || null,
          context: sessionData.context || {},
          preferences: sessionData.preferences || {}
        },
        
        // System state
        system: {
          memoryStats: await this.getMemoryStats(),
          taskStats: await this.getTaskStats(),
          lastActivity: timestamp
        },
        
        // Recovery context
        recovery: {
          keyDecisions: sessionData.keyDecisions || [],
          activeWorkflows: sessionData.activeWorkflows || [],
          contextualNotes: sessionData.contextualNotes || [],
          nextSteps: sessionData.nextSteps || []
        }
      };

      // Save checkpoint
      const checkpointFile = path.join(this.checkpointsDir, `${checkpointId}.json`);
      await fs.promises.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2));
      
      // Cleanup old checkpoints
      await this.cleanupCheckpoints();
      
      console.log(`[${new Date().toISOString()}] INFO    Recovery checkpoint created: ${checkpointId}`);
      this.emit('checkpoint-created', checkpoint);
      
      return checkpoint;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Checkpoint creation failed:`, error.message);
      this.emit('recovery-error', { error: error.message, phase: 'checkpoint-creation' });
      throw error;
    }
  }

  /**
   * Load the most recent checkpoint
   */
  async loadLatestCheckpoint() {
    try {
      const checkpointFiles = await fs.promises.readdir(this.checkpointsDir);
      const jsonFiles = checkpointFiles
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.checkpointsDir, file),
          stat: fs.statSync(path.join(this.checkpointsDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Newest first

      if (jsonFiles.length === 0) {
        console.log(`[${new Date().toISOString()}] INFO    No checkpoints found`);
        return null;
      }

      const latestFile = jsonFiles[0];
      const checkpointData = await fs.promises.readFile(latestFile.path, 'utf8');
      const checkpoint = JSON.parse(checkpointData);
      
      console.log(`[${new Date().toISOString()}] INFO    Loaded checkpoint: ${checkpoint.id} (${checkpoint.timestamp})`);
      this.emit('checkpoint-loaded', checkpoint);
      
      return checkpoint;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Failed to load checkpoint:`, error.message);
      this.emit('recovery-error', { error: error.message, phase: 'checkpoint-loading' });
      throw error;
    }
  }

  /**
   * Generate recovery prompt for session restoration
   */
  async generateRecoveryPrompt(checkpoint = null) {
    try {
      if (!checkpoint) {
        checkpoint = await this.loadLatestCheckpoint();
      }

      if (!checkpoint) {
        return this.generateFirstTimePrompt();
      }

      const recoveryPrompt = `# Trinity MVP Session Recovery

## Previous Session Context
**Session ID**: ${checkpoint.session.id}
**Timestamp**: ${checkpoint.timestamp}
**User**: ${checkpoint.session.user}
**Project**: ${checkpoint.session.project || 'Not specified'}

## System State Recovery
${this.formatSystemStats(checkpoint.system)}

## Context Restoration
${this.formatRecoveryContext(checkpoint.recovery)}

## Session Continuity
The Trinity MVP dual-agent system (Overseer + Consolidated Worker) was previously active with the above context. Please review this information to restore session continuity and pick up where the previous session left off.

## Available Capabilities
- Memory Hierarchy: 4-tier context management (Core/Working/Reference/Historical)
- Task Registry: Dual-agent task coordination
- Auto-Compact Detection: Predictive context optimization
- Recovery Tools: Session restoration and continuity

Ready to continue with restored context.`;

      return recoveryPrompt;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Recovery prompt generation failed:`, error.message);
      return this.generateErrorRecoveryPrompt(error);
    }
  }

  /**
   * Integration with Memory Hierarchy and Task Registry
   */
  async getMemoryStats() {
    if (!this.memoryHierarchy) {
      return { status: 'not_integrated', message: 'Memory Hierarchy not connected' };
    }

    try {
      return await this.memoryHierarchy.getStats();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTaskStats() {
    if (!this.taskRegistry) {
      return { status: 'not_integrated', message: 'Task Registry not connected' };
    }

    try {
      return await this.taskRegistry.getStats();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  setupComponentIntegration() {
    // Listen for important events from other components
    if (this.memoryHierarchy) {
      this.memoryHierarchy.on('context-optimized', (data) => {
        this.emit('context-optimization-detected', data);
      });
    }

    if (this.taskRegistry) {
      this.taskRegistry.on('task-created', (task) => {
        this.emit('task-activity', { type: 'created', task });
      });
      
      this.taskRegistry.on('task-updated', (task) => {
        this.emit('task-activity', { type: 'updated', task });
      });
    }

    console.log(`[${new Date().toISOString()}] INFO    Recovery Tools ↔ Component integration active`);
  }

  /**
   * Utility methods
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatSystemStats(systemStats) {
    let output = '### Memory Hierarchy\n';
    if (systemStats.memoryStats && systemStats.memoryStats.status !== 'not_integrated') {
      output += `- Total memories: ${systemStats.memoryStats.total || 'Unknown'}\n`;
      output += `- Recent activity: ${systemStats.memoryStats.recentActivity || 'Unknown'}\n`;
    } else {
      output += '- Status: Not integrated or error\n';
    }

    output += '\n### Task Registry\n';
    if (systemStats.taskStats && systemStats.taskStats.status !== 'not_integrated') {
      output += `- Total tasks: ${systemStats.taskStats.total || 'Unknown'}\n`;
      output += `- Recent activity: ${systemStats.taskStats.recentActivity || 'Unknown'}\n`;
    } else {
      output += '- Status: Not integrated or error\n';
    }

    return output;
  }

  formatRecoveryContext(recoveryContext) {
    let output = '';
    
    if (recoveryContext.keyDecisions && recoveryContext.keyDecisions.length > 0) {
      output += '### Key Decisions\n';
      recoveryContext.keyDecisions.forEach((decision, i) => {
        output += `${i + 1}. ${decision}\n`;
      });
      output += '\n';
    }

    if (recoveryContext.activeWorkflows && recoveryContext.activeWorkflows.length > 0) {
      output += '### Active Workflows\n';
      recoveryContext.activeWorkflows.forEach((workflow, i) => {
        output += `${i + 1}. ${workflow}\n`;
      });
      output += '\n';
    }

    if (recoveryContext.nextSteps && recoveryContext.nextSteps.length > 0) {
      output += '### Next Steps\n';
      recoveryContext.nextSteps.forEach((step, i) => {
        output += `${i + 1}. ${step}\n`;
      });
    }

    return output || 'No specific recovery context available.';
  }

  generateFirstTimePrompt() {
    return `# Trinity MVP First Session

Welcome to Trinity MVP - Professional Assistant with Context Intelligence!

## System Capabilities
- **Memory Hierarchy**: 4-tier context management (Core/Working/Reference/Historical)
- **Task Registry**: Dual-agent task coordination (Overseer + Consolidated Worker)
- **Auto-Compact Detection**: Predictive context optimization
- **Recovery Tools**: Session restoration and continuity

## Getting Started
This is a fresh session with no previous context to restore. The system is ready for your first interaction.

Ready to begin professional assistance.`;
  }

  generateErrorRecoveryPrompt(error) {
    return `# Trinity MVP Recovery Error

An error occurred during session recovery: ${error.message}

## Fallback Mode
The system is operating in fallback mode with basic functionality available.

## Available Actions
- Start fresh session
- Manual context restoration
- System diagnostics

Please proceed with caution and consider manual recovery if needed.`;
  }

  async ensureDirectories() {
    const dirs = [this.recoveryDir, this.checkpointsDir, this.sessionsDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
        console.log(`[${new Date().toISOString()}] INFO    Created directory: ${dir}`);
      }
    }
  }

  async cleanupCheckpoints() {
    try {
      const files = await fs.promises.readdir(this.checkpointsDir);
      const checkpointFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.checkpointsDir, file),
          stat: fs.statSync(path.join(this.checkpointsDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime); // Newest first

      // Remove old checkpoints beyond limit
      if (checkpointFiles.length > this.maxCheckpoints) {
        const toDelete = checkpointFiles.slice(this.maxCheckpoints);
        for (const file of toDelete) {
          await fs.promises.unlink(file.path);
          console.log(`[${new Date().toISOString()}] INFO    Cleaned up old checkpoint: ${file.name}`);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR   Checkpoint cleanup failed:`, error.message);
    }
  }
}

module.exports = RecoveryTools;