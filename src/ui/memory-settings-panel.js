/**
 * Memory Settings Panel
 * User preferences for memory display and behavior
 * 
 * Provides toggleable memory-in-chat bubbles, display preferences, and memory management settings
 */

class MemorySettingsPanel {
    constructor(options = {}) {
        this.container = null;
        this.settings = {
            // Memory display preferences
            showMemoryBubbles: true,
            showMemoryContext: true,
            showOptimizationStats: true,
            showArtifactChips: true,
            
            // Memory behavior
            autoLoadContext: true,
            maxContextItems: 10,
            compressionLevel: 'balanced', // minimal, balanced, aggressive
            categoryPreferences: {
                core: true,
                working: true,
                reference: true,
                historical: false
            },
            
            // UI preferences
            bubbleStyle: 'detailed', // minimal, detailed, full
            memoryPanelAutoExpand: false,
            contextThreshold: 0.3 // minimum relevance score
        };
        
        this.callbacks = {
            onSettingsChange: options.onSettingsChange || (() => {}),
            onResetMemory: options.onResetMemory || (() => {}),
            onExportMemory: options.onExportMemory || (() => {})
        };
        
        this.loadSettings();
        this.createPanel();
    }

    /**
     * Create the settings panel interface
     */
    createPanel() {
        this.container = document.createElement('div');
        this.container.className = 'memory-settings-panel';
        this.container.innerHTML = `
            <div class="settings-header">
                <h3>Memory Settings</h3>
                <div class="settings-actions">
                    <button class="reset-settings-btn" title="Reset to defaults">
                        <span class="icon">🔄</span> Reset
                    </button>
                </div>
            </div>
            
            <div class="settings-content">
                <div class="settings-section">
                    <h4>Display Preferences</h4>
                    <div class="settings-group">
                        <label class="setting-item">
                            <input type="checkbox" id="showMemoryBubbles" ${this.settings.showMemoryBubbles ? 'checked' : ''}>
                            <span class="setting-label">Show memory bubbles in chat</span>
                            <span class="setting-description">Display memory context information with chat responses</span>
                        </label>
                        
                        <label class="setting-item">
                            <input type="checkbox" id="showMemoryContext" ${this.settings.showMemoryContext ? 'checked' : ''}>
                            <span class="setting-label">Show memory context details</span>
                            <span class="setting-description">Include detailed context information in bubbles</span>
                        </label>
                        
                        <label class="setting-item">
                            <input type="checkbox" id="showOptimizationStats" ${this.settings.showOptimizationStats ? 'checked' : ''}>
                            <span class="setting-label">Show optimization statistics</span>
                            <span class="setting-description">Display token savings and compression ratios</span>
                        </label>
                        
                        <label class="setting-item">
                            <input type="checkbox" id="showArtifactChips" ${this.settings.showArtifactChips ? 'checked' : ''}>
                            <span class="setting-label">Show artifact chips</span>
                            <span class="setting-description">Show clickable links to referenced documents</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Memory Behavior</h4>
                    <div class="settings-group">
                        <label class="setting-item">
                            <input type="checkbox" id="autoLoadContext" ${this.settings.autoLoadContext ? 'checked' : ''}>
                            <span class="setting-label">Automatically load relevant context</span>
                            <span class="setting-description">Load memory context for all conversations</span>
                        </label>
                        
                        <div class="setting-item">
                            <span class="setting-label">Maximum context items</span>
                            <input type="range" id="maxContextItems" min="5" max="20" value="${this.settings.maxContextItems}" class="setting-slider">
                            <span class="setting-value">${this.settings.maxContextItems}</span>
                            <span class="setting-description">Maximum number of memory items to load per conversation</span>
                        </div>
                        
                        <div class="setting-item">
                            <span class="setting-label">Compression level</span>
                            <select id="compressionLevel" class="setting-select">
                                <option value="minimal" ${this.settings.compressionLevel === 'minimal' ? 'selected' : ''}>Minimal (preserve more content)</option>
                                <option value="balanced" ${this.settings.compressionLevel === 'balanced' ? 'selected' : ''}>Balanced (recommended)</option>
                                <option value="aggressive" ${this.settings.compressionLevel === 'aggressive' ? 'selected' : ''}>Aggressive (maximum efficiency)</option>
                            </select>
                            <span class="setting-description">How aggressively to compress memory content</span>
                        </div>
                        
                        <div class="setting-item">
                            <span class="setting-label">Context relevance threshold</span>
                            <input type="range" id="contextThreshold" min="0.1" max="0.9" step="0.1" value="${this.settings.contextThreshold}" class="setting-slider">
                            <span class="setting-value">${Math.round(this.settings.contextThreshold * 100)}%</span>
                            <span class="setting-description">Minimum relevance score for including memory items</span>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Memory Categories</h4>
                    <div class="settings-group">
                        <span class="section-description">Choose which memory categories to include in context loading</span>
                        
                        <label class="setting-item category-setting">
                            <input type="checkbox" id="categoryCore" ${this.settings.categoryPreferences.core ? 'checked' : ''}>
                            <span class="category-badge core">Core</span>
                            <span class="setting-description">Essential system knowledge and critical information</span>
                        </label>
                        
                        <label class="setting-item category-setting">
                            <input type="checkbox" id="categoryWorking" ${this.settings.categoryPreferences.working ? 'checked' : ''}>
                            <span class="category-badge working">Working</span>
                            <span class="setting-description">Current tasks, active projects, and recent conversations</span>
                        </label>
                        
                        <label class="setting-item category-setting">
                            <input type="checkbox" id="categoryReference" ${this.settings.categoryPreferences.reference ? 'checked' : ''}>
                            <span class="category-badge reference">Reference</span>
                            <span class="setting-description">Documentation, guides, and reference materials</span>
                        </label>
                        
                        <label class="setting-item category-setting">
                            <input type="checkbox" id="categoryHistorical" ${this.settings.categoryPreferences.historical ? 'checked' : ''}>
                            <span class="category-badge historical">Historical</span>
                            <span class="setting-description">Archived conversations and old project data</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Interface Options</h4>
                    <div class="settings-group">
                        <div class="setting-item">
                            <span class="setting-label">Memory bubble style</span>
                            <select id="bubbleStyle" class="setting-select">
                                <option value="minimal" ${this.settings.bubbleStyle === 'minimal' ? 'selected' : ''}>Minimal (just summary)</option>
                                <option value="detailed" ${this.settings.bubbleStyle === 'detailed' ? 'selected' : ''}>Detailed (with stats)</option>
                                <option value="full" ${this.settings.bubbleStyle === 'full' ? 'selected' : ''}>Full (all information)</option>
                            </select>
                            <span class="setting-description">How much information to show in memory bubbles</span>
                        </div>
                        
                        <label class="setting-item">
                            <input type="checkbox" id="memoryPanelAutoExpand" ${this.settings.memoryPanelAutoExpand ? 'checked' : ''}>
                            <span class="setting-label">Auto-expand memory panel</span>
                            <span class="setting-description">Automatically expand memory panel when relevant context is loaded</span>
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Memory Management</h4>
                    <div class="settings-group">
                        <div class="memory-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Memory Items:</span>
                                <span class="stat-value" id="totalMemoryItems">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Memory Size:</span>
                                <span class="stat-value" id="totalMemorySize">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Compression Savings:</span>
                                <span class="stat-value" id="compressionSavings">--</span>
                            </div>
                        </div>
                        
                        <div class="management-actions">
                            <button class="action-btn secondary" id="exportMemoryBtn">
                                <span class="icon">📤</span> Export Memory
                            </button>
                            <button class="action-btn secondary" id="optimizeMemoryBtn">
                                <span class="icon">⚡</span> Optimize Memory
                            </button>
                            <button class="action-btn danger" id="resetMemoryBtn">
                                <span class="icon">🗑️</span> Reset Memory
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.updateMemoryStats();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Checkbox settings
        ['showMemoryBubbles', 'showMemoryContext', 'showOptimizationStats', 'showArtifactChips', 
         'autoLoadContext', 'memoryPanelAutoExpand'].forEach(setting => {
            const checkbox = this.container.querySelector(`#${setting}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.checked;
                    this.saveSettings();
                    this.callbacks.onSettingsChange(this.settings);
                });
            }
        });

        // Category checkboxes
        ['categoryCore', 'categoryWorking', 'categoryReference', 'categoryHistorical'].forEach(setting => {
            const checkbox = this.container.querySelector(`#${setting}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const category = setting.replace('category', '').toLowerCase();
                    this.settings.categoryPreferences[category] = e.target.checked;
                    this.saveSettings();
                    this.callbacks.onSettingsChange(this.settings);
                });
            }
        });

        // Range sliders
        const maxContextSlider = this.container.querySelector('#maxContextItems');
        const contextThresholdSlider = this.container.querySelector('#contextThreshold');

        if (maxContextSlider) {
            maxContextSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.settings.maxContextItems = value;
                this.container.querySelector('.setting-value').textContent = value;
                this.saveSettings();
                this.callbacks.onSettingsChange(this.settings);
            });
        }

        if (contextThresholdSlider) {
            contextThresholdSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.settings.contextThreshold = value;
                e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
                this.saveSettings();
                this.callbacks.onSettingsChange(this.settings);
            });
        }

        // Select dropdowns
        ['compressionLevel', 'bubbleStyle'].forEach(setting => {
            const select = this.container.querySelector(`#${setting}`);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.settings[setting] = e.target.value;
                    this.saveSettings();
                    this.callbacks.onSettingsChange(this.settings);
                });
            }
        });

        // Action buttons
        const resetSettingsBtn = this.container.querySelector('.reset-settings-btn');
        const exportMemoryBtn = this.container.querySelector('#exportMemoryBtn');
        const optimizeMemoryBtn = this.container.querySelector('#optimizeMemoryBtn');
        const resetMemoryBtn = this.container.querySelector('#resetMemoryBtn');

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        if (exportMemoryBtn) {
            exportMemoryBtn.addEventListener('click', () => {
                this.exportMemory();
            });
        }

        if (optimizeMemoryBtn) {
            optimizeMemoryBtn.addEventListener('click', () => {
                this.optimizeMemory();
            });
        }

        if (resetMemoryBtn) {
            resetMemoryBtn.addEventListener('click', () => {
                this.confirmResetMemory();
            });
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('trinity-memory-settings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsedSettings };
            }
        } catch (error) {
            console.warn('Failed to load memory settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('trinity-memory-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save memory settings:', error);
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Reset all memory settings to defaults?')) {
            localStorage.removeItem('trinity-memory-settings');
            
            // Reset to defaults
            this.settings = {
                showMemoryBubbles: true,
                showMemoryContext: true,
                showOptimizationStats: true,
                showArtifactChips: true,
                autoLoadContext: true,
                maxContextItems: 10,
                compressionLevel: 'balanced',
                categoryPreferences: {
                    core: true,
                    working: true,
                    reference: true,
                    historical: false
                },
                bubbleStyle: 'detailed',
                memoryPanelAutoExpand: false,
                contextThreshold: 0.3
            };
            
            // Recreate panel with new settings
            this.createPanel();
            this.callbacks.onSettingsChange(this.settings);
        }
    }

    /**
     * Update memory statistics display
     */
    async updateMemoryStats() {
        try {
            // This would connect to the memory integration to get real stats
            // For now, using placeholder data
            const stats = {
                totalItems: 42,
                totalSize: 1024 * 156, // 156 KB
                compressionSavings: 0.34 // 34%
            };
            
            const totalItemsEl = this.container.querySelector('#totalMemoryItems');
            const totalSizeEl = this.container.querySelector('#totalMemorySize');
            const compressionSavingsEl = this.container.querySelector('#compressionSavings');
            
            if (totalItemsEl) totalItemsEl.textContent = stats.totalItems;
            if (totalSizeEl) totalSizeEl.textContent = this.formatSize(stats.totalSize);
            if (compressionSavingsEl) compressionSavingsEl.textContent = `${Math.round(stats.compressionSavings * 100)}%`;
            
        } catch (error) {
            console.error('Failed to update memory stats:', error);
        }
    }

    /**
     * Export memory data
     */
    async exportMemory() {
        try {
            this.showNotification('Preparing memory export...', 'info');
            
            // This would connect to memory integration for real export
            const exportData = {
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                // memoryData would be added here
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trinity-memory-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Memory exported successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to export memory:', error);
            this.showNotification('Failed to export memory', 'error');
        }
    }

    /**
     * Optimize memory (compression and cleanup)
     */
    async optimizeMemory() {
        try {
            this.showNotification('Optimizing memory...', 'info');
            
            // This would trigger memory optimization in the backend
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
            
            this.updateMemoryStats();
            this.showNotification('Memory optimization complete!', 'success');
            
        } catch (error) {
            console.error('Failed to optimize memory:', error);
            this.showNotification('Failed to optimize memory', 'error');
        }
    }

    /**
     * Confirm and reset memory
     */
    confirmResetMemory() {
        const confirmed = confirm(
            'Are you sure you want to reset all memory data?\n\n' +
            'This will permanently delete:\n' +
            '• All conversations and context\n' +
            '• Uploaded documents\n' +
            '• Learning patterns and preferences\n\n' +
            'This action cannot be undone.'
        );
        
        if (confirmed) {
            const doubleConfirm = confirm('This will delete ALL memory data. Are you absolutely sure?');
            if (doubleConfirm) {
                this.resetMemory();
            }
        }
    }

    /**
     * Reset all memory data
     */
    async resetMemory() {
        try {
            this.showNotification('Resetting memory data...', 'info');
            
            this.callbacks.onResetMemory();
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
            
            this.updateMemoryStats();
            this.showNotification('Memory data reset complete!', 'success');
            
        } catch (error) {
            console.error('Failed to reset memory:', error);
            this.showNotification('Failed to reset memory', 'error');
        }
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update settings programmatically
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // Update UI to reflect new settings
        this.updateUI();
    }

    /**
     * Update UI elements to reflect current settings
     */
    updateUI() {
        // Update checkboxes
        Object.entries(this.settings).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                const checkbox = this.container.querySelector(`#${key}`);
                if (checkbox) {
                    checkbox.checked = value;
                }
            }
        });
        
        // Update category checkboxes
        Object.entries(this.settings.categoryPreferences).forEach(([category, enabled]) => {
            const checkbox = this.container.querySelector(`#category${category.charAt(0).toUpperCase() + category.slice(1)}`);
            if (checkbox) {
                checkbox.checked = enabled;
            }
        });
        
        // Update sliders and selects
        const maxContextSlider = this.container.querySelector('#maxContextItems');
        if (maxContextSlider) {
            maxContextSlider.value = this.settings.maxContextItems;
            maxContextSlider.nextElementSibling.textContent = this.settings.maxContextItems;
        }
        
        const thresholdSlider = this.container.querySelector('#contextThreshold');
        if (thresholdSlider) {
            thresholdSlider.value = this.settings.contextThreshold;
            thresholdSlider.nextElementSibling.textContent = `${Math.round(this.settings.contextThreshold * 100)}%`;
        }
        
        const compressionSelect = this.container.querySelector('#compressionLevel');
        if (compressionSelect) {
            compressionSelect.value = this.settings.compressionLevel;
        }
        
        const bubbleStyleSelect = this.container.querySelector('#bubbleStyle');
        if (bubbleStyleSelect) {
            bubbleStyleSelect.value = this.settings.bubbleStyle;
        }
    }

    /**
     * Utility methods
     */
    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${Math.round(bytes / (1024 * 1024))} MB`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#339af0'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 4000);
    }

    /**
     * Get container element for integration
     */
    getContainer() {
        return this.container;
    }

    /**
     * Destroy the panel
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// CSS styles for the settings panel
const memorySettingsCSS = `
.memory-settings-panel {
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-height: 600px;
    display: flex;
    flex-direction: column;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
}

