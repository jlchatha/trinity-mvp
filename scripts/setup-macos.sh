#!/bin/bash

# Trinity MVP - macOS Universal Installer
# Auto-detects architecture and installs everything needed

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[Trinity MVP]${NC} $1"
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

# Welcome message
clear
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                     Trinity MVP Installer                    ║
║                                                              ║
║  This installer will set up everything you need to run      ║
║  Trinity MVP on your Mac:                                   ║
║                                                              ║
║  • Node.js (if not installed)                              ║
║  • Claude Code                                              ║
║  • Trinity MVP Application                                  ║
║                                                              ║
║  The installation is completely automated.                  ║
╚══════════════════════════════════════════════════════════════╝

EOF

log "Starting Trinity MVP installation for macOS..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "This installer is for macOS only. Detected: $OSTYPE"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
log "Detected architecture: $ARCH"

if [[ "$ARCH" == "arm64" ]]; then
    log "Apple Silicon (M1/M2/M3) detected"
    NODE_ARCH="arm64"
elif [[ "$ARCH" == "x86_64" ]]; then
    log "Intel Mac detected"
    NODE_ARCH="x64"
else
    error "Unsupported architecture: $ARCH"
    exit 1
fi

# Get macOS version
MACOS_VERSION=$(sw_vers -productVersion)
log "macOS version: $MACOS_VERSION"

# Create Trinity directory
TRINITY_DIR="$HOME/Trinity-MVP"
log "Creating Trinity directory at: $TRINITY_DIR"
mkdir -p "$TRINITY_DIR"
cd "$TRINITY_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install Node.js if needed
log "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    log "Node.js already installed: $NODE_VERSION"
    
    # Check if version is recent enough (v18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [[ $NODE_MAJOR -lt 18 ]]; then
        warning "Node.js version $NODE_VERSION is too old. Installing Node.js 20 LTS..."
        INSTALL_NODE=true
    else
        success "Node.js version is compatible"
        INSTALL_NODE=false
    fi
else
    log "Node.js not found. Installing Node.js 20 LTS..."
    INSTALL_NODE=true
fi

if [[ "$INSTALL_NODE" == "true" ]]; then
    # Download and install Node.js 20 LTS
    NODE_VERSION="20.11.1"
    NODE_PKG="node-v${NODE_VERSION}-darwin-${NODE_ARCH}.pkg"
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_PKG}"
    
    log "Downloading Node.js from: $NODE_URL"
    curl -L -o "$NODE_PKG" "$NODE_URL"
    
    log "Installing Node.js (this may require your password)..."
    sudo installer -pkg "$NODE_PKG" -target /
    
    # Update PATH for current session
    export PATH="/usr/local/bin:$PATH"
    
    # Verify installation
    if command_exists node; then
        success "Node.js installed successfully: $(node --version)"
        rm "$NODE_PKG"  # Clean up installer
    else
        error "Node.js installation failed"
        exit 1
    fi
fi

# Step 2: Install Claude Code
log "Checking Claude Code installation..."
if command_exists claude; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
    success "Claude Code already installed: $CLAUDE_VERSION"
else
    log "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
    
    # Verify installation
    if command_exists claude; then
        success "Claude Code installed successfully: $(claude --version)"
    else
        error "Claude Code installation failed"
        exit 1
    fi
fi

# Step 3: Clone Trinity MVP repository
log "Setting up Trinity MVP..."
if [[ -d "trinity-mvp" ]]; then
    log "Trinity MVP directory already exists. Updating..."
    cd trinity-mvp
    git pull origin main || {
        warning "Git pull failed. You may need to resolve conflicts manually."
    }
else
    log "Cloning Trinity MVP repository..."
    git clone https://github.com/jlchatha/trinity-mvp.git
    cd trinity-mvp
fi

# Step 4: Install Trinity MVP dependencies
log "Installing Trinity MVP dependencies..."
npm install

# Step 5: Set up Trinity data directory
TRINITY_DATA_DIR="$HOME/.trinity-mvp"
log "Creating Trinity data directory: $TRINITY_DATA_DIR"
mkdir -p "$TRINITY_DATA_DIR/queue/input"
mkdir -p "$TRINITY_DATA_DIR/queue/processing" 
mkdir -p "$TRINITY_DATA_DIR/queue/output"
mkdir -p "$TRINITY_DATA_DIR/queue/failed"
mkdir -p "$TRINITY_DATA_DIR/sessions"
mkdir -p "$TRINITY_DATA_DIR/logs"

# Step 6: Create launch script
log "Creating launch script..."
cat > "$TRINITY_DIR/start-trinity.sh" << 'LAUNCH_SCRIPT'
#!/bin/bash

# Trinity MVP Launcher
cd "$(dirname "$0")/trinity-mvp"

echo "Starting Trinity MVP..."
echo "Opening in your default browser in 3 seconds..."

# Start the application
npm start

LAUNCH_SCRIPT

chmod +x "$TRINITY_DIR/start-trinity.sh"

# Step 7: Create desktop shortcut (if possible)
DESKTOP_DIR="$HOME/Desktop"
if [[ -d "$DESKTOP_DIR" ]]; then
    log "Creating desktop shortcut..."
    cat > "$DESKTOP_DIR/Trinity MVP.command" << DESKTOP_SCRIPT
#!/bin/bash
cd "$TRINITY_DIR"
./start-trinity.sh
DESKTOP_SCRIPT
    chmod +x "$DESKTOP_DIR/Trinity MVP.command"
    success "Desktop shortcut created: Trinity MVP.command"
fi

# Step 8: Run health check
log "Running system health check..."
npm run health-check || {
    warning "Health check reported some issues. Trinity MVP may still work correctly."
}

# Installation complete
clear
cat << 'EOF'

╔══════════════════════════════════════════════════════════════╗
║                 🎉 Installation Complete! 🎉                 ║
║                                                              ║
║  Trinity MVP is now installed and ready to use!             ║
║                                                              ║
║  To start Trinity MVP:                                      ║
║                                                              ║
║  Option 1: Double-click "Trinity MVP.command" on Desktop    ║
║  Option 2: Open Terminal and run:                          ║
║            cd ~/Trinity-MVP && ./start-trinity.sh          ║
║                                                              ║
║  The first time you run Trinity MVP, you'll need to        ║
║  configure your Claude API key.                             ║
║                                                              ║
║  Questions? Check the documentation or contact support.     ║
╚══════════════════════════════════════════════════════════════╝

EOF

success "Trinity MVP installation completed successfully!"
log "Installation directory: $TRINITY_DIR"
log "Data directory: $TRINITY_DATA_DIR"

# Ask if user wants to start Trinity now
echo
read -p "Would you like to start Trinity MVP now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Starting Trinity MVP..."
    ./start-trinity.sh
else
    log "You can start Trinity MVP anytime using the desktop shortcut or launch script."
fi