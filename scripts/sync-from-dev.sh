#!/bin/bash

# Trinity MVP - Development to Public Repository Sync Script
# Copies clean, production-ready code from trinity-system/mvp-dev to public repository

set -e  # Exit on any error

# Configuration
DEV_DIR="/home/alreadyinuse/git/trinity-system/mvp-dev"
PUBLIC_DIR="/home/alreadyinuse/git/trinity-system/trinity-mvp-public"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${PUBLIC_DIR}/backups/${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if development directory exists
check_dev_directory() {
    if [ ! -d "$DEV_DIR" ]; then
        error "Development directory not found: $DEV_DIR"
        exit 1
    fi
    log "Development directory found: $DEV_DIR"
}

# Function to create backup of current public files
create_backup() {
    if [ -d "$PUBLIC_DIR/src" ]; then
        log "Creating backup of current public files..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup existing source files
        if [ -d "$PUBLIC_DIR/src" ]; then
            cp -r "$PUBLIC_DIR/src" "$BACKUP_DIR/"
        fi
        
        # Backup main files
        for file in main.js package.json; do
            if [ -f "$PUBLIC_DIR/$file" ]; then
                cp "$PUBLIC_DIR/$file" "$BACKUP_DIR/"
            fi
        done
        
        success "Backup created: $BACKUP_DIR"
    else
        log "No existing files to backup"
    fi
}

# Function to sync core source files
sync_source_files() {
    log "Syncing core source files..."
    
    # Create source directory structure
    mkdir -p "$PUBLIC_DIR/src/core"
    mkdir -p "$PUBLIC_DIR/src/ui"
    mkdir -p "$PUBLIC_DIR/src/utils"
    mkdir -p "$PUBLIC_DIR/src/platform"
    
    # Copy core files with production names and fix internal require statements
    if [ -f "$DEV_DIR/src/claude-code-sdk.js" ]; then
        sed "s|require('./file-comm-manager')|require('./file-manager')|g" \
            "$DEV_DIR/src/claude-code-sdk.js" > "$PUBLIC_DIR/src/core/claude-integration.js"
    fi
    
    if [ -f "$DEV_DIR/src/file-comm-manager.js" ]; then
        cp "$DEV_DIR/src/file-comm-manager.js" "$PUBLIC_DIR/src/core/file-manager.js"
    fi
    
    if [ -f "$DEV_DIR/src/agent-prompts.js" ]; then
        cp "$DEV_DIR/src/agent-prompts.js" "$PUBLIC_DIR/src/core/ai-prompts.js"
    fi
    
    # Copy UI files to renderer directory (matching main.js expectations)
    if [ -d "$DEV_DIR/renderer" ]; then
        mkdir -p "$PUBLIC_DIR/renderer"
        cp -r "$DEV_DIR/renderer/"* "$PUBLIC_DIR/renderer/"
    fi
    
    # Copy utility files (if they exist)
    if [ -f "$DEV_DIR/src/cross-platform.js" ]; then
        cp "$DEV_DIR/src/cross-platform.js" "$PUBLIC_DIR/src/platform/"
    fi
    
    success "Source files synced with updated require paths"
}

# Function to sync and clean main application files
sync_main_files() {
    log "Syncing main application files..."
    
    # Copy main.js with production modifications and path fixes
    if [ -f "$DEV_DIR/main.js" ]; then
        # Remove development-specific code and update require paths
        sed '/\/\/ DEV:/d; /\/\/ DEBUG:/d; /console\.log.*DEV/d' "$DEV_DIR/main.js" | \
        sed "s|require('./src/claude-code-sdk')|require('./src/core/claude-integration')|g" | \
        sed "s|require('./src/agent-prompts')|require('./src/core/ai-prompts')|g" | \
        sed "s|require('./src/file-comm-manager')|require('./src/core/file-manager')|g" \
        > "$PUBLIC_DIR/main.js"
    fi
    
    # Copy preload.js if it exists
    if [ -f "$DEV_DIR/preload.js" ]; then
        cp "$DEV_DIR/preload.js" "$PUBLIC_DIR/"
    fi
    
    success "Main application files synced with updated require paths"
}

# Function to create production package.json
create_production_package_json() {
    log "Creating production package.json..."
    
    # Use the already created package.json in public repo
    # Just verify it exists
    if [ ! -f "$PUBLIC_DIR/package.json" ]; then
        error "Public package.json not found. It should already exist."
        exit 1
    fi
    
    log "Using existing production package.json"
}

# Function to create startup scripts
create_startup_scripts() {
    log "Creating production startup scripts..."
    
    # Create simplified startup script for production
    cat > "$PUBLIC_DIR/scripts/start-trinity.sh" << 'EOF'
#!/bin/bash

# Trinity MVP Production Startup Script
set -e

# Configuration
TRINITY_DIR="$HOME/.trinity-mvp"
LOG_FILE="$TRINITY_DIR/logs/startup.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Create directories
mkdir -p "$TRINITY_DIR"/{queue/{input,processing,output,failed},sessions,logs}

# Start watcher daemon
log "Starting Trinity MVP background services..."
if [ -f "src/claude-watcher.js" ]; then
    nohup node src/claude-watcher.js > "$TRINITY_DIR/logs/claude-watcher.out" 2>&1 &
    echo $! > "$TRINITY_DIR/claude-watcher.pid"
fi

# Start Electron application
log "Launching Trinity MVP interface..."
npm start

# Cleanup on exit
cleanup() {
    log "Shutting down Trinity MVP..."
    if [ -f "$TRINITY_DIR/claude-watcher.pid" ]; then
        kill $(cat "$TRINITY_DIR/claude-watcher.pid") 2>/dev/null || true
        rm "$TRINITY_DIR/claude-watcher.pid"
    fi
}

trap cleanup EXIT
EOF

    chmod +x "$PUBLIC_DIR/scripts/start-trinity.sh"
    
    success "Startup scripts created"
}

# Function to sync setup and installation scripts
sync_setup_scripts() {
    log "Creating setup and installation scripts..."
    
    # Create macOS setup script
    cat > "$PUBLIC_DIR/scripts/setup-macos.sh" << 'EOF'
#!/bin/bash

# Trinity MVP macOS Setup Script
set -e

echo "Trinity MVP - macOS Setup"
echo "========================="
echo

echo "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "Install via Homebrew: brew install node"
    echo "Or download from: https://nodejs.org/"
    exit 1
fi

echo "Node.js found: $(node --version)"

# Check Claude Code
if ! command -v claude &> /dev/null; then
    echo "WARNING: Claude Code not found"
    echo "Please install Claude Code: https://claude.ai/code"
    echo "Then run this setup script again"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
echo "Installing Trinity MVP dependencies..."
npm install

echo
echo "Setting up Trinity MVP directories..."
mkdir -p "$HOME/.trinity-mvp"/{queue/{input,processing,output,failed},sessions,logs}

echo
echo "Trinity MVP setup complete!"
echo "Run 'npm start' to launch Trinity MVP"
EOF

    chmod +x "$PUBLIC_DIR/scripts/setup-macos.sh"

    # Create Linux setup script
    cat > "$PUBLIC_DIR/scripts/setup-linux.sh" << 'EOF'
#!/bin/bash

# Trinity MVP Linux Setup Script
set -e

echo "Trinity MVP - Linux Setup"
echo "========================="
echo

echo "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    echo "On RHEL: sudo dnf install nodejs npm"
    exit 1
fi

echo "Node.js found: $(node --version)"

# Check Claude Code
if ! command -v claude &> /dev/null; then
    echo "WARNING: Claude Code not found"
    echo "Please install Claude Code: https://claude.ai/code"
    echo "Then run this setup script again"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
echo "Installing Trinity MVP dependencies..."
npm install

echo
echo "Setting up Trinity MVP directories..."
mkdir -p "$HOME/.trinity-mvp"/{queue/{input,processing,output,failed},sessions,logs}

echo
echo "Trinity MVP setup complete!"
echo "Run 'npm start' to launch Trinity MVP"
EOF

    chmod +x "$PUBLIC_DIR/scripts/setup-linux.sh"
    
    success "Setup scripts created"
}

# Function to create health check script
create_health_check() {
    log "Creating health check script..."
    
    cat > "$PUBLIC_DIR/scripts/health-check.js" << 'EOF'
#!/usr/bin/env node

// Trinity MVP Health Check Script
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const TRINITY_DIR = path.join(os.homedir(), '.trinity-mvp');

class HealthCheck {
  constructor() {
    this.checks = [];
    this.results = {};
  }

  async run() {
    console.log('Trinity MVP Health Check');
    console.log('========================\n');

    await this.checkNodeVersion();
    await this.checkTrinityDirectories();
    await this.checkClaudeCode();
    await this.checkAPIKey();
    await this.checkDependencies();

    this.printSummary();
  }

  async checkNodeVersion() {
    console.log('Checking Node.js version...');
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      this.pass('Node.js', `${version} (>=18 required)`);
    } else {
      this.fail('Node.js', `${version} - Please upgrade to Node.js 18+`);
    }
  }

  async checkTrinityDirectories() {
    console.log('Checking Trinity directories...');
    const requiredDirs = [
      'queue/input',
      'queue/processing', 
      'queue/output',
      'queue/failed',
      'sessions',
      'logs'
    ];

    let allExist = true;
    for (const dir of requiredDirs) {
      const fullPath = path.join(TRINITY_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        allExist = false;
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`  Created: ${fullPath}`);
        } catch (error) {
          this.fail('Directories', `Cannot create ${fullPath}: ${error.message}`);
          return;
        }
      }
    }

    if (allExist) {
      this.pass('Directories', 'All required directories exist');
    } else {
      this.pass('Directories', 'Missing directories created');
    }
  }

  async checkClaudeCode() {
    console.log('Checking Claude Code installation...');
    
    return new Promise((resolve) => {
      const command = 'claude --version'; // Native Claude Code on Linux/macOS
      
      const proc = spawn('sh', ['-c', command], { stdio: 'pipe' });
      
      let output = '';
      proc.stdout.on('data', (data) => output += data.toString());
      proc.stderr.on('data', (data) => output += data.toString());
      
      proc.on('close', (code) => {
        if (code === 0) {
          this.pass('Claude Code', `Installed and accessible`);
        } else {
          this.fail('Claude Code', 'Not found or not accessible');
        }
        resolve();
      });
      
      setTimeout(() => {
        proc.kill();
        this.fail('Claude Code', 'Check timed out');
        resolve();
      }, 5000);
    });
  }

  async checkAPIKey() {
    console.log('Checking API key configuration...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      if (apiKey.startsWith('sk-')) {
        this.pass('API Key', 'Properly configured');
      } else {
        this.fail('API Key', 'Invalid format (should start with sk-)');
      }
    } else {
      this.fail('API Key', 'ANTHROPIC_API_KEY not set');
    }
  }

  async checkDependencies() {
    console.log('Checking package dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const nodeModules = fs.existsSync('node_modules');
      
      if (nodeModules) {
        this.pass('Dependencies', 'node_modules exists');
      } else {
        this.fail('Dependencies', 'Run "npm install" to install dependencies');
      }
    } catch (error) {
      this.fail('Dependencies', `Cannot read package.json: ${error.message}`);
    }
  }

  pass(check, message) {
    console.log(`  ✅ ${check}: ${message}`);
    this.results[check] = { status: 'pass', message };
  }

  fail(check, message) {
    console.log(`  ❌ ${check}: ${message}`);
    this.results[check] = { status: 'fail', message };
  }

  printSummary() {
    console.log('\nHealth Check Summary');
    console.log('===================');
    
    const passed = Object.values(this.results).filter(r => r.status === 'pass').length;
    const total = Object.keys(this.results).length;
    
    console.log(`\nPassed: ${passed}/${total} checks`);
    
    const failed = Object.entries(this.results).filter(([, r]) => r.status === 'fail');
    if (failed.length > 0) {
      console.log('\nFailed checks:');
      failed.forEach(([check, result]) => {
        console.log(`  - ${check}: ${result.message}`);
      });
    }
    
    if (passed === total) {
      console.log('\n🎉 Trinity MVP is ready to use!');
    } else {
      console.log('\n⚠️  Please resolve the failed checks before using Trinity MVP');
    }
  }
}

