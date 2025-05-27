#!/usr/bin/env node

/**
 * Trinity MVP Queue Manager
 * 
 * Resolves stuck request issues through intelligent queue monitoring and cleanup.
 * Addresses critical issue where requests get stuck in processing directory for hours.
 * 
 * Solution: Active monitoring with timeout-based cleanup and recovery mechanisms.
 */

const fs = require('fs');
const path = require('path');

class QueueManager {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.baseDir = options.baseDir;
    
    // Queue directories
    this.queueDir = path.join(this.baseDir, 'queue');
    this.inputDir = path.join(this.queueDir, 'input');
    this.processingDir = path.join(this.queueDir, 'processing');
    this.outputDir = path.join(this.queueDir, 'output');
    this.failedDir = path.join(this.queueDir, 'failed');
    
    // Timeout thresholds
    this.timeouts = {
      simple: 2 * 60 * 1000,     // 2 minutes (30s timeout + 90s buffer)
      memory: 3 * 60 * 1000,     // 3 minutes (45s timeout + 135s buffer) 
      fileSystem: 5 * 60 * 1000, // 5 minutes (90s timeout + 210s buffer)
      complex: 4 * 60 * 1000,    // 4 minutes (60s timeout + 180s buffer)
      default: 2 * 60 * 1000     // 2 minutes default
    };
    
    // Maximum processing time before forced cleanup (safety net)
    this.maxProcessingTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // Health monitoring
    this.stats = {
      cleanedUpRequests: 0,
      recoveredRequests: 0,
      failedRequests: 0,
      totalScans: 0,
      lastScanTime: null
    };
    
