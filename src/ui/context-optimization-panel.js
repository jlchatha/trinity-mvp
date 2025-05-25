/**
 * Trinity MVP Context Optimization Dashboard
 * Surface context meter and auto-compact intelligence for professional users
 * Real-time token usage, cost analysis, and optimization recommendations
 */

class ContextOptimizationPanel {
  constructor() {
    this.isInitialized = false;
    this.isVisible = false;
    this.updateInterval = null;
    this.lastMetrics = null;
    this.alertHistory = [];
    this.optimizationHistory = [];
    this.chartData = {
      contextUtilization: [],
      tokenUsage: [],
      costTrend: [],
      timestamps: []
    };
    
    console.log('[Context Panel] Initializing Context Optimization Dashboard');
  }

  /**
   * Initialize the Context Optimization Panel
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('[Context Panel] Setting up Context Optimization Dashboard');
      
      // Check if Trinity API is available
      if (!window.trinityAPI || !window.trinityAPI.context) {
        console.warn('[Context Panel] Trinity API not available, using demo data');
      }
      
      this.setupPanel();
      this.setupEventListeners();
      this.startRealTimeUpdates();
      
      this.isInitialized = true;
      console.log('[Context Panel] ✅ Context Optimization Dashboard ready');
      
    } catch (error) {
      console.error('[Context Panel] Failed to initialize:', error);
    }
  }

  /**
   * Setup the panel HTML structure
   */
  setupPanel() {
    const panelContent = `
      <div class="context-panel-content">
        <div class="context-header">
          <div class="context-title">
            <span class="context-icon">📊</span>
            <span>Context Intelligence</span>
          </div>
          <div class="context-status-indicator" id="context-status-indicator">
            <span class="status-dot status-good"></span>
            <span class="status-text">GOOD</span>
          </div>
        </div>

        <!-- Real-time Metrics Overview -->
        <div class="context-metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Context Usage</div>
            <div class="metric-value" id="context-usage">0%</div>
            <div class="metric-bar">
              <div class="metric-fill" id="context-usage-bar"></div>
            </div>
            <div class="metric-detail" id="context-detail">0 / 100k tokens</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Session Cost</div>
            <div class="metric-value" id="session-cost">$0.00</div>
            <div class="metric-detail" id="cost-detail">0 requests</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Token Efficiency</div>
            <div class="metric-value" id="token-efficiency">100</div>
            <div class="metric-detail">tokens per $</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Auto-Compact Risk</div>
            <div class="metric-value" id="autocompact-risk">VERY LOW</div>
            <div class="metric-detail" id="risk-detail">~∞ requests left</div>
          </div>
        </div>

        <!-- Context Utilization Chart -->
        <div class="context-chart-section">
          <div class="section-title">Context Utilization Trend</div>
          <div class="context-chart" id="context-chart">
            <div class="chart-placeholder">
              <span>📈</span>
              <p>Real-time context tracking will appear here</p>
            </div>
          </div>
        </div>

        <!-- Optimization Recommendations -->
        <div class="optimization-section">
          <div class="section-title">Smart Recommendations</div>
          <div class="recommendation-list" id="recommendation-list">
            <div class="recommendation-item recommendation-success">
              <div class="recommendation-icon">✅</div>
              <div class="recommendation-content">
                <div class="recommendation-title">Context Optimized</div>
                <div class="recommendation-desc">Your conversation is efficiently using context</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Token Savings Analytics -->
        <div class="savings-section">
          <div class="section-title">Optimization Savings</div>
          <div class="savings-grid">
            <div class="savings-card">
              <div class="savings-label">Tokens Saved</div>
              <div class="savings-value" id="tokens-saved">0</div>
              <div class="savings-detail">This session</div>
            </div>
            <div class="savings-card">
              <div class="savings-label">Cost Reduction</div>
              <div class="savings-value" id="cost-reduction">0%</div>
              <div class="savings-detail">Estimated</div>
            </div>
            <div class="savings-card">
              <div class="savings-label">Efficiency Gain</div>
              <div class="savings-value" id="efficiency-gain">+0%</div>
              <div class="savings-detail">vs. baseline</div>
            </div>
          </div>
        </div>

        <!-- Recent Optimizations Log -->
        <div class="history-section">
          <div class="section-title">Recent Optimizations</div>
          <div class="optimization-log" id="optimization-log">
            <div class="log-placeholder">
              No optimizations recorded in this session
            </div>
          </div>
        </div>

        <!-- Manual Optimization Controls -->
        <div class="controls-section">
          <div class="section-title">Manual Controls</div>
          <div class="control-buttons">
            <button class="control-btn control-primary" id="optimize-now-btn">
              <span>🔄</span> Optimize Now
            </button>
            <button class="control-btn control-secondary" id="reset-metrics-btn">
              <span>📊</span> Reset Metrics
            </button>
            <button class="control-btn control-secondary" id="export-data-btn">
              <span>📄</span> Export Data
            </button>
          </div>
        </div>
      </div>
    `;

    // Add panel content to Context panel in single window
    const contextPanel = document.querySelector('#context-panel-content');
    if (contextPanel) {
      contextPanel.innerHTML = panelContent;
      console.log('[Context Panel] Panel content injected');
    } else {
      console.warn('[Context Panel] Context panel container not found');
    }
  }

