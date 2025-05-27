# Trinity MVP API Reference

## Developer Guide to Trinity's Core APIs and Integration Points

This reference covers Trinity MVP's internal APIs, integration patterns, and extension points for developers who want to understand, modify, or extend Trinity's functionality.

## Table of Contents

1. [Core Architecture APIs](#core-architecture-apis)
2. [Memory System API](#memory-system-api)
3. [File Communication API](#file-communication-api)
4. [Claude Code Integration API](#claude-code-integration-api)
5. [Configuration API](#configuration-api)
6. [Event System API](#event-system-api)
7. [Extension Points](#extension-points)
8. [Development Tools](#development-tools)

## Core Architecture APIs

### Application Lifecycle

**Main Process (main.js)**

```javascript
class TrinityApplication {
  constructor(options = {}) {
    this.config = new ConfigurationManager(options);
    this.memorySystem = new MemoryHierarchy(this.config);
    this.fileComm = new FileCommManager(this.config);
    this.claudeIntegration = new ClaudeCodeIntegration(this.config);
  }

  /**
   * Initialize Trinity MVP application
   * @param {Object} options - Application configuration options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    await this.config.load();
    await this.memorySystem.initialize();
    await this.fileComm.initialize();
    await this.claudeIntegration.initialize();
  }

  /**
   * Start the application
   * @returns {Promise<void>}
   */
  async start() {
    // Create main window
    this.mainWindow = await this.createMainWindow();
    
    // Start background services
    await this.startBackgroundServices();
    
    // Initialize IPC handlers
    this.setupIPC();
  }

  /**
   * Graceful shutdown
   * @returns {Promise<void>}
   */
  async shutdown() {
    await this.fileComm.cleanup();
    await this.memorySystem.save();
    await this.claudeIntegration.disconnect();
  }
}
```

**Renderer Process IPC Interface**

```javascript
// Available via window.electronAPI (preload.js)
const electronAPI = {
  // Core messaging
  sendMessage: (message) => ipcRenderer.invoke('send-message', message),
  onResponse: (callback) => ipcRenderer.on('message-response', callback),
  
  // Memory operations
  getMemoryContext: (sessionId) => ipcRenderer.invoke('get-memory-context', sessionId),
  updateMemory: (context) => ipcRenderer.invoke('update-memory', context),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // System integration
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info')
};
```

## Memory System API

### Memory Hierarchy Interface

**Core Memory Operations**

```javascript
class MemoryHierarchy {
  /**
   * Initialize memory system
   * @param {Object} config - Memory configuration
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    this.coreMemory = new CoreMemoryManager(config);
    this.workingMemory = new WorkingMemoryManager(config);
    this.referenceMemory = new ReferenceMemoryManager(config);
    this.historicalMemory = new HistoricalMemoryManager(config);
  }

  /**
   * Store context in appropriate memory layer
   * @param {Object} context - Context to store
   * @param {string} memoryType - Type of memory ('core', 'working', 'reference', 'historical')
   * @returns {Promise<string>} Memory ID
   */
  async storeContext(context, memoryType = 'working') {
    const memoryManager = this.getMemoryManager(memoryType);
    return await memoryManager.store(context);
  }

  /**
   * Retrieve relevant context for a request
   * @param {Object} request - Current request context
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Relevant context
   */
  async getRelevantContext(request, options = {}) {
    const relevanceScorer = new RelevanceScorer(options);
    
    // Score and rank context from all memory layers
    const candidates = await this.getAllContextCandidates();
    const scored = candidates.map(candidate => ({
      ...candidate,
      relevanceScore: relevanceScorer.score(candidate, request)
    }));
    
    // Return top-scored context within token limits
    return this.optimizeForTokenLimits(scored, options.maxTokens);
  }

  /**
   * Update memory based on conversation outcomes
   * @param {Object} conversation - Conversation context
   * @param {Object} outcome - Results and user feedback
   * @returns {Promise<void>}
   */
  async updateFromConversation(conversation, outcome) {
    // Extract learnings from successful interactions
    const learnings = this.extractLearnings(conversation, outcome);
    
    // Update appropriate memory layers
    await this.coreMemory.updatePatterns(learnings.patterns);
    await this.workingMemory.updateContext(learnings.context);
    await this.referenceMemory.updateTemplates(learnings.templates);
  }
}
```

**Memory Layer Interfaces**

```javascript
// Core Memory - Long-term user and project knowledge
class CoreMemoryManager {
  /**
   * Store user preference
   * @param {string} category - Preference category
   * @param {Object} preference - Preference data
   * @returns {Promise<void>}
   */
  async storeUserPreference(category, preference) {
    const userProfile = await this.getUserProfile();
    userProfile.preferences[category] = {
      ...userProfile.preferences[category],
      ...preference,
      updatedAt: new Date().toISOString()
    };
    await this.saveUserProfile(userProfile);
  }

  /**
   * Store project context
   * @param {string} projectId - Project identifier
   * @param {Object} context - Project context
   * @returns {Promise<void>}
   */
  async storeProjectContext(projectId, context) {
    const projectMemory = await this.getProjectMemory(projectId);
    projectMemory.context = {
      ...projectMemory.context,
      ...context,
      lastUpdated: new Date().toISOString()
    };
    await this.saveProjectMemory(projectId, projectMemory);
  }
}

// Working Memory - Active session context
class WorkingMemoryManager {
  /**
   * Start new session
   * @param {string} sessionId - Session identifier
   * @param {Object} initialContext - Initial session context
   * @returns {Promise<void>}
   */
  async startSession(sessionId, initialContext = {}) {
    const session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      context: initialContext,
      conversationHistory: [],
      currentTasks: [],
      activeProject: null
    };
    await this.saveSession(sessionId, session);
  }

  /**
   * Update session context
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Context updates
   * @returns {Promise<void>}
   */
  async updateSessionContext(sessionId, updates) {
    const session = await this.getSession(sessionId);
    session.context = { ...session.context, ...updates };
    session.lastUpdated = new Date().toISOString();
    await this.saveSession(sessionId, session);
  }
}
```

## File Communication API

### Queue-Based Communication System

**FileCommManager Interface**

```javascript
class FileCommManager {
  /**
   * Queue a request for Claude Code processing
   * @param {Object} request - Request to process
   * @returns {Promise<string>} Request ID
   */
  async queueRequest(request) {
    const requestId = this.generateRequestId();
    const requestFile = {
      id: requestId,
      timestamp: new Date().toISOString(),
      sessionId: request.sessionId,
      prompt: request.prompt,
      context: request.context,
      tools: request.tools || [],
      priority: request.priority || 'normal'
    };
    
    await this.writeToQueue(requestId, requestFile, 'input');
    return requestId;
  }

  /**
   * Wait for response from Claude Code
   * @param {string} requestId - Request identifier
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Response data
   */
  async waitForResponse(requestId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkForResponse = async () => {
        try {
          const response = await this.checkQueue(requestId, 'output');
          if (response) {
            resolve(response);
            return;
          }
          
          // Check for failure
          const failure = await this.checkQueue(requestId, 'failed');
          if (failure) {
            reject(new Error(`Request failed: ${failure.error}`));
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Request timeout'));
            return;
          }
          
          // Continue polling
          setTimeout(checkForResponse, 100);
        } catch (error) {
          reject(error);
        }
      };
      
      checkForResponse();
    });
  }

  /**
   * Clean up completed requests
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<void>}
   */
  async cleanup(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;
    
    for (const queueType of ['output', 'failed']) {
      const files = await this.listQueueFiles(queueType);
      for (const file of files) {
        if (file.timestamp < cutoff) {
          await this.removeFromQueue(file.id, queueType);
        }
      }
    }
  }
}
```

**Queue File Formats**

```javascript
// Input Queue File Format
{
  "id": "req_20241127_143052_abc123",
  "timestamp": "2024-11-27T14:30:52.123Z",
  "sessionId": "session_abc123",
  "prompt": "Please read package.json and analyze the project structure",
  "context": {
    "projectRoot": "/path/to/project",
    "relevantMemory": [...],
    "userPreferences": {...}
  },
  "tools": ["read", "bash", "edit"],
  "priority": "normal"
}

// Output Queue File Format
{
  "requestId": "req_20241127_143052_abc123",
  "response": "Based on your package.json, this is a Node.js project...",
  "metadata": {
    "processingTime": 4.2,
    "tokensUsed": 1250,
    "toolsUsed": ["read"],
    "memoryUpdates": [...]
  },
  "timestamp": "2024-11-27T14:30:56.456Z"
}

// Failed Queue File Format
{
  "requestId": "req_20241127_143052_abc123",
  "error": "File not found: package.json",
  "errorType": "FileNotFoundError",
  "timestamp": "2024-11-27T14:30:54.789Z",
  "retryable": true
}
```

## Claude Code Integration API

### ClaudeCodeIntegration Interface

```javascript
class ClaudeCodeIntegration {
  /**
   * Process request through Claude Code
   * @param {Object} request - Request to process
   * @returns {Promise<Object>} Response from Claude Code
   */
  async processRequest(request) {
    // Prepare optimized prompt
    const prompt = await this.preparePrompt(request);
    
    // Execute Claude Code with appropriate tools
    const result = await this.executeClaudeCode(prompt, request.tools);
    
    // Parse and structure response
    return this.parseResponse(result, request);
  }

  /**
   * Prepare context-optimized prompt
   * @param {Object} request - Original request
   * @returns {Promise<string>} Optimized prompt
   */
  async preparePrompt(request) {
    const contextOptimizer = new ContextOptimizer();
    const relevantContext = await this.memorySystem.getRelevantContext(request);
    
    return contextOptimizer.buildPrompt({
      userInput: request.prompt,
      context: relevantContext,
      sessionHistory: request.sessionHistory,
      userPreferences: request.userPreferences
    });
  }

  /**
   * Execute Claude Code command
   * @param {string} prompt - Prepared prompt
   * @param {Array} tools - Available tools
   * @returns {Promise<Object>} Raw Claude Code response
   */
  async executeClaudeCode(prompt, tools = []) {
    const command = this.buildClaudeCommand(prompt, tools);
    
    return new Promise((resolve, reject) => {
      const process = spawn('claude', command, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ANTHROPIC_API_KEY: this.config.apiKey }
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Claude Code failed: ${stderr}`));
        }
      });
      
      // Send prompt to stdin
      process.stdin.write(prompt);
      process.stdin.end();
    });
  }

  /**
   * Build Claude Code command arguments
   * @param {string} prompt - Input prompt
   * @param {Array} tools - Available tools
   * @returns {Array} Command arguments
   */
  buildClaudeCommand(prompt, tools) {
    const args = ['--output-format', 'json'];
    
    if (tools.length > 0) {
      args.push('--allowed-tools', tools.join(','));
    }
    
    return args;
  }
}
```

### Tool Integration

**Available Claude Code Tools**

```javascript
const AVAILABLE_TOOLS = {
  // File operations
  read: {
    description: 'Read file contents',
    usage: 'Read file at specified path',
    permissions: ['read']
  },
  
  edit: {
    description: 'Edit file contents',
    usage: 'Modify existing files',
    permissions: ['read', 'write']
  },
  
  write: {
    description: 'Create new files',
    usage: 'Create new files with specified content',
    permissions: ['write']
  },
  
  // System operations
  bash: {
    description: 'Execute system commands',
    usage: 'Run shell commands and scripts',
    permissions: ['execute']
  },
  
  // Project navigation
  ls: {
    description: 'List directory contents',
    usage: 'Navigate project structure',
    permissions: ['read']
  },
  
  // Search operations
  grep: {
    description: 'Search file contents',
    usage: 'Find patterns in files',
    permissions: ['read']
  },
  
  glob: {
    description: 'Find files by pattern',
    usage: 'Locate files matching patterns',
    permissions: ['read']
  }
};

