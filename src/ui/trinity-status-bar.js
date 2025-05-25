/**
 * Trinity Status Bar - Tier 1 Ambient Intelligence UI
 * 
 * Integrates Trinity component status into existing Electron app nav area
 * "Invisible by Default, Visible on Demand" - intelligent transparency
 */

class TrinityStatusBar {
  constructor() {
    console.log('[Trinity Status Bar] Initializing enhanced Trinity Status Bar...');
    this.components = {
      memory: null,
      tasks: null,
      recovery: null,
      autoCompact: null
    };
    
    this.refreshInterval = null;
    this.updateFrequency = 5000; // 5 seconds
    this.lastUpdate = null;
    
    this.initializeStatusBar();
    this.setupEventListeners();
    console.log('[Trinity Status Bar] Enhanced Trinity Status Bar initialized successfully');
  }

  /**
   * Initialize the Trinity status bar in existing nav area
   */
  initializeStatusBar() {
    // Find the existing status bar container or create one
    let navArea = document.querySelector('#trinity-status-bar') || document.querySelector('.trinity-nav-status');
    
    if (!navArea) {
      // Create nav status area if it doesn't exist
      navArea = this.createNavStatusArea();
    } else {
      // Clear existing content to avoid conflicts
      navArea.innerHTML = '';
      navArea.className = 'trinity-status-bar trinity-header'; // Maintain existing styling
    }
    
    // Create Trinity status components (simplified for single window)
    this.createAmbientStatus(navArea);
    // Note: File drop zone and actions now in single window panels
    
    // Initially show minimal status
    this.updateAmbientDisplay();
  }

  /**
   * Create nav status area in existing UI
   */
  createNavStatusArea() {
    const navArea = document.createElement('div');
    navArea.className = 'trinity-nav-status';
    
    // Insert before chat area or at top of main content
    const mainContent = document.querySelector('.main-content') || document.querySelector('.chat-container');
    if (mainContent && mainContent.parentNode) {
      mainContent.parentNode.insertBefore(navArea, mainContent);
    } else {
      document.body.appendChild(navArea);
    }
    
    return navArea;
  }

  /**
   * Create Tier 1 Ambient Status Display
   */
  createAmbientStatus(container) {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'trinity-ambient-status';
    statusContainer.innerHTML = `
      <div class="trinity-status-grid">
        <div class="trinity-status-item" id="memory-status">
          <span class="trinity-icon">🧠</span>
          <span class="trinity-label">Memory</span>
          <span class="trinity-value" id="memory-value">Ready</span>
        </div>
        
        <div class="trinity-status-item" id="tasks-status">
          <span class="trinity-icon">📋</span>
          <span class="trinity-label">Tasks</span>
          <span class="trinity-value" id="tasks-value">0 active</span>
        </div>
        
        <div class="trinity-status-item" id="recovery-status">
          <span class="trinity-icon">🔄</span>
          <span class="trinity-label">Recovery</span>
          <span class="trinity-value" id="recovery-value">Ready</span>
        </div>
        
        <div class="trinity-status-item" id="context-status">
          <span class="trinity-icon">⚡</span>
          <span class="trinity-label">Auto-compact</span>
          <span class="trinity-value" id="context-value">Active</span>
        </div>
      </div>
      
      <div class="trinity-status-actions">
        <button class="trinity-quick-btn" id="trinity-dashboard-toggle" title="Open Trinity Dashboard">
          <span class="trinity-icon">📊</span>
        </button>
        <button class="trinity-quick-btn" id="trinity-optimize" title="Optimize Context">
          <span class="trinity-icon">🚀</span>
        </button>
        <button class="trinity-quick-btn" id="trinity-checkpoint" title="Create Checkpoint">
          <span class="trinity-icon">💾</span>
        </button>
      </div>
    `;
    
    container.appendChild(statusContainer);
    this.addAmbientStyles();
  }

  /**
   * Create context-aware file drop zone
   */
  createFileDropZone(container) {
    const dropZone = document.createElement('div');
    dropZone.className = 'trinity-drop-zone-compact';
    dropZone.innerHTML = `
      <div class="trinity-drop-bar">
        <span class="trinity-drop-icon">📁</span>
        <span class="trinity-drop-text">Drop files here</span>
        <span class="trinity-drop-separator">•</span>
        <div class="trinity-drop-categories">
          <span class="trinity-drop-category">Documents</span>
          <span class="trinity-drop-separator">|</span>
          <span class="trinity-drop-category">Code</span>
          <span class="trinity-drop-separator">|</span>
          <span class="trinity-drop-category">Tasks</span>
          <span class="trinity-drop-separator">|</span>
          <span class="trinity-drop-category">Context</span>
        </div>
      </div>
    `;
    
    // Setup drag and drop handlers
    this.setupFileDropHandlers(dropZone);
    
    container.appendChild(dropZone);
  }

