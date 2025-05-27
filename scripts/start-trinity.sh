#!/bin/bash

# Trinity MVP Production Startup Script
set -e

# Configuration
TRINITY_DIR="$HOME/.trinity-mvp"
LOG_FILE="$TRINITY_DIR/logs/startup.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Dependency check function
check_dependencies() {
    log "Checking Trinity MVP dependencies..."
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        warn "Dependencies not found. Installing..."
        npm install
        if [ $? -ne 0 ]; then
            error "Failed to install dependencies. Please run 'npm install' manually."
            exit 1
        fi
        success "Dependencies installed successfully"
    fi
    
    # Check if Electron is available
    if ! npm list electron > /dev/null 2>&1; then
        warn "Electron not found. Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            error "Failed to install Electron. Please run 'npm install' manually."
            exit 1
        fi
    fi
    
    # Verify Electron binary exists
    if [ ! -f "node_modules/.bin/electron" ] && [ ! -f "node_modules/electron/dist/electron" ]; then
        error "Electron binary not found after installation. Dependencies may be corrupted."
        warn "Try: rm -rf node_modules package-lock.json && npm install"
        exit 1
    fi
    
    success "All dependencies verified"
}

# Create directories
mkdir -p "$TRINITY_DIR"/{queue/{input,processing,output,failed},sessions,logs}

# Check dependencies before starting
check_dependencies

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
