/**
 * Memory Explorer Panel - Task 1.1.2 Implementation
 * Dedicated memory management interface for Trinity MVP
 * 
 * Provides professional memory browsing, search, and management capabilities
 */

class MemoryExplorerPanel {
  constructor(options = {}) {
    this.memoryHierarchy = options.memoryHierarchy;
    this.isVisible = false;
    this.currentTier = 'all';
    this.searchQuery = '';
    this.selectedEntries = new Set();
    this.sortBy = 'modified'; // modified, created, title, size
    this.sortOrder = 'desc';
    
    this.initialize();
  }

  /**
   * Initialize the memory explorer panel
   */
  initialize() {
    this.createPanelStructure();
    this.setupEventListeners();
    this.addStyles();
    
    console.log('🔍 Memory Explorer Panel initialized');
  }

  /**
   * Create the panel HTML structure
   */
  createPanelStructure() {
    const panel = document.createElement('div');
    panel.id = 'trinity-memory-explorer';
    panel.className = 'trinity-memory-explorer hidden';
    
    panel.innerHTML = `
      <div class="trinity-memory-header">
        <div class="trinity-memory-title">
          <span class="trinity-memory-icon">🧠</span>
          <h2>Memory Explorer</h2>
          <span class="trinity-memory-stats" id="memory-stats-display">Loading...</span>
        </div>
        <div class="trinity-memory-controls">
          <button class="trinity-memory-btn" id="memory-refresh-btn" title="Refresh">
            <span>🔄</span>
          </button>
          <button class="trinity-memory-btn" id="memory-optimize-btn" title="Optimize Memory">
            <span>⚡</span>
          </button>
          <button class="trinity-memory-btn" id="memory-close-btn" title="Close">
            <span>✕</span>
          </button>
        </div>
      </div>
      
      <div class="trinity-memory-toolbar">
        <div class="trinity-memory-filters">
          <select id="memory-tier-filter" class="trinity-memory-select">
            <option value="all">All Tiers</option>
            <option value="core">🎯 Core Memory</option>
            <option value="working">⚡ Working Memory</option>
            <option value="reference">📚 Reference Memory</option>
            <option value="historical">📜 Historical Memory</option>
          </select>
          
          <select id="memory-sort-select" class="trinity-memory-select">
            <option value="modified">Sort by Modified</option>
            <option value="created">Sort by Created</option>
            <option value="title">Sort by Title</option>
            <option value="size">Sort by Size</option>
          </select>
          
          <button id="memory-sort-order" class="trinity-memory-btn trinity-sort-btn" title="Toggle Sort Order">
            <span id="sort-order-icon">⬇️</span>
          </button>
        </div>
        
        <div class="trinity-memory-search">
          <input 
            type="text" 
            id="memory-search-input" 
            placeholder="Search memories..." 
            class="trinity-memory-search-input"
          >
          <button class="trinity-memory-search-btn" id="memory-search-btn">
            <span>🔍</span>
          </button>
        </div>
      </div>
      
      <div class="trinity-memory-content">
        <div class="trinity-memory-sidebar">
          <div class="trinity-memory-tier-overview">
            <h3>Memory Tiers</h3>
            <div id="memory-tier-cards"></div>
          </div>
          
          <div class="trinity-memory-actions">
            <h3>Quick Actions</h3>
            <button class="trinity-memory-action-btn" id="memory-cleanup-btn">
              <span class="trinity-action-icon">🧹</span>
              <span>Cleanup Old Memories</span>
            </button>
            <button class="trinity-memory-action-btn" id="memory-backup-btn">
              <span class="trinity-action-icon">💾</span>
              <span>Create Backup</span>
            </button>
            <button class="trinity-memory-action-btn" id="memory-analyze-btn">
              <span class="trinity-action-icon">📊</span>
              <span>Analyze Patterns</span>
            </button>
          </div>
        </div>
        
        <div class="trinity-memory-main">
          <div class="trinity-memory-list" id="memory-entries-list">
            <!-- Memory entries will be populated here -->
          </div>
          
          <div class="trinity-memory-pagination">
            <button class="trinity-memory-btn" id="memory-prev-page" disabled>← Previous</button>
            <span class="trinity-memory-page-info" id="memory-page-info">Page 1 of 1</span>
            <button class="trinity-memory-btn" id="memory-next-page" disabled>Next →</button>
          </div>
        </div>
      </div>
      
      <div class="trinity-memory-details" id="memory-details-panel" style="display: none;">
        <div class="trinity-memory-details-header">
          <h3>Memory Details</h3>
          <button class="trinity-memory-btn" id="memory-details-close">✕</button>
        </div>
        <div class="trinity-memory-details-content" id="memory-details-content">
          <!-- Details content will be populated here -->
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Panel controls
    document.getElementById('memory-close-btn').addEventListener('click', () => this.hide());
    document.getElementById('memory-refresh-btn').addEventListener('click', () => this.refresh());
    document.getElementById('memory-optimize-btn').addEventListener('click', () => this.optimizeMemory());
    
    // Filters and search
    document.getElementById('memory-tier-filter').addEventListener('change', (e) => {
      this.currentTier = e.target.value;
      this.loadMemories();
    });
    
    document.getElementById('memory-sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.loadMemories();
    });
    
    document.getElementById('memory-sort-order').addEventListener('click', () => {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
      document.getElementById('sort-order-icon').textContent = this.sortOrder === 'desc' ? '⬇️' : '⬆️';
      this.loadMemories();
    });
    
    document.getElementById('memory-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.debounceSearch();
    });
    
    document.getElementById('memory-search-btn').addEventListener('click', () => this.loadMemories());
    
    // Quick actions
    document.getElementById('memory-cleanup-btn').addEventListener('click', () => this.cleanupMemories());
    document.getElementById('memory-backup-btn').addEventListener('click', () => this.createBackup());
    document.getElementById('memory-analyze-btn').addEventListener('click', () => this.analyzePatterns());
    
    // Details panel
    document.getElementById('memory-details-close').addEventListener('click', () => {
      document.getElementById('memory-details-panel').style.display = 'none';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isVisible) {
        if (e.key === 'Escape') {
          this.hide();
        } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
          e.preventDefault();
          this.refresh();
        } else if (e.ctrlKey && e.key === 'f') {
          e.preventDefault();
          document.getElementById('memory-search-input').focus();
        }
      }
    });
  }

  /**
   * Show the memory explorer panel
   */
  async show() {
    const panel = document.getElementById('trinity-memory-explorer');
    panel.classList.remove('hidden');
    this.isVisible = true;
    
    // Load initial data
    await this.loadTierOverview();
    await this.loadMemories();
    
    // Focus search input
    setTimeout(() => {
      document.getElementById('memory-search-input').focus();
    }, 100);
    
    console.log('🔍 Memory Explorer Panel shown');
  }

  /**
   * Hide the memory explorer panel
   */
  hide() {
    const panel = document.getElementById('trinity-memory-explorer');
    panel.classList.add('hidden');
    this.isVisible = false;
    
    console.log('🔍 Memory Explorer Panel hidden');
  }

  /**
   * Refresh all data
   */
  async refresh() {
    if (!this.isVisible) return;
    
    await this.loadTierOverview();
    await this.loadMemories();
    
    // Show refresh notification
    this.showNotification('Memory explorer refreshed', 'success');
  }

  /**
   * Load memory tier overview
   */
  async loadTierOverview() {
    if (!this.memoryHierarchy) return;
    
    try {
      const stats = await this.memoryHierarchy.getStats();
      
      // Update header stats
      const totalFiles = stats.total?.files || 0;
      const totalSize = this.formatBytes(stats.total?.size || 0);
      document.getElementById('memory-stats-display').textContent = `${totalFiles} memories (${totalSize})`;
      
      // Update tier cards
      const tierCardsContainer = document.getElementById('memory-tier-cards');
      tierCardsContainer.innerHTML = Object.entries(stats.tiers || {})
        .map(([tier, data]) => `
          <div class="trinity-memory-tier-card ${tier}" onclick="window.memoryExplorer.selectTier('${tier}')">
            <div class="trinity-tier-card-header">
              <span class="trinity-tier-card-icon">${this.getTierIcon(tier)}</span>
              <span class="trinity-tier-card-name">${tier}</span>
            </div>
            <div class="trinity-tier-card-stats">
              <div class="trinity-tier-card-files">${data.files} files</div>
              <div class="trinity-tier-card-size">${this.formatBytes(data.size)}</div>
            </div>
          </div>
        `).join('');
        
    } catch (error) {
      console.error('Failed to load tier overview:', error);
      this.showNotification('Failed to load memory statistics', 'error');
    }
  }

  /**
   * Load memories based on current filters
   */
  async loadMemories() {
    if (!this.memoryHierarchy) return;
    
    try {
      // Build search criteria
      const criteria = {};
      
      if (this.currentTier !== 'all') {
        criteria.tier = this.currentTier;
      }
      
      if (this.searchQuery.trim()) {
        criteria.title = this.searchQuery.trim();
      }
      
      // Retrieve memories
      const memories = await this.memoryHierarchy.retrieve(criteria) || [];
      
      // Sort memories
      this.sortMemories(memories);
      
      // Display memories
      this.displayMemories(memories);
      
    } catch (error) {
      console.error('Failed to load memories:', error);
      this.showNotification('Failed to load memories', 'error');
    }
  }

  /**
   * Sort memories array
   */
  sortMemories(memories) {
    memories.sort((a, b) => {
      let aValue, bValue;
      
      switch (this.sortBy) {
        case 'title':
          aValue = a.metadata?.title || '';
          bValue = b.metadata?.title || '';
          break;
        case 'created':
          aValue = new Date(a.timestamps?.created || 0);
          bValue = new Date(b.timestamps?.created || 0);
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'modified':
        default:
          aValue = new Date(a.timestamps?.modified || 0);
          bValue = new Date(b.timestamps?.modified || 0);
          break;
      }
      
      if (this.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }

  /**
   * Display memories in the list
   */
  displayMemories(memories) {
    const listContainer = document.getElementById('memory-entries-list');
    
    if (!memories || memories.length === 0) {
      listContainer.innerHTML = `
        <div class="trinity-memory-empty">
          <span class="trinity-empty-icon">🔍</span>
          <p>No memories found</p>
          <p class="trinity-empty-hint">Try adjusting your filters or search terms</p>
        </div>
      `;
      return;
    }
    
    listContainer.innerHTML = memories.map(memory => `
      <div class="trinity-memory-entry" onclick="window.memoryExplorer.showMemoryDetails('${memory.id}')">
        <div class="trinity-memory-entry-header">
          <span class="trinity-memory-entry-icon">${this.getTierIcon(memory.tier)}</span>
          <span class="trinity-memory-entry-title">${this.escapeHtml(memory.metadata?.title || 'Untitled')}</span>
          <span class="trinity-memory-entry-tier">${memory.tier}</span>
        </div>
        <div class="trinity-memory-entry-meta">
          <span class="trinity-memory-entry-date">${this.formatDate(memory.timestamps?.modified)}</span>
          <span class="trinity-memory-entry-size">${this.formatBytes(memory.size || 0)}</span>
          ${memory.metadata?.tags ? `<span class="trinity-memory-entry-tags">${memory.metadata.tags.slice(0, 3).map(tag => `<span class="trinity-tag">${tag}</span>`).join('')}</span>` : ''}
        </div>
        <div class="trinity-memory-entry-description">
          ${this.escapeHtml((memory.metadata?.description || '').substring(0, 100))}${memory.metadata?.description?.length > 100 ? '...' : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Show memory details
   */
  async showMemoryDetails(memoryId) {
    try {
      const memory = await this.memoryHierarchy.retrieve({ id: memoryId });
      if (!memory || memory.length === 0) return;
      
      const memoryData = memory[0];
      const detailsPanel = document.getElementById('memory-details-panel');
      const detailsContent = document.getElementById('memory-details-content');
      
      detailsContent.innerHTML = `
        <div class="trinity-memory-detail-section">
          <h4>Metadata</h4>
          <div class="trinity-memory-detail-grid">
            <div class="trinity-memory-detail-item">
              <span class="trinity-detail-label">Title:</span>
              <span class="trinity-detail-value">${this.escapeHtml(memoryData.metadata?.title || 'Untitled')}</span>
            </div>
            <div class="trinity-memory-detail-item">
              <span class="trinity-detail-label">Tier:</span>
              <span class="trinity-detail-value">${this.getTierIcon(memoryData.tier)} ${memoryData.tier}</span>
            </div>
            <div class="trinity-memory-detail-item">
              <span class="trinity-detail-label">Created:</span>
              <span class="trinity-detail-value">${this.formatDate(memoryData.timestamps?.created)}</span>
            </div>
            <div class="trinity-memory-detail-item">
              <span class="trinity-detail-label">Modified:</span>
              <span class="trinity-detail-value">${this.formatDate(memoryData.timestamps?.modified)}</span>
            </div>
            <div class="trinity-memory-detail-item">
              <span class="trinity-detail-label">Size:</span>
              <span class="trinity-detail-value">${this.formatBytes(memoryData.size || 0)}</span>
            </div>
            ${memoryData.metadata?.tags ? `
              <div class="trinity-memory-detail-item">
                <span class="trinity-detail-label">Tags:</span>
                <span class="trinity-detail-value">${memoryData.metadata.tags.map(tag => `<span class="trinity-tag">${tag}</span>`).join(' ')}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${memoryData.metadata?.description ? `
          <div class="trinity-memory-detail-section">
            <h4>Description</h4>
            <p class="trinity-memory-description">${this.escapeHtml(memoryData.metadata.description)}</p>
          </div>
        ` : ''}
        
        <div class="trinity-memory-detail-section">
          <h4>Content Preview</h4>
          <div class="trinity-memory-content-preview">
            <pre>${this.escapeHtml(JSON.stringify(memoryData.content, null, 2).substring(0, 1000))}${JSON.stringify(memoryData.content, null, 2).length > 1000 ? '\n...' : ''}</pre>
          </div>
        </div>
        
        <div class="trinity-memory-detail-actions">
          <button class="trinity-memory-btn trinity-btn-primary" onclick="window.memoryExplorer.editMemory('${memoryId}')">Edit</button>
          <button class="trinity-memory-btn trinity-btn-secondary" onclick="window.memoryExplorer.duplicateMemory('${memoryId}')">Duplicate</button>
          <button class="trinity-memory-btn trinity-btn-danger" onclick="window.memoryExplorer.deleteMemory('${memoryId}')">Delete</button>
        </div>
      `;
      
      detailsPanel.style.display = 'block';
      
    } catch (error) {
      console.error('Failed to show memory details:', error);
      this.showNotification('Failed to load memory details', 'error');
    }
  }

  /**
   * Select tier filter
   */
  selectTier(tier) {
    this.currentTier = tier;
    document.getElementById('memory-tier-filter').value = tier;
    this.loadMemories();
  }

  /**
   * Utility methods
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

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadMemories();
    }, 300);
  }

  showNotification(message, type = 'info') {
    // Use Trinity status bar notification system if available
    if (window.trinityStatusBar) {
      window.trinityStatusBar.showNotification(message, type);
    } else {
      console.log(`Memory Explorer: ${message}`);
    }
  }

  // Placeholder methods for future implementation
  optimizeMemory() {
    this.showNotification('Memory optimization started...', 'info');
    // TODO: Implement memory optimization
  }

  cleanupMemories() {
    this.showNotification('Memory cleanup started...', 'info');
    // TODO: Implement memory cleanup
  }

  createBackup() {
    this.showNotification('Creating memory backup...', 'info');
    // TODO: Implement memory backup
  }

  analyzePatterns() {
    this.showNotification('Analyzing memory patterns...', 'info');
    // TODO: Implement pattern analysis
  }

  editMemory(memoryId) {
    this.showNotification('Memory editing coming soon...', 'info');
    // TODO: Implement memory editing
  }

  duplicateMemory(memoryId) {
    this.showNotification('Memory duplication coming soon...', 'info');
    // TODO: Implement memory duplication
  }

  deleteMemory(memoryId) {
    this.showNotification('Memory deletion coming soon...', 'info');
    // TODO: Implement memory deletion with confirmation
  }

  /**
   * Add styles for the memory explorer
   */
  addStyles() {
    if (document.getElementById('trinity-memory-explorer-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'trinity-memory-explorer-styles';
    styles.textContent = `
      .trinity-memory-explorer {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 15, 15, 0.98);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        backdrop-filter: blur(10px);
      }
      
      .trinity-memory-explorer.hidden {
        display: none;
      }
      
      .trinity-memory-header {
        background: rgba(20, 20, 20, 0.9);
        border-bottom: 1px solid rgba(79, 195, 247, 0.3);
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .trinity-memory-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .trinity-memory-icon {
        font-size: 24px;
      }
      
      .trinity-memory-title h2 {
        margin: 0;
        color: #e0e0e0;
        font-size: 20px;
        font-weight: 600;
      }
      
      .trinity-memory-stats {
        color: #4fc3f7;
        font-size: 14px;
        font-weight: 500;
      }
      
      .trinity-memory-controls {
        display: flex;
        gap: 8px;
      }
      
      .trinity-memory-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .trinity-memory-btn:hover {
        background: rgba(79, 195, 247, 0.2);
        border-color: rgba(79, 195, 247, 0.4);
      }
      
      .trinity-memory-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .trinity-memory-toolbar {
        background: rgba(25, 25, 25, 0.9);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }
      
      .trinity-memory-filters {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      
      .trinity-memory-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
      }
      
      .trinity-memory-search {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .trinity-memory-search-input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        min-width: 250px;
      }
      
      .trinity-memory-search-input:focus {
        outline: none;
        border-color: rgba(79, 195, 247, 0.5);
        background: rgba(79, 195, 247, 0.1);
      }
      
      .trinity-memory-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .trinity-memory-sidebar {
        width: 280px;
        background: rgba(20, 20, 20, 0.9);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px;
        overflow-y: auto;
      }
      
      .trinity-memory-sidebar h3 {
        margin: 0 0 16px 0;
        color: #e0e0e0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .trinity-memory-tier-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trinity-memory-tier-card:hover {
        background: rgba(79, 195, 247, 0.1);
        border-color: rgba(79, 195, 247, 0.3);
      }
      
      .trinity-tier-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .trinity-tier-card-name {
        font-weight: 600;
        color: #e0e0e0;
        text-transform: capitalize;
      }
      
      .trinity-tier-card-stats {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #888;
      }
      
      .trinity-memory-actions {
        margin-top: 24px;
      }
      
      .trinity-memory-action-btn {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }
      
      .trinity-memory-action-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(79, 195, 247, 0.3);
      }
      
      .trinity-memory-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .trinity-memory-list {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }
      
      .trinity-memory-entry {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .trinity-memory-entry:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(79, 195, 247, 0.3);
      }
      
      .trinity-memory-entry-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .trinity-memory-entry-title {
        font-weight: 600;
        color: #e0e0e0;
        flex: 1;
      }
      
      .trinity-memory-entry-tier {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .trinity-memory-entry-meta {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #888;
      }
      
      .trinity-memory-entry-description {
        color: #b0b0b0;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .trinity-memory-empty {
        text-align: center;
        padding: 60px 20px;
        color: #888;
      }
      
      .trinity-empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }
      
      .trinity-memory-pagination {
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
      }
      
      .trinity-memory-details {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(20, 20, 20, 0.98);
        border: 1px solid rgba(79, 195, 247, 0.3);
        border-radius: 12px;
        max-width: 700px;
        max-height: 80vh;
        overflow: hidden;
        z-index: 10001;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      }
      
      .trinity-memory-details-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .trinity-memory-details-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .trinity-memory-detail-section {
        margin-bottom: 24px;
      }
      
      .trinity-memory-detail-section h4 {
        margin: 0 0 12px 0;
        color: #e0e0e0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .trinity-memory-detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .trinity-memory-detail-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .trinity-detail-label {
        font-size: 12px;
        color: #888;
        font-weight: 500;
      }
      
      .trinity-detail-value {
        color: #e0e0e0;
        font-size: 14px;
      }
      
      .trinity-memory-content-preview {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 16px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .trinity-memory-content-preview pre {
        margin: 0;
        color: #e0e0e0;
        white-space: pre-wrap;
      }
      
      .trinity-memory-detail-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .trinity-tag {
        background: rgba(79, 195, 247, 0.2);
        color: #4fc3f7;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 500;
        margin-right: 4px;
      }
      
      .trinity-btn-primary {
        background: #4fc3f7;
        color: #000;
      }
      
      .trinity-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #e0e0e0;
      }
      
      .trinity-btn-danger {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        border-color: rgba(244, 67, 54, 0.3);
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize memory explorer and make it globally available
window.memoryExplorer = new MemoryExplorerPanel();

module.exports = MemoryExplorerPanel;