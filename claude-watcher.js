#!/usr/bin/env node

/**
 * Trinity MVP - Claude Code Queue Watcher
 * Monitors file queue and processes requests with Claude Code via WSL
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Trinity-Native Memory System
const TrinityNativeMemory = require('./src/core/trinity-native-memory');
const MemoryReferenceDetector = require('./src/core/memory-reference-detector');
const ComplexQueryProcessor = require('./src/core/complex-query-processor');

// Trinity System Awareness Components
const ClaudeCodeContextEnhancer = require('./src/core/claude-code-context-enhancer');

// Trinity Identity Restoration Components
const TrinityResponseEnhancer = require('./src/core/trinity-response-enhancer');

class ClaudeWatcher {
  constructor() {
    this.trinityDir = path.join(os.homedir(), '.trinity-mvp');
    this.queueDir = path.join(this.trinityDir, 'queue');
    this.inputDir = path.join(this.queueDir, 'input');
    this.processingDir = path.join(this.queueDir, 'processing');
    this.outputDir = path.join(this.queueDir, 'output');
    this.failedDir = path.join(this.queueDir, 'failed');
    this.logsDir = path.join(this.trinityDir, 'logs');
    
    this.logFile = path.join(this.logsDir, `claude-watcher-${new Date().toISOString().split('T')[0]}.log`);
    this.isRunning = false;
    this.pollInterval = 1000; // Check every second
    
    // Initialize Trinity-Native Memory System
    this.trinityMemory = new TrinityNativeMemory({
      baseDir: this.trinityDir,
      logger: {
        info: (msg) => this.log(`[MEMORY] ${msg}`),
        warn: (msg) => this.log(`[MEMORY WARN] ${msg}`),
        error: (msg) => this.log(`[MEMORY ERROR] ${msg}`)
      }
    });
    
    this.memoryDetector = new MemoryReferenceDetector({
      logger: {
        info: (msg) => this.log(`[DETECTOR] ${msg}`),
        warn: (msg) => this.log(`[DETECTOR WARN] ${msg}`),
        error: (msg) => this.log(`[DETECTOR ERROR] ${msg}`)
      }
    });
    
    this.complexQueryProcessor = new ComplexQueryProcessor({
      baseDir: this.trinityDir,
      logger: {
        info: (msg) => this.log(`[COMPLEX-QUERY] ${msg}`),
        warn: (msg) => this.log(`[COMPLEX-QUERY WARN] ${msg}`),
        error: (msg) => this.log(`[COMPLEX-QUERY ERROR] ${msg}`)
      }
    });
    
    // Initialize Trinity System Awareness
    this.contextEnhancer = new ClaudeCodeContextEnhancer({
      systemDir: this.trinityDir,
      enableCuriosity: true,
      enableSystemAwareness: true,
      logger: {
        info: (msg) => this.log(`[SYSTEM-AWARENESS] ${msg}`),
        warn: (msg) => this.log(`[SYSTEM-AWARENESS WARN] ${msg}`),
        error: (msg) => this.log(`[SYSTEM-AWARENESS ERROR] ${msg}`)
      }
    });
    
    // 🔧 DEBUG FLOW TRACING SYSTEM
    this.DEBUG_ENABLED = process.env.TRINITY_DEBUG === 'true' || true; // TODO: Set to false for production
    this.FLOW_TRACE_ID = null;
    this.debugStep = 0;
    
    // Initialize Trinity Identity Restoration
    this.trinityIdentity = new TrinityResponseEnhancer({
      systemDir: this.trinityDir,
      enableIdentityEnhancement: true,
      enableCreativeHandling: true,
      logger: {
        info: (msg) => this.log(`[TRINITY-IDENTITY] ${msg}`),
        warn: (msg) => this.log(`[TRINITY-IDENTITY WARN] ${msg}`),
        error: (msg) => this.log(`[TRINITY-IDENTITY ERROR] ${msg}`)
      }
    });
    
    this.log('Claude Watcher starting up with Trinity-Native Memory, System Awareness, and Identity Restoration...');
    this.ensureDirectories();
    this.initializeMemory();
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(`[WATCHER] ${message}`);
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  // 🔧 DEBUG FLOW TRACING METHODS
  debugTrace(step, message, data = null) {
    if (!this.DEBUG_ENABLED) return;
    
    this.debugStep++;
    const traceId = this.FLOW_TRACE_ID || 'NO_TRACE';
    let debugMsg = `🔧 [TRACE:${traceId}:${this.debugStep}] ${step}: ${message}`;
    
    if (data) {
      if (typeof data === 'string') {
        debugMsg += ` | "${data}" (len:${data.length})`;
      } else if (typeof data === 'object') {
        debugMsg += ` | ${JSON.stringify(data, null, 0)}`;
      } else {
        debugMsg += ` | ${data} (${typeof data})`;
      }
    }
    
    this.log(debugMsg);
  }
  
  startTrace(requestId, operation) {
    if (!this.DEBUG_ENABLED) return;
    
    this.FLOW_TRACE_ID = `${requestId}_${operation}`;
    this.debugStep = 0;
    this.debugTrace('START', `Beginning ${operation} for ${requestId}`);
  }
  
  endTrace(result = 'completed') {
    if (!this.DEBUG_ENABLED) return;
    
    this.debugTrace('END', `Flow trace completed: ${result}`);
    this.FLOW_TRACE_ID = null;
    this.debugStep = 0;
  }
  
  ensureDirectories() {
    const dirs = [this.inputDir, this.processingDir, this.outputDir, this.failedDir, this.logsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    this.log('Queue directories verified');
  }
  
  async initializeMemory() {
    try {
      await this.trinityMemory.initialize();
      this.log('Trinity-Native Memory initialized successfully');
      
      const stats = this.trinityMemory.getStats();
      this.log(`Memory Stats: ${stats.totalConversations} conversations, ${stats.totalTopics} topics, ${stats.totalSessions} sessions`);
    } catch (error) {
      this.log(`Failed to initialize Trinity-Native Memory: ${error.message}`);
    }
  }
  
  async start() {
    this.isRunning = true;
    this.log('Claude Watcher started - monitoring queue...');
    this.log('🔧 STARTUP VERSION: May 28 2025 v2.1 - New code verification marker');
    
    while (this.isRunning) {
      try {
        await this.processQueue();
        await this.sleep(this.pollInterval);
      } catch (error) {
        this.log(`Error in main loop: ${error.message}`);
        await this.sleep(this.pollInterval * 2);
      }
    }
  }
  
  async processQueue() {
    const files = fs.readdirSync(this.inputDir).filter(f => f.endsWith('.json'));
    
    for (const filename of files) {
      if (!this.isRunning) break;
      
      const inputPath = path.join(this.inputDir, filename);
      const processingPath = path.join(this.processingDir, filename);
      
      try {
        // Move to processing
        fs.renameSync(inputPath, processingPath);
        this.log(`Processing request: ${filename}`);
        
        // Process the request
        await this.processRequest(processingPath, filename);
        
      } catch (error) {
        this.log(`Error processing ${filename}: ${error.message}`);
        
        // Move to failed directory
        try {
          const failedPath = path.join(this.failedDir, filename);
          if (fs.existsSync(processingPath)) {
            fs.renameSync(processingPath, failedPath);
          }
        } catch (moveError) {
          this.log(`Failed to move error file: ${moveError.message}`);
        }
      }
    }
  }
  
  async processRequest(requestPath, filename) {
    this.log(`🔍 EXECUTION_TRACE: processRequest ENTRY - ${filename}`);
    
    // Read the request
    const requestData = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
    this.log(`Request data: ${JSON.stringify(requestData, null, 2)}`);
    
    const { sessionId, options = {} } = requestData;
    // Accept both 'prompt' and 'message' field names for flexibility
    const prompt = requestData.prompt || requestData.message;
    
    // 🔧 START FLOW TRACE
    this.startTrace(requestData.requestId || filename, 'processRequest');
    this.debugTrace('INIT', 'Request data parsed', { sessionId, promptLen: prompt?.length, options, promptField: requestData.prompt ? 'prompt' : 'message' });
    const workingDirectory = options.workingDirectory;
    const userContext = options.userContext || {};
    
    let memoryContext = null;
    let enhancedPrompt = prompt;
    let complexQueryResult = null;
    
    try {
      // Step 1: Check for complex query processing needs
      this.log(`🔍 TRACE: Starting request processing with prompt: "${prompt.substring(0, 50)}..." (${typeof prompt})`);
      const needsComplexProcessing = this.complexQueryProcessor.needsComplexProcessing(prompt);
      
      if (needsComplexProcessing) {
        this.log(`🧠 Complex analytical query detected - enhancing for professional processing`);
        complexQueryResult = await this.complexQueryProcessor.processComplexQuery(prompt);
        
        if (complexQueryResult.enhanced && complexQueryResult.enhancedPrompt) {
          enhancedPrompt = complexQueryResult.enhancedPrompt;
          this.log(`✅ Query enhanced for analytical processing (${enhancedPrompt.length} chars)`);
          this.log(`📋 Operations identified: ${JSON.stringify(complexQueryResult.operations)}`);
        } else if (complexQueryResult.enhanced) {
          this.log('⚠️ Complex query processor marked as enhanced but no enhancedPrompt provided - using original prompt');
        }
      } else {
        this.log('📝 Simple query - proceeding with standard processing');
      }
      
      // CRITICAL: Validate enhancedPrompt before ANY memory system calls
      this.log(`🔍 TRACE: Pre-validation enhancedPrompt: "${enhancedPrompt}" (type: ${typeof enhancedPrompt})`);
      if (!enhancedPrompt || typeof enhancedPrompt !== 'string') {
        this.log('⚠️ EMERGENCY: Invalid enhancedPrompt detected - using original prompt');
        enhancedPrompt = prompt;
      }
      this.log(`🔍 TRACE: Post-validation enhancedPrompt: "${enhancedPrompt}" (type: ${typeof enhancedPrompt})`);
      
      // Step 2: Check if this prompt contains memory references
      this.log(`🔍 EXECUTION_TRACE: About to call detectsMemoryReference with: "${enhancedPrompt}" (type: ${typeof enhancedPrompt})`);
      try {
              // AGGRESSIVE CRASH DEBUGGING - Phase 2
      this.log(`🔍 AGGRESSIVE_TRACE: Pre-memory-detection state check`);
      this.log(`🔍 AGGRESSIVE_TRACE: enhancedPrompt type: ${typeof enhancedPrompt}`);
      this.log(`🔍 AGGRESSIVE_TRACE: enhancedPrompt value: "${enhancedPrompt}"`);
      this.log(`🔍 AGGRESSIVE_TRACE: enhancedPrompt length: ${enhancedPrompt?.length}`);
      this.log(`🔍 AGGRESSIVE_TRACE: memoryDetector exists: ${!!this.memoryDetector}`);
      this.log(`🔍 AGGRESSIVE_TRACE: About to call detectsMemoryReference...`);
      
      // Extra validation before memory detector call
      if (!enhancedPrompt) {
        this.log('🚨 CRITICAL: enhancedPrompt is falsy before memory detection!');
        enhancedPrompt = prompt || 'DEFAULT_PROMPT';
      }
      if (typeof enhancedPrompt !== 'string') {
        this.log(`🚨 CRITICAL: enhancedPrompt is not string: ${typeof enhancedPrompt}`);
        enhancedPrompt = String(enhancedPrompt);
      }

        const hasMemoryReference = this.memoryDetector.detectsMemoryReference(enhancedPrompt);
        this.log(`🔍 EXECUTION_TRACE: detectsMemoryReference returned: ${hasMemoryReference}`);
        
        if (hasMemoryReference) {
          this.log(`Memory reference detected in enhanced prompt`);
          
          // Load relevant memory context using Trinity-Native Memory
          this.log(`📝 Passing to memory system: "${enhancedPrompt}" (type: ${typeof enhancedPrompt})`);
          this.log(`🔍 EXECUTION_TRACE: About to call buildContextForClaude`);
          memoryContext = await this.trinityMemory.buildContextForClaude(enhancedPrompt);
          this.log(`🔍 EXECUTION_TRACE: buildContextForClaude completed successfully`);
          
          if (memoryContext.contextText && memoryContext.contextText.trim().length > 0) {
            // Write context file for Claude Code to read
            const contextFilePath = path.join(this.trinityDir, 'memory', 'claude-context.txt');
            
            // Ensure memory directory exists
            const memoryContextDir = path.dirname(contextFilePath);
            if (!fs.existsSync(memoryContextDir)) {
              fs.mkdirSync(memoryContextDir, { recursive: true });
            }
            
            // Write context file
            fs.writeFileSync(contextFilePath, memoryContext.contextText);
            
            // Enhanced message for Claude Code with actual context content
            enhancedPrompt = `${enhancedPrompt}\n\n=== RELEVANT CONTEXT FROM MEMORY ===\n${memoryContext.contextText}\n=== END CONTEXT ===`;
            
            this.log(`Memory context written to: ${contextFilePath}`);
            this.log(`Context summary: ${memoryContext.summary}`);
            this.log(`Memory context size: ${memoryContext.contextText.length} characters`);
          } else {
            this.log('Memory reference detected but no relevant context found');
          }
        } else {
          this.log(`🔍 EXECUTION_TRACE: No memory reference detected, skipping memory context`);
        }
      } catch (memoryError) {
        this.log(`🚨 EXECUTION_TRACE: Memory system error caught: ${memoryError.message}`);
        this.log(`🚨 EXECUTION_TRACE: Error stack: ${memoryError.stack}`);
        this.log(`Failed to load memory context: ${memoryError.message}`);
        // Continue without memory context
      }
    
    // Step 3: Apply Trinity System Awareness Enhancement
    try {
      this.debugTrace('SYS_AWARE_START', 'Starting system awareness enhancement', enhancedPrompt);
      this.log('🧠 Applying Trinity System Awareness enhancement...');
      this.log('🔧 CODE VERSION TEST: This message proves new code is loaded - May 28 2025 v2.1');
      
      // Build conversation history from session context (if available)
      const conversationHistory = [];
      if (userContext && userContext.previousMessages) {
        conversationHistory.push(...userContext.previousMessages);
      }
      this.debugTrace('CONV_HISTORY', 'Conversation history built', { historyLength: conversationHistory.length });
      
      // Apply system awareness and curiosity enhancement
      this.debugTrace('ENHANCE_BEFORE', 'Calling contextEnhancer.enhanceWithSystemAwareness', enhancedPrompt);
      const systemAwarePrompt = await this.contextEnhancer.enhanceWithSystemAwareness(
        enhancedPrompt, 
        conversationHistory,
        {
          workingDirectory: workingDirectory,
          sessionId: sessionId,
          forceEnhancement: false // Let the enhancer decide based on message content
        }
      );
      this.debugTrace('ENHANCE_AFTER', 'System awareness enhancement returned', systemAwarePrompt);
      
      if (systemAwarePrompt !== enhancedPrompt) {
        enhancedPrompt = systemAwarePrompt;
        this.log('✅ System awareness enhancement applied');
        
        // Log the enhancement for debugging
        const enhancementStats = this.contextEnhancer.getEnhancementStats();
        this.log(`📊 Enhancement stats: awareness=${enhancementStats.system_awareness_enabled}, curiosity=${enhancementStats.curiosity_enabled}`);
      } else {
        this.log('ℹ️ No system awareness enhancement needed for this request');
      }
      
    } catch (error) {
      this.log(`⚠️ System awareness enhancement failed: ${error.message}`);
      // Continue with existing enhancedPrompt without system awareness
    }
    
    // Final size validation before Claude Code execution
    const totalPromptSize = enhancedPrompt.length;
    const MAX_TOTAL_PROMPT_SIZE = 100000; // 100KB max total prompt
    
    this.debugTrace('SIZE_CHECK', 'Final prompt size validation', { totalPromptSize, original: prompt });
    
    if (totalPromptSize > MAX_TOTAL_PROMPT_SIZE) {
      this.log(`🚨 Total prompt too large (${totalPromptSize} chars), using original prompt to prevent crash`);
      enhancedPrompt = prompt; // Fallback to original prompt without context
      this.debugTrace('SIZE_FALLBACK', 'Using original prompt due to size', prompt);
    } else {
      this.log(`✅ Prompt size validated: ${totalPromptSize} chars`);
    }
    
    // Execute Claude Code with enhanced prompt
    this.debugTrace('EXECUTE_START', 'Calling executeClaudeCode', enhancedPrompt);
    const result = await this.executeClaudeCode(enhancedPrompt, workingDirectory, options, complexQueryResult);
    this.debugTrace('EXECUTE_END', 'Claude Code execution completed', { success: result.success, outputLen: result.output?.length });
    
    // Save conversation to Trinity-Native Memory if successful
    if (result.success && result.output && result.output.trim().length > 0) {
      try {
        this.log('Saving conversation to Trinity-Native Memory...');
        const conversationId = await this.trinityMemory.storeResponse(
          prompt, // Original user prompt (not enhanced)
          result.output,
          sessionId || 'default'
        );
        this.log(`Conversation saved to memory: ${conversationId}`);
        
        // Log memory stats
        const stats = this.trinityMemory.getStats();
        this.log(`Memory updated: ${stats.totalConversations} total conversations`);
      } catch (error) {
        this.log(`Failed to save conversation to memory: ${error.message}`);
      }
    }
    
    // Create response (matching file manager expected format)
    const responseData = {
      requestId: filename.replace('.json', ''),
      sessionId,
      timestamp: new Date().toISOString(),
      success: result.success,
      content: result.output, // File manager expects 'content' field
      output: result.output,  // Keep both for compatibility
      error: result.error,
      executionTime: result.executionTime,
      duration_ms: result.executionTime, // Alternative field name
      // Trinity-Native Memory Context for UI display
      memoryContext: memoryContext ? {
        summary: memoryContext.summary,
        relevantConversations: memoryContext.relevantConversations,
        artifacts: memoryContext.artifacts || []
      } : null
    };
    
    // Write response file (same name as request for file manager compatibility)
    const outputPath = path.join(this.outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(responseData, null, 2));
    
    // Remove from processing
    fs.unlinkSync(requestPath);
    
    this.log(`Request ${filename} completed successfully`);
    
    // 🔧 END FLOW TRACE
    this.endTrace('success');
    
    } catch (error) {
      this.log(`🚨 CRITICAL ERROR in processRequest: ${error.message}`);
      this.log(`🚨 Error stack: ${error.stack}`);
      this.endTrace('error');
      throw error;
    }
  }
  
  async executeClaudeCode(prompt, workingDirectory, options = {}, complexQueryResult = null) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        // Get API key with development fallback
        let apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
        
        // Development fallback: Trinity agent key (never shipped to production)
        if (!apiKey && process.env.NODE_ENV === 'development') {
          try {
            // Try multiple possible Trinity development paths
            const trinityPaths = [
              path.join(__dirname, '../agents/optimus_001/config/config.json'), // Linux dev path
              path.join(os.homedir(), 'git/trinity-system/agents/optimus_001/config/config.json'), // macOS dev path
              '/home/alreadyinuse/git/trinity-system/agents/optimus_001/config/config.json' // Absolute dev path
            ];
            
            for (const configPath of trinityPaths) {
              if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.api_key) {
                  apiKey = config.api_key;
                  this.log(`Using Trinity development API key from ${configPath}`);
                  break;
                }
              }
            }
          } catch (error) {
            this.log('Failed to load Trinity dev key:', error.message);
          }
        }
        
        if (!apiKey) {
          this.log('ERROR: No ANTHROPIC_API_KEY found in environment');
          return resolve({
            success: false,
            output: '',
            error: 'No ANTHROPIC_API_KEY environment variable found',
            executionTime: Date.now() - startTime
          });
        }
        
        // Ensure Claude tools are enabled (non-blocking)
        this.ensureClaudeToolsEnabled(apiKey).catch(error => {
          this.log(`Tool setup error: ${error.message}`);
        });
        
        // Adaptive format selection based on query type and complexity
        const outputFormat = this.selectOptimalOutputFormat(prompt, complexQueryResult);
        this.log(`📊 Selected output format: ${outputFormat} for query type`);
        
        // Build Claude Code command using optimal format
        this.log(`🔍 DEBUG: prompt before command build: "${prompt}" (type: ${typeof prompt}, length: ${prompt?.length || 0})`);
        const claudeArgs = ['--print', '--output-format', outputFormat, prompt];
        
        // Cross-platform Claude Code path detection
        let claudePath = 'claude'; // Default to PATH lookup
        
        // Try platform-specific paths first for reliability
        if (os.platform() === 'linux') {
          const linuxPath = '/home/alreadyinuse/.claude/local/claude';
          if (fs.existsSync(linuxPath)) {
            claudePath = linuxPath;
          }
        } else if (os.platform() === 'darwin') {
          // macOS: Try common Claude Code installation paths
          const macosPaths = [
            path.join(os.homedir(), '.claude/local/claude'),
            '/usr/local/bin/claude',
            '/opt/homebrew/bin/claude',
            'claude' // fallback to PATH
          ];
          
          for (const testPath of macosPaths) {
            if (testPath === 'claude' || fs.existsSync(testPath)) {
              claudePath = testPath;
              break;
            }
          }
        }
        
        this.log(`Executing: ${claudePath} ${claudeArgs.join(' ')}`);
        this.log(`API Key present: ${apiKey ? 'YES' : 'NO'} (length: ${apiKey?.length || 0})`);
        this.log(`Working directory: ${workingDirectory || process.cwd()}`);
        
        const proc = spawn(claudePath, claudeArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          cwd: workingDirectory || process.cwd(),
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: apiKey,
            CLAUDE_MODEL: options.model || 'claude-3-haiku-20240307'
          }
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
          clearTimeout(timeoutId);
          const executionTime = Date.now() - startTime;
          
          this.log(`Claude Code process finished with exit code: ${code}`);
          this.log(`Claude Code stdout: ${stdout.trim()}`);
          this.log(`Claude Code stderr: ${stderr.trim()}`);
          
          // Claude Code returns 0 for success, but we should also check if we got actual output
          const hasOutput = stdout.trim().length > 0;
          const isSuccess = code === 0 && hasOutput;
          
          if (isSuccess) {
            // Adaptive parsing based on selected output format
            const output = stdout.trim();
            
            // Determine expected format from command args
            const expectedFormat = claudeArgs.includes('json') ? 'json' : 'text';
            this.log(`📋 Expected format: ${expectedFormat}, parsing accordingly`);
            
            if (expectedFormat === 'json') {
              // JSON format expected - parse with text fallback
              try {
                const jsonResponse = JSON.parse(output);
                resolve({
                  success: true,
                  output: jsonResponse.result || jsonResponse.content || output,
                  error: null,
                  executionTime,
                  cost: jsonResponse.cost_usd,
                  sessionId: jsonResponse.session_id,
                  format: 'json'
                });
              } catch (parseError) {
                this.log(`⚠️ JSON parsing failed, falling back to text: ${parseError.message}`);
                resolve({
                  success: true,
                  output: output,
                  error: null,
                  executionTime,
                  cost: null,
                  sessionId: null,
                  format: 'text-fallback'
                });
              }
            } else {
              // Text format expected - use directly with JSON attempt for metadata
              try {
                const jsonResponse = JSON.parse(output);
                // If it's actually JSON, extract the content properly
                resolve({
                  success: true,
                  output: jsonResponse.result || jsonResponse.content || output,
                  error: null,
                  executionTime,
                  cost: jsonResponse.cost_usd,
                  sessionId: jsonResponse.session_id,
                  format: 'json-detected'
                });
              } catch (parseError) {
                // Expected text format
                resolve({
                  success: true,
                  output: output,
                  error: null,
                  executionTime,
                  cost: null,
                  sessionId: null,
                  format: 'text'
                });
              }
            }
          } else {
            resolve({
              success: false,
              output: stdout.trim(),
              error: stderr.trim() || `Process exited with code ${code}, no output received`,
              executionTime
            });
          }
        });
        
        proc.on('error', (error) => {
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: '',
            error: `Failed to spawn process: ${error.message}`,
            executionTime
          });
        });
        
        // Timeout after 60 seconds (increased for complex analytical queries)
        const timeoutId = setTimeout(() => {
          console.log(`[${new Date().toISOString()}] TIMEOUT: Claude Code execution exceeded 60s, killing process`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Command args: ${claudeArgs.join(' ')}`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Current stdout: "${stdout}"`);
          console.log(`[${new Date().toISOString()}] TIMEOUT: Current stderr: "${stderr}"`);
          proc.kill('SIGTERM');
          const executionTime = Date.now() - startTime;
          resolve({
            success: false,
            output: stdout.trim(),
            error: 'Claude Code execution timeout (60s) - Process was killed',
            executionTime
          });
        }, 60000);
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        resolve({
          success: false,
          output: '',
          error: `Execution error: ${error.message}`,
          executionTime
        });
      }
    });
  }
  
  // WSL path conversion removed - Trinity now uses native Claude Code execution
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Ensure Claude tools are enabled (fast, no timeouts)
   * Uses the enabledTools command for bulk setup
   */
  async ensureClaudeToolsEnabled(apiKey) {
    try {
      // Check if tools are already configured (fast check)
      const claudeConfigPath = path.join(process.cwd(), '.claude', 'settings.json');
      if (fs.existsSync(claudeConfigPath)) {
        const settings = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
        if (settings.allowedTools && settings.allowedTools.length > 0) {
          this.log('✅ Claude tools already configured');
          return;
        }
      }
      
      // Trinity required tools
      const requiredTools = ['Bash', 'Read', 'Write', 'Edit', 'LS', 'Glob', 'Grep'];
      
      // Cross-platform Claude path (same logic as executeClaudeCode)
      let claudePath = 'claude';
      if (os.platform() === 'linux') {
        const linuxPath = '/home/alreadyinuse/.claude/local/claude';
        if (fs.existsSync(linuxPath)) claudePath = linuxPath;
      } else if (os.platform() === 'darwin') {
        const macosPaths = [
          path.join(os.homedir(), '.claude/local/claude'),
          '/usr/local/bin/claude',
          '/opt/homebrew/bin/claude'
        ];
        for (const testPath of macosPaths) {
          if (fs.existsSync(testPath)) {
            claudePath = testPath;
            break;
          }
        }
      }
      
      // Fast bulk tool setup (no individual timeouts)
      this.log('⚡ Enabling Trinity tools in Claude Code...');
      
      return new Promise((resolve) => {
        const proc = spawn(claudePath, ['config', 'add', 'allowedTools', ...requiredTools], {
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, ANTHROPIC_API_KEY: apiKey }
        });
        
        let output = '';
        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => output += data.toString());
        
        proc.on('close', (code) => {
          if (code === 0) {
            this.log('✅ Trinity tools enabled successfully');
          } else {
            this.log(`⚠️ Tool setup warning (code ${code}): ${output}`);
          }
          resolve(); // Always resolve to not block execution
        });
        
        // Fast timeout (2 seconds max)
        setTimeout(() => {
          proc.kill();
          this.log('⚡ Tool setup timeout (proceeding anyway)');
          resolve();
        }, 2000);
      });
      
    } catch (error) {
      this.log(`⚠️ Tool setup error: ${error.message}`);
      // Don't block execution on tool setup failure
    }
  }
  
  /**
   * Select optimal output format based on query characteristics
   */
  selectOptimalOutputFormat(prompt, complexQueryResult) {
    // TEMPORARY: Force text format to test hypothesis (like previous JSON issue fix)
    this.log(`📊 FORMAT TEST: Forcing 'text' format for debugging stdin issue`);
    return 'text';
    
    // DISABLED: Original adaptive logic (restore after text format validation)
    /*
    const queryAnalysis = {
      isCreativeRequest: /\b(write|create|compose|generate|make|craft|design)\s+(a\s+)?(poem|story|song|essay|article|code|function|script)\b/i.test(prompt),
      isDataQuery: /\b(analyze|calculate|compute|compare|statistics|data|metrics|performance|benchmark|results?)\b/i.test(prompt),
      isStructuredOutput: /\b(list|table|format|json|structure|organize|categorize|breakdown)\b/i.test(prompt),
      isComplexAnalytical: complexQueryResult && complexQueryResult.enhanced && complexQueryResult.operations && complexQueryResult.operations.length > 2,
      hasMemoryReference: this.memoryDetector.detectsMemoryReference(prompt),
      isLongFormQuery: prompt.length > 300,
      isCodeRelated: /\b(code|function|class|method|variable|debug|error|bug|syntax|programming|javascript|python|typescript)\b/i.test(prompt)
    };
    */
    
    // Format selection logic based on query characteristics
    if (queryAnalysis.isDataQuery || queryAnalysis.isComplexAnalytical) {
      // Structured data queries benefit from JSON format for parsing metadata
      return 'json';
    }
    
    if (queryAnalysis.isCreativeRequest && !queryAnalysis.hasMemoryReference) {
      // Creative content often works better with text format (cleaner output)
      return 'text';
    }
    
    if (queryAnalysis.isCodeRelated && queryAnalysis.isStructuredOutput) {
      // Code analysis with structured output benefits from JSON metadata
      return 'json';
    }
    
    if (queryAnalysis.hasMemoryReference) {
      // Memory-related queries may need JSON for session tracking
      return 'json';
    }
    
    // Default to text format for general queries (better Claude Code compatibility)
    return 'text';
  }
  
  stop() {
    this.isRunning = false;
    this.log('Claude Watcher stopping...');
  }
}

// Handle graceful shutdown
const watcher = new ClaudeWatcher();

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  watcher.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  watcher.stop();
  process.exit(0);
});

// Start the watcher
watcher.start().catch(error => {
  console.error('Claude Watcher crashed:', error);
  process.exit(1);
});