    this.logger.info('[QueueManager] Initialized with intelligent stuck request cleanup');
  }
  
  /**
   * Scan processing directory for stuck requests and clean them up
   * @returns {Object} Cleanup results
   */
  async scanAndCleanup() {
    this.stats.totalScans++;
    this.stats.lastScanTime = new Date();
    
    const results = {
      scanned: 0,
      cleaned: 0,
      recovered: 0,
      failed: 0,
      stuckRequests: []
    };
    
    try {
      if (!fs.existsSync(this.processingDir)) {
        this.logger.warn('[QueueManager] Processing directory does not exist');
        return results;
      }
      
      const files = fs.readdirSync(this.processingDir).filter(f => f.endsWith('.json'));
      results.scanned = files.length;
      
      if (files.length === 0) {
        this.logger.info('[QueueManager] No files in processing directory');
        return results;
      }
      
      this.logger.info(`[QueueManager] Scanning ${files.length} processing files for stuck requests`);
      
      for (const filename of files) {
        const filePath = path.join(this.processingDir, filename);
        const cleanupResult = await this.evaluateFile(filePath, filename);
        
        if (cleanupResult.action !== 'keep') {
          results.stuckRequests.push({
            filename,
            reason: cleanupResult.reason,
            action: cleanupResult.action,
            ageMinutes: cleanupResult.ageMinutes
          });
          
          if (cleanupResult.action === 'cleanup') {
            results.cleaned++;
            this.stats.cleanedUpRequests++;
          } else if (cleanupResult.action === 'recover') {
            results.recovered++;
            this.stats.recoveredRequests++;
          } else if (cleanupResult.action === 'fail') {
            results.failed++;
            this.stats.failedRequests++;
          }
        }
      }
      
      if (results.stuckRequests.length > 0) {
        this.logger.warn(`[QueueManager] Found ${results.stuckRequests.length} stuck requests`);
        results.stuckRequests.forEach(req => {
          this.logger.warn(`[QueueManager] ${req.action.toUpperCase()}: ${req.filename} (${req.ageMinutes}min) - ${req.reason}`);
        });
      } else {
        this.logger.info('[QueueManager] No stuck requests found');
      }
      
    } catch (error) {
      this.logger.error(`[QueueManager] Scan failed: ${error.message}`);
    }
    
    return results;
  }
  
  /**
   * Evaluate a single file for cleanup action
   * @param {string} filePath - Full path to the file
   * @param {string} filename - Just the filename
   * @returns {Object} Evaluation result
   */
  async evaluateFile(filePath, filename) {
    try {
      const stats = fs.statSync(filePath);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageMinutes = Math.round(ageMs / 60000);
      
      // Read file to determine timeout category
      let timeoutCategory = 'default';
      let requestData = null;
      
      try {
        requestData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        timeoutCategory = this.determineTimeoutCategory(requestData);
      } catch (parseError) {
        this.logger.warn(`[QueueManager] Cannot parse ${filename}: ${parseError.message}`);
      }
      
      const timeoutThreshold = this.timeouts[timeoutCategory];
      
      // Force cleanup after 2 hours regardless of category
      if (ageMs > this.maxProcessingTime) {
        this.moveToFailed(filePath, filename, `Processing exceeded maximum time (${Math.round(ageMs/3600000)}h)`);
        return {
          action: 'fail',
          reason: `Exceeded maximum processing time (${Math.round(ageMs/3600000)} hours)`,
          ageMinutes,
          category: timeoutCategory
        };
      }
      
      // Category-specific timeout cleanup
      if (ageMs > timeoutThreshold) {
        // Try to recover first for recent timeouts (within 1.5x threshold)
        if (ageMs < timeoutThreshold * 1.5) {
          this.moveToInput(filePath, filename, 'Timeout recovery attempt');
          return {
            action: 'recover',
            reason: `Timeout exceeded, attempting recovery (${timeoutCategory})`,
            ageMinutes,
            category: timeoutCategory
          };
        } else {
          // Move to failed for old stuck requests
          this.moveToFailed(filePath, filename, `Processing timeout (${timeoutCategory})`);
          return {
            action: 'cleanup',
            reason: `Processing timeout exceeded (${timeoutCategory})`,
            ageMinutes,
            category: timeoutCategory
          };
        }
      }
      
      // File is still within acceptable processing time
      return {
        action: 'keep',
        reason: `Still processing within ${timeoutCategory} timeout`,
        ageMinutes,
        category: timeoutCategory
      };
      
    } catch (error) {
      this.logger.error(`[QueueManager] Error evaluating ${filename}: ${error.message}`);
      return {
        action: 'keep',
        reason: `Evaluation error: ${error.message}`,
        ageMinutes: 0,
        category: 'unknown'
      };
    }
  }
  
  /**
   * Determine timeout category from request data
   * @param {Object} requestData - The request data
   * @returns {string} Timeout category
   */
  determineTimeoutCategory(requestData) {
    if (!requestData || !requestData.prompt) {
      return 'default';
    }
    
    const prompt = requestData.prompt;
    
    // File system operations - longest timeout
    if (this.isFileSystemOperation(prompt)) {
      return 'fileSystem';
    }
    
    // Memory operations
    if (this.isMemoryOperation(prompt)) {
      return 'memory';
    }
    
    // Complex operations (check for complexity indicators)
    if (this.isComplexOperation(prompt)) {
      return 'complex';
    }
    
    return 'simple';
  }
  
  /**
   * Check if prompt indicates file system operation
   */
  isFileSystemOperation(prompt) {
    const patterns = [
      /\b(list|find|search|scan|show)\s+.*\b(files?|folders?|directories?)\b/i,
      /\b(largest|biggest|smallest)\s+.*\b(files?|folders?)\b/i,
      /\b(in|from|within)\s+.*\b(downloads?|documents?|desktop|folder|directory)\b/i,
      /\b(browse|explore|check)\s+.*\b(directory|folder|path)\b/i,
      /\b(ls|dir|find|locate|grep)\b.*\b(files?|directories?)\b/i
    ];
    return patterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Check if prompt indicates memory operation
   */
  isMemoryOperation(prompt) {
    const patterns = [
      /\b(remember|recall|what.*tell|what.*say|what.*mention)\b/i,
      /\b(my\s+favorite|I\s+told\s+you|we\s+discussed|earlier\s+conversation)\b/i,
      /what\s+(was|did)\s+.*\b(that|you|we|I)\b/i,
      /that\s+(poem|code|story|idea|thing)/i,
      /\b(remember\s+that|store\s+this|save\s+this|note\s+that)\b/i,
      /you\s+(mentioned|told|said)\s+(earlier|before)/i,
      /what\s+did\s+we\s+(talk|discuss)\s+about/i,
      /\b(earlier|previous|before)\b.*\b(conversation|discussion|chat)\b/i
    ];
    return patterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Check if prompt indicates complex operation
   */
  isComplexOperation(prompt) {
    const patterns = [
      /\b(analyze|examine|review|evaluate|assess)\b/i,
      /\b(algorithm|architecture|system|complex|detailed)\b/i,
      /\b(write|create|generate|implement)\s+.*\b(code|program|system|application)\b/i,
      /\b(explain|describe)\s+.*\b(how|why|what|when)\b.*\b(work|function|operate)\b/i
    ];
    return patterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * Move file back to input directory for retry
   */
  moveToInput(filePath, filename, reason) {
    try {
      const targetPath = path.join(this.inputDir, filename);
      fs.renameSync(filePath, targetPath);
      this.logger.info(`[QueueManager] RECOVERED: ${filename} → input (${reason})`);
    } catch (error) {
      this.logger.error(`[QueueManager] Failed to recover ${filename}: ${error.message}`);
    }
  }
  
  /**
   * Move file to failed directory
   */
  moveToFailed(filePath, filename, reason) {
    try {
      // Ensure failed directory exists
      if (!fs.existsSync(this.failedDir)) {
        fs.mkdirSync(this.failedDir, { recursive: true });
      }
      
      const targetPath = path.join(this.failedDir, filename);
      fs.renameSync(filePath, targetPath);
      this.logger.warn(`[QueueManager] FAILED: ${filename} → failed (${reason})`);
    } catch (error) {
      this.logger.error(`[QueueManager] Failed to move ${filename} to failed: ${error.message}`);
    }
  }
  
  /**
   * Get queue health statistics
   * @returns {Object} Health statistics
   */
  getHealthStats() {
    const queueCounts = this.getQueueCounts();
    
    return {
      timestamp: new Date().toISOString(),
      queues: queueCounts,
      cleanup: {
        totalScans: this.stats.totalScans,
        cleanedUpRequests: this.stats.cleanedUpRequests,
        recoveredRequests: this.stats.recoveredRequests,
        failedRequests: this.stats.failedRequests,
        lastScanTime: this.stats.lastScanTime
      },
      health: {
        processingStuck: queueCounts.processing > 0,
        queueBacklog: queueCounts.input > 10,
        overallHealth: this.calculateOverallHealth(queueCounts)
      }
    };
  }
  
  /**
   * Get current file counts in each queue directory
   */
  getQueueCounts() {
    const counts = {};
    
    ['input', 'processing', 'output', 'failed'].forEach(dir => {
      const dirPath = path.join(this.queueDir, dir);
      try {
        if (fs.existsSync(dirPath)) {
          counts[dir] = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).length;
        } else {
          counts[dir] = 0;
        }
      } catch (error) {
        counts[dir] = -1; // Error reading directory
      }
    });
    
    return counts;
  }
  
  /**
   * Calculate overall queue health score
   */
  calculateOverallHealth(queueCounts) {
    let score = 100;
    
    // Deduct for stuck processing files
    if (queueCounts.processing > 0) {
      score -= queueCounts.processing * 10;
    }
    
    // Deduct for large input backlog
    if (queueCounts.input > 10) {
      score -= (queueCounts.input - 10) * 2;
    }
    
    // Deduct for many failed requests
    if (queueCounts.failed > 5) {
      score -= (queueCounts.failed - 5) * 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Force cleanup of all processing files (emergency use)
   * @returns {Object} Cleanup results
   */
  async forceCleanupAll() {
    this.logger.warn('[QueueManager] FORCE CLEANUP: Moving all processing files to failed');
    
    const results = { moved: 0, errors: 0 };
    
    try {
      if (!fs.existsSync(this.processingDir)) {
        return results;
      }
      
      const files = fs.readdirSync(this.processingDir).filter(f => f.endsWith('.json'));
      
      for (const filename of files) {
        try {
          const filePath = path.join(this.processingDir, filename);
          this.moveToFailed(filePath, filename, 'Force cleanup');
          results.moved++;
        } catch (error) {
          this.logger.error(`[QueueManager] Force cleanup failed for ${filename}: ${error.message}`);
          results.errors++;
        }
      }
      
    } catch (error) {
      this.logger.error(`[QueueManager] Force cleanup scan failed: ${error.message}`);
      results.errors++;
    }
    
    return results;
  }
}

module.exports = QueueManager;