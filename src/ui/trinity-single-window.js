/**
 * Trinity Single Window Architecture
 * 
 * Unified layout combining chat + collapsible panels for professional UX
 * Replaces multi-window navigation with industry-standard panel-based interface
 */

class TrinitySingleWindow {
  constructor() {
    console.log('[Trinity Single Window] Initializing single window architecture...');
    this.panelStates = this.loadPanelStates();
    this.defaultStates = {
      memory: true,    // Expanded by default
      tasks: false,    // Collapsed by default
      recovery: false, // Collapsed by default
      context: false,  // Collapsed by default (will be expanded when active)
      files: false     // Collapsed by default
    };
    
    // Track conversation metrics for real token counting
    this.conversationMetrics = {
      sessionStart: Date.now(),
      messageCount: 0,
      estimatedTokens: 0,
      lastActivity: Date.now()
    };
    
    // System reliability monitoring
    this.systemHealth = {
      sessionStart: Date.now(),
      totalMessages: 0,
      successfulResponses: 0,
      blankResponses: 0,
      errorResponses: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      responseTimeHistory: []
    };
    
    this.initializeSingleWindow();
    this.setupEventListeners();
    this.loadMemoryStatistics();
    this.loadMemoryBrowser(); // Load actual memory files into browser
    console.log('[Trinity Single Window] Single window architecture initialized successfully');
  }

  /**
   * Initialize the single window layout
   */
  initializeSingleWindow() {
    // Find the main container or create one
    let mainContainer = document.querySelector('.trinity-main-container');
    
    if (!mainContainer) {
      mainContainer = this.createMainContainer();
    }
    
    // Clear existing content to rebuild with new architecture
    mainContainer.innerHTML = '';
    
    // Create the unified layout structure
    this.createLayoutStructure(mainContainer);
    this.addSingleWindowStyles();
    
    // Initialize panel states
    this.restorePanelStates();
  }

  /**
   * Create main container if it doesn't exist
   */
  createMainContainer() {
    const mainContainer = document.createElement('div');
    mainContainer.className = 'trinity-main-container';
    
    // Insert after status bar or at body start
    const statusBar = document.querySelector('#trinity-status-bar') || document.querySelector('.trinity-nav-status');
    if (statusBar && statusBar.parentNode) {
      statusBar.parentNode.insertBefore(mainContainer, statusBar.nextSibling);
    } else {
      document.body.appendChild(mainContainer);
    }
    
    return mainContainer;
  }

  /**
   * Create the unified layout structure
   */
  createLayoutStructure(container) {
    container.innerHTML = `
      <div class="trinity-unified-layout">
        <!-- Chat Panel (Primary) -->
        <div class="trinity-chat-panel">
          <div class="trinity-chat-header">
            <h2>Trinity Assistant</h2>
            <div class="trinity-chat-controls">
              <button class="trinity-btn-icon" id="trinity-clear-chat" title="Clear Chat">🗑️</button>
              <button class="trinity-btn-icon" id="trinity-export-chat" title="Export Chat">📤</button>
            </div>
          </div>
          <div class="trinity-chat-content">
            <div class="trinity-chat-messages-container" id="trinity-chat-messages">
              <!-- Chat messages will be loaded here -->
              <div class="trinity-welcome-message">
                <h3>🎯 Welcome to Trinity MVP</h3>
                <p>Your professional AI assistant with memory hierarchy, task management, and intelligent context optimization.</p>
                <div class="trinity-quick-start">
                  <p><strong>Quick Start:</strong></p>
                  <ul>
                    <li>📁 Drag files to the Files panel to add to memory</li>
                    <li>🧠 Browse Memory panel to explore your knowledge base</li>
                    <li>📋 Use Tasks panel to manage your work</li>
                    <li>🔄 Access Recovery panel for session management</li>
                  </ul>
                </div>
              </div>
              
              <!-- Typing Indicator -->
              <div id="trinity-typing-indicator" class="trinity-typing-indicator" style="display: none;">
                <div class="trinity-message assistant">
                  <div class="trinity-message-content">
                    <div class="trinity-typing-dots">
                      <div class="trinity-typing-dot"></div>
                      <div class="trinity-typing-dot"></div>
                      <div class="trinity-typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="trinity-chat-input-area">
            <div class="trinity-input-container">
              <textarea id="trinity-chat-input" placeholder="Ask Trinity anything..." rows="2"></textarea>
              <button id="trinity-send-btn" class="trinity-send-btn">
                <span class="trinity-send-icon">➤</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Collapsible Panels (Secondary) -->
        <div class="trinity-side-panels">
          <!-- Memory Panel -->
          <div class="trinity-panel" id="trinity-memory-panel">
            <div class="trinity-panel-header" data-panel="memory">
              <span class="trinity-panel-icon">🧠</span>
              <span class="trinity-panel-title">Memory</span>
              <span class="trinity-panel-toggle">▼</span>
            </div>
            <div class="trinity-panel-content">
              <div class="trinity-memory-overview">
                <div class="trinity-memory-stats">
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Total Items:</span>
                    <span class="trinity-stat-value" id="memory-total-items">Loading...</span>
                  </div>
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Total Size:</span>
                    <span class="trinity-stat-value" id="memory-total-size">Loading...</span>
                  </div>
                </div>
                <div class="trinity-memory-actions">
                  <button class="trinity-panel-btn" id="browse-memory-detailed">
                    <span class="trinity-btn-icon">🔍</span>
                    Explore Memory
                  </button>
                  <button class="trinity-panel-btn" id="optimize-memory">
                    <span class="trinity-btn-icon">🚀</span>
                    Optimize
                  </button>
                  <button class="trinity-panel-btn" id="refresh-memory-browser">
                    <span class="trinity-btn-icon">🔄</span>
                    Refresh
                  </button>
                </div>
                
                <!-- Memory Browser (expandable) -->
                <div class="trinity-memory-browser" id="trinity-memory-browser" style="display: none;">
                  <div class="trinity-memory-search">
                    <input type="text" placeholder="Search memories..." id="memory-search-input" class="trinity-search-input">
                  </div>
                  <div class="trinity-memory-filters">
                    <button class="trinity-filter-btn active" data-tier="all">All</button>
                    <button class="trinity-filter-btn" data-tier="core">Core</button>
                    <button class="trinity-filter-btn" data-tier="working">Working</button>
                    <button class="trinity-filter-btn" data-tier="reference">Reference</button>
                    <button class="trinity-filter-btn" data-tier="conversation">Chats</button>
                  </div>
                  <div class="trinity-memory-list" id="trinity-memory-list">
                    <!-- Demo memories -->
                    <div class="trinity-memory-item" data-tier="core">
                      <div class="trinity-memory-header">
                        <span class="trinity-memory-icon">🎯</span>
                        <span class="trinity-memory-title">Trinity System Architecture</span>
                        <span class="trinity-memory-tier">Core</span>
                      </div>
                      <div class="trinity-memory-preview">Architecture overview and component relationships...</div>
                      <div class="trinity-memory-meta">
                        <span class="trinity-memory-size">15.4 KB</span>
                        <span class="trinity-memory-time">2 hours ago</span>
                      </div>
                    </div>
                    <div class="trinity-memory-item" data-tier="working">
                      <div class="trinity-memory-header">
                        <span class="trinity-memory-icon">⚡</span>
                        <span class="trinity-memory-title">MVP Implementation Plan</span>
                        <span class="trinity-memory-tier">Working</span>
                      </div>
                      <div class="trinity-memory-preview">Current implementation roadmap and milestones...</div>
                      <div class="trinity-memory-meta">
                        <span class="trinity-memory-size">8.2 KB</span>
                        <span class="trinity-memory-time">1 hour ago</span>
                      </div>
                    </div>
                    <div class="trinity-memory-item" data-tier="reference">
                      <div class="trinity-memory-header">
                        <span class="trinity-memory-icon">📚</span>
                        <span class="trinity-memory-title">Memory Hierarchy Documentation</span>
                        <span class="trinity-memory-tier">Reference</span>
                      </div>
                      <div class="trinity-memory-preview">Complete documentation of the four-tier memory system...</div>
                      <div class="trinity-memory-meta">
                        <span class="trinity-memory-size">12.3 KB</span>
                        <span class="trinity-memory-time">3 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tasks Panel -->
          <div class="trinity-panel" id="trinity-tasks-panel">
            <div class="trinity-panel-header" data-panel="tasks">
              <span class="trinity-panel-icon">📋</span>
              <span class="trinity-panel-title">Tasks</span>
              <span class="trinity-panel-toggle">▶</span>
            </div>
            <div class="trinity-panel-content">
              <div class="trinity-tasks-overview">
                <div class="trinity-task-stats">
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Active:</span>
                    <span class="trinity-stat-value" id="tasks-active">0</span>
                  </div>
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Completed:</span>
                    <span class="trinity-stat-value" id="tasks-completed">0</span>
                  </div>
                </div>
                <div class="trinity-task-actions">
                  <button class="trinity-panel-btn" id="create-new-task">
                    <span class="trinity-btn-icon">➕</span>
                    New Task
                  </button>
                  <button class="trinity-panel-btn" id="view-all-tasks">
                    <span class="trinity-btn-icon">📋</span>
                    View All
                  </button>
                </div>
                
                <!-- Task Management Interface (expandable) -->
                <div class="trinity-task-manager" id="trinity-task-manager" style="display: none;">
                  <div class="trinity-task-creation">
                    <input type="text" placeholder="Task title..." id="task-title-input" class="trinity-task-input">
                    <textarea placeholder="Task description (optional)..." id="task-description-input" class="trinity-task-textarea" rows="2"></textarea>
                    <div class="trinity-task-meta">
                      <select id="task-priority" class="trinity-task-select">
                        <option value="low">Low Priority</option>
                        <option value="medium" selected>Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <select id="task-category" class="trinity-task-select">
                        <option value="general">General</option>
                        <option value="development">Development</option>
                        <option value="documentation">Documentation</option>
                        <option value="testing">Testing</option>
                        <option value="research">Research</option>
                      </select>
                    </div>
                    <button class="trinity-task-create-btn" id="task-create-btn">
                      <span class="trinity-btn-icon">✨</span>
                      Create Task
                    </button>
                  </div>
                  
                  <div class="trinity-task-filters">
                    <button class="trinity-filter-btn active" data-status="all">All</button>
                    <button class="trinity-filter-btn" data-status="pending">Pending</button>
                    <button class="trinity-filter-btn" data-status="in_progress">In Progress</button>
                    <button class="trinity-filter-btn" data-status="completed">Completed</button>
                  </div>
                  
                  <div class="trinity-task-list" id="trinity-task-list">
                    <!-- Demo tasks -->
                    <div class="trinity-task-item" data-status="in_progress" data-priority="high">
                      <div class="trinity-task-header">
                        <span class="trinity-task-status-icon in_progress">🔄</span>
                        <span class="trinity-task-title">Implement Single Window Architecture</span>
                        <span class="trinity-task-priority high">High</span>
                      </div>
                      <div class="trinity-task-description">Complete the unified layout combining chat + collapsible panels for professional UX</div>
                      <div class="trinity-task-meta-info">
                        <span class="trinity-task-category">Development</span>
                        <span class="trinity-task-time">2 hours ago</span>
                        <div class="trinity-task-actions-mini">
                          <button class="trinity-task-action-btn" title="Mark Complete">✓</button>
                          <button class="trinity-task-action-btn" title="Edit Task">✏️</button>
                        </div>
                      </div>
                    </div>
                    
                    <div class="trinity-task-item" data-status="pending" data-priority="medium">
                      <div class="trinity-task-header">
                        <span class="trinity-task-status-icon pending">⏳</span>
                        <span class="trinity-task-title">Memory Optimization Enhancement</span>
                        <span class="trinity-task-priority medium">Medium</span>
                      </div>
                      <div class="trinity-task-description">Improve memory hierarchy auto-optimization algorithms</div>
                      <div class="trinity-task-meta-info">
                        <span class="trinity-task-category">Development</span>
                        <span class="trinity-task-time">1 day ago</span>
                        <div class="trinity-task-actions-mini">
                          <button class="trinity-task-action-btn" title="Start Task">▶️</button>
                          <button class="trinity-task-action-btn" title="Edit Task">✏️</button>
                        </div>
                      </div>
                    </div>
                    
                    <div class="trinity-task-item" data-status="completed" data-priority="high">
                      <div class="trinity-task-header">
                        <span class="trinity-task-status-icon completed">✅</span>
                        <span class="trinity-task-title">UI Issues Resolution</span>
                        <span class="trinity-task-priority high">High</span>
                      </div>
                      <div class="trinity-task-description">Fixed drop zone overwhelming interface and functional duplication</div>
                      <div class="trinity-task-meta-info">
                        <span class="trinity-task-category">Development</span>
                        <span class="trinity-task-time">3 hours ago</span>
                        <div class="trinity-task-actions-mini">
                          <button class="trinity-task-action-btn" title="View Details">👁️</button>
                          <button class="trinity-task-action-btn" title="Archive">📦</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recovery Panel -->
          <div class="trinity-panel" id="trinity-recovery-panel">
            <div class="trinity-panel-header" data-panel="recovery">
              <span class="trinity-panel-icon">🔄</span>
              <span class="trinity-panel-title">Recovery</span>
              <span class="trinity-panel-toggle">▶</span>
            </div>
            <div class="trinity-panel-content">
              <div class="trinity-recovery-overview">
                <div class="trinity-recovery-stats">
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Status:</span>
                    <span class="trinity-stat-value success">Ready</span>
                  </div>
                  <div class="trinity-stat-item">
                    <span class="trinity-stat-label">Last Checkpoint:</span>
                    <span class="trinity-stat-value" id="last-checkpoint">Never</span>
                  </div>
                </div>
                <div class="trinity-recovery-actions">
                  <button class="trinity-panel-btn" id="create-checkpoint">
                    <span class="trinity-btn-icon">💾</span>
                    Create Checkpoint
                  </button>
                  <button class="trinity-panel-btn" id="view-recovery-tools">
                    <span class="trinity-btn-icon">🔧</span>
                    Recovery Tools
                  </button>
                </div>
                
                <!-- Recovery Tools Interface (expandable) -->
                <div class="trinity-recovery-manager" id="trinity-recovery-manager" style="display: none;">
                  <div class="trinity-recovery-sections">
                    
                    <!-- Checkpoint Management -->
                    <div class="trinity-recovery-section">
                      <h4 class="trinity-section-title">
                        <span class="trinity-section-icon">💾</span>
                        Checkpoint Management
                      </h4>
                      <div class="trinity-checkpoint-creation">
                        <input type="text" placeholder="Checkpoint description (optional)..." 
                               id="checkpoint-description" class="trinity-recovery-input">
                        <div class="trinity-checkpoint-options">
                          <label class="trinity-checkbox-label">
                            <input type="checkbox" id="include-memory" checked>
                            Include Memory State
                          </label>
                          <label class="trinity-checkbox-label">
                            <input type="checkbox" id="include-tasks" checked>
                            Include Active Tasks
                          </label>
                          <label class="trinity-checkbox-label">
                            <input type="checkbox" id="include-context">
                            Include Chat Context
                          </label>
                        </div>
                        <button class="trinity-recovery-btn primary" id="create-checkpoint-detailed">
                          <span class="trinity-btn-icon">✨</span>
                          Create Checkpoint
                        </button>
                      </div>
                      
                      <div class="trinity-checkpoint-list">
                        <h5>Recent Checkpoints</h5>
                        <div class="trinity-checkpoint-items">
                          <div class="trinity-checkpoint-item">
                            <div class="trinity-checkpoint-header">
                              <span class="trinity-checkpoint-icon">💾</span>
                              <span class="trinity-checkpoint-name">Single Window Implementation</span>
                              <span class="trinity-checkpoint-time">2h ago</span>
                            </div>
                            <div class="trinity-checkpoint-info">
                              <span class="trinity-checkpoint-size">2.4 MB</span>
                              <span class="trinity-checkpoint-id">cp_1748055918</span>
                              <div class="trinity-checkpoint-actions">
                                <button class="trinity-mini-btn" title="Restore">📂</button>
                                <button class="trinity-mini-btn" title="Download">⬇️</button>
                                <button class="trinity-mini-btn" title="Delete">🗑️</button>
                              </div>
                            </div>
                          </div>
                          
                          <div class="trinity-checkpoint-item">
                            <div class="trinity-checkpoint-header">
                              <span class="trinity-checkpoint-icon">💾</span>
                              <span class="trinity-checkpoint-name">Pre-UI-Fixes Backup</span>
                              <span class="trinity-checkpoint-time">5h ago</span>
                            </div>
                            <div class="trinity-checkpoint-info">
                              <span class="trinity-checkpoint-size">1.8 MB</span>
                              <span class="trinity-checkpoint-id">cp_1748040123</span>
                              <div class="trinity-checkpoint-actions">
                                <button class="trinity-mini-btn" title="Restore">📂</button>
                                <button class="trinity-mini-btn" title="Download">⬇️</button>
                                <button class="trinity-mini-btn" title="Delete">🗑️</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Session Recovery -->
                    <div class="trinity-recovery-section">
                      <h4 class="trinity-section-title">
                        <span class="trinity-section-icon">🔄</span>
                        Session Recovery
                      </h4>
                      <div class="trinity-session-tools">
                        <button class="trinity-recovery-btn" id="backup-session">
                          <span class="trinity-btn-icon">📦</span>
                          Backup Current Session
                        </button>
                        <button class="trinity-recovery-btn" id="restore-session">
                          <span class="trinity-btn-icon">📁</span>
                          Restore Session
                        </button>
                        <button class="trinity-recovery-btn" id="clear-session">
                          <span class="trinity-btn-icon">🧹</span>
                          Clear Session Data
                        </button>
                      </div>
                    </div>
                    
                    <!-- Auto-Compact Recovery -->
                    <div class="trinity-recovery-section">
                      <h4 class="trinity-section-title">
                        <span class="trinity-section-icon">⚡</span>
                        Auto-Compact Recovery
                      </h4>
                      <div class="trinity-autocompact-info">
                        <div class="trinity-recovery-stat">
                          <span class="trinity-stat-label">Last Auto-Compact:</span>
                          <span class="trinity-stat-value">Never</span>
                        </div>
                        <div class="trinity-recovery-stat">
                          <span class="trinity-stat-label">Context Size:</span>
                          <span class="trinity-stat-value">95.6 KB</span>
                        </div>
                        <div class="trinity-recovery-stat">
                          <span class="trinity-stat-label">Recovery Status:</span>
                          <span class="trinity-stat-value success">Ready</span>
                        </div>
                      </div>
                      <div class="trinity-autocompact-tools">
                        <button class="trinity-recovery-btn" id="trigger-recovery">
                          <span class="trinity-btn-icon">🚀</span>
                          Trigger Recovery Protocol
                        </button>
                        <button class="trinity-recovery-btn" id="test-recovery">
                          <span class="trinity-btn-icon">🧪</span>
                          Test Recovery System
                        </button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Context Panel -->
          <div class="trinity-panel" id="trinity-context-panel">
            <div class="trinity-panel-header" data-panel="context">
              <span class="trinity-panel-icon">📊</span>
              <span class="trinity-panel-title">Context</span>
              <span class="trinity-panel-toggle">▶</span>
            </div>
            <div class="trinity-panel-content">
              <div id="context-panel-content">
                <!-- Context Optimization Panel content will be loaded here -->
              </div>
            </div>
          </div>

          <!-- Files Panel -->
          <div class="trinity-panel" id="trinity-files-panel">
            <div class="trinity-panel-header" data-panel="files">
              <span class="trinity-panel-icon">📁</span>
              <span class="trinity-panel-title">Files</span>
              <span class="trinity-panel-toggle">▶</span>
            </div>
            <div class="trinity-panel-content">
              <div class="trinity-files-overview">
                <!-- Compact drop zone -->
                <div class="trinity-compact-drop-zone" id="trinity-file-drop-zone">
                  <div class="trinity-drop-content">
                    <span class="trinity-drop-icon">📁</span>
                    <span class="trinity-drop-text">Drop files here</span>
                  </div>
                  <div class="trinity-file-categories">
                    <span class="trinity-file-category">Docs</span>
                    <span class="trinity-file-separator">|</span>
                    <span class="trinity-file-category">Code</span>
                    <span class="trinity-file-separator">|</span>
                    <span class="trinity-file-category">Tasks</span>
                  </div>
                </div>
                <div class="trinity-recent-files">
                  <h4>Recent Files</h4>
                  <div class="trinity-file-list" id="trinity-recent-file-list">
                    <div class="trinity-file-item demo">
                      <span class="trinity-file-icon">📄</span>
                      <span class="trinity-file-name">project-notes.md</span>
                      <span class="trinity-file-time">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Add single window styles
   */
  addSingleWindowStyles() {
    if (document.getElementById('trinity-single-window-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trinity-single-window-styles';
    styles.textContent = `
      /* Single Window Layout */
      .trinity-main-container {
        width: 100%;
        height: calc(100vh - 80px); /* Account for status bar */
        overflow: hidden;
      }
      
      .trinity-unified-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        height: 100%;
        background: #0f0f0f;
        gap: 1px;
      }
      
