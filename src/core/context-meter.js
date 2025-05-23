/**
 * Trinity MVP Context Meter - Background Cost & Context Intelligence
 * Real-time monitoring of context window utilization via /cost file
 * First assistant with predictive context optimization!
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ContextMeter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.costFilePath = options.costFilePath || '/cost';
    this.updateInterval = options.updateInterval || 1000; // 1 second
    this.contextWindowSize = options.contextWindowSize || 100000; // Claude Haiku context window
    this.warningThreshold = options.warningThreshold || 0.75; // 75%
    this.criticalThreshold = options.criticalThreshold || 0.85; // 85%
    this.optimizationThreshold = options.optimizationThreshold || 0.8; // 80%
    
    // State tracking
    this.isRunning = false;
    this.watchInterval = null;
    this.lastCostData = null;
    this.sessionMetrics = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: 0,
      sessionStart: new Date(),
      efficiency: 100,
      contextUtilization: 0,
      avgTokensPerRequest: 0
    };
    
    // Cost tracking
    this.costHistory = [];
    this.maxHistoryLength = 100; // Keep last 100 requests
    
    this.log('Trinity Context Meter initialized');
  }

  /**
   * Start background monitoring
   */
  start() {
    if (this.isRunning) {
      this.log('Context Meter already running');
      return;
    }

    this.log('🎯 Starting Trinity Context Meter - Real-time cost & context intelligence');
    this.isRunning = true;
    this.sessionMetrics.sessionStart = new Date();
    
    // Start monitoring /cost file
    this.watchInterval = setInterval(() => {
      this.checkCostFile();
    }, this.updateInterval);
    
    this.emit('started');
  }

  /**
   * Stop background monitoring
   */
  stop() {
    if (!this.isRunning) return;
    
    this.log('Stopping Trinity Context Meter');
    this.isRunning = false;
    
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    
    this.emit('stopped');
  }

  /**
   * Check /cost file for updates
   */
  async checkCostFile() {
    try {
      if (!fs.existsSync(this.costFilePath)) {
        return; // No cost data yet
      }

      const costData = fs.readFileSync(this.costFilePath, 'utf8');
      
      // Only process if data has changed
      if (costData !== this.lastCostData) {
        this.lastCostData = costData;
        await this.processCostData(costData);
      }
    } catch (error) {
      this.log(`Error reading cost file: ${error.message}`, 'warning');
    }
  }

  /**
   * Process cost data and update metrics
   */
  async processCostData(costData) {
    try {
      // Parse cost data (assuming JSON format from Claude)
      const lines = costData.trim().split('\n');
      const latestLine = lines[lines.length - 1];
      
      if (!latestLine) return;
      
      // Parse the latest cost entry
      const costEntry = this.parseCostEntry(latestLine);
      if (!costEntry) return;
      
      // Update session metrics
      this.updateSessionMetrics(costEntry);
      
      // Add to history
      this.costHistory.push({
        ...costEntry,
        timestamp: new Date()
      });
      
      // Trim history if too long
      if (this.costHistory.length > this.maxHistoryLength) {
        this.costHistory = this.costHistory.slice(-this.maxHistoryLength);
      }
      
      // Calculate context utilization
      this.calculateContextUtilization();
      
      // Check for alerts
      this.checkAlerts();
      
      // Emit update event
      this.emit('update', this.getMetrics());
      
    } catch (error) {
      this.log(`Error processing cost data: ${error.message}`, 'error');
    }
  }

  /**
   * Parse a single cost entry from /cost file
   */
  parseCostEntry(line) {
    try {
      // Try JSON format first
      if (line.startsWith('{')) {
        return JSON.parse(line);
      }
      
      // Try parsing common cost formats
      // Format: "Input: 1234 tokens, Output: 567 tokens, Cost: $0.012"
      const inputMatch = line.match(/Input:\s*(\d+)\s*tokens/i);
      const outputMatch = line.match(/Output:\s*(\d+)\s*tokens/i);
      const costMatch = line.match(/Cost:\s*\$?([\d.]+)/i);
      
      if (inputMatch && outputMatch) {
        return {
          inputTokens: parseInt(inputMatch[1]),
          outputTokens: parseInt(outputMatch[1]),
          cost: costMatch ? parseFloat(costMatch[1]) : 0
        };
      }
      
      return null;
    } catch (error) {
      this.log(`Error parsing cost entry: ${error.message}`, 'warning');
      return null;
    }
  }

  /**
   * Update session metrics with new cost entry
   */
  updateSessionMetrics(costEntry) {
    this.sessionMetrics.totalInputTokens += costEntry.inputTokens || 0;
    this.sessionMetrics.totalOutputTokens += costEntry.outputTokens || 0;
    this.sessionMetrics.totalCost += costEntry.cost || 0;
    this.sessionMetrics.requestCount++;
    
    // Calculate efficiency (tokens per dollar)
    this.sessionMetrics.efficiency = this.sessionMetrics.totalCost > 0 ? 
      ((this.sessionMetrics.totalInputTokens + this.sessionMetrics.totalOutputTokens) / this.sessionMetrics.totalCost) : 100;
    
    // Calculate average tokens per request
    this.sessionMetrics.avgTokensPerRequest = this.sessionMetrics.requestCount > 0 ?
      (this.sessionMetrics.totalInputTokens + this.sessionMetrics.totalOutputTokens) / this.sessionMetrics.requestCount : 0;
  }

  /**
   * Calculate context window utilization
   */
  calculateContextUtilization() {
    // Use input tokens as primary measure of context usage
    this.sessionMetrics.contextUtilization = this.sessionMetrics.totalInputTokens / this.contextWindowSize;
    
    // Estimate remaining requests before context limit
    if (this.sessionMetrics.avgTokensPerRequest > 0) {
      const remainingTokens = this.contextWindowSize - this.sessionMetrics.totalInputTokens;
      this.sessionMetrics.estimatedRemainingRequests = Math.floor(remainingTokens / this.sessionMetrics.avgTokensPerRequest);
    }
  }

  /**
   * Check for context alerts and optimization triggers
   */
  checkAlerts() {
    const utilization = this.sessionMetrics.contextUtilization;
    
    // Critical threshold - immediate optimization needed
    if (utilization >= this.criticalThreshold) {
      this.emit('alert', {
        level: 'critical',
        message: `Context ${Math.round(utilization * 100)}% full - Auto-compact risk HIGH`,
        recommendation: 'Immediate context optimization recommended',
        utilization: utilization
      });
    }
    // Warning threshold - optimization should be planned
    else if (utilization >= this.warningThreshold) {
      this.emit('alert', {
        level: 'warning', 
        message: `Context ${Math.round(utilization * 100)}% full - Optimization recommended`,
        recommendation: `Consider optimizing memory in ${this.sessionMetrics.estimatedRemainingRequests || 'few'} requests`,
        utilization: utilization
      });
    }
    // Optimization threshold - proactive optimization
    else if (utilization >= this.optimizationThreshold) {
      this.emit('alert', {
        level: 'info',
        message: `Context ${Math.round(utilization * 100)}% full - Proactive optimization available`,
        recommendation: 'Background optimization can be triggered',
        utilization: utilization
      });
    }
  }

  /**
   * Get current metrics for display
   */
  getMetrics() {
    const sessionDuration = (new Date() - this.sessionMetrics.sessionStart) / 1000; // seconds
    
    return {
      ...this.sessionMetrics,
      sessionDuration,
      contextPercentage: Math.round(this.sessionMetrics.contextUtilization * 100),
      formattedCost: `$${this.sessionMetrics.totalCost.toFixed(4)}`,
      tokensRemaining: this.contextWindowSize - this.sessionMetrics.totalInputTokens,
      status: this.getContextStatus(),
      riskLevel: this.getRiskLevel()
    };
  }

  /**
   * Get context status string
   */
  getContextStatus() {
    const utilization = this.sessionMetrics.contextUtilization;
    
    if (utilization >= this.criticalThreshold) return 'CRITICAL';
    if (utilization >= this.warningThreshold) return 'WARNING';
    if (utilization >= this.optimizationThreshold) return 'OPTIMAL';
    return 'GOOD';
  }

  /**
   * Get risk level for auto-compact
   */
  getRiskLevel() {
    const utilization = this.sessionMetrics.contextUtilization;
    
    if (utilization >= 0.9) return 'VERY HIGH';
    if (utilization >= this.criticalThreshold) return 'HIGH';
    if (utilization >= this.warningThreshold) return 'MEDIUM';
    if (utilization >= this.optimizationThreshold) return 'LOW';
    return 'VERY LOW';
  }

  /**
   * Generate context meter display (ASCII for terminal)
   */
  generateMeterDisplay() {
    const metrics = this.getMetrics();
    const barLength = 20;
    const filledLength = Math.floor(metrics.contextPercentage / 100 * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    return `
┌─ Trinity MVP Context Meter ─────────────────────────────────────┐
│ Context Window: ${bar} ${metrics.contextPercentage}% (${Math.round(metrics.totalInputTokens/1000)}k/${Math.round(this.contextWindowSize/1000)}k)     │
│ Session Cost: ${metrics.formattedCost} | Requests: ${metrics.requestCount} | Efficiency: ${Math.round(metrics.efficiency)}     │
│ Status: ${metrics.status.padEnd(8)} | Risk: ${metrics.riskLevel.padEnd(9)} | Remaining: ~${metrics.estimatedRemainingRequests || 'N/A'} req │
└─────────────────────────────────────────────────────────────────┘`;
  }

  /**
   * Get cost trend analysis
   */
  getCostTrend() {
    if (this.costHistory.length < 2) return 'INSUFFICIENT_DATA';
    
    const recent = this.costHistory.slice(-5); // Last 5 requests
    const avgCost = recent.reduce((sum, entry) => sum + (entry.cost || 0), 0) / recent.length;
    const avgTokens = recent.reduce((sum, entry) => sum + (entry.inputTokens || 0) + (entry.outputTokens || 0), 0) / recent.length;
    
    if (avgTokens > this.sessionMetrics.avgTokensPerRequest * 1.2) return 'INCREASING';
    if (avgTokens < this.sessionMetrics.avgTokensPerRequest * 0.8) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * Reset session metrics
   */
  resetSession() {
    this.sessionMetrics = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: 0,
      sessionStart: new Date(),
      efficiency: 100,
      contextUtilization: 0,
      avgTokensPerRequest: 0
    };
    
    this.costHistory = [];
    this.emit('sessionReset');
    this.log('Session metrics reset');
  }

  /**
   * Log messages
   */
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [CONTEXT-METER] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage);
    } else if (level === 'warning') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }
}

module.exports = ContextMeter;