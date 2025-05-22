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