/**
 * Determine required tools for request
 * @param {string} userInput - User's request
 * @param {Object} context - Request context
 * @returns {Array} Required tool names
 */
function determineRequiredTools(userInput, context) {
  const tools = [];
  
  // File reading indicators
  if (/read|show|display|analyze|review/.test(userInput.toLowerCase())) {
    tools.push('read', 'ls');
  }
  
  // File modification indicators
  if (/create|write|modify|update|edit|add/.test(userInput.toLowerCase())) {
    tools.push('read', 'write', 'edit');
  }
  
  // Command execution indicators
  if (/run|execute|install|test|build|deploy/.test(userInput.toLowerCase())) {
    tools.push('bash');
  }
  
  // Search indicators
  if (/find|search|locate|grep/.test(userInput.toLowerCase())) {
    tools.push('grep', 'glob', 'ls');
  }
  
  return [...new Set(tools)]; // Remove duplicates
}
```

## Configuration API

### ConfigurationManager Interface

```javascript
class ConfigurationManager {
  /**
   * Load configuration from multiple sources
   * @returns {Promise<Object>} Merged configuration
   */
  async load() {
    const sources = [
      this.loadDefaults(),
      await this.loadFromFile(),
      await this.loadFromEnvironment(),
      await this.loadFromArgs()
    ];
    
    this.config = this.mergeConfigurations(sources);
    return this.config;
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = undefined) {
    return this.getNestedValue(this.config, key) ?? defaultValue;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} value - Value to set
   * @returns {void}
   */
  set(key, value) {
    this.setNestedValue(this.config, key, value);
  }