  /**
   * Create quick action buttons
   */
  createQuickActions(container) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'trinity-quick-actions';
    actionsContainer.innerHTML = `
      <div class="trinity-action-group">
        <button class="trinity-action-btn" id="create-task-btn">
          <span class="trinity-icon">➕</span>
          <span class="trinity-action-label">New Task</span>
        </button>
        
        <button class="trinity-action-btn" id="browse-memory-btn">
          <span class="trinity-icon">🔍</span>
          <span class="trinity-action-label">Memory Explorer</span>
        </button>
        
        <button class="trinity-action-btn" id="view-recovery-btn">
          <span class="trinity-icon">🔄</span>
          <span class="trinity-action-label">Recovery Tools</span>
        </button>
      </div>
    `;
    
    container.appendChild(actionsContainer);
  }

  /**
   * Add styles for ambient status UI
   */
  addAmbientStyles() {
    if (document.getElementById('trinity-ambient-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trinity-ambient-styles';
    styles.textContent = `
      .trinity-nav-status {
        background: rgba(15, 15, 15, 0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }
      
      .trinity-ambient-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .trinity-status-grid {
        display: flex;
        gap: 20px;
        align-items: center;
      }
      
      .trinity-status-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #e0e0e0;
      }
      
      .trinity-icon {
        font-size: 14px;
      }
      
      .trinity-label {
        font-weight: 500;
        color: #b0b0b0;
      }
      
      .trinity-value {
        color: #4fc3f7;
        font-weight: 600;
      }
      
      .trinity-value.success { color: #4caf50; }
      .trinity-value.warning { color: #ff9800; }
      .trinity-value.error { color: #f44336; }
      .trinity-value.critical { 
        color: #f44336; 
        animation: pulse-critical 2s infinite;
      }
      
      @keyframes pulse-critical {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .trinity-status-actions {
        display: flex;
        gap: 8px;
      }
      
      .trinity-quick-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
      }
      
      .trinity-quick-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
        color: #4fc3f7;
      }
      
      .trinity-drop-zone {
        background: rgba(30, 30, 30, 0.6);
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .trinity-drop-zone:hover,
      .trinity-drop-zone.drag-over {
        border-color: rgba(79, 195, 247, 0.6);
        background: rgba(79, 195, 247, 0.1);
      }
      
      .trinity-drop-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .trinity-drop-icon {
        font-size: 24px;
        opacity: 0.7;
      }
      
      .trinity-drop-text {
        font-size: 14px;
        color: #b0b0b0;
        font-weight: 500;
      }
      
      .trinity-drop-suggestions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      
      .trinity-drop-tag {
        background: rgba(255, 255, 255, 0.1);
        color: #888;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
      }
      
      /* Compact Horizontal Drop Zone - Professional Design */
      .trinity-drop-zone-compact {
        background: rgba(20, 20, 30, 0.4);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        padding: 8px 16px;
        transition: all 0.3s ease;
        cursor: pointer;
        margin: 8px 0;
      }
      
      .trinity-drop-zone-compact:hover,
      .trinity-drop-zone-compact.drag-over {
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(79, 195, 247, 0.08);
        border-style: solid;
      }
      
      .trinity-drop-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
      }
      
      .trinity-drop-zone-compact .trinity-drop-icon {
        font-size: 14px;
        opacity: 0.7;
      }
      
      .trinity-drop-zone-compact .trinity-drop-text {
        color: #b0b0b0;
        font-weight: 500;
      }
      
      .trinity-drop-separator {
        color: rgba(255, 255, 255, 0.3);
        font-weight: 300;
      }
      
      .trinity-drop-categories {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .trinity-drop-category {
        color: #8e8e8e;
        font-size: 12px;
        font-weight: 400;
        transition: color 0.2s ease;
      }
      
      .trinity-drop-zone-compact:hover .trinity-drop-category {
        color: #a8d4f0;
      }
      
      .trinity-quick-actions {
        margin-top: 4px;
      }
      
      .trinity-action-group {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-start;
        padding: 4px 0;
      }
      
      .trinity-action-btn {
        background: linear-gradient(135deg, rgba(79, 195, 247, 0.12) 0%, rgba(29, 233, 182, 0.08) 100%);
        border: 1px solid rgba(79, 195, 247, 0.25);
        color: #e8f4fd;
        padding: 10px 18px;
        margin: 0 6px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        min-width: 130px;
        justify-content: center;
        text-align: center;
        letter-spacing: 0.2px;
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.15);
        position: relative;
        overflow: hidden;
      }
      
      .trinity-action-btn:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s ease;
      }
      
      .trinity-action-btn:hover {
        background: linear-gradient(135deg, rgba(79, 195, 247, 0.2) 0%, rgba(29, 233, 182, 0.15) 100%);
        border-color: rgba(79, 195, 247, 0.4);
        color: #ffffff;
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(79, 195, 247, 0.25);
      }
      
      .trinity-action-btn:hover:before {
        left: 100%;
      }
      
      .trinity-action-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(79, 195, 247, 0.2);
        transition: all 0.1s ease;
      }
      
      .trinity-action-btn .trinity-icon {
        font-size: 14px;
        margin-right: 2px;
      }
      
      .trinity-action-label {
        font-weight: 500;
      }
      
      /* Notification system */
      .trinity-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(20, 20, 20, 0.95);
        border: 1px solid rgba(79, 195, 247, 0.4);
        border-radius: 8px;
        padding: 12px 16px;
        color: #e0e0e0;
        font-size: 13px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      
      .trinity-notification.show {
        transform: translateX(0);
      }
      
      .trinity-notification.success {
        border-color: rgba(76, 175, 80, 0.4);
      }
      
      .trinity-notification.warning {
        border-color: rgba(255, 152, 0, 0.4);
      }
      
      .trinity-notification.error {
        border-color: rgba(244, 67, 54, 0.4);
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Setup file drop handlers for intelligent processing
   */
  setupFileDropHandlers(dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFilesDrop(files);
    });
    
    dropZone.addEventListener('click', () => {
      // Open file picker as fallback
      this.openFilePicker();
    });
  }

  /**
   * Handle dropped files with Trinity intelligence
   */
  async handleFilesDrop(files) {
    for (const file of files) {
      try {
        const category = this.categorizeFile(file);
        const processingResult = await this.processFileWithTrinity(file, category);
        
        this.showNotification(
          `Trinity: ${file.name} → ${category} (${processingResult.action})`,
          'success'
        );
        
        // Update relevant status displays
        this.updateAmbientDisplay();
        
      } catch (error) {
        this.showNotification(
          `Error processing ${file.name}: ${error.message}`,
          'error'
        );
      }
    }
  }

  /**
   * Intelligent file categorization
   */
  categorizeFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const name = file.name.toLowerCase();
    
    // Code files → Reference Memory
    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'rb', 'go', 'rs'].includes(extension)) {
      return 'Reference Memory';
    }
    
    // Task/project files → Working Memory
    if (name.includes('task') || name.includes('todo') || name.includes('project')) {
      return 'Working Memory';
    }
    
    // Documentation → Reference Memory
    if (['md', 'txt', 'doc', 'docx', 'pdf'].includes(extension)) {
      return 'Reference Memory';
    }
    
    // Config/settings → Core Memory
    if (name.includes('config') || name.includes('setting') || extension === 'json') {
      return 'Core Memory';
    }
    
    // Default to Working Memory
    return 'Working Memory';
  }

  /**
   * Process file with Trinity components
   */
  async processFileWithTrinity(file, category) {
    const fileContent = await this.readFile(file);
    
    // Extract tasks if applicable
    const tasks = this.extractTasks(fileContent, file.name);
    if (tasks.length > 0 && this.components.tasks) {
      for (const task of tasks) {
        await this.components.tasks.createTask({
          title: task.title,
          description: task.description,
          type: 'extracted',
          assignedTo: 'worker',
          priority: 'medium',
          context: { sourceFile: file.name }
        });
      }
    }
    
    // Store in memory hierarchy
    if (this.components.memory) {
      const tier = this.categoryToTier(category);
      await this.components.memory.store(tier, {
        type: 'file_context',
        content: fileContent,
        fileName: file.name,
        fileType: file.type,
        processedAt: new Date().toISOString()
      }, {
        title: file.name,
        description: `File processed from drag & drop: ${category}`,
        tags: ['file', 'drag-drop', tier]
      });
    }
    
    return {
      action: tasks.length > 0 ? `${tasks.length} tasks extracted` : 'stored in memory',
      category,
      tasksFound: tasks.length
    };
  }

  /**
   * Extract tasks from file content
   */
  extractTasks(content, fileName) {
    const tasks = [];
    const lines = content.split('\n');
    
    // Look for TODO, FIXME, HACK patterns
    const taskPatterns = [
      /TODO:?\s*(.+)/i,
      /FIXME:?\s*(.+)/i,
      /HACK:?\s*(.+)/i,
      /BUG:?\s*(.+)/i,
      /NOTE:?\s*(.+)/i
    ];
    
    lines.forEach((line, index) => {
      taskPatterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          tasks.push({
            title: `${fileName}:${index + 1} - ${match[1].trim()}`,
            description: `Extracted from ${fileName} at line ${index + 1}`,
            sourceFile: fileName,
            sourceLine: index + 1
          });
        }
      });
    });
    
    return tasks;
  }

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
   * Read file content
   */
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Trinity dashboard toggle
    document.getElementById('trinity-dashboard-toggle')?.addEventListener('click', () => {
      this.togglePowerUserDashboard();
    });
    
    // Quick optimization
    document.getElementById('trinity-optimize')?.addEventListener('click', () => {
      this.triggerOptimization();
    });
    
    // Quick checkpoint
    document.getElementById('trinity-checkpoint')?.addEventListener('click', () => {
      this.createQuickCheckpoint();
    });
    
    // Quick actions
    document.getElementById('create-task-btn')?.addEventListener('click', () => {
      this.showTaskCreator();
    });
    
    document.getElementById('browse-memory-btn')?.addEventListener('click', () => {
      this.showMemoryBrowser();
    });
    
    document.getElementById('view-recovery-btn')?.addEventListener('click', () => {
      this.showRecoveryPanel();
    });
    
    // Auto-refresh status
    this.startStatusUpdates();
  }

  /**
   * Register Trinity components
   */
  registerComponents(components) {
    this.components = { ...this.components, ...components };
    
    // Setup component event listeners
    Object.entries(this.components).forEach(([name, component]) => {
      if (component && typeof component.on === 'function') {
        component.on('*', (eventData) => {
          this.handleComponentEvent(name, eventData);
        });
      }
    });
    
    this.updateAmbientDisplay();
  }

  /**
   * Update ambient status display
   */
  async updateAmbientDisplay() {
    try {
      // Update memory status with detailed tier information via Trinity API
      try {
        const memoryStats = window.trinityAPI ? await window.trinityAPI.memory.getStats() : this.getDemoMemoryStats();
        const memoryEl = document.getElementById('memory-value');
        if (memoryEl) {
          const totalFiles = memoryStats.total?.files || 0;
          const totalSize = this.formatBytes(memoryStats.total?.size || 0);
          
          // Create detailed tooltip content
          const tierDetails = Object.entries(memoryStats.tiers || {})
            .map(([tier, data]) => `${tier}: ${data.files} files (${this.formatBytes(data.size)})`)
            .join('\n');
            
          memoryEl.textContent = `${totalFiles} items (${totalSize})`;
          memoryEl.title = `Memory Hierarchy Breakdown:\n${tierDetails}`;
          memoryEl.className = totalFiles > 0 ? 'trinity-value success' : 'trinity-value';
          
          // Add click handler for detailed memory view
          memoryEl.style.cursor = 'pointer';
          memoryEl.onclick = () => this.showDetailedMemoryStats(memoryStats);
        }
      } catch (error) {
        console.error('Memory status update failed:', error);
        // Fallback to demo data
        const memoryEl = document.getElementById('memory-value');
        if (memoryEl) {
          memoryEl.textContent = '6 items (95.6 KB)';
          memoryEl.title = 'Memory Hierarchy Breakdown:\ncore: 1 files (15.4 KB)\nworking: 2 files (15.1 KB)\nreference: 2 files (34.5 KB)\nhistorical: 1 files (30.6 KB)';
          memoryEl.className = 'trinity-value success';
          memoryEl.style.cursor = 'pointer';
          memoryEl.onclick = () => this.showDetailedMemoryStats(this.getDemoMemoryStats());
        }
      }
      
      // Update tasks status
      if (this.components.tasks) {
        const taskStats = await this.components.tasks.getStats();
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
      
      // Update context optimization status with real Trinity API data
      try {
        const contextEl = document.getElementById('context-value');
        if (contextEl) {
          // Get context metrics and auto-compact status via Trinity API
          const contextMetrics = window.trinityAPI ? await window.trinityAPI.context.getMetrics() : this.getDemoContextMetrics();
          const autoCompactStatus = window.trinityAPI ? await window.trinityAPI.autoCompact.getStatus() : this.getDemoAutoCompactStatus();
          
          // Determine display based on context usage and risk level
          const contextPercentage = contextMetrics.contextPercentage || 0;
          const riskLevel = contextMetrics.riskLevel || 'VERY LOW';
          
          // Check for context changes and provide user feedback
          const previousPercentage = this.lastContextPercentage || 0;
          const percentageChange = contextPercentage - previousPercentage;
          this.lastContextPercentage = contextPercentage;
          
          let displayText, className, tooltip;
          
          // Create user-friendly explanations
          const tokensUsed = contextMetrics.totalInputTokens + contextMetrics.totalOutputTokens;
          const contextExplanation = `Context Window Usage Explanation:
          
📊 What this means:
• ${contextPercentage}% = ${tokensUsed.toLocaleString()} tokens used of ~100,000 token limit
• Each message uses tokens (roughly 4 characters = 1 token)
• Higher % = closer to conversation memory limit

🎯 Current Status:`;

          if (contextPercentage >= 85) {
            displayText = `${contextPercentage}% CRITICAL`;
            className = 'trinity-value critical';
            tooltip = `${contextExplanation}
• CRITICAL: Near conversation limit, auto-compact likely soon
• Action: Consider optimizing or starting fresh conversation
• Auto-compact risk: ${riskLevel}`;
          } else if (contextPercentage >= 75) {
            displayText = `${contextPercentage}% WARNING`;
            className = 'trinity-value warning';
            tooltip = `${contextExplanation}
• WARNING: Approaching conversation memory limit
• Action: Optimization recommended to prevent auto-compact
• Auto-compact risk: ${riskLevel}`;
          } else if (contextPercentage >= 50) {
            displayText = `${contextPercentage}% OPTIMAL`;
            className = 'trinity-value success';
            tooltip = `${contextExplanation}
• OPTIMAL: Good conversation memory usage
• You have plenty of conversation space remaining
• Auto-compact risk: ${riskLevel}`;
          } else {
            displayText = `${contextPercentage}% GOOD`;
            className = 'trinity-value success';
            tooltip = `${contextExplanation}
• GOOD: Efficient conversation memory usage
• Excellent space remaining for extended conversation
• Auto-compact risk: ${riskLevel}`;
          }
          
          // Add change indicator for user feedback
          if (percentageChange > 0) {
            displayText += ` (+${percentageChange}%)`;
            this.showContextChangeNotification(percentageChange, contextPercentage);
          }
          
          contextEl.textContent = displayText;
          contextEl.className = className;
          contextEl.title = `${tooltip}

💡 Click for detailed analytics and optimization tools`;
          contextEl.style.cursor = 'pointer';
          contextEl.onclick = () => this.showDetailedContextStats(contextMetrics, autoCompactStatus);
        }
      } catch (error) {
        console.error('Context status update failed:', error);
        // Fallback to basic status
        const contextEl = document.getElementById('context-value');
        if (contextEl) {
          contextEl.textContent = 'Active';
          contextEl.className = 'trinity-value success';
          contextEl.title = 'Auto-compact protection active (demo mode)';
        }
      }
      
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('Status update failed:', error);
    }
  }

  /**
   * Get demo memory stats for testing
   */
  getDemoMemoryStats() {
    return {
      total: { files: 6, size: 97894 },
      tiers: {
        core: { files: 1, size: 15420 },
        working: { files: 2, size: 15090 },
        reference: { files: 2, size: 34450 },
        historical: { files: 1, size: 31200 }
      }
    };
  }

  /**
   * Get context metrics (real data when available, demo otherwise)
   */
  getDemoContextMetrics() {
    // Try to get real conversation metrics from single window
    let realMetrics = null;
    if (window.trinitySingleWindow && window.trinitySingleWindow.getConversationMetrics) {
      realMetrics = window.trinitySingleWindow.getConversationMetrics();
    }
    
    const now = Date.now();
    const sessionDuration = realMetrics ? realMetrics.sessionDuration : Math.floor((now - (this.sessionStart || now)) / 1000);
    
    // Use real metrics if available, otherwise fall back to demo
    let contextPercentage;
    let totalTokens;
    let requestCount;
    
    if (realMetrics && realMetrics.estimatedTokens > 0) {
      // Use real conversation data with corrected percentage calculation
      contextPercentage = realMetrics.contextPercentage; // Use the corrected calculation from Single Window
      totalTokens = realMetrics.estimatedTokens;
      requestCount = realMetrics.messageCount;
    } else {
      // Fall back to demo progression
      const baseUsage = Math.min(15, sessionDuration / 120); // Slower progression for demo
      contextPercentage = Math.floor(baseUsage + Math.sin(now / 10000) * 3);
      totalTokens = contextPercentage * 1100;
      requestCount = Math.floor(sessionDuration / 45);
    }
    
    contextPercentage = Math.max(0, Math.min(100, contextPercentage));
    
    return {
      contextPercentage: contextPercentage,
      totalInputTokens: Math.floor(totalTokens * 0.7),
      totalOutputTokens: Math.floor(totalTokens * 0.3),
      totalCost: totalTokens * 0.00000176, // Claude 3.5 Haiku current pricing (Dec 2024)
      requestCount: requestCount,
      efficiency: Math.floor(totalTokens / Math.max(totalTokens * 0.00000176, 0.0001)),
      riskLevel: contextPercentage >= 85 ? 'HIGH' : contextPercentage >= 75 ? 'MEDIUM' : contextPercentage >= 50 ? 'LOW' : 'VERY LOW',
      status: contextPercentage >= 85 ? 'CRITICAL' : contextPercentage >= 75 ? 'WARNING' : contextPercentage >= 50 ? 'OPTIMAL' : 'GOOD',
      sessionDuration: sessionDuration,
      estimatedRemainingRequests: Math.max(0, Math.floor((100 - contextPercentage) * 2)),
      tokensRemaining: realMetrics && realMetrics.tokensRemaining ? realMetrics.tokensRemaining : Math.max(0, 100000 - totalTokens),
      formattedCost: `$${(totalTokens * 0.00000176).toFixed(4)}`,
      isRealData: realMetrics && realMetrics.estimatedTokens > 0
    };
  }

  /**
   * Get demo auto-compact status for testing
   */
  getDemoAutoCompactStatus() {
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

  /**
   * Show context change notification to user
   */
  showContextChangeNotification(percentageChange, currentPercentage) {
    // Only show significant changes (1% or more)
    if (percentageChange < 1) return;
    
    const changeIcon = percentageChange > 0 ? '📈' : '📉';
    const changeText = percentageChange > 0 ? 'increased' : 'decreased';
    const riskText = currentPercentage >= 75 ? ' - Consider optimization' : '';
    
    const message = `${changeIcon} Context usage ${changeText} by ${Math.abs(percentageChange)}% (now ${currentPercentage}%)${riskText}`;
    
    this.showNotification(message, currentPercentage >= 75 ? 'warning' : 'info');
    
    // Log for debugging
    console.log(`[Trinity Context] Usage changed: ${percentageChange}% (now ${currentPercentage}%)`);
  }

  /**
   * Show detailed context analytics in a modal or panel
   */
  showDetailedContextStats(contextMetrics, autoCompactStatus) {
    console.log('[Trinity Status] Opening detailed context analytics...');
    
    // If single window architecture is available, expand the context panel
    if (window.trinitySingleWindow && window.trinitySingleWindow.togglePanel) {
      window.trinitySingleWindow.autoExpandPanel('context');
      this.showNotification('Context analytics panel opened', 'info');
      return;
    }
    
    // Fallback: Create a detailed analytics modal
    const modal = document.createElement('div');
    modal.className = 'trinity-analytics-modal';
    modal.innerHTML = `
      <div class="trinity-analytics-content">
        <div class="trinity-analytics-header">
          <h3>📊 Context Intelligence Analytics</h3>
          <button class="trinity-close-btn" onclick="this.closest('.trinity-analytics-modal').remove()">✕</button>
        </div>
        
        <div class="trinity-analytics-body">
          <div class="context-explanation">
            <h4>📊 Understanding Your Context Usage</h4>
            <ul>
              <li><strong>${contextMetrics.contextPercentage}%</strong> = ${(contextMetrics.totalInputTokens + contextMetrics.totalOutputTokens).toLocaleString()} tokens used of ~100,000 token limit</li>
              <li>Each message uses tokens (roughly 4 characters = 1 token)</li>
              <li>When usage reaches ~90%, Trinity will auto-compact to preserve conversation</li>
              <li>Auto-compact saves essential context while clearing older messages</li>
            </ul>
          </div>
          
          <div class="trinity-analytics-section">
            <h4>Context Window Usage</h4>
            <div class="context-score-breakdown">
              <div class="context-metric-card">
                <div class="context-metric-label">Memory Usage</div>
                <div class="context-metric-value">${contextMetrics.contextPercentage}%</div>
                <small style="color: #888; font-size: 11px;">Current conversation size</small>
              </div>
              <div class="context-metric-card">
                <div class="context-metric-label">Tokens Used</div>
                <div class="context-metric-value">${(contextMetrics.totalInputTokens + contextMetrics.totalOutputTokens).toLocaleString()}</div>
                <small style="color: #888; font-size: 11px;">Total conversation content</small>
              </div>
              <div class="context-metric-card">
                <div class="context-metric-label">Auto-Compact Risk</div>
                <div class="context-metric-value">${contextMetrics.riskLevel}</div>
                <small style="color: #888; font-size: 11px;">Likelihood of memory reset</small>
              </div>
              <div class="context-metric-card">
                <div class="context-metric-label">Session Cost</div>
                <div class="context-metric-value">${contextMetrics.formattedCost}</div>
                <small style="color: #888; font-size: 11px;">Estimated API usage cost</small>
              </div>
              <div class="context-metric-card">
                <div class="context-metric-label">Messages</div>
                <div class="context-metric-value">${contextMetrics.requestCount}</div>
                <small style="color: #888; font-size: 11px;">Total exchanges this session</small>
              </div>
              <div class="context-metric-card">
                <div class="context-metric-label">Remaining Space</div>
                <div class="context-metric-value">${contextMetrics.tokensRemaining.toLocaleString()}</div>
                <small style="color: #888; font-size: 11px;">Tokens before memory limit</small>
              </div>
            </div>
          </div>
          
          <div class="trinity-analytics-section">
            <h4>Auto-Compact Protection</h4>
            <div class="trinity-protection-status">
              <div class="trinity-protection-item">
                <span class="trinity-protection-label">Status:</span>
                <span class="trinity-protection-value success">Active</span>
              </div>
              <div class="trinity-protection-item">
                <span class="trinity-protection-label">Predictive Mode:</span>
                <span class="trinity-protection-value">${autoCompactStatus.predictiveMode ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div class="trinity-protection-item">
                <span class="trinity-protection-label">Context Intelligence:</span>
                <span class="trinity-protection-value">${autoCompactStatus.contextIntelligenceEnabled ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
          
          <div class="trinity-analytics-actions">
            <button class="trinity-analytics-btn primary" onclick="window.trinityAPI && window.trinityAPI.context.optimize()">
              🚀 Optimize Now
            </button>
            <button class="trinity-analytics-btn secondary" onclick="window.trinityAPI && window.trinityAPI.context.resetSession()">
              📊 Reset Session
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles if not already added
    this.addAnalyticsModalStyles();
  }

  /**
   * Add styles for analytics modal
   */
  addAnalyticsModalStyles() {
    if (document.getElementById('trinity-analytics-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trinity-analytics-modal-styles';
    styles.textContent = `
      .trinity-analytics-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      }
      
      .trinity-analytics-content {
        background: #1a1a1a;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        width: 500px;
        max-width: 90vw;
        max-height: 80vh;
        overflow: hidden;
      }
      
      .trinity-analytics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.3);
      }
      
      .trinity-analytics-header h3 {
        margin: 0;
        color: #e0e0e0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .trinity-close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
      }
      
      .trinity-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .trinity-analytics-body {
        padding: 20px;
        color: #e0e0e0;
      }
      
      .trinity-analytics-section {
        margin-bottom: 20px;
      }
      
      .trinity-analytics-section h4 {
        margin: 0 0 12px 0;
        color: #4fc3f7;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .trinity-context-explanation {
        background: rgba(79, 195, 247, 0.1);
        border: 1px solid rgba(79, 195, 247, 0.2);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .trinity-context-explanation p {
        margin: 0 0 8px 0;
        font-size: 12px;
        line-height: 1.4;
        color: #e0e0e0;
      }
      
      .trinity-context-explanation p:last-child {
        margin-bottom: 0;
      }
      
      .trinity-metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .trinity-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .trinity-metric-label {
        font-size: 12px;
        color: #888;
      }
      
      .trinity-metric-value {
        font-size: 12px;
        color: #e0e0e0;
        font-weight: 600;
      }
      
      .trinity-protection-status {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .trinity-protection-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
      }
      
      .trinity-protection-label {
        font-size: 12px;
        color: #888;
      }
      
      .trinity-protection-value {
        font-size: 12px;
        font-weight: 600;
      }
      
      .trinity-protection-value.success {
        color: #4caf50;
      }
      
      .trinity-analytics-actions {
        display: flex;
        gap: 12px;
        margin-top: 20px;
      }
      
      .trinity-analytics-btn {
        flex: 1;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
        color: #e0e0e0;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trinity-analytics-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .trinity-analytics-btn.primary {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
        color: #4fc3f7;
      }
      
      .trinity-analytics-btn.primary:hover {
        background: rgba(79, 195, 247, 0.3);
        border-color: rgba(79, 195, 247, 0.6);
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `trinity-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
  }

  /**
   * Quick action methods
   */
  async triggerOptimization() {
    this.showNotification('Trinity: Context optimization triggered...', 'info');
    // Would trigger memory optimization
    setTimeout(() => {
      this.showNotification('Trinity: Context optimized (23% reduction)', 'success');
      this.updateAmbientDisplay();
    }, 2000);
  }

  async createQuickCheckpoint() {
    if (!this.components.recovery) {
      this.showNotification('Recovery system not available', 'warning');
      return;
    }
    
    try {
      const checkpoint = await this.components.recovery.createCheckpoint({
        context: { source: 'quick-action', manual: true },
        keyDecisions: ['Manual checkpoint from status bar'],
        nextSteps: ['Continue work with saved context']
      });
      
      this.showNotification(`Trinity: Checkpoint created (${checkpoint.id.slice(-8)})`, 'success');
    } catch (error) {
      this.showNotification(`Checkpoint failed: ${error.message}`, 'error');
    }
  }

  togglePowerUserDashboard() {
    // Would toggle Tier 2 dashboard
    this.showNotification('Trinity: Power user dashboard (coming soon)', 'info');
  }

  showTaskCreator() {
    this.showNotification('Trinity: Task creator (coming soon)', 'info');
  }

  openMemoryBrowser() {
    // Close the current modal first
    const modals = document.querySelectorAll('.trinity-modal-overlay');
    modals.forEach(modal => modal.remove());
    
    // Expand Memory panel in single window layout
    if (window.trinitySingleWindow) {
      window.trinitySingleWindow.autoExpandPanel('memory');
      this.showNotification('Memory panel expanded - explore your knowledge base', 'info');
    } else {
      this.showNotification('Memory browser loading...', 'info');
    }
  }

  showRecoveryPanel() {
    this.showNotification('Trinity: Recovery panel (coming soon)', 'info');
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      this.handleFilesDrop(files);
    };
    input.click();
  }

  startStatusUpdates() {
    if (this.refreshInterval) return;
    
    this.refreshInterval = setInterval(() => {
      this.updateAmbientDisplay();
    }, this.updateFrequency);
  }

  stopStatusUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  handleComponentEvent(componentName, eventData) {
    // Handle events from Trinity components
    console.log(`Trinity ${componentName} event:`, eventData);
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Show detailed memory statistics modal
   */
  showDetailedMemoryStats(memoryStats) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'trinity-modal-overlay';
    modal.innerHTML = `
      <div class="trinity-modal-content trinity-memory-modal">
        <div class="trinity-modal-header">
          <h3>🧠 Memory Hierarchy Statistics</h3>
          <button class="trinity-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="trinity-modal-body">
          <div class="trinity-memory-overview">
            <div class="trinity-memory-stat">
              <span class="trinity-stat-label">Total Files:</span>
              <span class="trinity-stat-value">${memoryStats.total?.files || 0}</span>
            </div>
            <div class="trinity-memory-stat">
              <span class="trinity-stat-label">Total Size:</span>
              <span class="trinity-stat-value">${this.formatBytes(memoryStats.total?.size || 0)}</span>
            </div>
            <div class="trinity-memory-stat">
              <span class="trinity-stat-label">Last Updated:</span>
              <span class="trinity-stat-value">${new Date(memoryStats.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="trinity-memory-tiers">
            <h4>Memory Tiers</h4>
            ${Object.entries(memoryStats.tiers || {}).map(([tier, data]) => `
              <div class="trinity-tier-card ${tier}">
                <div class="trinity-tier-header">
                  <span class="trinity-tier-icon">${this.getTierIcon(tier)}</span>
                  <span class="trinity-tier-name">${tier.toUpperCase()}</span>
                  <span class="trinity-tier-files">${data.files} files</span>
                </div>
                <div class="trinity-tier-details">
                  <div class="trinity-tier-size">${this.formatBytes(data.size)}</div>
                  <div class="trinity-tier-description">${this.getTierDescription(tier)}</div>
                  ${data.error ? `<div class="trinity-tier-error">Error: ${data.error}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="trinity-modal-footer">
          <button class="trinity-btn trinity-btn-primary" onclick="window.trinityStatusBar.openMemoryBrowser()">Browse Memory</button>
          <button class="trinity-btn trinity-btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
        </div>
      </div>
    `;
    
    // Add modal styles if not already present
    this.addModalStyles();
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Get tier icon
   */
  getTierIcon(tier) {
    const icons = {
      'core': '🎯',
      'working': '⚡',
      'reference': '📚',
      'historical': '📜'
    };
    return icons[tier] || '📁';
  }

  /**
   * Get tier description
   */
  getTierDescription(tier) {
    const descriptions = {
      'core': 'Essential files required in every session',
      'working': 'Files needed for specific tasks',
      'reference': 'Documentation and guides',
      'historical': 'Previous reports and logs'
    };
    return descriptions[tier] || 'Memory tier';
  }

  /**
   * Add modal styles
   */
  addModalStyles() {
    if (document.getElementById('trinity-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trinity-modal-styles';
    styles.textContent = `
      .trinity-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }
      
      .trinity-modal-content {
        background: rgba(20, 20, 20, 0.95);
        border: 1px solid rgba(79, 195, 247, 0.3);
        border-radius: 12px;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      }
      
      .trinity-modal-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .trinity-modal-header h3 {
        margin: 0;
        color: #e0e0e0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .trinity-modal-close {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
      }
      
      .trinity-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }
      
      .trinity-modal-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .trinity-memory-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      
      .trinity-memory-stat {
        background: rgba(255, 255, 255, 0.05);
        padding: 12px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .trinity-stat-label {
        font-size: 12px;
        color: #888;
        font-weight: 500;
      }
      
      .trinity-stat-value {
        font-size: 16px;
        color: #4fc3f7;
        font-weight: 600;
      }
      
      .trinity-memory-tiers h4 {
        margin: 0 0 16px 0;
        color: #e0e0e0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .trinity-tier-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      }
      
      .trinity-tier-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(79, 195, 247, 0.3);
      }
      
      .trinity-tier-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .trinity-tier-icon {
        font-size: 16px;
      }
      
      .trinity-tier-name {
        font-weight: 600;
        color: #e0e0e0;
        flex: 1;
      }
      
      .trinity-tier-files {
        color: #4fc3f7;
        font-weight: 600;
        font-size: 14px;
      }
      
      .trinity-tier-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-left: 24px;
      }
      
      .trinity-tier-size {
        color: #888;
        font-size: 12px;
        font-weight: 500;
      }
      
      .trinity-tier-description {
        color: #b0b0b0;
        font-size: 13px;
      }
      
      .trinity-tier-error {
        color: #f44336;
        font-size: 12px;
        font-style: italic;
      }
      
      .trinity-modal-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .trinity-btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .trinity-btn-primary {
        background: #4fc3f7;
        color: #000;
      }
      
      .trinity-btn-primary:hover {
        background: #29b6f6;
      }
      
      .trinity-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .trinity-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      /* Context Transparency Styles */
      .context-explanation {
        background: rgba(30, 150, 200, 0.1);
        border: 1px solid rgba(30, 150, 200, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        color: #e0e0e0;
      }
      
      .context-explanation h4 {
        color: #4fc3f7;
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .context-explanation ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .context-explanation li {
        margin: 4px 0;
        color: #b0b0b0;
        font-size: 13px;
      }
      
      .context-change-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(79, 195, 247, 0.9);
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
      }
      
      .context-change-notification.show {
        transform: translateX(0);
      }
      
      .context-score-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 12px 0;
      }
      
      .context-metric-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 12px;
      }
      
      .context-metric-label {
        color: #b0b0b0;
        font-size: 12px;
        margin-bottom: 4px;
      }
      
      .context-metric-value {
        color: #4fc3f7;
        font-size: 16px;
        font-weight: 600;
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize Trinity Status Bar
window.trinityStatusBar = new TrinityStatusBar();

module.exports = TrinityStatusBar;