  /**
   * Setup event listeners for controls
   */
  setupEventListeners() {
    // Manual optimization trigger
    const optimizeBtn = document.getElementById('optimize-now-btn');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => this.triggerManualOptimization());
    }

    // Reset metrics
    const resetBtn = document.getElementById('reset-metrics-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetMetrics());
    }

    // Export data
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    console.log('[Context Panel] Event listeners attached');
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    if (this.updateInterval) return;
    
    // Update every 2 seconds
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 2000);
    
    // Initial update
    this.updateMetrics();
    
    console.log('[Context Panel] Real-time updates started');
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update context metrics from Trinity API or demo data
   */
  async updateMetrics() {
    try {
      let metrics;
      
      // Try to get real metrics from Trinity API first (now connected to real data via IPC)
      if (window.trinityAPI && window.trinityAPI.context && window.trinityAPI.context.getMetrics) {
        console.log('[Context Panel] Fetching real metrics from Trinity API...');
        metrics = await window.trinityAPI.context.getMetrics();
        
        // Check if we got real data (not demo data)
        if (metrics && metrics.isRealData) {
          console.log('[Context Panel] Using real conversation metrics:', metrics);
        } else {
          console.log('[Context Panel] Trinity API returned demo data, falling back to local metrics');
          // Fall back to local metrics from single window
          metrics = this.getDemoMetrics();
        }
      } else {
        console.log('[Context Panel] Trinity API not available, using local metrics');
        // Use demo data that simulates realistic context usage
        metrics = this.getDemoMetrics();
      }
      
      this.lastMetrics = metrics;
      this.updateUI(metrics);
      this.updateChart(metrics);
      this.checkForAlerts(metrics);
      
    } catch (error) {
      console.warn('[Context Panel] Error updating metrics:', error);
      // Fallback to demo data
      const demoMetrics = this.getDemoMetrics();
      this.updateUI(demoMetrics);
    }
  }

  /**
   * Generate realistic demo metrics (uses real data when available)
   */
  getDemoMetrics() {
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
      // Use real conversation data with proper percentage calculation
      contextPercentage = realMetrics.contextPercentage; // Use the corrected calculation from Single Window
      totalTokens = realMetrics.estimatedTokens;
      requestCount = realMetrics.messageCount;
    } else {
      // Fall back to demo progression
      requestCount = Math.max(1, Math.floor(sessionDuration / 30)); // Request every 30 seconds
      const baseUsage = Math.min(15, requestCount * 1.5); // Slower growth for demo
      contextPercentage = Math.floor(baseUsage + Math.sin(now / 10000) * 3);
      totalTokens = Math.floor(contextPercentage * 1000);
    }
    
    contextPercentage = Math.max(0, Math.min(100, contextPercentage));
    const totalCost = totalTokens * 0.00000176; // Claude 3.5 Haiku current pricing (Dec 2024)
    
    return {
      contextPercentage: contextPercentage,
      totalInputTokens: Math.floor(totalTokens * 0.7),
      totalOutputTokens: Math.floor(totalTokens * 0.3),
      totalCost: totalCost,
      requestCount: requestCount,
      efficiency: Math.floor(totalTokens / Math.max(totalCost, 0.0001)),
      riskLevel: this.calculateRiskLevel(contextPercentage),
      status: this.calculateStatus(contextPercentage),
      sessionDuration: sessionDuration,
      estimatedRemainingRequests: Math.max(0, Math.floor((100 - contextPercentage) * 2)),
      tokensRemaining: realMetrics && realMetrics.tokensRemaining ? realMetrics.tokensRemaining : Math.max(0, 100000 - totalTokens),
      formattedCost: `$${totalCost.toFixed(4)}`,
      isRealData: realMetrics && realMetrics.estimatedTokens > 0
    };
  }

  /**
   * Calculate risk level based on context usage
   */
  calculateRiskLevel(percentage) {
    if (percentage >= 90) return 'VERY HIGH';
    if (percentage >= 75) return 'HIGH';
    if (percentage >= 50) return 'MEDIUM';
    if (percentage >= 25) return 'LOW';
    return 'VERY LOW';
  }

  /**
   * Calculate status based on context usage
   */
  calculateStatus(percentage) {
    if (percentage >= 85) return 'CRITICAL';
    if (percentage >= 75) return 'WARNING';
    if (percentage >= 60) return 'OPTIMAL';
    return 'GOOD';
  }

  /**
   * Update UI elements with metrics
   */
  updateUI(metrics) {
    // Context usage
    const usageElement = document.getElementById('context-usage');
    const usageBar = document.getElementById('context-usage-bar');
    const usageDetail = document.getElementById('context-detail');
    
    if (usageElement) usageElement.textContent = `${metrics.contextPercentage}%`;
    if (usageBar) {
      usageBar.style.width = `${metrics.contextPercentage}%`;
      usageBar.className = `metric-fill ${this.getUsageColorClass(metrics.contextPercentage)}`;
    }
    if (usageDetail) {
      const totalTokens = metrics.totalInputTokens + metrics.totalOutputTokens;
      usageDetail.textContent = `${Math.floor(totalTokens/1000)}k / 100k tokens`;
    }

    // Session cost
    const costElement = document.getElementById('session-cost');
    const costDetail = document.getElementById('cost-detail');
    if (costElement) costElement.textContent = metrics.formattedCost || `$${metrics.totalCost.toFixed(4)}`;
    if (costDetail) costDetail.textContent = `${metrics.requestCount} requests`;

    // Token efficiency
    const efficiencyElement = document.getElementById('token-efficiency');
    if (efficiencyElement) efficiencyElement.textContent = Math.floor(metrics.efficiency || 100);

    // Auto-compact risk
    const riskElement = document.getElementById('autocompact-risk');
    const riskDetail = document.getElementById('risk-detail');
    if (riskElement) {
      riskElement.textContent = metrics.riskLevel;
      riskElement.className = `metric-value ${this.getRiskColorClass(metrics.riskLevel)}`;
    }
    if (riskDetail) {
      const remaining = metrics.estimatedRemainingRequests;
      riskDetail.textContent = remaining > 999 ? '~∞ requests left' : `~${remaining} requests left`;
    }

    // Status indicator
    const statusIndicator = document.getElementById('context-status-indicator');
    if (statusIndicator) {
      const statusDot = statusIndicator.querySelector('.status-dot');
      const statusText = statusIndicator.querySelector('.status-text');
      
      if (statusDot) statusDot.className = `status-dot ${this.getStatusColorClass(metrics.status)}`;
      if (statusText) statusText.textContent = metrics.status;
    }

    // Update recommendations
    this.updateRecommendations(metrics);
  }

  /**
   * Get color class for usage percentage
   */
  getUsageColorClass(percentage) {
    if (percentage >= 85) return 'fill-critical';
    if (percentage >= 75) return 'fill-warning';
    if (percentage >= 60) return 'fill-optimal';
    return 'fill-good';
  }

  /**
   * Get color class for risk level
   */
  getRiskColorClass(riskLevel) {
    switch (riskLevel) {
      case 'VERY HIGH': return 'text-critical';
      case 'HIGH': return 'text-warning';
      case 'MEDIUM': return 'text-optimal';
      default: return 'text-good';
    }
  }

  /**
   * Get color class for status
   */
  getStatusColorClass(status) {
    switch (status) {
      case 'CRITICAL': return 'status-critical';
      case 'WARNING': return 'status-warning';
      case 'OPTIMAL': return 'status-optimal';
      default: return 'status-good';
    }
  }

  /**
   * Update chart with historical data
   */
  updateChart(metrics) {
    const now = new Date();
    
    // Add current data point
    this.chartData.contextUtilization.push(metrics.contextPercentage);
    this.chartData.tokenUsage.push(metrics.totalInputTokens + metrics.totalOutputTokens);
    this.chartData.costTrend.push(metrics.totalCost);
    this.chartData.timestamps.push(now);
    
    // Keep last 20 data points
    if (this.chartData.contextUtilization.length > 20) {
      this.chartData.contextUtilization.shift();
      this.chartData.tokenUsage.shift();
      this.chartData.costTrend.shift();
      this.chartData.timestamps.shift();
    }
    
    // Update chart visualization (simplified ASCII chart for now)
    this.updateSimpleChart();
  }

  /**
   * Update simple ASCII chart
   */
  updateSimpleChart() {
    const chartElement = document.getElementById('context-chart');
    if (!chartElement || this.chartData.contextUtilization.length < 2) return;
    
    const data = this.chartData.contextUtilization;
    const maxValue = Math.max(...data, 100);
    const chartHeight = 8;
    const chartWidth = Math.min(data.length, 20);
    
    let chartHTML = '<div class="ascii-chart">';
    
    // Create bars
    for (let i = 0; i < chartWidth; i++) {
      const value = data[data.length - chartWidth + i] || 0;
      const barHeight = Math.floor((value / maxValue) * chartHeight);
      
      chartHTML += '<div class="chart-bar">';
      for (let j = chartHeight; j > 0; j--) {
        const cellClass = j <= barHeight ? this.getBarColorClass(value) : 'chart-empty';
        chartHTML += `<div class="chart-cell ${cellClass}"></div>`;
      }
      chartHTML += '</div>';
    }
    
    chartHTML += '</div>';
    chartHTML += `<div class="chart-legend">Context usage over time (${data.length} points)</div>`;
    
    chartElement.innerHTML = chartHTML;
  }

  /**
   * Get bar color class based on value
   */
  getBarColorClass(value) {
    if (value >= 85) return 'bar-critical';
    if (value >= 75) return 'bar-warning';
    if (value >= 60) return 'bar-optimal';
    return 'bar-good';
  }

  /**
   * Update recommendations based on metrics
   */
  updateRecommendations(metrics) {
    const recommendationList = document.getElementById('recommendation-list');
    if (!recommendationList) return;
    
    const recommendations = this.generateRecommendations(metrics);
    
    recommendationList.innerHTML = recommendations.map(rec => `
      <div class="recommendation-item ${rec.type}">
        <div class="recommendation-icon">${rec.icon}</div>
        <div class="recommendation-content">
          <div class="recommendation-title">${rec.title}</div>
          <div class="recommendation-desc">${rec.description}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Generate smart recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.contextPercentage >= 85) {
      recommendations.push({
        type: 'recommendation-critical',
        icon: '🚨',
        title: 'Immediate Optimization Needed',
        description: 'Context is nearly full. Auto-compact risk is very high. Consider optimizing memory now.'
      });
    } else if (metrics.contextPercentage >= 75) {
      recommendations.push({
        type: 'recommendation-warning',
        icon: '⚠️',
        title: 'Optimization Recommended',
        description: `Context ${metrics.contextPercentage}% full. Plan optimization in next ${metrics.estimatedRemainingRequests || 'few'} requests.`
      });
    } else if (metrics.contextPercentage >= 60) {
      recommendations.push({
        type: 'recommendation-info',
        icon: 'ℹ️',
        title: 'Proactive Optimization Available',
        description: 'Context usage optimal. Background optimization can be scheduled.'
      });
    } else {
      recommendations.push({
        type: 'recommendation-success',
        icon: '✅',
        title: 'Context Optimized',
        description: 'Your conversation is efficiently using context. Performance is excellent.'
      });
    }
    
    // Add efficiency recommendation
    if (metrics.efficiency < 500) {
      recommendations.push({
        type: 'recommendation-info',
        icon: '💡',
        title: 'Efficiency Improvement',
        description: 'Consider shorter prompts or memory optimization to improve token efficiency.'
      });
    }
    
    return recommendations;
  }

  /**
   * Check for alerts and update history
   */
  checkForAlerts(metrics) {
    const now = new Date();
    
    // Check for critical thresholds
    if (metrics.contextPercentage >= 85 && !this.hasRecentAlert('critical')) {
      this.addAlert({
        level: 'critical',
        timestamp: now,
        message: `Context ${metrics.contextPercentage}% full - Auto-compact risk HIGH`,
        recommendation: 'Immediate context optimization recommended'
      });
    } else if (metrics.contextPercentage >= 75 && !this.hasRecentAlert('warning')) {
      this.addAlert({
        level: 'warning',
        timestamp: now,
        message: `Context ${metrics.contextPercentage}% full - Optimization recommended`,
        recommendation: 'Consider optimizing memory proactively'
      });
    }
  }

  /**
   * Check if we have a recent alert of the same level
   */
  hasRecentAlert(level) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.alertHistory.some(alert => 
      alert.level === level && alert.timestamp > fiveMinutesAgo
    );
  }

  /**
   * Add alert to history
   */
  addAlert(alert) {
    this.alertHistory.push(alert);
    
    // Keep only last 50 alerts
    if (this.alertHistory.length > 50) {
      this.alertHistory = this.alertHistory.slice(-50);
    }
    
    console.log(`[Context Panel] Alert: ${alert.level} - ${alert.message}`);
  }

  /**
   * Trigger manual optimization
   */
  async triggerManualOptimization() {
    const optimizeBtn = document.getElementById('optimize-now-btn');
    if (optimizeBtn) {
      optimizeBtn.disabled = true;
      optimizeBtn.innerHTML = '<span>⏳</span> Optimizing...';
    }
    
    try {
      console.log('[Context Panel] Triggering manual optimization');
      
      // Try Trinity API first
      let result;
      if (window.trinityAPI && window.trinityAPI.context && window.trinityAPI.context.optimize) {
        result = await window.trinityAPI.context.optimize();
      } else {
        // Simulate optimization
        result = await this.simulateOptimization();
      }
      
      this.addOptimizationRecord(result);
      this.updateOptimizationLog();
      
      console.log('[Context Panel] Manual optimization completed:', result);
      
    } catch (error) {
      console.error('[Context Panel] Optimization failed:', error);
    } finally {
      if (optimizeBtn) {
        optimizeBtn.disabled = false;
        optimizeBtn.innerHTML = '<span>🔄</span> Optimize Now';
      }
    }
  }

  /**
   * Simulate optimization for demo
   */
  async simulateOptimization() {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const beforeMetrics = this.lastMetrics || this.getDemoMetrics();
    
    return {
      success: true,
      timestamp: new Date(),
      trigger: 'manual',
      beforeOptimization: {
        contextUtilization: beforeMetrics.contextPercentage,
        totalTokens: beforeMetrics.totalInputTokens + beforeMetrics.totalOutputTokens,
        cost: beforeMetrics.formattedCost
      },
      afterOptimization: {
        estimatedReduction: '25-35%',
        tokensSaved: Math.floor((beforeMetrics.totalInputTokens + beforeMetrics.totalOutputTokens) * 0.3),
        costSaved: beforeMetrics.totalCost * 0.3,
        newUtilization: Math.max(15, beforeMetrics.contextPercentage - 30)
      }
    };
  }

  /**
   * Add optimization record
   */
  addOptimizationRecord(record) {
    this.optimizationHistory.push(record);
    
    // Keep only last 20 optimizations
    if (this.optimizationHistory.length > 20) {
      this.optimizationHistory = this.optimizationHistory.slice(-20);
    }
  }

  /**
   * Update optimization log display
   */
  updateOptimizationLog() {
    const logElement = document.getElementById('optimization-log');
    if (!logElement) return;
    
    if (this.optimizationHistory.length === 0) {
      logElement.innerHTML = '<div class="log-placeholder">No optimizations recorded in this session</div>';
      return;
    }
    
    const recent = this.optimizationHistory.slice(-5).reverse(); // Show last 5, most recent first
    
    logElement.innerHTML = recent.map(record => `
      <div class="optimization-record">
        <div class="record-header">
          <span class="record-icon">${record.success ? '✅' : '❌'}</span>
          <span class="record-time">${record.timestamp.toLocaleTimeString()}</span>
          <span class="record-trigger">${record.trigger}</span>
        </div>
        <div class="record-details">
          ${record.success ? 
            `Saved ~${record.afterOptimization.tokensSaved || 'N/A'} tokens (${record.afterOptimization.estimatedReduction})` :
            `Failed: ${record.error || 'Unknown error'}`
          }
        </div>
      </div>
    `).join('');
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    console.log('[Context Panel] Resetting metrics');
    
    this.sessionStart = Date.now();
    this.chartData = {
      contextUtilization: [],
      tokenUsage: [],
      costTrend: [],
      timestamps: []
    };
    this.alertHistory = [];
    this.optimizationHistory = [];
    
    // Try Trinity API reset
    if (window.trinityAPI && window.trinityAPI.context && window.trinityAPI.context.resetSession) {
      window.trinityAPI.context.resetSession();
    }
    
    // Force immediate update
    this.updateMetrics();
    this.updateOptimizationLog();
  }

  /**
   * Export context data
   */
  exportData() {
    console.log('[Context Panel] Exporting context data');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      currentMetrics: this.lastMetrics,
      chartData: this.chartData,
      alertHistory: this.alertHistory,
      optimizationHistory: this.optimizationHistory,
      sessionDuration: this.sessionStart ? Math.floor((Date.now() - this.sessionStart) / 1000) : 0
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `trinity-context-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Show/hide the panel
   */
  setVisibility(visible) {
    this.isVisible = visible;
    
    if (visible && !this.isInitialized) {
      this.initialize();
    }
    
    if (visible) {
      this.startRealTimeUpdates();
    } else {
      this.stopRealTimeUpdates();
    }
  }

  /**
   * Cleanup when panel is destroyed
   */
  destroy() {
    this.stopRealTimeUpdates();
    this.isInitialized = false;
    console.log('[Context Panel] Context Optimization Panel destroyed');
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.ContextOptimizationPanel = ContextOptimizationPanel;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextOptimizationPanel;
}