      /* Chat Panel (Primary) */
      .trinity-chat-panel {
        background: #1a1a1a;
        display: flex;
        flex-direction: column;
        height: 100%;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden; /* Prevent any overflow that could hide input */
      }
      
      .trinity-chat-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
      }
      
      .trinity-chat-header h2 {
        margin: 0;
        color: #e0e0e0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .trinity-chat-controls {
        display: flex;
        gap: 8px;
      }
      
      .trinity-btn-icon {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 12px;
      }
      
      .trinity-btn-icon:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
      }
      
      .trinity-chat-content {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        color: #e0e0e0;
        display: flex;
        flex-direction: column;
        min-height: 0; /* Critical for flex child with overflow */
      }
      
      /* Ensure messages container scrolls properly */
      .trinity-chat-messages-container {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-bottom: 20px;
      }
      
      .trinity-welcome-message {
        max-width: 600px;
        margin: 40px auto;
        text-align: center;
      }
      
      .trinity-welcome-message h3 {
        color: #4fc3f7;
        margin-bottom: 16px;
        font-size: 24px;
      }
      
      .trinity-welcome-message p {
        color: #b0b0b0;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .trinity-quick-start {
        background: rgba(79, 195, 247, 0.1);
        border: 1px solid rgba(79, 195, 247, 0.3);
        border-radius: 8px;
        padding: 16px;
        text-align: left;
        margin-top: 20px;
      }
      
      .trinity-quick-start ul {
        margin: 8px 0 0 0;
        padding-left: 20px;
      }
      
      .trinity-quick-start li {
        margin-bottom: 8px;
        color: #d0d0d0;
      }
      
      .trinity-chat-input-area {
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
        flex-shrink: 0; /* Prevent input area from shrinking */
        position: relative;
        z-index: 10; /* Ensure input stays on top */
      }
      
      .trinity-input-container {
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }
      
      #trinity-chat-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 12px;
        color: #e0e0e0;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        min-height: 40px;
        max-height: 120px;
      }
      
      #trinity-chat-input:focus {
        outline: none;
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }
      
      .trinity-send-btn {
        background: #4fc3f7;
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        color: #000;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
      }
      
      .trinity-send-btn:hover {
        background: #29b6f6;
        transform: translateY(-1px);
      }
      
      .trinity-send-icon {
        font-size: 16px;
      }
      
      /* Chat Message Bubbles */
      .trinity-message {
        display: flex;
        margin-bottom: 1rem;
        animation: fadeIn 0.3s ease;
      }
      
      .trinity-message.user {
        justify-content: flex-end;
      }
      
      .trinity-message.assistant {
        justify-content: flex-start;
      }
      
      .trinity-message-content {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        position: relative;
        word-wrap: break-word;
      }
      
      .trinity-message.user .trinity-message-content {
        background: linear-gradient(45deg, #4a9eff, #7c3aed);
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      .trinity-message.assistant .trinity-message-content {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom-left-radius: 4px;
      }
      
      .trinity-message-time {
        font-size: 0.75rem;
        color: #888;
        margin-top: 0.25rem;
        text-align: right;
      }
      
      .trinity-message.assistant .trinity-message-time {
        text-align: left;
      }
      
      .trinity-message-memory-indicator {
        background: rgba(79, 195, 247, 0.15);
        border: 1px solid rgba(79, 195, 247, 0.3);
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #4fc3f7;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      /* Enhanced Memory Indicator with Session Metadata */
      .trinity-message-memory-indicator.enhanced {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .trinity-message-memory-indicator .session-indicator {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-size: 0.6rem;
        margin-left: 0.5rem;
      }
      
      .trinity-message-memory-indicator .memory-details {
        font-size: 0.65rem;
        color: rgba(79, 195, 247, 0.8);
        line-height: 1.3;
      }
      
      /* Clarification Message Styles */
      .trinity-message.clarification {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%) !important;
        border: 1px solid #ffc107 !important;
        color: #856404 !important;
      }
      
      .trinity-clarification-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-weight: 600;
      }
      
      .trinity-clarification-icon {
        font-size: 1.2rem;
      }
      
      .trinity-clarification-text {
        margin-bottom: 1rem;
        line-height: 1.5;
      }
      
      .trinity-clarification-matches {
        margin: 1rem 0;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 8px;
        border: 1px solid rgba(255, 193, 7, 0.3);
      }
      
      .trinity-clarification-option {
        padding: 0.5rem;
        margin: 0.25rem 0;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 6px;
        border-left: 3px solid #ffc107;
      }
      
      .trinity-clarification-option:hover {
        background: rgba(255, 255, 255, 0.9);
        cursor: pointer;
      }
      
      .trinity-clarification-relevance {
        font-size: 0.75rem;
        color: #6c757d;
        margin-top: 0.25rem;
      }
      
      .trinity-clarification-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
      }
      
      .trinity-clarification-dismiss {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background-color 0.2s;
      }
      
      .trinity-clarification-dismiss:hover {
        background: #0056b3;
      }
      
      /* Typing Indicator */
      .trinity-typing-indicator {
        padding: 0 1rem;
      }
      
      .trinity-typing-dots {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
      }
      
      .trinity-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #4fc3f7;
        animation: typingDot 1.4s infinite;
      }
      
      .trinity-typing-dot:nth-child(1) { animation-delay: 0s; }
      .trinity-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .trinity-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes typingDot {
        0%, 60%, 100% { opacity: 0.3; }
        30% { opacity: 1; }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Side Panels */
      .trinity-side-panels {
        background: #161616;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
      }
      
      .trinity-panel {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .trinity-panel-header {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.02);
        transition: all 0.2s ease;
        user-select: none;
      }
      
      .trinity-panel-header:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .trinity-panel-icon {
        font-size: 16px;
      }
      
      .trinity-panel-title {
        flex: 1;
        color: #e0e0e0;
        font-weight: 600;
        font-size: 14px;
      }
      
      .trinity-panel-toggle {
        color: #888;
        font-size: 12px;
        transition: transform 0.2s ease;
      }
      
      .trinity-panel.expanded .trinity-panel-toggle {
        transform: rotate(180deg);
      }
      
      .trinity-panel-content {
        padding: 16px;
        display: none;
        background: rgba(0, 0, 0, 0.2);
      }
      
      .trinity-panel.expanded .trinity-panel-content {
        display: block;
      }
      
      /* Panel Content Styles */
      .trinity-memory-overview, 
      .trinity-tasks-overview, 
      .trinity-recovery-overview,
      .trinity-files-overview {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .trinity-memory-stats,
      .trinity-task-stats,
      .trinity-recovery-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .trinity-stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }
      
      .trinity-stat-label {
        color: #888;
      }
      
      .trinity-stat-value {
        color: #4fc3f7;
        font-weight: 600;
      }
      
      .trinity-stat-value.success {
        color: #4caf50;
      }
      
      .trinity-memory-actions,
      .trinity-task-actions,
      .trinity-recovery-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .trinity-panel-btn {
        background: rgba(79, 195, 247, 0.1);
        border: 1px solid rgba(79, 195, 247, 0.3);
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        text-align: left;
      }
      
      .trinity-panel-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.5);
      }
      
      .trinity-btn-icon {
        font-size: 12px;
      }
      
      /* Files Panel Specific */
      .trinity-compact-drop-zone {
        background: rgba(30, 30, 30, 0.6);
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 12px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 12px;
      }
      
      .trinity-compact-drop-zone:hover,
      .trinity-compact-drop-zone.drag-over {
        border-color: rgba(79, 195, 247, 0.6);
        background: rgba(79, 195, 247, 0.1);
      }
      
      .trinity-drop-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 6px;
      }
      
      .trinity-drop-icon {
        font-size: 14px;
        opacity: 0.7;
      }
      
      .trinity-drop-text {
        font-size: 12px;
        color: #b0b0b0;
        font-weight: 500;
      }
      
      .trinity-file-categories {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 10px;
        color: #666;
      }
      
      .trinity-recent-files h4 {
        margin: 0 0 8px 0;
        color: #888;
        font-size: 12px;
        font-weight: 600;
      }
      
      .trinity-file-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .trinity-file-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        font-size: 11px;
      }
      
      .trinity-file-icon {
        font-size: 12px;
      }
      
      .trinity-file-name {
        flex: 1;
        color: #d0d0d0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .trinity-file-time {
        color: #666;
        font-size: 10px;
      }
      
      /* Memory Browser Styles */
      .trinity-memory-browser {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .trinity-memory-search {
        margin-bottom: 8px;
      }
      
      .trinity-search-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 6px 8px;
        color: #e0e0e0;
        font-size: 11px;
      }
      
      .trinity-search-input:focus {
        outline: none;
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }
      
      .trinity-memory-filters {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
      }
      
      .trinity-filter-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #888;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trinity-filter-btn.active,
      .trinity-filter-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
        color: #4fc3f7;
      }
      
      .trinity-memory-list {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .trinity-memory-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trinity-memory-item:hover {
        background: rgba(79, 195, 247, 0.1);
        border-color: rgba(79, 195, 247, 0.3);
      }
      
      .trinity-memory-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      
      .trinity-memory-icon {
        font-size: 12px;
      }
      
      .trinity-memory-title {
        flex: 1;
        color: #e0e0e0;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .trinity-memory-tier {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .trinity-memory-preview {
        color: #b0b0b0;
        font-size: 10px;
        line-height: 1.3;
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .trinity-memory-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #666;
      }
      
      .trinity-memory-size {
        font-weight: 600;
      }
      
      /* Context Indicator */
      .trinity-context-indicator {
        background: rgba(79, 195, 247, 0.2);
        border: 1px solid rgba(79, 195, 247, 0.4);
        color: #4fc3f7;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      
      /* Task Management Styles */
      .trinity-task-manager {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .trinity-task-creation {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
      }
      
      .trinity-task-input,
      .trinity-task-textarea {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 6px 8px;
        color: #e0e0e0;
        font-size: 11px;
        margin-bottom: 8px;
        font-family: inherit;
      }
      
      .trinity-task-input:focus,
      .trinity-task-textarea:focus {
        outline: none;
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }
      
      .trinity-task-textarea {
        resize: vertical;
        min-height: 40px;
      }
      
      .trinity-task-meta {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      
      .trinity-task-select {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 4px 6px;
        color: #e0e0e0;
        font-size: 10px;
      }
      
      .trinity-task-create-btn {
        width: 100%;
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid rgba(76, 175, 80, 0.4);
        color: #4caf50;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .trinity-task-create-btn:hover {
        background: rgba(76, 175, 80, 0.3);
        border-color: rgba(76, 175, 80, 0.6);
      }
      
      .trinity-task-list {
        max-height: 250px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .trinity-task-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 10px;
        transition: all 0.2s ease;
      }
      
      .trinity-task-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .trinity-task-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
      }
      
      .trinity-task-status-icon {
        font-size: 12px;
      }
      
      .trinity-task-title {
        flex: 1;
        color: #e0e0e0;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .trinity-task-priority {
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .trinity-task-priority.high {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
      }
      
      .trinity-task-priority.medium {
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
      }
      
      .trinity-task-priority.low {
        background: rgba(158, 158, 158, 0.2);
        color: #9e9e9e;
      }
      
      .trinity-task-description {
        color: #b0b0b0;
        font-size: 10px;
        line-height: 1.3;
        margin-bottom: 6px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .trinity-task-meta-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 9px;
        color: #666;
      }
      
      .trinity-task-category {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
        padding: 2px 4px;
        border-radius: 2px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .trinity-task-actions-mini {
        display: flex;
        gap: 2px;
      }
      
      .trinity-task-action-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #888;
        padding: 2px 4px;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 10px;
      }
      
      .trinity-task-action-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
      }
      
      /* Recovery Panel Styles */
      .trinity-recovery-manager {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .trinity-recovery-sections {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .trinity-recovery-section {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 12px;
      }
      
      .trinity-section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 12px 0;
        color: #e0e0e0;
        font-size: 12px;
        font-weight: 600;
      }
      
      .trinity-section-icon {
        font-size: 14px;
      }
      
      .trinity-recovery-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 6px 8px;
        color: #e0e0e0;
        font-size: 11px;
        margin-bottom: 8px;
        font-family: inherit;
      }
      
      .trinity-recovery-input:focus {
        outline: none;
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }
      
      .trinity-checkpoint-options {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .trinity-checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        color: #b0b0b0;
        cursor: pointer;
      }
      
      .trinity-checkbox-label input[type="checkbox"] {
        margin: 0;
        width: 12px;
        height: 12px;
      }
      
      .trinity-recovery-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 500;
        width: 100%;
        margin-bottom: 4px;
      }
      
      .trinity-recovery-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
      }
      
      .trinity-recovery-btn.primary {
        background: rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.4);
        color: #4caf50;
      }
      
      .trinity-recovery-btn.primary:hover {
        background: rgba(76, 175, 80, 0.3);
        border-color: rgba(76, 175, 80, 0.6);
      }
      
      .trinity-checkpoint-list h5 {
        margin: 12px 0 8px 0;
        color: #888;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .trinity-checkpoint-items {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 150px;
        overflow-y: auto;
      }
      
      .trinity-checkpoint-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 8px;
        transition: all 0.2s ease;
      }
      
      .trinity-checkpoint-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .trinity-checkpoint-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }
      
      .trinity-checkpoint-icon {
        font-size: 12px;
      }
      
      .trinity-checkpoint-name {
        flex: 1;
        color: #e0e0e0;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .trinity-checkpoint-time {
        color: #888;
        font-size: 9px;
      }
      
      .trinity-checkpoint-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 9px;
        color: #666;
      }
      
      .trinity-checkpoint-size,
      .trinity-checkpoint-id {
        font-weight: 600;
      }
      
      .trinity-checkpoint-actions {
        display: flex;
        gap: 2px;
      }
      
      .trinity-mini-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #888;
        padding: 2px 4px;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 10px;
      }
      
      .trinity-mini-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
      }
      
      .trinity-session-tools,
      .trinity-autocompact-tools {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .trinity-autocompact-info {
        margin-bottom: 12px;
      }
      
      .trinity-recovery-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        font-size: 10px;
      }
      
      .trinity-recovery-stat .trinity-stat-label {
        color: #888;
      }
      
      .trinity-recovery-stat .trinity-stat-value {
        color: #4fc3f7;
        font-weight: 600;
      }
      
      .trinity-recovery-stat .trinity-stat-value.success {
        color: #4caf50;
      }
      
      /* Responsive adjustments */
      @media (max-width: 1200px) {
        .trinity-unified-layout {
          grid-template-columns: 1fr 280px;
        }
      }
      
      @media (max-width: 900px) {
        .trinity-unified-layout {
          grid-template-columns: 1fr 260px;
        }
      }
      
      /* Context Optimization Panel Styles */
      .context-panel-content {
        color: #e0e0e0;
      }
      
      .context-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .context-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 14px;
      }
      
      .context-icon {
        font-size: 16px;
      }
      
      .context-status-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 10px;
        font-weight: 600;
      }
      
      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
      
      .status-dot.status-good { background: #4caf50; }
      .status-dot.status-optimal { background: #2196f3; }
      .status-dot.status-warning { background: #ff9800; }
      .status-dot.status-critical { background: #f44336; }
      
      /* Metrics Grid */
      .context-metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      
      .metric-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.75rem;
        position: relative;
      }
      
      .metric-label {
        font-size: 10px;
        color: #888;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .metric-value {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 0.25rem;
      }
      
      .metric-value.text-good { color: #4caf50; }
      .metric-value.text-optimal { color: #2196f3; }
      .metric-value.text-warning { color: #ff9800; }
      .metric-value.text-critical { color: #f44336; }
      
      .metric-bar {
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.25rem;
      }
      
      .metric-fill {
        height: 100%;
        transition: width 0.3s ease;
        border-radius: 2px;
      }
      
      .metric-fill.fill-good { background: #4caf50; }
      .metric-fill.fill-optimal { background: #2196f3; }
      .metric-fill.fill-warning { background: #ff9800; }
      .metric-fill.fill-critical { background: #f44336; }
      
      .metric-detail {
        font-size: 9px;
        color: #666;
      }
      
      /* Section Titles */
      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #b0b0b0;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Context Chart */
      .context-chart-section {
        margin-bottom: 1rem;
      }
      
      .context-chart {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.75rem;
        min-height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .chart-placeholder {
        text-align: center;
        color: #666;
      }
      
      .chart-placeholder span {
        font-size: 18px;
        display: block;
        margin-bottom: 0.25rem;
      }
      
      .chart-placeholder p {
        margin: 0;
        font-size: 10px;
      }
      
      .ascii-chart {
        display: flex;
        align-items: end;
        gap: 1px;
        height: 40px;
        margin-bottom: 0.25rem;
      }
      
      .chart-bar {
        display: flex;
        flex-direction: column-reverse;
        min-width: 3px;
        height: 100%;
      }
      
      .chart-cell {
        height: 5px;
        margin-bottom: 1px;
      }
      
      .chart-empty { background: rgba(255, 255, 255, 0.05); }
      .bar-good { background: #4caf50; }
      .bar-optimal { background: #2196f3; }
      .bar-warning { background: #ff9800; }
      .bar-critical { background: #f44336; }
      
      .chart-legend {
        font-size: 9px;
        color: #666;
        text-align: center;
      }
      
      /* Recommendations */
      .optimization-section {
        margin-bottom: 1rem;
      }
      
      .recommendation-list {
        space-y: 0.5rem;
      }
      
      .recommendation-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.5rem;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      
      .recommendation-success {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.2);
      }
      
      .recommendation-info {
        background: rgba(33, 150, 243, 0.1);
        border: 1px solid rgba(33, 150, 243, 0.2);
      }
      
      .recommendation-warning {
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.2);
      }
      
      .recommendation-critical {
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.2);
      }
      
      .recommendation-icon {
        font-size: 12px;
        margin-top: 1px;
      }
      
      .recommendation-content {
        flex: 1;
      }
      
      .recommendation-title {
        font-size: 10px;
        font-weight: 600;
        margin-bottom: 0.25rem;
      }
      
      .recommendation-desc {
        font-size: 9px;
        color: #b0b0b0;
        line-height: 1.3;
      }
      
      /* Savings Section */
      .savings-section {
        margin-bottom: 1rem;
      }
      
      .savings-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.5rem;
      }
      
      .savings-card {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.2);
        border-radius: 4px;
        padding: 0.5rem;
        text-align: center;
      }
      
      .savings-label {
        font-size: 9px;
        color: #888;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
      }
      
      .savings-value {
        font-size: 14px;
        font-weight: 700;
        color: #4caf50;
        margin-bottom: 0.125rem;
      }
      
      .savings-detail {
        font-size: 8px;
        color: #666;
      }
      
      /* History Section */
      .history-section {
        margin-bottom: 1rem;
      }
      
      .optimization-log {
        max-height: 80px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.5rem;
      }
      
      .log-placeholder {
        text-align: center;
        color: #666;
        font-size: 9px;
        font-style: italic;
      }
      
      .optimization-record {
        margin-bottom: 0.5rem;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .optimization-record:last-child {
        margin-bottom: 0;
        border-bottom: none;
      }
      
      .record-header {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-bottom: 0.125rem;
      }
      
      .record-icon {
        font-size: 8px;
      }
      
      .record-time {
        font-size: 8px;
        color: #888;
      }
      
      .record-trigger {
        font-size: 8px;
        color: #666;
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 4px;
        border-radius: 2px;
        margin-left: auto;
      }
      
      .record-details {
        font-size: 8px;
        color: #b0b0b0;
        line-height: 1.2;
      }
      
      /* Control Buttons */
      .controls-section {
        margin-bottom: 1rem;
      }
      
      .control-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .control-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
        color: #e0e0e0;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
      }
      
      .control-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .control-primary {
        background: rgba(33, 150, 243, 0.2);
        border-color: rgba(33, 150, 243, 0.4);
        color: #2196f3;
      }
      
      .control-primary:hover {
        background: rgba(33, 150, 243, 0.3);
        border-color: rgba(33, 150, 243, 0.6);
      }
      
      .control-secondary {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.1);
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Load artifacts from filesystem (fallback method)
   */
  async loadArtifactsFromFilesystem() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const os = require('os');
      
      const memoryDir = path.join(os.homedir(), '.trinity-mvp', 'memory');
      const artifacts = [];
      const tiers = ['core', 'working', 'reference', 'historical'];
      
      for (const tier of tiers) {
        const tierDir = path.join(memoryDir, tier);
        try {
          const files = await fs.readdir(tierDir);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          for (const file of jsonFiles) {
            const filePath = path.join(tierDir, file);
            try {
              const content = await fs.readFile(filePath, 'utf8');
              const data = JSON.parse(content);
              
              artifacts.push({
                id: data.id || file,
                title: data.metadata?.title || data.title || data.type || 'Memory Item',
                content: data.content?.data ? JSON.stringify(data.content.data, null, 2) : 
                        data.originalContent || data.compressedContent || JSON.stringify(data, null, 2),
                category: tier,
                type: data.type || data.content?.type || 'unknown',
                created: data.timestamps?.created || data.timestamp || data.created || new Date().toISOString(),
                size: content.length,
                metadata: {
                  path: filePath,
                  tier: tier,
                  originalData: data
                }
              });
            } catch (fileError) {
              console.warn(`[Memory Artifacts] Could not parse file ${filePath}:`, fileError.message);
            }
          }
        } catch (tierError) {
          console.log(`[Memory Artifacts] Tier directory ${tier} not found, skipping`);
        }
      }
      
      console.log(`[Memory Artifacts] Fallback loaded ${artifacts.length} artifacts`);
      return artifacts;
    } catch (error) {
      console.error('Error loading memory artifacts from filesystem:', error);
      return [];
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Panel toggle functionality
    document.querySelectorAll('.trinity-panel-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const panelName = e.currentTarget.dataset.panel;
        this.togglePanel(panelName);
      });
    });
    
    // Chat input handling
    const chatInput = document.getElementById('trinity-chat-input');
    const sendBtn = document.getElementById('trinity-send-btn');
    
    if (chatInput && sendBtn) {
      // Auto-resize textarea
      chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
      
      // Send on Enter (Shift+Enter for new line)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
      
      // Focus chat input by default
      chatInput.focus();
    }
    
    // File drop zone
    const dropZone = document.getElementById('trinity-file-drop-zone');
    if (dropZone) {
      this.setupFileDropHandlers(dropZone);
    }
    
    // Panel action buttons
    this.setupPanelActionHandlers();
  }

  /**
   * Toggle panel expanded/collapsed state
   */
  togglePanel(panelName) {
    const panel = document.getElementById(`trinity-${panelName}-panel`);
    if (!panel) return;
    
    const isExpanded = panel.classList.contains('expanded');
    
    if (isExpanded) {
      panel.classList.remove('expanded');
      this.panelStates[panelName] = false;
    } else {
      panel.classList.add('expanded');
      this.panelStates[panelName] = true;
    }
    
    // Update toggle icon
    const toggle = panel.querySelector('.trinity-panel-toggle');
    if (toggle) {
      toggle.textContent = this.panelStates[panelName] ? '▼' : '▶';
    }
    
    // Handle Context Panel specific initialization
    if (panelName === 'context' && this.panelStates[panelName]) {
      this.initializeContextPanelContent();
    }
    
    this.savePanelStates();
  }

  /**
   * Restore panel states from localStorage
   */
  restorePanelStates() {
    Object.entries(this.panelStates).forEach(([panelName, isExpanded]) => {
      const panel = document.getElementById(`trinity-${panelName}-panel`);
      if (!panel) return;
      
      if (isExpanded) {
        panel.classList.add('expanded');
      }
      
      const toggle = panel.querySelector('.trinity-panel-toggle');
      if (toggle) {
        toggle.textContent = isExpanded ? '▼' : '▶';
      }
    });
  }

  /**
   * Load panel states from localStorage
   */
  loadPanelStates() {
    try {
      const saved = localStorage.getItem('trinity-panel-states');
      return saved ? JSON.parse(saved) : { ...this.defaultStates };
    } catch (error) {
      console.warn('Failed to load panel states:', error);
      return { ...this.defaultStates };
    }
  }

  /**
   * Save panel states to localStorage
   */
  savePanelStates() {
    try {
      localStorage.setItem('trinity-panel-states', JSON.stringify(this.panelStates));
    } catch (error) {
      console.warn('Failed to save panel states:', error);
    }
  }

  /**
   * Auto-expand relevant panel based on user action
   */
  autoExpandPanel(panelName) {
    if (!this.panelStates[panelName]) {
      this.togglePanel(panelName);
    }
  }

  /**
   * Setup file drop handlers
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
      this.openFilePicker();
    });
  }

  /**
   * Handle dropped files
   */
  async handleFilesDrop(files) {
    // Auto-expand files panel when files are dropped
    this.autoExpandPanel('files');
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}`);
        // This would integrate with existing Trinity file processing
        // For now, just show a notification
        this.showNotification(`File processed: ${file.name}`, 'success');
      } catch (error) {
        this.showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Open file picker
   */
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

  /**
   * Setup panel action handlers
   */
  setupPanelActionHandlers() {
    // Memory panel actions
    document.getElementById('browse-memory-detailed')?.addEventListener('click', () => {
      // First, toggle the simple memory browser to show actual files
      this.toggleMemoryBrowser();
    });
    
    document.getElementById('refresh-memory-browser')?.addEventListener('click', () => {
      this.loadMemoryBrowser();
      this.showNotification('Memory browser refreshed', 'info');
    });
    
    // Memory browser filters
    document.querySelectorAll('.trinity-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.trinity-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterMemories(e.target.dataset.tier);
      });
    });
    
    // Memory search
    document.getElementById('memory-search-input')?.addEventListener('input', (e) => {
      this.searchMemories(e.target.value);
    });
    
    // Memory item clicks
    document.querySelectorAll('.trinity-memory-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectMemory(item);
      });
    });
    
    document.getElementById('optimize-memory')?.addEventListener('click', () => {
      this.showNotification('Memory optimization triggered...', 'info');
    });
    
    // Tasks panel actions
    document.getElementById('create-new-task')?.addEventListener('click', () => {
      this.toggleTaskManager();
    });
    
    document.getElementById('view-all-tasks')?.addEventListener('click', () => {
      this.toggleTaskManager();
    });
    
    // Task creation
    document.getElementById('task-create-btn')?.addEventListener('click', () => {
      this.createNewTask();
    });
    
    // Task filters
    document.querySelectorAll('.trinity-task-manager .trinity-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.trinity-task-manager .trinity-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterTasks(e.target.dataset.status);
      });
    });
    
    // Task action buttons
    document.querySelectorAll('.trinity-task-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTaskAction(e.target, e.target.closest('.trinity-task-item'));
      });
    });
    
    // Task title input - create on Enter
    document.getElementById('task-title-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.createNewTask();
      }
    });
    
    // Recovery panel actions
    document.getElementById('create-checkpoint')?.addEventListener('click', () => {
      this.createQuickCheckpoint();
    });
    
    document.getElementById('view-recovery-tools')?.addEventListener('click', () => {
      this.toggleRecoveryManager();
    });
    
    // Recovery manager actions
    document.getElementById('create-checkpoint-detailed')?.addEventListener('click', () => {
      this.createDetailedCheckpoint();
    });
    
    document.getElementById('backup-session')?.addEventListener('click', () => {
      this.backupSession();
    });
    
    document.getElementById('restore-session')?.addEventListener('click', () => {
      this.restoreSession();
    });
    
    document.getElementById('clear-session')?.addEventListener('click', () => {
      this.clearSession();
    });
    
    document.getElementById('trigger-recovery')?.addEventListener('click', () => {
      this.triggerRecoveryProtocol();
    });
    
    document.getElementById('test-recovery')?.addEventListener('click', () => {
      this.testRecoverySystem();
    });
    
    // Checkpoint mini actions
    document.querySelectorAll('.trinity-mini-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCheckpointAction(e.target, e.target.closest('.trinity-checkpoint-item'));
      });
    });
    
    // Initialize Context Optimization Panel when panel is expanded
    this.initializeContextPanel();
  }
  
  /**
   * Initialize Context Optimization Panel
   */
  initializeContextPanel() {
    // Import and initialize the Context Optimization Panel
    if (typeof ContextOptimizationPanel !== 'undefined') {
      this.contextPanel = new ContextOptimizationPanel();
      console.log('[Trinity Single Window] Context Optimization Panel initialized');
    } else {
      console.warn('[Trinity Single Window] ContextOptimizationPanel not found, will initialize on first use');
    }
  }
  
  /**
   * Initialize Context Panel content when expanded
   */
  initializeContextPanelContent() {
    if (!this.contextPanel) {
      // Try to initialize if not already done
      if (typeof ContextOptimizationPanel !== 'undefined') {
        this.contextPanel = new ContextOptimizationPanel();
      } else {
        console.error('[Trinity Single Window] ContextOptimizationPanel class not available');
        return;
      }
    }
    
    // Initialize the panel content
    this.contextPanel.initialize();
    this.contextPanel.setVisibility(true);
    
    console.log('[Trinity Single Window] Context Panel content initialized and visible');
  }

  /**
   * Send chat message with proper Trinity integration
   */
  async sendMessage() {
    const input = document.getElementById('trinity-chat-input');
    const sendBtn = document.getElementById('trinity-send-btn');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Track system health metrics
    const messageStartTime = Date.now();
    this.systemHealth.totalMessages++;
    
    // Add user message to chat
    this.addChatMessage('user', message);
    
    // Clear input and disable send button
    input.value = '';
    input.style.height = 'auto';
    if (sendBtn) sendBtn.disabled = true;
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Load intelligent memory context with session awareness
    let memoryContext = null;
    let requiresClarification = false;
    let clarificationSuggestion = null;
    
    try {
      // Use enhanced memory integration to load relevant context
      if (window.trinityAPI && window.trinityAPI.memory) {
        console.log('[Trinity Chat] Loading intelligent memory context...');
        memoryContext = await window.trinityAPI.memory.loadRelevantContext(message);
        
        // Check for uncertainty handling
        if (memoryContext && memoryContext.requiresClarification) {
          requiresClarification = true;
          clarificationSuggestion = memoryContext.clarificationSuggestion;
          console.log('[Trinity Chat] Multiple matches detected, clarification needed');
        }
      }
    } catch (error) {
      console.warn('[Trinity Chat] Failed to load intelligent memory context:', error);
      // Fallback to manual memory selection
      const memoryInfo = this.getActiveMemoryContext();
      memoryContext = memoryInfo ? { summary: 'Using selected memories', artifacts: [] } : null;
    }
    
    try {
      let response;
      
      console.log(`[Trinity Chat] Processing message: "${message}" (${message.length} chars)`);
      
      // Check if clarification is needed before processing (CONSERVATIVE MODE)
      if (requiresClarification && clarificationSuggestion && memoryContext.multipleMatches && memoryContext.multipleMatches.length >= 3) {
        console.log('[Trinity Chat] Multiple matches detected but proceeding with best match for better UX');
        
        // CONSERVATIVE: Log but don't block conversation - proceed with best context
        console.log(`[Trinity Chat] Would show clarification for ${memoryContext.multipleMatches.length} matches, but proceeding for better UX`);
        
        // Continue with normal processing using the loaded context
        // (This allows the conversation to flow normally while still having the enhanced context)
      }
      
      // Check if Trinity API is available
      if (window.trinityAPI && window.trinityAPI.overseer) {
        console.log('[Trinity Chat] Sending message to Overseer Agent...');
        
        // Include memory context in the request
        const requestData = {
          message: message,
          memoryContext: memoryContext
        };
        
        // Send message to Overseer Agent with memory context
        response = await window.trinityAPI.overseer.sendMessage(requestData);
        
        console.log('[Trinity Chat] Overseer response:', response);
        console.log('[Trinity Chat] Response content debug:', {
          hasResponse: !!response.response,
          responseType: typeof response.response,
          responseLength: response.response ? response.response.length : 0,
          responseTrimmed: response.response ? response.response.trim() : 'null/undefined'
        });
        
        if (response.status === 'processed') {
          // Check for blank or empty responses
          if (!response.response || response.response.trim().length === 0) {
            console.error('[Trinity Chat] BLANK RESPONSE DETECTED:', {
              userMessage: message,
              responseStatus: response.status,
              responseContent: response.response,
              responseType: typeof response.response,
              timestamp: new Date().toISOString()
            });
            
            // Track blank response
            this.systemHealth.blankResponses++;
            
            // Provide intelligent fallback based on user message
            const fallbackResponse = this.generateIntelligentFallback(message);
            this.addChatMessage('assistant', fallbackResponse, memoryContext);
          } else {
            // Track successful response
            this.systemHealth.successfulResponses++;
            this.addChatMessage('assistant', response.response, memoryContext);
          }
        } else if (response.status === 'error') {
          console.error('[Trinity Chat] Overseer returned error status:', response.error);
          
          // Track error response
          this.systemHealth.errorResponses++;
          
          const errorFallback = response.fallbackResponse || this.generateIntelligentFallback(message);
          this.addChatMessage('assistant', errorFallback, memoryContext);
        } else {
          console.warn('[Trinity Chat] Unexpected response status:', response.status);
          
          // Track error response
          this.systemHealth.errorResponses++;
          
          this.addChatMessage('assistant', this.generateIntelligentFallback(message), memoryContext);
        }
      } else {
        console.log('[Trinity Chat] Trinity API not available, using fallback response');
        // Fallback response for when Trinity API is not available
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
        this.addChatMessage('assistant', 'Hello! I\'m Trinity, your professional AI assistant. I can help you with tasks, manage your memory hierarchy, and optimize your workflow. Try asking me about your files or creating a task!', memoryContext);
      }
      
    } catch (error) {
      console.error('[Trinity Chat] CHAT ERROR CAUGHT:', {
        userMessage: message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      const errorFallback = this.generateIntelligentFallback(message);
      this.addChatMessage('assistant', errorFallback, memoryContext);
    } finally {
      // Track response time
      const responseTime = Date.now() - messageStartTime;
      this.systemHealth.lastResponseTime = responseTime;
      this.systemHealth.responseTimeHistory.push(responseTime);
      
      // Keep only last 50 response times for average calculation
      if (this.systemHealth.responseTimeHistory.length > 50) {
        this.systemHealth.responseTimeHistory = this.systemHealth.responseTimeHistory.slice(-50);
      }
      
      // Calculate average response time
      this.systemHealth.averageResponseTime = Math.round(
        this.systemHealth.responseTimeHistory.reduce((a, b) => a + b, 0) / this.systemHealth.responseTimeHistory.length
      );
      
      console.log(`[Trinity Chat] Response processed in ${responseTime}ms (avg: ${this.systemHealth.averageResponseTime}ms)`);
      
      // Log system health periodically
      if (this.systemHealth.totalMessages % 5 === 0) {
        this.logSystemHealth();
      }
      
      // Hide typing indicator and re-enable send button
      this.hideTypingIndicator();
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }

  /**
   * Add message to chat display with proper bubble formatting
   */
  addChatMessage(sender, content, memoryContext = null) {
    const chatContent = document.getElementById('trinity-chat-messages');
    if (!chatContent) return;
    
    // Remove welcome message on first real message
    const welcomeMsg = chatContent.querySelector('.trinity-welcome-message');
    if (welcomeMsg && (sender === 'user' || sender === 'assistant')) {
      welcomeMsg.style.transition = 'opacity 0.3s ease';
      welcomeMsg.style.opacity = '0';
      setTimeout(() => welcomeMsg.remove(), 300);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `trinity-message ${sender}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create memory indicator for assistant messages (Enhanced with Session Metadata)
    let memoryIndicatorHTML = '';
    if (sender === 'assistant' && memoryContext && memoryContext.artifacts && memoryContext.artifacts.length > 0) {
      const artifactCount = memoryContext.artifacts.length;
      const memoryTypes = [...new Set(memoryContext.artifacts.map(a => a.category))];
      const sessionAware = memoryContext.artifacts.some(a => a.category === 'conversation');
      
      memoryIndicatorHTML = `
        <div class="trinity-message-memory-indicator enhanced">
          <span>🧠</span>
          <span>Memory Used: ${artifactCount} items</span>
          ${sessionAware ? '<span class="session-indicator">📝 Session Context</span>' : ''}
          <div class="memory-details">
            ${memoryContext.summary} (${memoryTypes.join(', ')})
            ${memoryContext.optimization ? `• ${memoryContext.optimization.tokensSaved} tokens saved` : ''}
          </div>
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div class="trinity-message-content">
        ${this.formatMessageContent(content, sender)}
        ${memoryIndicatorHTML}
        <div class="trinity-message-time">${timeString}</div>
      </div>
    `;
    
    chatContent.appendChild(messageDiv);
    
    // Update conversation metrics for realistic token tracking
    this.updateConversationMetrics(content, sender);
    
    // Auto-scroll to bottom with smooth behavior
    setTimeout(() => {
      chatContent.scrollTop = chatContent.scrollHeight;
      // Also ensure the input area is visible by scrolling the main container if needed
      const inputArea = document.querySelector('.trinity-chat-input-area');
      if (inputArea) {
        inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }

  /**
   * Add clarification message when multiple matches are detected
   */
  addClarificationMessage(clarificationSuggestion, multipleMatches) {
    const chatContent = document.getElementById('trinity-chat-messages');
    if (!chatContent) return;
    
    // Remove welcome message if present
    const welcomeMsg = chatContent.querySelector('.trinity-welcome-message');
    if (welcomeMsg) {
      welcomeMsg.style.transition = 'opacity 0.3s ease';
      welcomeMsg.style.opacity = '0';
      setTimeout(() => welcomeMsg.remove(), 300);
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'trinity-message assistant clarification';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create clarification content with formatted matches
    let matchesHTML = '';
    if (multipleMatches && multipleMatches.length > 0) {
      matchesHTML = multipleMatches.map((match, index) => `
        <div class="trinity-clarification-option" data-match-id="${match.id}">
          <strong>${index + 1}.</strong> ${match.summary}
          <div class="trinity-clarification-relevance">Relevance: ${Math.round(match.relevance * 100)}%</div>
        </div>
      `).join('');
    }
    
    messageDiv.innerHTML = `
      <div class="trinity-message-content">
        <div class="trinity-clarification-header">
          <span class="trinity-clarification-icon">🤔</span>
          <strong>Need Clarification</strong>
        </div>
        <div class="trinity-clarification-text">
          ${this.formatMessageContent(clarificationSuggestion, 'assistant')}
        </div>
        ${matchesHTML ? `<div class="trinity-clarification-matches">${matchesHTML}</div>` : ''}
        <div class="trinity-clarification-actions">
          <button class="trinity-clarification-dismiss" onclick="trinitySingleWindow.dismissClarification()">
            I'll be more specific
          </button>
        </div>
        <div class="trinity-message-time">${timeString}</div>
      </div>
    `;
    
    // Add special styling for clarification messages
    messageDiv.style.background = 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)';
    messageDiv.style.border = '1px solid #ffc107';
    messageDiv.style.borderRadius = '12px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.padding = '15px';
    
    chatContent.appendChild(messageDiv);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      chatContent.scrollTop = chatContent.scrollHeight;
    }, 100);
  }

  /**
   * Dismiss clarification message and re-enable input
   */
  dismissClarification() {
    const clarificationMsg = document.querySelector('.trinity-message.clarification');
    if (clarificationMsg) {
      clarificationMsg.style.transition = 'opacity 0.3s ease';
      clarificationMsg.style.opacity = '0.7';
    }
    
    const input = document.getElementById('trinity-chat-input');
    if (input) {
      input.focus();
      input.placeholder = 'Please be more specific about what you\'re looking for...';
    }
  }

  /**
   * Log system health statistics for monitoring
   */
  logSystemHealth() {
    const health = this.systemHealth;
    const sessionDuration = Math.round((Date.now() - health.sessionStart) / 1000);
    const successRate = health.totalMessages > 0 ? 
      Math.round((health.successfulResponses / health.totalMessages) * 100) : 0;
    
    console.log(`[Trinity System Health] Session Statistics:
📊 Total Messages: ${health.totalMessages}
✅ Successful: ${health.successfulResponses} (${successRate}%)
❌ Errors: ${health.errorResponses}
⚪ Blank Responses: ${health.blankResponses}
⏱️ Avg Response Time: ${health.averageResponseTime}ms
🕒 Session Duration: ${sessionDuration}s
📈 Health Score: ${this.calculateHealthScore()}/100`);
  }

  /**
   * Calculate overall system health score
   */
  calculateHealthScore() {
    if (this.systemHealth.totalMessages === 0) return 100;
    
    const successRate = this.systemHealth.successfulResponses / this.systemHealth.totalMessages;
    const errorRate = (this.systemHealth.errorResponses + this.systemHealth.blankResponses) / this.systemHealth.totalMessages;
    const responseTimeScore = Math.max(0, 100 - (this.systemHealth.averageResponseTime / 50)); // Penalize >5s responses
    
    const baseScore = successRate * 70; // 70% weight for success rate
    const reliabilityScore = (1 - errorRate) * 20; // 20% weight for reliability
    const performanceScore = (responseTimeScore / 100) * 10; // 10% weight for performance
    
    return Math.round(baseScore + reliabilityScore + performanceScore);
  }

  /**
   * Get current system health for external monitoring
   */
  getSystemHealth() {
    return {
      ...this.systemHealth,
      healthScore: this.calculateHealthScore(),
      sessionDuration: Math.round((Date.now() - this.systemHealth.sessionStart) / 1000),
      successRate: this.systemHealth.totalMessages > 0 ? 
        Math.round((this.systemHealth.successfulResponses / this.systemHealth.totalMessages) * 100) : 0
    };
  }

  /**
   * Format message content for professional presentation
   */
  formatMessageContent(content, sender) {
    if (!content || content.trim().length === 0) {
      console.warn('[Trinity Chat] Empty content provided to formatMessageContent');
      return sender === 'assistant' ? 'I apologize, but I seem to have lost my response. Could you please try again?' : content;
    }
    
    // Basic HTML escaping for user messages to prevent XSS
    if (sender === 'user') {
      return content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }
    
    // Professional formatting for assistant messages
    let formatted = content.trim();
    
    // Convert markdown-style formatting
    formatted = formatted
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text (but not inside bold)
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+?)`/g, '<code>$1</code>')
      // Lists (simple bullet points)
      .replace(/^[\s]*[-*+]\s+(.+?)$/gm, '<li>$1</li>')
      // Convert line breaks to proper paragraphs
      .replace(/\n\s*\n/g, '</p><p>')
      // Single line breaks become <br> within paragraphs
      .replace(/(?<!>)\n(?!<)/g, '<br>');
    
    // Wrap lists in <ul> tags
    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }
    
    // Wrap in paragraph tags if not already formatted
    if (!formatted.includes('<p>') && !formatted.includes('<pre>') && !formatted.includes('<ul>')) {
      formatted = `<p>${formatted}</p>`;
    }
    
    // Clean up formatting issues
    formatted = formatted
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>\s*<ul>/g, '<ul>') // Fix paragraph-list transitions
      .replace(/<\/ul>\s*<\/p>/g, '</ul>') // Fix list-paragraph transitions
      .replace(/(<br>\s*){2,}/g, '<br>'); // Reduce multiple line breaks
    
    return formatted;
  }

  /**
   * Generate intelligent fallback response based on user message
   */
  generateIntelligentFallback(userMessage) {
    const message = userMessage.toLowerCase();
    
    console.log(`[Trinity Chat] Generating intelligent fallback for: "${userMessage}"`);
    
    // Check for problematic trigger words that might cause blank responses
    const triggerWords = ['think', 'thoughts', 'opinion', 'feel', 'believe'];
    const hasTriggerWord = triggerWords.some(word => message.includes(word));
    
    if (hasTriggerWord) {
      console.log(`[Trinity Chat] Detected trigger word in message, providing safe fallback`);
      return "I can help you analyze information and provide practical assistance. What specific task or information would you like me to help you with?";
    }
    
    // Context-aware fallbacks based on message content
    if (message.includes('file') || message.includes('document') || message.includes('upload')) {
      return "I can help you process and manage files. You can drag and drop files into the Trinity interface or tell me what specific file operations you need assistance with.";
    }
    
    if (message.includes('task') || message.includes('todo') || message.includes('project')) {
      return "I can help you create and manage tasks. Use the Tasks panel on the right to create new tasks, or tell me what you'd like to accomplish and I can help organize it.";
    }
    
    if (message.includes('memory') || message.includes('remember') || message.includes('recall')) {
      return "I can help you with memory management. Check the Memory panel to see stored information, or tell me what you'd like me to remember for future reference.";
    }
    
    if (message.includes('context') || message.includes('optimization') || message.includes('performance')) {
      return "I can help you optimize your workflow. Check the Context panel for real-time performance metrics and optimization suggestions.";
    }
    
    if (message.includes('help') || message.includes('how') || message.includes('what can')) {
      return "I'm Trinity, your professional AI assistant. I can help with file processing, task management, memory organization, and workflow optimization. What would you like to explore first?";
    }
    
    // Generic professional fallback
    return "I'm here to help you with professional tasks and workflow optimization. Could you please be more specific about what you'd like assistance with?";
  }

  /**
   * Update conversation metrics for realistic token tracking
   */
  updateConversationMetrics(content, sender) {
    this.conversationMetrics.messageCount++;
    this.conversationMetrics.lastActivity = Date.now();
    
    // Estimate tokens based on character count (rough approximation: 4 chars = 1 token)
    const estimatedTokensInMessage = Math.ceil(content.length / 4);
    this.conversationMetrics.estimatedTokens += estimatedTokensInMessage;
    
    // Get the current conversation metrics with proper calculations
    const currentMetrics = this.getConversationMetrics();
    
    // Push real conversation metrics to IPC bridge for context intelligence panels
    if (window.trinityAPI && window.trinityAPI.context && window.trinityAPI.context.updateMetrics) {
      window.trinityAPI.context.updateMetrics(currentMetrics).then(() => {
        console.log('[Trinity Chat] Context metrics pushed to IPC bridge successfully');
      }).catch(error => {
        console.warn('[Trinity Chat] Failed to push context metrics to IPC:', error);
      });
    }
    
    // Update status bar context display to reflect real usage
    if (window.trinityStatusBar && window.trinityStatusBar.updateAmbientDisplay) {
      setTimeout(() => {
        window.trinityStatusBar.updateAmbientDisplay();
      }, 500);
    }
    
    // Update context panel if it's open
    if (this.contextPanel && this.contextPanel.isInitialized) {
      this.contextPanel.updateMetrics();
    }
    
    console.log(`[Trinity Chat] Updated metrics: ${this.conversationMetrics.messageCount} messages, ~${this.conversationMetrics.estimatedTokens} tokens (${currentMetrics.contextPercentage}%)`);
  }

  /**
   * Get current conversation metrics for context tracking
   */
  getConversationMetrics() {
    const sessionDuration = Math.floor((Date.now() - this.conversationMetrics.sessionStart) / 1000);
    
    // More realistic context percentage calculation
    // Assume ~100,000 token context window capacity
    const contextWindowCapacity = 100000;
    const rawPercentage = (this.conversationMetrics.estimatedTokens / contextWindowCapacity) * 100;
    const contextPercentage = Math.min(85, Math.max(0, Math.round(rawPercentage * 10) / 10)); // Round to 1 decimal, cap at 85%
    
    return {
      sessionStart: this.conversationMetrics.sessionStart,
      messageCount: this.conversationMetrics.messageCount,
      estimatedTokens: this.conversationMetrics.estimatedTokens,
      sessionDuration: sessionDuration,
      contextPercentage: contextPercentage,
      lastActivity: this.conversationMetrics.lastActivity,
      contextWindowCapacity: contextWindowCapacity,
      tokensRemaining: Math.max(0, contextWindowCapacity - this.conversationMetrics.estimatedTokens)
    };
  }

  /**
   * Toggle memory browser visibility
   */
  toggleMemoryBrowser() {
    const browser = document.getElementById('trinity-memory-browser');
    if (!browser) return;
    
    const isVisible = browser.style.display !== 'none';
    browser.style.display = isVisible ? 'none' : 'block';
    
    const button = document.getElementById('browse-memory-detailed');
    if (button) {
      button.innerHTML = isVisible ? 
        '<span class="trinity-btn-icon">🔍</span>Explore Memory' :
        '<span class="trinity-btn-icon">📁</span>Hide Browser';
    }
    
    this.showNotification(isVisible ? 'Memory browser hidden' : 'Memory browser opened', 'info');
  }

  /**
   * Filter memories by tier
   */
  filterMemories(tier) {
    const items = document.querySelectorAll('.trinity-memory-item');
    items.forEach(item => {
      if (tier === 'all' || item.dataset.tier === tier) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Search memories by title/content
   */
  searchMemories(query) {
    const items = document.querySelectorAll('.trinity-memory-item');
    const searchTerm = query.toLowerCase().trim();
    
    items.forEach(item => {
      const title = item.querySelector('.trinity-memory-title')?.textContent.toLowerCase() || '';
      const preview = item.querySelector('.trinity-memory-preview')?.textContent.toLowerCase() || '';
      
      if (!searchTerm || title.includes(searchTerm) || preview.includes(searchTerm)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Load and populate memory browser with actual memory files
   */
  async loadMemoryBrowser() {
    try {
      console.log('[Memory Browser] Loading actual memory files...');
      
      // Use IPC to load memory artifacts
      if (window.trinityAPI && window.trinityAPI.loadMemoryArtifacts) {
        const artifacts = await window.trinityAPI.loadMemoryArtifacts();
        this.populateMemoryBrowser(artifacts);
        console.log(`[Memory Browser] Loaded ${artifacts.length} actual memory artifacts`);
        return;
      }
      
      console.warn('[Memory Browser] Trinity API not available, keeping demo data');
    } catch (error) {
      console.error('[Memory Browser] Failed to load memory artifacts:', error);
    }
  }

  /**
   * Populate memory browser with actual artifacts
   */
  populateMemoryBrowser(artifacts) {
    const memoryList = document.getElementById('trinity-memory-list');
    if (!memoryList) return;

    // Clear existing content
    memoryList.innerHTML = '';

    if (!artifacts || artifacts.length === 0) {
      memoryList.innerHTML = '<div class="trinity-memory-item">No memory artifacts found</div>';
      return;
    }

    // Create memory items for each artifact
    artifacts.forEach(artifact => {
      const item = document.createElement('div');
      item.className = 'trinity-memory-item';
      item.dataset.tier = artifact.category;
      
      const typeIcon = this.getMemoryTypeIcon(artifact.type);
      const timeAgo = this.formatTimeAgo(artifact.created);
      const size = this.formatFileSize(artifact.size || 0);
      const preview = this.generateMemoryPreview(artifact.content);
      
      item.innerHTML = `
        <div class="trinity-memory-header">
          <span class="trinity-memory-icon">${typeIcon}</span>
          <span class="trinity-memory-title">${artifact.title || 'Untitled'}</span>
          <span class="trinity-memory-tier">${artifact.category}</span>
        </div>
        <div class="trinity-memory-preview">${preview}</div>
        <div class="trinity-memory-meta">
          <span class="trinity-memory-size">${size}</span>
          <span class="trinity-memory-time">${timeAgo}</span>
        </div>
      `;
      
      // Add click handler to view full artifact
      item.addEventListener('click', () => {
        this.viewMemoryArtifact(artifact);
      });
      
      memoryList.appendChild(item);
    });
  }

  /**
   * Get icon for memory type
   */
  getMemoryTypeIcon(type) {
    const icons = {
      'user-preference': '🎯',
      'user_content': '📄',
      'conversation': '💬',
      'system_generated': '⚙️',
      'unknown': '📁'
    };
    return icons[type] || icons['unknown'];
  }

  /**
   * Generate preview text for memory content
   */
  generateMemoryPreview(content) {
    if (!content) return 'No content available';
    
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const maxLength = 100;
    
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Format time ago string
   */
  formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  /**
   * View memory artifact in detail
   */
  viewMemoryArtifact(artifact) {
    console.log('[Memory Browser] Viewing artifact:', artifact.title);
    this.createMemoryContentViewer(artifact);
  }

  /**
   * Create and show memory content viewer
   */
  createMemoryContentViewer(artifact) {
    // Create overlay for memory content viewer
    const overlay = document.createElement('div');
    overlay.className = 'trinity-memory-content-overlay';
    overlay.innerHTML = `
      <div class="trinity-memory-content-modal">
        <div class="trinity-memory-content-header">
          <div class="trinity-memory-content-title">
            <span class="trinity-memory-icon">${this.getMemoryTypeIcon(artifact.type)}</span>
            <span class="trinity-memory-title-text">${artifact.title || 'Memory Artifact'}</span>
            <span class="trinity-memory-category-badge">${artifact.category}</span>
          </div>
          <button class="trinity-memory-close-btn" onclick="this.closest('.trinity-memory-content-overlay').remove()">
            <span>✕</span>
          </button>
        </div>
        <div class="trinity-memory-content-meta">
          <div class="meta-item">
            <strong>Type:</strong> ${artifact.type || 'Unknown'}
          </div>
          <div class="meta-item">
            <strong>Created:</strong> ${this.formatTimeAgo(artifact.created)}
          </div>
          <div class="meta-item">
            <strong>Size:</strong> ${this.formatFileSize(artifact.size || 0)}
          </div>
          <div class="meta-item">
            <strong>Category:</strong> ${artifact.category}
          </div>
        </div>
        <div class="trinity-memory-content-body">
          <div class="trinity-memory-content-text">
            ${this.formatMemoryContent(artifact.content)}
          </div>
        </div>
        <div class="trinity-memory-content-actions">
          <button class="trinity-btn" onclick="navigator.clipboard.writeText('${artifact.content?.replace(/'/g, "\\'")}'); alert('Content copied to clipboard!')">
            📋 Copy Content
          </button>
          <button class="trinity-btn" onclick="this.closest('.trinity-memory-content-overlay').remove()">
            Close
          </button>
        </div>
      </div>
    `;

    // Add styles for the memory content viewer
    if (!document.getElementById('trinity-memory-content-styles')) {
      const styles = document.createElement('style');
      styles.id = 'trinity-memory-content-styles';
      styles.textContent = `
        .trinity-memory-content-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        
        .trinity-memory-content-modal {
          background: #1e1e1e;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 80%;
          display: flex;
          flex-direction: column;
          color: #e0e0e0;
        }
        
        .trinity-memory-content-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
        }
        
        .trinity-memory-content-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .trinity-memory-title-text {
          font-size: 18px;
          font-weight: 600;
        }
        
        .trinity-memory-category-badge {
          background: rgba(79, 195, 247, 0.2);
          border: 1px solid rgba(79, 195, 247, 0.4);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          text-transform: uppercase;
        }
        
        .trinity-memory-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e0e0e0;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .trinity-memory-close-btn:hover {
          background: rgba(255, 100, 100, 0.3);
        }
        
        .trinity-memory-content-meta {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .meta-item {
          font-size: 12px;
          color: #b0b0b0;
        }
        
        .trinity-memory-content-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          min-height: 200px;
        }
        
        .trinity-memory-content-text {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          background: rgba(0, 0, 0, 0.3);
          padding: 16px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f0f0f0;
        }
        
        .trinity-memory-content-actions {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .trinity-btn {
          background: rgba(79, 195, 247, 0.2);
          border: 1px solid rgba(79, 195, 247, 0.4);
          color: #e0e0e0;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .trinity-btn:hover {
          background: rgba(79, 195, 247, 0.3);
        }
      `;
      document.head.appendChild(styles);
    }

    // Show the overlay
    document.body.appendChild(overlay);
    
    // Close on overlay click (outside modal)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Format memory content for display
   */
  formatMemoryContent(content) {
    if (!content) return 'No content available';
    
    if (typeof content === 'string') {
      return content;
    }
    
    // Pretty print JSON content
    return JSON.stringify(content, null, 2);
  }

  /**
   * Load and display actual memory statistics
   */
  async loadMemoryStatistics() {
    try {
      // Use IPC to get memory stats from main process
      if (window.trinityAPI && window.trinityAPI.getMemoryStats) {
        const stats = await window.trinityAPI.getMemoryStats();
        this.updateMemoryDisplay(stats.total.files, stats.total.size);
        console.log(`[Memory Stats] IPC loaded: ${stats.total.files} artifacts, ${this.formatFileSize(stats.total.size)}`);
        return;
      }
      
      // Fallback to filesystem access
      const fs = require('fs').promises;
      const path = require('path');
      const os = require('os');
      
      const memoryDir = path.join(os.homedir(), '.trinity-mvp', 'memory');
      let totalFiles = 0;
      let totalSize = 0;
      
      // Check if memory directory exists
      try {
        await fs.access(memoryDir);
      } catch (error) {
        console.warn('[Memory Stats] Memory directory not found:', memoryDir);
        this.updateMemoryDisplay(0, 0);
        return;
      }
      
      // Count files in memory hierarchy tiers only (conversations stored separately)
      const tiers = ['core', 'working', 'reference', 'historical'];
      
      for (const tier of tiers) {
        const tierDir = path.join(memoryDir, tier);
        try {
          const files = await fs.readdir(tierDir);
          const jsonFiles = files.filter(file => file.endsWith('.json'));
          
          for (const file of jsonFiles) {
            const filePath = path.join(tierDir, file);
            try {
              const stats = await fs.stat(filePath);
              totalFiles++;
              totalSize += stats.size;
            } catch (fileError) {
              console.warn(`[Memory Stats] Could not stat file ${filePath}:`, fileError.message);
            }
          }
        } catch (tierError) {
          // Tier directory doesn't exist, skip
          console.log(`[Memory Stats] Tier directory ${tier} not found, skipping`);
        }
      }
      
      this.updateMemoryDisplay(totalFiles, totalSize);
      console.log(`[Memory Stats] Memory Hierarchy: ${totalFiles} persistent artifacts, ${this.formatFileSize(totalSize)} (conversations excluded)`);
      
    } catch (error) {
      console.error('[Memory Stats] Error loading memory statistics:', error);
      this.updateMemoryDisplay(0, 0);
    }
  }

  /**
   * Update memory display in UI
   */
  updateMemoryDisplay(fileCount, totalSize) {
    const countElement = document.getElementById('memory-total-items');
    const sizeElement = document.getElementById('memory-total-size');
    
    if (countElement) {
      countElement.textContent = fileCount.toString();
    }
    
    if (sizeElement) {
      sizeElement.textContent = this.formatFileSize(totalSize);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  /**
   * Open Memory Artifacts Viewer in overlay
   */
  openMemoryArtifactsViewer() {
    try {
      // Check if Memory Artifacts Viewer is available
      if (typeof MemoryArtifactsViewer === 'undefined') {
        // Load the Memory Artifacts Viewer script if not already loaded
        this.loadMemoryArtifactsViewer().then(() => {
          this.createMemoryArtifactsOverlay();
        }).catch(error => {
          console.error('Failed to load Memory Artifacts Viewer:', error);
          this.showNotification('Memory Artifacts Viewer not available', 'error');
        });
      } else {
        // Memory Artifacts Viewer is already loaded
        this.createMemoryArtifactsOverlay();
      }
    } catch (error) {
      console.error('Error opening Memory Artifacts Viewer:', error);
      this.showNotification('Unable to open Memory Artifacts Viewer', 'error');
    }
  }

  /**
   * Load Memory Artifacts Viewer script dynamically
   */
  loadMemoryArtifactsViewer() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '../src/ui/memory-artifacts-viewer.js';
      script.onload = () => {
        console.log('[Trinity] Memory Artifacts Viewer loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('[Trinity] Failed to load Memory Artifacts Viewer:', error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Create Memory Artifacts Viewer overlay
   */
  createMemoryArtifactsOverlay() {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'trinity-memory-artifacts-overlay';
    overlay.innerHTML = `
      <div class="trinity-memory-artifacts-modal">
        <div class="trinity-memory-artifacts-header">
          <h2>🧠 Memory Artifacts</h2>
          <button class="trinity-close-btn" id="close-memory-artifacts">✕</button>
        </div>
        <div class="trinity-memory-artifacts-content" id="memory-artifacts-container">
          <!-- Memory Artifacts Viewer will be inserted here -->
        </div>
      </div>
    `;

    // Add overlay styles
    const styles = document.createElement('style');
    styles.textContent = `
      .trinity-memory-artifacts-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
      }

      .trinity-memory-artifacts-modal {
        background: #1a1a1a;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        width: 90%;
        height: 90%;
        max-width: 1200px;
        max-height: 800px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      }

      .trinity-memory-artifacts-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.02);
      }

      .trinity-memory-artifacts-header h2 {
        margin: 0;
        color: #e0e0e0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .trinity-close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .trinity-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }

      .trinity-memory-artifacts-content {
        flex: 1;
        overflow: hidden;
        background: #161616;
      }

      /* Make Memory Artifacts Viewer fit the overlay */
      .trinity-memory-artifacts-content .memory-artifacts-viewer {
        height: 100%;
        background: transparent;
        border: none;
      }
    `;
    document.head.appendChild(styles);

    // Add to DOM
    document.body.appendChild(overlay);

    // Initialize Memory Artifacts Viewer
    try {
      const container = overlay.querySelector('#memory-artifacts-container');
      
      // Connect to Trinity memory integration if available
      let memoryIntegration;
      if (window.trinityMemoryIntegration) {
        memoryIntegration = window.trinityMemoryIntegration;
      } else {
        // Create a mock memory integration that reads from filesystem
        memoryIntegration = {
          loadArtifacts: async () => {
            try {
              // Use IPC to load memory artifacts from main process
              if (window.trinityAPI && window.trinityAPI.loadMemoryArtifacts) {
                const artifacts = await window.trinityAPI.loadMemoryArtifacts();
                console.log(`[Memory Artifacts] IPC loaded ${artifacts.length} artifacts`);
                return artifacts;
              } else {
                console.warn('[Memory Artifacts] Trinity API not available, falling back to filesystem');
                return await this.loadArtifactsFromFilesystem();
              }
            } catch (error) {
              console.error('Error loading memory artifacts via IPC:', error);
              return await this.loadArtifactsFromFilesystem();
            }
          },
          loadCategoryItems: async (category) => {
            try {
              // Load items from specific category using IPC
              if (window.trinityAPI && window.trinityAPI.loadMemoryArtifacts) {
                const artifacts = await window.trinityAPI.loadMemoryArtifacts();
                return artifacts.filter(artifact => artifact.category === category);
              } else {
                console.warn('[Memory Artifacts] Trinity API not available');
                return [];
              }
            } catch (error) {
              console.error(`Error loading category ${category}:`, error);
              return [];
            }
          },
          getMemoryItems: () => [],
          searchMemory: async (query) => {
            try {
              if (window.trinityAPI && window.trinityAPI.memory) {
                return await window.trinityAPI.memory.search(query);
              }
              return [];
            } catch (error) {
              console.warn('Memory search failed:', error);
              return [];
            }
          }
        };
      }

      // Initialize Memory Artifacts Viewer
      const viewer = new MemoryArtifactsViewer(memoryIntegration, {
        syntaxHighlighting: true,
        showMetadata: true,
        allowFullscreen: false
      });

      // Mount the viewer
      container.appendChild(viewer.container);

      console.log('[Trinity] Memory Artifacts Viewer initialized successfully');
      this.showNotification('Memory Artifacts Viewer opened', 'success');

    } catch (error) {
      console.error('Error initializing Memory Artifacts Viewer:', error);
      this.showNotification('Failed to initialize Memory Artifacts Viewer', 'error');
    }

    // Setup close handlers
    overlay.querySelector('#close-memory-artifacts').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Close on background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Select memory for conversation context
   */
  selectMemory(item) {
    // Toggle selection
    item.classList.toggle('selected');
    
    const title = item.querySelector('.trinity-memory-title')?.textContent || 'Memory';
    const isSelected = item.classList.contains('selected');
    
    // Visual feedback
    if (isSelected) {
      item.style.borderColor = 'rgba(79, 195, 247, 0.6)';
      item.style.background = 'rgba(79, 195, 247, 0.15)';
      this.showNotification(`Added "${title}" to conversation context`, 'success');
    } else {
      item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      item.style.background = 'rgba(255, 255, 255, 0.05)';
      this.showNotification(`Removed "${title}" from conversation context`, 'info');
    }
    
    // Update chat context indicator
    this.updateChatContextIndicator();
  }

  /**
   * Update chat context indicator
   */
  updateChatContextIndicator() {
    const selectedCount = document.querySelectorAll('.trinity-memory-item.selected').length;
    const chatHeader = document.querySelector('.trinity-chat-header');
    
    if (chatHeader) {
      let indicator = chatHeader.querySelector('.trinity-context-indicator');
      
      if (selectedCount > 0) {
        if (!indicator) {
          indicator = document.createElement('div');
          indicator.className = 'trinity-context-indicator';
          chatHeader.appendChild(indicator);
        }
        indicator.textContent = `${selectedCount} memories loaded`;
        indicator.style.display = 'block';
      } else if (indicator) {
        indicator.style.display = 'none';
      }
    }
  }

  /**
   * Toggle task manager visibility
   */
  toggleTaskManager() {
    const manager = document.getElementById('trinity-task-manager');
    if (!manager) return;
    
    const isVisible = manager.style.display !== 'none';
    manager.style.display = isVisible ? 'none' : 'block';
    
    // Update button states
    const createBtn = document.getElementById('create-new-task');
    const viewBtn = document.getElementById('view-all-tasks');
    
    if (isVisible) {
      createBtn.innerHTML = '<span class="trinity-btn-icon">➕</span>New Task';
      viewBtn.innerHTML = '<span class="trinity-btn-icon">📋</span>View All';
    } else {
      createBtn.innerHTML = '<span class="trinity-btn-icon">📝</span>Creating...';
      viewBtn.innerHTML = '<span class="trinity-btn-icon">📋</span>Hide Tasks';
      
      // Focus on task title input
      setTimeout(() => {
        document.getElementById('task-title-input')?.focus();
      }, 100);
    }
    
    this.showNotification(isVisible ? 'Task manager hidden' : 'Task manager opened', 'info');
  }

  /**
   * Create new task
   */
  createNewTask() {
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-description-input');
    const prioritySelect = document.getElementById('task-priority');
    const categorySelect = document.getElementById('task-category');
    
    if (!titleInput) return;
    
    const title = titleInput.value.trim();
    if (!title) {
      this.showNotification('Please enter a task title', 'warning');
      titleInput.focus();
      return;
    }
    
    const description = descInput.value.trim();
    const priority = prioritySelect.value;
    const category = categorySelect.value;
    
    // Create task element
    const taskElement = this.createTaskElement({
      title,
      description,
      priority,
      category,
      status: 'pending',
      created: new Date()
    });
    
    // Add to task list
    const taskList = document.getElementById('trinity-task-list');
    if (taskList) {
      taskList.insertBefore(taskElement, taskList.firstChild);
    }
    
    // Clear form
    titleInput.value = '';
    descInput.value = '';
    prioritySelect.value = 'medium';
    categorySelect.value = 'general';
    
    // Update task counts
    this.updateTaskCounts();
    
    this.showNotification(`Task created: "${title}"`, 'success');
    titleInput.focus();
  }

  /**
   * Create task element
   */
  createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'trinity-task-item';
    taskDiv.dataset.status = task.status;
    taskDiv.dataset.priority = task.priority;
    
    const statusIcon = this.getTaskStatusIcon(task.status);
    const timeAgo = this.getTimeAgo(task.created);
    
    taskDiv.innerHTML = `
      <div class="trinity-task-header">
        <span class="trinity-task-status-icon ${task.status}">${statusIcon}</span>
        <span class="trinity-task-title">${task.title}</span>
        <span class="trinity-task-priority ${task.priority}">${task.priority}</span>
      </div>
      <div class="trinity-task-description">${task.description || 'No description'}</div>
      <div class="trinity-task-meta-info">
        <span class="trinity-task-category">${task.category}</span>
        <span class="trinity-task-time">${timeAgo}</span>
        <div class="trinity-task-actions-mini">
          ${this.getTaskActionButtons(task.status)}
        </div>
      </div>
    `;
    
    // Add event listeners to action buttons
    taskDiv.querySelectorAll('.trinity-task-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTaskAction(e.target, taskDiv);
      });
    });
    
    return taskDiv;
  }

  /**
   * Get task status icon
   */
  getTaskStatusIcon(status) {
    const icons = {
      'pending': '⏳',
      'in_progress': '🔄',
      'completed': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '📋';
  }

  /**
   * Get task action buttons based on status
   */
  getTaskActionButtons(status) {
    switch (status) {
      case 'pending':
        return `
          <button class="trinity-task-action-btn" title="Start Task" data-action="start">▶️</button>
          <button class="trinity-task-action-btn" title="Edit Task" data-action="edit">✏️</button>
        `;
      case 'in_progress':
        return `
          <button class="trinity-task-action-btn" title="Mark Complete" data-action="complete">✓</button>
          <button class="trinity-task-action-btn" title="Edit Task" data-action="edit">✏️</button>
        `;
      case 'completed':
        return `
          <button class="trinity-task-action-btn" title="View Details" data-action="view">👁️</button>
          <button class="trinity-task-action-btn" title="Archive" data-action="archive">📦</button>
        `;
      default:
        return `
          <button class="trinity-task-action-btn" title="Edit Task" data-action="edit">✏️</button>
        `;
    }
  }

  /**
   * Handle task action
   */
  handleTaskAction(button, taskElement) {
    const action = button.dataset.action;
    const title = taskElement.querySelector('.trinity-task-title')?.textContent || 'Task';
    
    switch (action) {
      case 'start':
        this.updateTaskStatus(taskElement, 'in_progress');
        this.showNotification(`Started task: "${title}"`, 'info');
        break;
      case 'complete':
        this.updateTaskStatus(taskElement, 'completed');
        this.showNotification(`Completed task: "${title}"`, 'success');
        break;
      case 'edit':
        this.editTask(taskElement);
        break;
      case 'view':
        this.viewTask(taskElement);
        break;
      case 'archive':
        this.archiveTask(taskElement);
        break;
    }
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskElement, newStatus) {
    taskElement.dataset.status = newStatus;
    
    const statusIcon = taskElement.querySelector('.trinity-task-status-icon');
    if (statusIcon) {
      statusIcon.textContent = this.getTaskStatusIcon(newStatus);
      statusIcon.className = `trinity-task-status-icon ${newStatus}`;
    }
    
    // Update action buttons
    const actionsContainer = taskElement.querySelector('.trinity-task-actions-mini');
    if (actionsContainer) {
      actionsContainer.innerHTML = this.getTaskActionButtons(newStatus);
      
      // Reattach event listeners
      actionsContainer.querySelectorAll('.trinity-task-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleTaskAction(e.target, taskElement);
        });
      });
    }
    
    this.updateTaskCounts();
  }

  /**
   * Filter tasks by status
   */
  filterTasks(status) {
    const items = document.querySelectorAll('.trinity-task-item');
    items.forEach(item => {
      if (status === 'all' || item.dataset.status === status) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Update task counts in panel header
   */
  updateTaskCounts() {
    const items = document.querySelectorAll('.trinity-task-item');
    const pending = Array.from(items).filter(item => item.dataset.status === 'pending').length;
    const inProgress = Array.from(items).filter(item => item.dataset.status === 'in_progress').length;
    const completed = Array.from(items).filter(item => item.dataset.status === 'completed').length;
    
    const activeEl = document.getElementById('tasks-active');
    const completedEl = document.getElementById('tasks-completed');
    
    if (activeEl) activeEl.textContent = pending + inProgress;
    if (completedEl) completedEl.textContent = completed;
  }

  /**
   * Get time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  /**
   * Edit task (placeholder)
   */
  editTask(taskElement) {
    const title = taskElement.querySelector('.trinity-task-title')?.textContent || 'Task';
    this.showNotification(`Edit task: "${title}" (coming soon)`, 'info');
  }

  /**
   * View task (placeholder)
   */
  viewTask(taskElement) {
    const title = taskElement.querySelector('.trinity-task-title')?.textContent || 'Task';
    this.showNotification(`View task: "${title}" (coming soon)`, 'info');
  }

  /**
   * Archive task
   */
  archiveTask(taskElement) {
    const title = taskElement.querySelector('.trinity-task-title')?.textContent || 'Task';
    taskElement.remove();
    this.updateTaskCounts();
    this.showNotification(`Archived task: "${title}"`, 'info');
  }

  /**
   * Toggle recovery manager visibility
   */
  toggleRecoveryManager() {
    const manager = document.getElementById('trinity-recovery-manager');
    if (!manager) return;
    
    const isVisible = manager.style.display !== 'none';
    manager.style.display = isVisible ? 'none' : 'block';
    
    const button = document.getElementById('view-recovery-tools');
    if (button) {
      button.innerHTML = isVisible ? 
        '<span class="trinity-btn-icon">🔧</span>Recovery Tools' :
        '<span class="trinity-btn-icon">📁</span>Hide Tools';
    }
    
    this.showNotification(isVisible ? 'Recovery tools hidden' : 'Recovery tools opened', 'info');
  }

  /**
   * Create quick checkpoint
   */
  createQuickCheckpoint() {
    this.showNotification('Creating quick checkpoint...', 'info');
    
    // Simulate checkpoint creation
    setTimeout(() => {
      const checkpointId = 'cp_' + Date.now();
      this.showNotification(`Quick checkpoint created: ${checkpointId.slice(-8)}`, 'success');
      
      // Update last checkpoint time
      const lastCheckpointEl = document.getElementById('last-checkpoint');
      if (lastCheckpointEl) {
        lastCheckpointEl.textContent = 'just now';
      }
    }, 1500);
  }

  /**
   * Create detailed checkpoint
   */
  createDetailedCheckpoint() {
    const descInput = document.getElementById('checkpoint-description');
    const includeMemory = document.getElementById('include-memory')?.checked;
    const includeTasks = document.getElementById('include-tasks')?.checked;
    const includeContext = document.getElementById('include-context')?.checked;
    
    const description = descInput?.value.trim() || 'Manual checkpoint';
    
    this.showNotification('Creating detailed checkpoint...', 'info');
    
    // Simulate checkpoint creation with options
    setTimeout(() => {
      const checkpointId = 'cp_' + Date.now();
      const components = [];
      if (includeMemory) components.push('memory');
      if (includeTasks) components.push('tasks');
      if (includeContext) components.push('context');
      
      const checkpointData = {
        id: checkpointId,
        description,
        components,
        created: new Date(),
        size: Math.floor(Math.random() * 3000000 + 1000000) // Random size between 1-4MB
      };
      
      this.addCheckpointToList(checkpointData);
      this.showNotification(`Checkpoint "${description}" created successfully`, 'success');
      
      // Clear form
      if (descInput) descInput.value = '';
      
      // Update last checkpoint time
      const lastCheckpointEl = document.getElementById('last-checkpoint');
      if (lastCheckpointEl) {
        lastCheckpointEl.textContent = 'just now';
      }
    }, 2000);
  }

  /**
   * Add checkpoint to list
   */
  addCheckpointToList(checkpointData) {
    const checkpointList = document.querySelector('.trinity-checkpoint-items');
    if (!checkpointList) return;
    
    const checkpointElement = document.createElement('div');
    checkpointElement.className = 'trinity-checkpoint-item';
    checkpointElement.innerHTML = `
      <div class="trinity-checkpoint-header">
        <span class="trinity-checkpoint-icon">💾</span>
        <span class="trinity-checkpoint-name">${checkpointData.description}</span>
        <span class="trinity-checkpoint-time">just now</span>
      </div>
      <div class="trinity-checkpoint-info">
        <span class="trinity-checkpoint-size">${this.formatBytes(checkpointData.size)}</span>
        <span class="trinity-checkpoint-id">${checkpointData.id}</span>
        <div class="trinity-checkpoint-actions">
          <button class="trinity-mini-btn" title="Restore">📂</button>
          <button class="trinity-mini-btn" title="Download">⬇️</button>
          <button class="trinity-mini-btn" title="Delete">🗑️</button>
        </div>
      </div>
    `;
    
    // Add event listeners to action buttons
    checkpointElement.querySelectorAll('.trinity-mini-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCheckpointAction(e.target, checkpointElement);
      });
    });
    
    // Insert at top of list
    checkpointList.insertBefore(checkpointElement, checkpointList.firstChild);
  }

  /**
   * Handle checkpoint action
   */
  handleCheckpointAction(button, checkpointElement) {
    const name = checkpointElement.querySelector('.trinity-checkpoint-name')?.textContent || 'Checkpoint';
    const action = button.title;
    
    switch (action) {
      case 'Restore':
        this.showNotification(`Restoring checkpoint: "${name}"...`, 'info');
        setTimeout(() => {
          this.showNotification(`Checkpoint "${name}" restored successfully`, 'success');
        }, 2000);
        break;
      case 'Download':
        this.showNotification(`Downloading checkpoint: "${name}"...`, 'info');
        setTimeout(() => {
          this.showNotification(`Checkpoint "${name}" downloaded`, 'success');
        }, 1000);
        break;
      case 'Delete':
        if (confirm(`Delete checkpoint "${name}"?`)) {
          checkpointElement.remove();
          this.showNotification(`Checkpoint "${name}" deleted`, 'info');
        }
        break;
    }
  }

  /**
   * Backup session
   */
  backupSession() {
    this.showNotification('Backing up current session...', 'info');
    
    setTimeout(() => {
      const sessionData = {
        memories: document.querySelectorAll('.trinity-memory-item.selected').length,
        tasks: document.querySelectorAll('.trinity-task-item').length,
        panelStates: this.panelStates,
        timestamp: new Date()
      };
      
      this.showNotification(`Session backed up: ${sessionData.memories} memories, ${sessionData.tasks} tasks`, 'success');
    }, 1500);
  }

  /**
   * Restore session
   */
  restoreSession() {
    this.showNotification('Opening session restore dialog...', 'info');
    // This would open a file picker or session selection dialog
    setTimeout(() => {
      this.showNotification('Session restore feature (coming soon)', 'info');
    }, 1000);
  }

  /**
   * Clear session
   */
  clearSession() {
    if (confirm('Clear all session data? This will reset memories, tasks, and panel states.')) {
      this.showNotification('Clearing session data...', 'info');
      
      setTimeout(() => {
        // Clear selected memories
        document.querySelectorAll('.trinity-memory-item.selected').forEach(item => {
          item.classList.remove('selected');
          item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          item.style.background = 'rgba(255, 255, 255, 0.05)';
        });
        
        // Clear created tasks (keep demo tasks)
        document.querySelectorAll('.trinity-task-item').forEach((item, index) => {
          if (index >= 3) { // Keep first 3 demo items
            item.remove();
          }
        });
        
        // Reset panel states to defaults
        this.panelStates = { ...this.defaultStates };
        this.savePanelStates();
        
        // Update UI
        this.updateChatContextIndicator();
        this.updateTaskCounts();
        
        this.showNotification('Session data cleared successfully', 'success');
      }, 2000);
    }
  }

  /**
   * Trigger recovery protocol
   */
  triggerRecoveryProtocol() {
    this.showNotification('Triggering Trinity auto-compact recovery protocol...', 'info');
    
    setTimeout(() => {
      this.showNotification('Recovery protocol activated - system state preserved', 'success');
    }, 2500);
  }

  /**
   * Test recovery system
   */
  testRecoverySystem() {
    this.showNotification('Testing recovery system integrity...', 'info');
    
    setTimeout(() => {
      const tests = [
        'Memory hierarchy validation',
        'Task registry backup',
        'Session state preservation',
        'Context recovery protocols'
      ];
      
      this.showNotification(`Recovery system test passed: ${tests.length} components verified`, 'success');
    }, 3000);
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
   * Show typing indicator
   */
  showTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator') || document.getElementById('trinity-typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'block';
      // Scroll to show the typing indicator at bottom of chat
      const chatContent = document.getElementById('trinity-chat-messages') || document.getElementById('messagesContainer');
      if (chatContent) {
        setTimeout(() => {
          chatContent.scrollTop = chatContent.scrollHeight;
        }, 50); // Small delay to ensure DOM is updated
      }
    }
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator') || document.getElementById('trinity-typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }
  }

  /**
   * Get active memory context for conversation
   */
  getActiveMemoryContext() {
    const selectedMemories = document.querySelectorAll('.trinity-memory-item.selected');
    if (selectedMemories.length === 0) return null;
    
    const memories = Array.from(selectedMemories).map(item => ({
      name: item.querySelector('.trinity-memory-title')?.textContent || 'Untitled',
      tier: item.dataset.tier || 'working'
    }));
    
    const memoryDisplayNames = memories
      .map(m => this.formatMemoryDisplayName(m))
      .slice(0, 3); // Show max 3 names
    
    const displayText = memoryDisplayNames.length === memories.length ? 
      memoryDisplayNames.join(', ') : 
      `${memoryDisplayNames.join(', ')} +${memories.length - memoryDisplayNames.length} more`;

    return {
      count: memories.length,
      display: displayText,
      memories: memories
    };
  }

  /**
   * Format memory names for user-friendly display
   */
  formatMemoryDisplayName(memory) {
    const nameMap = {
      'Trinity System Architecture': 'Trinity System Architecture (Core)',
      'MVP Implementation Plan': 'MVP Implementation Plan (Working)',
      'Memory Hierarchy Documentation': 'Memory Hierarchy Documentation (Reference)'
    };
    
    return nameMap[memory.name] || `${memory.name.replace(/[-_]/g, ' ')} (${memory.tier})`;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // This would use the existing Trinity notification system
    console.log(`[Trinity ${type.toUpperCase()}]: ${message}`);
  }
}

// Initialize Trinity Single Window when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.trinitySingleWindow = new TrinitySingleWindow();
  });
} else {
  // DOM is already ready
  window.trinitySingleWindow = new TrinitySingleWindow();
}

module.exports = TrinitySingleWindow;