  /**
   * Save configuration to file
   * @returns {Promise<void>}
   */
  async save() {
    const configPath = this.getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }
}
```

**Configuration Schema**

```javascript
// Default configuration structure
const DEFAULT_CONFIG = {
  // Application settings
  app: {
    name: 'Trinity MVP',
    version: '1.0.0',
    environment: 'production',
    logLevel: 'info'
  },
  
  // UI settings
  ui: {
    theme: 'professional',
    accessible: false,
    window: {
      width: 1200,
      height: 800,
      resizable: true
    }
  },
  
  // Memory system settings
  memory: {
    maxCoreMemorySize: '50MB',
    maxWorkingMemorySize: '20MB',
    contextOptimization: true,
    autoArchive: true,
    archiveAfterDays: 30
  },
  
  // Claude Code integration
  claude: {
    apiKey: null, // Set via environment or secure storage
    timeout: 30000,
    maxRetries: 3,
    defaultTools: ['read', 'write', 'edit', 'bash', 'ls'],
    allowedDirectories: ['.'] // Restrict file access
  },
  
  // File communication settings
  fileComm: {
    queueDirectory: '~/.trinity-mvp/queue',
    cleanupInterval: 3600000, // 1 hour
    maxQueueSize: 100
  },
  
  // Performance settings
  performance: {
    responseTimeout: 30000,
    maxConcurrentRequests: 3,
    memoryOptimization: true
  },
  
  // Security settings
  security: {
    enableFileAccess: true,
    enableCommandExecution: true,
    restrictToProjectDirectory: true,
    auditLog: true
  }
};
```

## Event System API

### Event-Driven Architecture

**TrinityEventEmitter Interface**

```javascript
class TrinityEventEmitter extends EventEmitter {
  /**
   * Emit application event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @returns {boolean} Whether event had listeners
   */
  emitTrinityEvent(event, data = {}) {
    const eventData = {
      timestamp: new Date().toISOString(),
      source: 'trinity-core',
      ...data
    };
    
    return this.emit(event, eventData);
  }

