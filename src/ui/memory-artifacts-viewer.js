/**
 * Memory Artifacts Viewer
 * Claude Desktop-style artifact viewer for Trinity MVP memory items
 * 
 * Provides document browser, syntax highlighting, search/filter, and artifact linking
 */

class MemoryArtifactsViewer {
    constructor(memoryIntegration, options = {}) {
        this.memoryIntegration = memoryIntegration;
        this.container = null;
        this.currentView = 'browser'; // browser, viewer, search
        this.selectedArtifact = null;
        this.searchQuery = '';
        this.filterCategory = 'all';
        
        this.config = {
            maxPreviewLength: 500,
            syntaxHighlighting: options.syntaxHighlighting !== false,
            showMetadata: options.showMetadata !== false,
            allowFullscreen: options.allowFullscreen !== false
        };
        
        this.artifacts = [];
        this.filteredArtifacts = [];
        
        this.createViewer();
        this.loadArtifacts();
    }

    /**
     * Create the artifact viewer interface
     */
    createViewer() {
        this.container = document.createElement('div');
        this.container.className = 'memory-artifacts-viewer';
        this.container.innerHTML = `
            <div class="artifacts-header">
                <div class="artifacts-nav">
                    <button class="nav-btn active" data-view="browser">
                        <span class="icon">📁</span> Browse
                    </button>
                    <button class="nav-btn" data-view="search">
                        <span class="icon">🔍</span> Search
                    </button>
                </div>
                <div class="artifacts-controls">
                    <select class="category-filter">
                        <option value="all">All Categories</option>
                        <option value="core">Core</option>
                        <option value="working">Working</option>
                        <option value="reference">Reference</option>
                        <option value="historical">Historical</option>
                    </select>
                    <button class="refresh-btn" title="Refresh artifacts">
                        <span class="icon">🔄</span>
                    </button>
                </div>
            </div>
            
            <div class="artifacts-content">
                <div class="artifacts-browser" data-view="browser">
                    <div class="artifacts-list">
                        <div class="loading">Loading artifacts...</div>
                    </div>
                </div>
                
                <div class="artifacts-search hidden" data-view="search">
                    <div class="search-input-container">
                        <input type="text" class="search-input" placeholder="Search artifacts by content or filename...">
                        <button class="search-btn">
                            <span class="icon">🔍</span>
                        </button>
                    </div>
                    <div class="search-results">
                        <div class="no-results">Enter search terms to find artifacts</div>
                    </div>
                </div>
                
                <div class="artifact-viewer hidden" data-view="viewer">
                    <div class="viewer-header">
                        <button class="back-btn">
                            <span class="icon">←</span> Back
                        </button>
                        <div class="artifact-title"></div>
                        <div class="viewer-actions">
                            <button class="copy-btn" title="Copy content">
                                <span class="icon">📋</span>
                            </button>
                            <button class="fullscreen-btn" title="Fullscreen">
                                <span class="icon">⛶</span>
                            </button>
                        </div>
                    </div>
                    <div class="viewer-content">
                        <div class="artifact-metadata"></div>
                        <div class="artifact-content"></div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation buttons
        this.container.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Category filter
        this.container.querySelector('.category-filter').addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.filterArtifacts();
        });

        // Refresh button
        this.container.querySelector('.refresh-btn').addEventListener('click', () => {
            this.loadArtifacts();
        });

        // Search functionality
        const searchInput = this.container.querySelector('.search-input');
        const searchBtn = this.container.querySelector('.search-btn');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.performSearch();
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        searchBtn.addEventListener('click', () => {
            this.performSearch();
        });

        // Back button
        this.container.querySelector('.back-btn').addEventListener('click', () => {
            this.switchView('browser');
        });

        // Copy button
        this.container.querySelector('.copy-btn').addEventListener('click', () => {
            this.copyArtifactContent();
        });

        // Fullscreen button
        this.container.querySelector('.fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
    }

    /**
     * Load artifacts from memory integration
     */
    async loadArtifacts() {
        try {
            this.showLoading(true);
            
            const artifacts = [];
            
            // Load from all memory categories
            for (const category of ['core', 'working', 'reference', 'historical']) {
                const categoryItems = await this.memoryIntegration.loadCategoryItems(category);
                for (const item of categoryItems) {
                    artifacts.push({
                        ...item,
                        displayName: this.getDisplayName(item),
                        preview: this.generatePreview(item),
                        formattedDate: this.formatDate(item.metadata?.timestamp),
                        typeIcon: this.getTypeIcon(item.type)
                    });
                }
            }
            
            // Sort by timestamp (most recent first)
            this.artifacts = artifacts.sort((a, b) => {
                const dateA = new Date(a.metadata?.timestamp || 0);
                const dateB = new Date(b.metadata?.timestamp || 0);
                return dateB - dateA;
            });
            
            this.filterArtifacts();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Failed to load artifacts:', error);
            this.showError('Failed to load artifacts');
        }
    }

    /**
     * Filter artifacts based on current filters
     */
    filterArtifacts() {
        this.filteredArtifacts = this.artifacts.filter(artifact => {
            if (this.filterCategory !== 'all' && artifact.category !== this.filterCategory) {
                return false;
            }
            return true;
        });
        
        this.renderArtifactsList();
    }

    /**
     * Render artifacts list
     */
    renderArtifactsList() {
        const listContainer = this.container.querySelector('.artifacts-list');
        
        if (this.filteredArtifacts.length === 0) {
            listContainer.innerHTML = `
                <div class="no-artifacts">
                    <div class="icon">📭</div>
                    <div class="message">No artifacts found</div>
                    <div class="submessage">Upload documents or have conversations to build your memory</div>
                </div>
            `;
            return;
        }
        
        const artifactsHTML = this.filteredArtifacts.map(artifact => `
            <div class="artifact-item" data-id="${artifact.id}">
                <div class="artifact-icon">${artifact.typeIcon}</div>
                <div class="artifact-info">
                    <div class="artifact-name">${this.escapeHtml(artifact.displayName)}</div>
                    <div class="artifact-meta">
                        <span class="category ${artifact.category}">${artifact.category}</span>
                        <span class="date">${artifact.formattedDate}</span>
                        <span class="size">${this.formatSize(artifact.metadata?.compressedSize || 0)}</span>
                    </div>
                    <div class="artifact-preview">${this.escapeHtml(artifact.preview)}</div>
                    ${artifact.metadata?.tags ? `<div class="artifact-tags">${artifact.metadata.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </div>
                <div class="artifact-actions">
                    <button class="view-btn" data-id="${artifact.id}">View</button>
                </div>
            </div>
        `).join('');
        
        listContainer.innerHTML = artifactsHTML;
        
        // Attach click handlers for artifact items
        listContainer.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const artifactId = e.target.dataset.id;
                this.viewArtifact(artifactId);
            });
        });
        
        // Double-click to view
        listContainer.querySelectorAll('.artifact-item').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const artifactId = e.currentTarget.dataset.id;
                this.viewArtifact(artifactId);
            });
        });
    }

    /**
     * Switch between viewer modes
     */
    switchView(view) {
        // Update navigation
        this.container.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide content sections
        this.container.querySelectorAll('[data-view]').forEach(section => {
            section.classList.toggle('hidden', section.dataset.view !== view);
        });
        
        this.currentView = view;
    }

    /**
     * View specific artifact
     */
    async viewArtifact(artifactId) {
        const artifact = this.artifacts.find(a => a.id === artifactId);
        if (!artifact) return;
        
        this.selectedArtifact = artifact;
        
        // Update viewer content
        this.container.querySelector('.artifact-title').textContent = artifact.displayName;
        
        // Render metadata
        this.renderArtifactMetadata(artifact);
        
        // Render content with syntax highlighting
        this.renderArtifactContent(artifact);
        
        // Switch to viewer
        this.switchView('viewer');
    }

    /**
     * Render artifact metadata
     */
    renderArtifactMetadata(artifact) {
        const metadataContainer = this.container.querySelector('.artifact-metadata');
        
        const metadata = [
            { label: 'Type', value: artifact.type.replace('_', ' ') },
            { label: 'Category', value: artifact.category },
            { label: 'Created', value: artifact.formattedDate },
            { label: 'Size', value: this.formatSize(artifact.metadata?.originalSize || 0) },
            { label: 'Compressed', value: this.formatSize(artifact.metadata?.compressedSize || 0) }
        ];
        
        if (artifact.metadata?.compressionRatio) {
            const savings = Math.round((1 - artifact.metadata.compressionRatio) * 100);
            if (savings > 0) {
                metadata.push({ label: 'Savings', value: `${savings}%` });
            }
        }
        
        if (artifact.metadata?.source) {
            metadata.push({ label: 'Source', value: artifact.metadata.source });
        }
        
        metadataContainer.innerHTML = `
            <div class="metadata-grid">
                ${metadata.map(item => `
                    <div class="metadata-item">
                        <span class="label">${item.label}:</span>
                        <span class="value">${this.escapeHtml(item.value)}</span>
                    </div>
                `).join('')}
            </div>
            ${artifact.metadata?.tags ? `
                <div class="metadata-tags">
                    <span class="tags-label">Tags:</span>
                    ${artifact.metadata.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;
    }

    /**
     * Render artifact content with syntax highlighting
     */
    renderArtifactContent(artifact) {
        const contentContainer = this.container.querySelector('.artifact-content');
        const content = artifact.compressedContent || artifact.originalContent || '';
        
        // Determine content type for syntax highlighting
        const contentType = this.detectContentType(artifact);
        
        if (this.config.syntaxHighlighting && contentType !== 'text') {
            contentContainer.innerHTML = `
                <div class="content-header">
                    <span class="content-type">${contentType}</span>
                    <span class="content-length">${content.length} characters</span>
                </div>
                <pre class="content-code ${contentType}"><code>${this.escapeHtml(content)}</code></pre>
            `;
        } else {
            contentContainer.innerHTML = `
                <div class="content-header">
                    <span class="content-type">text</span>
                    <span class="content-length">${content.length} characters</span>
                </div>
                <div class="content-text">${this.formatTextContent(content)}</div>
            `;
        }
    }

    /**
     * Perform search in artifacts
     */
    async performSearch() {
        if (!this.searchQuery.trim()) {
            this.container.querySelector('.search-results').innerHTML = 
                '<div class="no-results">Enter search terms to find artifacts</div>';
            return;
        }
        
        const results = this.artifacts.filter(artifact => {
            const searchText = this.searchQuery.toLowerCase();
            const content = (artifact.compressedContent || artifact.originalContent || '').toLowerCase();
            const name = artifact.displayName.toLowerCase();
            const tags = (artifact.metadata?.tags || []).join(' ').toLowerCase();
            
            return content.includes(searchText) || 
                   name.includes(searchText) || 
                   tags.includes(searchText);
        });
        
        const resultsContainer = this.container.querySelector('.search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    No artifacts found for "${this.escapeHtml(this.searchQuery)}"
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = `
            <div class="search-summary">Found ${results.length} artifact${results.length !== 1 ? 's' : ''}</div>
            ${results.map(artifact => `
                <div class="search-result" data-id="${artifact.id}">
                    <div class="result-header">
                        <span class="result-icon">${artifact.typeIcon}</span>
                        <span class="result-name">${this.escapeHtml(artifact.displayName)}</span>
                        <span class="result-category ${artifact.category}">${artifact.category}</span>
                    </div>
                    <div class="result-preview">${this.highlightSearchTerms(artifact.preview, this.searchQuery)}</div>
                    <button class="result-view-btn" data-id="${artifact.id}">View</button>
                </div>
            `).join('')}
        `;
        
        // Attach click handlers
        resultsContainer.querySelectorAll('.result-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const artifactId = e.target.dataset.id;
                this.viewArtifact(artifactId);
            });
        });
    }

    /**
     * Copy artifact content to clipboard
     */
    async copyArtifactContent() {
        if (!this.selectedArtifact) return;
        
        const content = this.selectedArtifact.compressedContent || this.selectedArtifact.originalContent || '';
        
        try {
            await navigator.clipboard.writeText(content);
            this.showNotification('Content copied to clipboard');
        } catch (error) {
            console.error('Failed to copy content:', error);
            this.showNotification('Failed to copy content', 'error');
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        this.container.classList.toggle('fullscreen');
        const btn = this.container.querySelector('.fullscreen-btn');
        const icon = btn.querySelector('.icon');
        icon.textContent = this.container.classList.contains('fullscreen') ? '⛋' : '⛶';
    }

    /**
     * Utility methods
     */
    getDisplayName(item) {
        if (item.metadata?.source && item.metadata.source !== 'user') {
            return item.metadata.source;
        }
        if (item.type === 'conversation') {
            return `Conversation (${item.metadata?.sessionId || 'session'})`;
        }
        return `${item.type.replace('_', ' ')} - ${item.metadata?.timestamp?.substring(0, 10) || 'unknown'}`;
    }

    generatePreview(item) {
        const content = item.compressedContent || item.originalContent || '';
        if (content.length <= this.config.maxPreviewLength) {
            return content;
        }
        return content.substring(0, this.config.maxPreviewLength) + '...';
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }

    getTypeIcon(type) {
        const icons = {
            'user_document': '📄',
            'conversation': '💬',
            'user_content': '📝',
            'system_generated': '⚙️'
        };
        return icons[type] || '📄';
    }

    detectContentType(artifact) {
        const source = artifact.metadata?.source || '';
        if (source.endsWith('.js')) return 'javascript';
        if (source.endsWith('.ts')) return 'typescript';
        if (source.endsWith('.py')) return 'python';
        if (source.endsWith('.html')) return 'html';
        if (source.endsWith('.css')) return 'css';
        if (source.endsWith('.json')) return 'json';
        if (source.endsWith('.md')) return 'markdown';
        if (source.endsWith('.xml')) return 'xml';
        if (source.endsWith('.yaml') || source.endsWith('.yml')) return 'yaml';
        return 'text';
    }

    formatTextContent(content) {
        // Convert line breaks to HTML
        return this.escapeHtml(content).replace(/\n/g, '<br>');
    }

    highlightSearchTerms(text, query) {
        if (!query) return this.escapeHtml(text);
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    showLoading(show) {
        const loading = this.container.querySelector('.loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        const listContainer = this.container.querySelector('.artifacts-list');
        listContainer.innerHTML = `
            <div class="error">
                <div class="icon">⚠️</div>
                <div class="message">${this.escapeHtml(message)}</div>
            </div>
        `;
    }

    showNotification(message, type = 'success') {
        // Simple notification - could be enhanced with a proper notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'error' ? '#ff6b6b' : '#51cf66'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    /**
     * Get container element for integration
     */
    getContainer() {
        return this.container;
    }

    /**
     * Destroy the viewer
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// CSS styles for the viewer
const artifactsViewerCSS = `
.memory-artifacts-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.memory-artifacts-viewer.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
}

.artifacts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.artifacts-nav {
    display: flex;
    gap: 8px;
}

.nav-btn {
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.nav-btn:hover {
    background: #e9ecef;
}

.nav-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}

.artifacts-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-filter {
    padding: 6px 10px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 14px;
}

.refresh-btn {
    padding: 8px;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 4px;
    cursor: pointer;
}

.refresh-btn:hover {
    background: #e9ecef;
}

.artifacts-content {
    flex: 1;
    overflow: hidden;
    position: relative;
}

.artifacts-browser,
.artifacts-search,
.artifact-viewer {
    height: 100%;
    overflow-y: auto;
}

.hidden {
    display: none !important;
}

.artifacts-list {
    padding: 16px;
}

.artifact-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.artifact-item:hover {
    background: #f8f9fa;
    border-color: #007bff;
}

.artifact-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.artifact-info {
    flex: 1;
    min-width: 0;
}

.artifact-name {
    font-weight: 600;
    margin-bottom: 4px;
    color: #212529;
}

.artifact-meta {
    display: flex;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #6c757d;
}

.category {
    padding: 2px 6px;
    border-radius: 3px;
    color: white;
    font-weight: 500;
}

.category.core { background: #dc3545; }
.category.working { background: #007bff; }
.category.reference { background: #28a745; }
.category.historical { background: #6c757d; }

.artifact-preview {
    font-size: 14px;
    color: #495057;
    line-height: 1.4;
    margin-bottom: 8px;
}

.artifact-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.tag {
    padding: 2px 6px;
    background: #e9ecef;
    border-radius: 3px;
    font-size: 11px;
    color: #495057;
}

.artifact-actions {
    flex-shrink: 0;
}

.view-btn {
    padding: 6px 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.view-btn:hover {
    background: #0056b3;
}

.search-input-container {
    display: flex;
    padding: 16px;
    gap: 8px;
}

.search-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
}

.search-btn {
    padding: 10px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.search-results {
    padding: 0 16px 16px;
}

.search-result {
    padding: 16px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    margin-bottom: 12px;
}

.result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.result-name {
    font-weight: 600;
    flex: 1;
}

.result-preview {
    margin-bottom: 12px;
    color: #495057;
    line-height: 1.4;
}

.result-preview mark {
    background: #fff3cd;
    padding: 1px 2px;
}

.result-view-btn {
    padding: 6px 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.viewer-header {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.back-btn {
    padding: 8px 12px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 16px;
}

.artifact-title {
    flex: 1;
    font-weight: 600;
    font-size: 16px;
}

.viewer-actions {
    display: flex;
    gap: 8px;
}

.copy-btn,
.fullscreen-btn {
    padding: 8px;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 4px;
    cursor: pointer;
}

.viewer-content {
    padding: 16px;
    overflow-y: auto;
}

.artifact-metadata {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e9ecef;
}

.metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.metadata-item {
    display: flex;
    gap: 8px;
}

.metadata-item .label {
    font-weight: 600;
    color: #495057;
    min-width: 80px;
}

.metadata-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.tags-label {
    font-weight: 600;
    color: #495057;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e9ecef;
}

.content-type {
    font-weight: 600;
    color: #007bff;
}

.content-length {
    font-size: 14px;
    color: #6c757d;
}

.content-code {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    white-space: pre;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
}

.content-text {
    line-height: 1.6;
    color: #212529;
}

.no-artifacts,
.no-results,
.error {
    text-align: center;
    padding: 48px 24px;
    color: #6c757d;
}

.no-artifacts .icon,
.error .icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.no-artifacts .message,
.error .message {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #495057;
}

.no-artifacts .submessage {
    font-size: 14px;
}

.loading {
    text-align: center;
    padding: 48px 24px;
    color: #6c757d;
}

.search-summary {
    margin-bottom: 16px;
    font-weight: 600;
    color: #495057;
}
`;

// Inject CSS if not already present
if (!document.getElementById('memory-artifacts-viewer-styles')) {
    const style = document.createElement('style');
    style.id = 'memory-artifacts-viewer-styles';
    style.textContent = artifactsViewerCSS;
    document.head.appendChild(style);
}

module.exports = MemoryArtifactsViewer;