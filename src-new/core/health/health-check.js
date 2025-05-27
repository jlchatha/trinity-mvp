/**
 * Health Check System for Trinity MVP
 * Provides system status monitoring without affecting core functionality
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class HealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.version = this.getVersion();
  }

  /**
   * Perform comprehensive system health check
   * @returns {Promise<Object>} Health status report
   */
  async checkSystem() {
    const checks = await Promise.allSettled([
      this.checkMemoryUsage(),
      this.checkStorageAccess(),
      this.checkClaudeCodeIntegration(),
      this.checkDependencies(),
      this.checkEnvironment(),
    ]);

    const results = {};
    const checkNames = ['memory', 'storage', 'claudeCode', 'dependencies', 'environment'];
    
    checks.forEach((check, index) => {
      results[checkNames[index]] = check.status === 'fulfilled' 
        ? check.value 
        : { healthy: false, error: check.reason?.message || 'Unknown error' };
    });

    const overallHealth = Object.values(results).every(result => result.healthy !== false);

    return {
      status: overallHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: this.getUptime(),
      checks: results,
      summary: this.generateSummary(results),
    };
  }

  /**
   * Check memory usage and performance metrics
   * @returns {Promise<Object>} Memory status
   */
  async checkMemoryUsage() {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      
      return {
        healthy: true,
        process: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
        },
        system: {
          total: Math.round(totalMemory / 1024 / 1024 / 1024), // GB
          free: Math.round(freeMemory / 1024 / 1024 / 1024), // GB
          used: Math.round((totalMemory - freeMemory) / 1024 / 1024 / 1024), // GB
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: `Memory check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check storage access and directory permissions
   * @returns {Promise<Object>} Storage status
   */
  async checkStorageAccess() {
    try {
      const homeDir = require('os').homedir();
      const trinityDir = path.join(homeDir, '.trinity-mvp');
      
      // Check if Trinity directory exists and is accessible
      let directoryStatus = 'not_found';
      let writable = false;
      
      try {
        const stats = fs.statSync(trinityDir);
        if (stats.isDirectory()) {
          directoryStatus = 'exists';
          
          // Test write access
          const testFile = path.join(trinityDir, 'health-test.tmp');
          try {
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            writable = true;
          } catch (writeError) {
            writable = false;
          }
        }
      } catch (statError) {
        directoryStatus = 'not_found';
      }

      return {
        healthy: true,
        directory: {
          path: trinityDir,
          exists: directoryStatus === 'exists',
          writable,
          status: directoryStatus,
        },
        workspace: {
          current: process.cwd(),
          accessible: true,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: `Storage check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check Claude Code CLI integration
   * @returns {Promise<Object>} Claude Code status
   */
  async checkClaudeCodeIntegration() {
    return new Promise((resolve) => {
      try {
        const proc = spawn('claude', ['--version'], { 
          stdio: 'pipe',
          timeout: 5000,
        });
        
        let output = '';
        proc.stdout?.on('data', (data) => {
          output += data.toString();
        });

        proc.on('close', (code) => {
          resolve({
            healthy: code === 0,
            available: code === 0,
            version: code === 0 ? output.trim() : null,
            exitCode: code,
          });
        });

        proc.on('error', (error) => {
          resolve({
            healthy: false,
            available: false,
            error: error.message,
          });
        });

        // Timeout handling
        setTimeout(() => {
          proc.kill();
          resolve({
            healthy: false,
            available: false,
            error: 'Claude Code check timed out',
          });
        }, 5000);
      } catch (error) {
        resolve({
          healthy: false,
          available: false,
          error: `Claude Code check error: ${error.message}`,
        });
      }
    });
  }

  /**
   * Check critical dependencies
   * @returns {Promise<Object>} Dependencies status
   */
  async checkDependencies() {
    try {
      const packageJson = this.getPackageJson();
      const dependencies = packageJson?.dependencies || {};
      const devDependencies = packageJson?.devDependencies || {};
      
      const criticalDeps = ['dotenv'];
      const missingDeps = criticalDeps.filter(dep => !dependencies[dep]);
      
      return {
        healthy: missingDeps.length === 0,
        production: Object.keys(dependencies).length,
        development: Object.keys(devDependencies).length,
        missing: missingDeps,
        nodeVersion: process.version,
        platform: process.platform,
      };
    } catch (error) {
      return {
        healthy: false,
        error: `Dependencies check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check environment configuration
   * @returns {Promise<Object>} Environment status
   */
  async checkEnvironment() {
    try {
      const hasApiKey = !!(process.env.ANTHROPIC_API_KEY);
      const hasValidApiKey = hasApiKey && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-api');
      
      return {
        healthy: true,
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          hasApiKey,
          hasValidApiKey,
          hasCustomModel: !!(process.env.ANTHROPIC_MODEL),
        },
        features: {
          promptCaching: process.env.DISABLE_PROMPT_CACHING !== 'true',
          customTimeout: !!(process.env.API_TIMEOUT_MS),
          customBaseUrl: !!(process.env.ANTHROPIC_BASE_URL),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        error: `Environment check failed: ${error.message}`,
      };
    }
  }

  /**
   * Get application version from package.json
   * @returns {string} Version string
   */
  getVersion() {
    try {
      const packageJson = this.getPackageJson();
      return packageJson?.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get package.json contents
   * @returns {Object} Package.json data
   */
  getPackageJson() {
    try {
      const packagePath = path.join(__dirname, '../../../package.json');
      const packageData = fs.readFileSync(packagePath, 'utf8');
      return JSON.parse(packageData);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get application uptime
   * @returns {Object} Uptime information
   */
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    return {
      milliseconds: uptimeMs,
      seconds: uptimeSeconds,
      minutes: uptimeMinutes,
      hours: uptimeHours,
      formatted: this.formatUptime(uptimeSeconds),
    };
  }

  /**
   * Format uptime for human reading
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Generate health summary
   * @param {Object} results - Check results
   * @returns {Object} Summary information
   */
  generateSummary(results) {
    const totalChecks = Object.keys(results).length;
    const healthyChecks = Object.values(results).filter(r => r.healthy !== false).length;
    const issues = Object.entries(results)
      .filter(([_, result]) => result.healthy === false)
      .map(([name, result]) => ({ check: name, error: result.error }));

    return {
      totalChecks,
      healthyChecks,
      healthPercentage: Math.round((healthyChecks / totalChecks) * 100),
      issues,
      recommendations: this.generateRecommendations(results),
    };
  }

  /**
   * Generate recommendations based on health check results
   * @param {Object} results - Check results
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.claudeCode?.healthy === false) {
      recommendations.push('Install or update Claude Code CLI for optimal integration');
    }

    if (results.environment?.environment?.hasValidApiKey === false) {
      recommendations.push('Set a valid ANTHROPIC_API_KEY in your environment');
    }

    if (results.storage?.directory?.writable === false) {
      recommendations.push('Check file permissions for Trinity MVP storage directory');
    }

    if (results.memory?.process?.heapUsed > 500) {
      recommendations.push('Consider restarting Trinity MVP to free memory');
    }

    return recommendations;
  }
}

module.exports = HealthCheck;