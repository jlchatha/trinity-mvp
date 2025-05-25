#!/bin/bash

# Trinity MVP macOS Deployment Script
# Deploys Context Intelligence breakthrough to Mac environment

echo "🚀 Trinity MVP macOS Deployment - Context Intelligence Breakthrough"
echo "=================================================================="
echo ""

# Check if target directory provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide macOS Trinity directory path"
    echo "Usage: ./deploy-to-macos.sh /path/to/macos/trinity"
    exit 1
fi

MACOS_DIR="$1"

# Validate target directory exists
if [ ! -d "$MACOS_DIR" ]; then
    echo "❌ Error: Directory $MACOS_DIR does not exist"
    exit 1
fi

echo "🎯 Target Directory: $MACOS_DIR"
echo ""

# Create backup of existing files
echo "📦 Creating backup of existing files..."
BACKUP_DIR="${MACOS_DIR}/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup critical files if they exist
for file in "src/ui/context-optimization-panel.js" "src/ui/trinity-status-bar.js" "src/ui/trinity-single-window.js" "src/electron/trinity-ipc-bridge.js" "preload.js"; do
    if [ -f "${MACOS_DIR}/${file}" ]; then
        cp "${MACOS_DIR}/${file}" "${BACKUP_DIR}/"
        echo "✅ Backed up: $file"
    fi
done

echo ""

# Deploy updated files
echo "🚀 Deploying Context Intelligence updates..."

# Ensure target directories exist
mkdir -p "${MACOS_DIR}/src/ui"
mkdir -p "${MACOS_DIR}/src/electron"

# Copy critical files
cp "src/ui/context-optimization-panel.js" "${MACOS_DIR}/src/ui/"
echo "✅ Deployed: Context Optimization Panel (922+ lines)"

cp "src/ui/trinity-status-bar.js" "${MACOS_DIR}/src/ui/"
echo "✅ Deployed: Trinity Status Bar (enhanced)"

cp "src/ui/trinity-single-window.js" "${MACOS_DIR}/src/ui/"
echo "✅ Deployed: Single Window Integration"

cp "src/electron/trinity-ipc-bridge.js" "${MACOS_DIR}/src/electron/"
echo "✅ Deployed: IPC Bridge (with context endpoints)"

cp "preload.js" "${MACOS_DIR}/"
echo "✅ Deployed: Preload API"

echo ""

# Copy validation script
cp "validate-macos-deployment.js" "${MACOS_DIR}/"
echo "✅ Deployed: Validation script"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🔍 Next Steps:"
echo "1. cd $MACOS_DIR"
echo "2. node validate-macos-deployment.js"
echo "3. npm start (or electron .)"
echo "4. Test Context Intelligence Panel"
echo ""
echo "🎯 Expected Features:"
echo "• Token efficiency: 568,181 tokens per \$"
echo "• Real-time context metrics (not 0%)"
echo "• Accurate session costs"
echo "• Working Optimize Now button"
echo ""
echo "📱 Ready for live Mac tester!"