const healthCheck = new HealthCheck();
healthCheck.run().catch(console.error);
EOF

    chmod +x "$PUBLIC_DIR/scripts/health-check.js"
    
    success "Health check script created"
}

# Function to clean development artifacts
clean_development_artifacts() {
    log "Cleaning development artifacts..."
    
    # Remove development-specific files
    find "$PUBLIC_DIR" -name "*.dev.js" -delete 2>/dev/null || true
    find "$PUBLIC_DIR" -name "*.test.*" -delete 2>/dev/null || true
    find "$PUBLIC_DIR" -name "NOTES.md" -delete 2>/dev/null || true
    find "$PUBLIC_DIR" -name "*.log" -delete 2>/dev/null || true
    
    # Clean up any temporary files
    find "$PUBLIC_DIR" -name "*.tmp" -delete 2>/dev/null || true
    find "$PUBLIC_DIR" -name ".DS_Store" -delete 2>/dev/null || true
    
    success "Development artifacts cleaned"
}

# Function to update version and build info
update_version_info() {
    log "Updating version information..."
    
    # Get current git commit from development repo
    if [ -d "$DEV_DIR/.git" ]; then
        cd "$DEV_DIR"
        COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        
        # Create build info file
        cat > "$PUBLIC_DIR/BUILD_INFO.json" << EOF
{
  "buildDate": "$BUILD_DATE",
  "sourceCommit": "$COMMIT_HASH",
  "syncTimestamp": "$TIMESTAMP",
  "version": "1.0.0",
  "platform": "$(uname -s)",
  "nodeVersion": "$(node --version)"
}
EOF
        
        cd - > /dev/null
        success "Version information updated"
    else
        warning "No git repository found in development directory"
    fi
}

# Main execution
main() {
    log "Starting Trinity MVP sync from development to public repository"
    log "Development: $DEV_DIR"
    log "Public: $PUBLIC_DIR"
    echo
    
    check_dev_directory
    create_backup
    sync_source_files
    sync_main_files
    create_production_package_json
    create_startup_scripts
    sync_setup_scripts
    create_health_check
    clean_development_artifacts
    update_version_info
    
    echo
    success "Trinity MVP sync completed successfully!"
    log "Backup created in: $BACKUP_DIR"
    log "Public repository ready for release"
    
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Test the public repository: cd $PUBLIC_DIR && npm install && npm start"
    echo "2. Commit changes to public repository"
    echo "3. Create release packages: npm run build"
    echo "4. Test on target platforms"
}

# Run main function
main "$@"
EOF

chmod +x "$PUBLIC_DIR/scripts/sync-from-dev.sh"