  /**
   * Register typed event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {TrinityEventEmitter} This instance for chaining
   */
  onTrinityEvent(event, listener) {
    return this.on(event, listener);
  }
}
```

**Core Events**

```javascript
// Application lifecycle events
const APP_EVENTS = {
  STARTING: 'app:starting',
  READY: 'app:ready',
  SHUTTING_DOWN: 'app:shutting-down',
  ERROR: 'app:error'
};

// Memory system events
const MEMORY_EVENTS = {
  CONTEXT_STORED: 'memory:context-stored',
  CONTEXT_RETRIEVED: 'memory:context-retrieved',
  MEMORY_OPTIMIZED: 'memory:optimized',
  ARCHIVE_CREATED: 'memory:archive-created'
};

// Communication events
const COMM_EVENTS = {
  REQUEST_QUEUED: 'comm:request-queued',
  REQUEST_PROCESSING: 'comm:request-processing',
  RESPONSE_RECEIVED: 'comm:response-received',
  REQUEST_FAILED: 'comm:request-failed'
};

// Claude Code integration events
const CLAUDE_EVENTS = {
  INTEGRATION_READY: 'claude:ready',
  PROCESSING_STARTED: 'claude:processing-started',
  PROCESSING_COMPLETED: 'claude:processing-completed',
  TOOL_EXECUTED: 'claude:tool-executed',
  ERROR_OCCURRED: 'claude:error'
};
```

**Event Usage Examples**

```javascript
// Listen for memory updates
trinity.events.onTrinityEvent(MEMORY_EVENTS.CONTEXT_STORED, (event) => {
  console.log(`Stored context: ${event.contextId} for session: ${event.sessionId}`);
});

