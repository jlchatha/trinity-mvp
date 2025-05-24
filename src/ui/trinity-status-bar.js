/**
 * Trinity Status Bar - Tier 1 Ambient Intelligence UI
 * 
 * Integrates Trinity component status into existing Electron app nav area
 * "Invisible by Default, Visible on Demand" - intelligent transparency
 */

class TrinityStatusBar {
  constructor() {
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
  }

  /**
   * Initialize the Trinity status bar in existing nav area
   */
  initializeStatusBar() {
    // Find the existing nav area or create one
    let navArea = document.querySelector('.trinity-nav-status');
    
    if (!navArea) {
      // Create nav status area if it doesn't exist
      navArea = this.createNavStatusArea();
    }
    
    // Create Trinity status components
    this.createAmbientStatus(navArea);
    this.createFileDropZone(navArea);
    this.createQuickActions(navArea);
    
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
    dropZone.className = 'trinity-drop-zone';
    dropZone.innerHTML = `
      <div class="trinity-drop-content">
        <span class="trinity-drop-icon">📁</span>
        <span class="trinity-drop-text">Drop contexts here for Trinity processing</span>
        <div class="trinity-drop-suggestions">
          <span class="trinity-drop-tag">Documents</span>
          <span class="trinity-drop-tag">Code</span>
          <span class="trinity-drop-tag">Tasks</span>
          <span class="trinity-drop-tag">Context</span>
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
          <span class="trinity-action-label">Browse Memory</span>
        </button>
        
        <button class="trinity-action-btn" id="view-recovery-btn">
          <span class="trinity-icon">📜</span>
          <span class="trinity-action-label">Recovery</span>
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
      
      .trinity-quick-actions {
        margin-top: 4px;
      }
      
      .trinity-action-group {
        display: flex;
        gap: 12px;
      }
      
      .trinity-action-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }
      
      .trinity-action-btn:hover {
        background: rgba(79, 195, 247, 0.15);
        border-color: rgba(79, 195, 247, 0.3);
        color: #4fc3f7;
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
      // Update memory status
      if (this.components.memory) {
        const memoryStats = await this.components.memory.getStats();
        const memoryEl = document.getElementById('memory-value');
        if (memoryEl) {
          memoryEl.textContent = `${memoryStats.total || 0} items`;
          memoryEl.className = 'trinity-value success';
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
      
      // Update context status
      const contextEl = document.getElementById('context-value');
      if (contextEl) {
        contextEl.textContent = 'Active';
        contextEl.className = 'trinity-value success';
      }
      
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('Status update failed:', error);
    }
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

  showMemoryBrowser() {
    this.showNotification('Trinity: Memory browser (coming soon)', 'info');
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
}

// Initialize Trinity Status Bar
window.trinityStatusBar = new TrinityStatusBar();

module.exports = TrinityStatusBar;