/**
 * Windows-Specific Claude Code Integration
 * Handles WSL path translation and command execution for Windows systems
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class WindowsClaudeIntegration {
  constructor() {
    this.platform = process.platform;
    this.isWindows = this.platform === 'win32';
    this.wslAvailable = false;
    this.claudeInWSL = false;
    
    this.init();
  }

  async init() {
    if (this.isWindows) {
      await this.detectWSL();
      await this.detectClaudeInWSL();
    }
  }

  async detectWSL() {
    return new Promise((resolve) => {
      exec('wsl --version', (error, stdout, stderr) => {
        if (!error && stdout) {
          this.wslAvailable = true;
          console.log('WSL detected and available');
        } else {
          console.log('WSL not available');
        }
        resolve(this.wslAvailable);
      });
    });
  }

  async detectClaudeInWSL() {
    if (!this.wslAvailable) return false;

    return new Promise((resolve) => {
      exec('wsl bash -c "which claude"', (error, stdout, stderr) => {
        if (!error && stdout.trim()) {
          this.claudeInWSL = true;
          console.log('Claude Code found in WSL:', stdout.trim());
        } else {
          console.log('Claude Code not found in WSL');
        }
        resolve(this.claudeInWSL);
      });
    });
  }

  getClaudeCommand() {
    if (this.isWindows && this.wslAvailable && this.claudeInWSL) {
      // Use our WSL wrapper for better path handling
      const wrapperPath = path.join(__dirname, '..', '..', 'scripts', 'claude-wsl-wrapper.bat');
      return wrapperPath;
    } else if (this.isWindows) {
      throw new Error('Claude Code requires WSL on Windows. Please install WSL and Claude Code first.');
    } else {
      return 'claude';
    }
  }

  translatePathForWSL(windowsPath) {
    if (!this.isWindows) return windowsPath;

    // Convert Windows path to WSL path
    // C:\Users\... -> /mnt/c/Users/...
    const normalized = windowsPath.replace(/\\/g, '/');
    if (normalized.match(/^[A-Za-z]:/)) {
      const drive = normalized.charAt(0).toLowerCase();
      const pathWithoutDrive = normalized.substring(2);
      return `/mnt/${drive}${pathWithoutDrive}`;
    }
    return normalized;
  }

  translatePathFromWSL(wslPath) {
    if (!this.isWindows) return wslPath;

    // Convert WSL path back to Windows path
    // /mnt/c/Users/... -> C:\Users\...
    if (wslPath.startsWith('/mnt/')) {
      const parts = wslPath.substring(5).split('/');
      if (parts.length > 0) {
        const drive = parts[0].toUpperCase();
        const restOfPath = parts.slice(1).join('\\');
        return `${drive}:\\${restOfPath}`;
      }
    }
    return wslPath;
  }

  async executeClaudeCommand(args, options = {}) {
    const command = this.getClaudeCommand();
    const workingDir = options.workingDirectory || process.cwd();
    
    // Translate working directory for WSL if needed
    const wslWorkingDir = this.translatePathForWSL(workingDir);
    
    // Build command with WSL context
    let fullCommand;
    if (this.isWindows && this.wslAvailable) {
      // Execute Claude in WSL with proper working directory
      const claudeArgs = args.join(' ');
      fullCommand = `wsl bash -c "cd '${wslWorkingDir}' && claude ${claudeArgs}"`;
    } else {
      fullCommand = `${command} ${args.join(' ')}`;
    }

    return new Promise((resolve, reject) => {
      const proc = spawn('cmd', ['/c', fullCommand], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: null
          });
        } else {
          reject(new Error(`Claude Code failed (${code}): ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to execute Claude Code: ${error.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Claude Code execution timeout'));
      }, options.timeout || 30000);
    });
  }

  async testIntegration() {
    try {
      console.log('Testing Windows Claude Code integration...');
      
      // Test 1: WSL availability
      if (this.isWindows && !this.wslAvailable) {
        return {
          success: false,
          error: 'WSL not available. Please install WSL first.',
          steps: [
            'Run as Administrator: wsl --install',
            'Restart your computer',
            'Test again'
          ]
        };
      }

      // Test 2: Claude Code in WSL
      if (this.isWindows && !this.claudeInWSL) {
        return {
          success: false,
          error: 'Claude Code not found in WSL',
          steps: [
            'Open WSL terminal: wsl',
            'Install Claude Code: follow https://claude.ai/code',
            'Verify: claude --version',
            'Exit WSL and test again'
          ]
        };
      }

      // Test 3: Basic Claude Code execution
      const result = await this.executeClaudeCommand(['--version'], { timeout: 10000 });
      
      return {
        success: true,
        claudeVersion: result.output.trim(),
        platform: this.platform,
        wslAvailable: this.wslAvailable,
        claudeInWSL: this.claudeInWSL
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        steps: [
          'Verify WSL is installed and working',
          'Verify Claude Code is installed in WSL',
          'Check network connectivity',
          'Try manual command: wsl claude --version'
        ]
      };
    }
  }

  async setupTrinityFileComm() {
    // Setup file communication directories with Windows-compatible paths
    const trinityDir = path.join(os.homedir(), '.trinity-mvp');
    const queueDir = path.join(trinityDir, 'queue');
    
    // Create directories
    const dirs = [
      path.join(queueDir, 'input'),
      path.join(queueDir, 'processing'),
      path.join(queueDir, 'output'),
      path.join(queueDir, 'failed'),
      path.join(trinityDir, 'sessions'),
      path.join(trinityDir, 'logs')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    console.log('Trinity file communication directories created');
    console.log('Windows path:', trinityDir);
    console.log('WSL path:', this.translatePathForWSL(trinityDir));

    return {
      trinityDir,
      queueDir,
      wslTrinityDir: this.translatePathForWSL(trinityDir),
      wslQueueDir: this.translatePathForWSL(queueDir)
    };
  }
}

module.exports = WindowsClaudeIntegration;