// Monitor Claude Code processing
trinity.events.onTrinityEvent(CLAUDE_EVENTS.PROCESSING_STARTED, (event) => {
  updateUI({ status: 'processing', requestId: event.requestId });
});

trinity.events.onTrinityEvent(CLAUDE_EVENTS.PROCESSING_COMPLETED, (event) => {
  updateUI({ status: 'completed', response: event.response });
});
```

## Extension Points

### Plugin Architecture

**Plugin Interface**

```javascript
class TrinityPlugin {
  /**
   * Plugin constructor
   * @param {Object} trinity - Trinity application instance
   * @param {Object} config - Plugin configuration
   */
  constructor(trinity, config = {}) {
    this.trinity = trinity;
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Initialize plugin
   * @returns {Promise<void>}
   */
  async initialize() {
    // Override in subclasses
  }

  /**
   * Plugin lifecycle hooks
   */
  async onApplicationReady() {}
  async onSessionStart(sessionId) {}
  async onSessionEnd(sessionId) {}
  async onMemoryUpdate(context) {}
  async onRequestProcessed(request, response) {}

  /**
   * Cleanup plugin resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Override in subclasses
  }
}
```

**Example Plugin Implementation**

```javascript
class ProjectAnalyticsPlugin extends TrinityPlugin {
  async initialize() {
    this.analytics = new AnalyticsCollector(this.config);
    
    // Register event listeners
    this.trinity.events.onTrinityEvent(COMM_EVENTS.RESPONSE_RECEIVED, 
      this.trackResponse.bind(this));
    this.trinity.events.onTrinityEvent(MEMORY_EVENTS.CONTEXT_STORED, 
      this.trackMemoryUsage.bind(this));
  }

  async trackResponse(event) {
    await this.analytics.record('response', {
      sessionId: event.sessionId,
      responseTime: event.processingTime,
      tokensUsed: event.tokensUsed,
      toolsUsed: event.toolsUsed
    });
  }

  async trackMemoryUsage(event) {
    const memoryStats = await this.trinity.memory.getUsageStats();
    await this.analytics.record('memory', memoryStats);
  }

  async generateReport() {
    return await this.analytics.generateReport({
      timeframe: 'last-30-days',
      includeCharts: true
    });
  }
}
```

### Custom Memory Adapters

**Memory Adapter Interface**

```javascript
class MemoryAdapter {
  /**
   * Store memory data
   * @param {string} key - Storage key
   * @param {Object} data - Data to store
   * @returns {Promise<void>}
   */
  async store(key, data) {
    throw new Error('store() must be implemented');
  }

  /**
   * Retrieve memory data
   * @param {string} key - Storage key
   * @returns {Promise<Object|null>} Retrieved data or null
   */
  async retrieve(key) {
    throw new Error('retrieve() must be implemented');
  }

  /**
   * Delete memory data
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async delete(key) {
    throw new Error('delete() must be implemented');
  }

  /**
   * List available keys
   * @param {string} prefix - Key prefix filter
   * @returns {Promise<Array>} Array of keys
   */
  async list(prefix = '') {
    throw new Error('list() must be implemented');
  }
}

// Example: Redis Memory Adapter
class RedisMemoryAdapter extends MemoryAdapter {
  constructor(redisConfig) {
    super();
    this.redis = new Redis(redisConfig);
  }

  async store(key, data) {
    await this.redis.set(key, JSON.stringify(data));
  }

