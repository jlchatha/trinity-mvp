#!/bin/bash

# Trinity MVP Release Creation Script
# Creates packaged releases for Linux and macOS

set -e

echo "🚀 Trinity MVP Release Creation"
echo "================================"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Creating release for version: $VERSION"

# Create release directory
mkdir -p releases
rm -rf releases/trinity-mvp-$VERSION
mkdir -p releases/trinity-mvp-$VERSION

echo "📦 Copying core files..."

# Copy essential files only (no node_modules, no dev files)
cp package.json releases/trinity-mvp-$VERSION/
cp main.js releases/trinity-mvp-$VERSION/
cp claude-watcher.js releases/trinity-mvp-$VERSION/
cp preload.js releases/trinity-mvp-$VERSION/
cp LICENSE releases/trinity-mvp-$VERSION/
cp README.md releases/trinity-mvp-$VERSION/

# Copy directories
cp -r src releases/trinity-mvp-$VERSION/
cp -r renderer releases/trinity-mvp-$VERSION/
cp -r scripts releases/trinity-mvp-$VERSION/

# Create platform-specific packages
echo "🐧 Creating Linux package..."
cd releases
tar -czf trinity-mvp-$VERSION-linux.tar.gz trinity-mvp-$VERSION/
echo "   ✅ trinity-mvp-$VERSION-linux.tar.gz created"

echo "🍎 Creating macOS package..."
zip -r trinity-mvp-$VERSION-macos.zip trinity-mvp-$VERSION/ > /dev/null
echo "   ✅ trinity-mvp-$VERSION-macos.zip created"

cd ..

# Create release notes
echo "📝 Creating release notes..."
cat > releases/RELEASE-NOTES-$VERSION.md << EOF
# Trinity MVP v$VERSION

## What's New
- Professional AI assistant with persistent memory
- Native Linux and macOS support  
- Local file system integration via Claude Code
- 4-6 second response times with full local access
- Privacy-first design (all data stays local)

## Installation

### Linux
\`\`\`bash
# Extract and run
tar -xzf trinity-mvp-$VERSION-linux.tar.gz
cd trinity-mvp-$VERSION
npm install
export ANTHROPIC_API_KEY="your_api_key_here"
npm start
\`\`\`

### macOS  
\`\`\`bash
# Extract and run
unzip trinity-mvp-$VERSION-macos.zip
cd trinity-mvp-$VERSION
npm install
export ANTHROPIC_API_KEY="your_api_key_here" 
npm start
\`\`\`

## Requirements
- Node.js 18+ (auto-installed by setup scripts)
- [Claude Code](https://claude.ai/code) 
- [Anthropic API Key](https://claude.ai/pricing) (free tier available)

## Support
- 📖 [Documentation](https://github.com/jlchatha/trinity-mvp/blob/main/docs/user/GETTING-STARTED.md)
- 🐛 [Report Issues](https://github.com/jlchatha/trinity-mvp/issues)
- 💬 [Discussions](https://github.com/jlchatha/trinity-mvp/discussions)

Built with ❤️ for developers who need AI that actually remembers.
EOF

echo ""
echo "✅ Release packages created:"
echo "   📁 releases/trinity-mvp-$VERSION/"
echo "   🐧 releases/trinity-mvp-$VERSION-linux.tar.gz"
echo "   🍎 releases/trinity-mvp-$VERSION-macos.zip"
echo "   📝 releases/RELEASE-NOTES-$VERSION.md"
echo ""
echo "🎯 Next steps:"
echo "   1. Test packages on target platforms"
echo "   2. Create GitHub release with these files"
echo "   3. Update download links in documentation"