.settings-header h3 {
    margin: 0;
    color: #212529;
    font-size: 18px;
    font-weight: 600;
}

.settings-actions {
    display: flex;
    gap: 8px;
}

.reset-settings-btn {
    padding: 6px 12px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.reset-settings-btn:hover {
    background: #5a6268;
}

.settings-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.settings-section {
    margin-bottom: 32px;
}

.settings-section:last-child {
    margin-bottom: 0;
}

.settings-section h4 {
    margin: 0 0 16px 0;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 8px;
}

.settings-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
}

.setting-item input[type="checkbox"] {
    margin: 0;
    align-self: flex-start;
}

.setting-label {
    font-weight: 600;
    color: #212529;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.setting-description {
    font-size: 13px;
    color: #6c757d;
    line-height: 1.4;
}

.setting-slider {
    width: 200px;
    margin: 4px 0;
}

.setting-value {
    font-weight: 600;
    color: #007bff;
    min-width: 40px;
    display: inline-block;
}

.setting-select {
    padding: 6px 10px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-size: 14px;
    max-width: 300px;
}

.category-setting {
    align-items: flex-start;
}

.category-badge {
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    font-size: 12px;
    min-width: 70px;
    text-align: center;
}

.category-badge.core { background: #dc3545; }
.category-badge.working { background: #007bff; }
.category-badge.reference { background: #28a745; }
.category-badge.historical { background: #6c757d; }

.section-description {
    font-size: 13px;
    color: #6c757d;
    margin-bottom: 8px;
    display: block;
}

.memory-stats {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.stat-item:last-child {
    margin-bottom: 0;
}

.stat-label {
    font-weight: 500;
    color: #495057;
}

.stat-value {
    font-weight: 600;
    color: #007bff;
}

.management-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.action-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s;
}

.action-btn.secondary {
    background: #6c757d;
    color: white;
}

.action-btn.secondary:hover {
    background: #5a6268;
}

.action-btn.danger {
    background: #dc3545;
    color: white;
}

.action-btn.danger:hover {
    background: #c82333;
}

.icon {
    font-size: 14px;
}
`;

// Inject CSS if not already present
if (!document.getElementById('memory-settings-panel-styles')) {
    const style = document.createElement('style');
    style.id = 'memory-settings-panel-styles';
    style.textContent = memorySettingsCSS;
    document.head.appendChild(style);
}

module.exports = MemorySettingsPanel;