  async retrieve(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async delete(key) {
    await this.redis.del(key);
  }

  async list(prefix = '') {
    return await this.redis.keys(`${prefix}*`);
  }
}
```

## Development Tools

### Debug and Monitoring APIs

**Debug Interface**

```javascript
class TrinityDebugger {
  /**
   * Enable debug mode
   * @param {Object} options - Debug options
   */
  enable(options = {}) {
    this.debugEnabled = true;
    this.verboseLogging = options.verbose || false;
    this.traceMemory = options.memory || false;
    this.traceClaude = options.claude || false;
  }

  /**
   * Log debug information
   * @param {string} category - Debug category
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   */
  log(category, message, data = {}) {
    if (!this.debugEnabled) return;
    
    console.debug(`[Trinity:${category}] ${message}`, data);
  }

  /**
   * Generate system diagnostic report
   * @returns {Promise<Object>} Diagnostic data
   */
  async generateDiagnostic() {
    return {
      timestamp: new Date().toISOString(),
      version: this.trinity.version,
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      
      // Trinity-specific diagnostics
      memorySystem: await this.trinity.memory.getDiagnostics(),
      fileComm: await this.trinity.fileComm.getDiagnostics(),
      claudeIntegration: await this.trinity.claude.getDiagnostics(),
      
      // Active sessions
      activeSessions: await this.trinity.memory.getActiveSessions(),
      queueStatus: await this.trinity.fileComm.getQueueStatus()
    };
  }
}
```

**Health Check API**

```javascript
class TrinityHealthCheck {
  /**
   * Run comprehensive health check
   * @returns {Promise<Object>} Health status
   */
  async runHealthCheck() {
    const checks = [
      this.checkMemorySystem(),
      this.checkFileCommSystem(),
      this.checkClaudeIntegration(),
      this.checkSystemResources(),
      this.checkFilePermissions()
    ];

    const results = await Promise.allSettled(checks);
    
    return {
      overall: results.every(r => r.status === 'fulfilled' && r.value.healthy),
      timestamp: new Date().toISOString(),
      checks: results.map((result, index) => ({
        name: this.getCheckName(index),
        status: result.status,
        healthy: result.status === 'fulfilled' ? result.value.healthy : false,
        details: result.status === 'fulfilled' ? result.value : result.reason
      }))
    };
  }

  async checkMemorySystem() {
    try {
      const stats = await this.trinity.memory.getStats();
      return {
        healthy: stats.accessible && stats.writable,
        details: stats
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async checkClaudeIntegration() {
    try {
      // Test Claude Code availability
      const testResponse = await this.trinity.claude.testConnection();
      return {
        healthy: testResponse.success,
        details: testResponse
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}
```

### Testing Utilities

**Test Helpers**

```javascript
class TrinityTestHelpers {
  /**
   * Create test Trinity instance
   * @param {Object} config - Test configuration
   * @returns {Promise<Trinity>} Test instance
   */
  static async createTestInstance(config = {}) {
    const testConfig = {
      ...DEFAULT_TEST_CONFIG,
      ...config
    };
    
    const trinity = new Trinity(testConfig);
    await trinity.initialize();
    
    return trinity;
  }

  /**
   * Mock Claude Code responses
   * @param {Array} responses - Mock responses
   * @returns {Function} Cleanup function
   */
  static mockClaudeCode(responses) {
    const originalExecute = ClaudeCodeIntegration.prototype.executeClaudeCode;
    let responseIndex = 0;
    
    ClaudeCodeIntegration.prototype.executeClaudeCode = async () => {
      const response = responses[responseIndex % responses.length];
      responseIndex++;
      return response;
    };
    
    // Return cleanup function
    return () => {
      ClaudeCodeIntegration.prototype.executeClaudeCode = originalExecute;
    };
  }

  /**
   * Create test memory context
   * @param {Object} data - Test data
   * @returns {Object} Test context
   */
  static createTestContext(data = {}) {
    return {
      sessionId: 'test-session',
      userId: 'test-user',
      projectId: 'test-project',
      timestamp: new Date().toISOString(),
      ...data
    };
  }
}
```

---

This API reference provides comprehensive documentation for developers working with Trinity MVP's codebase. For usage examples and integration patterns, see the [Development Guide](development.md) and [Contributing Guidelines](contributing.md).