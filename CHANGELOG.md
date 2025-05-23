# Trinity MVP - Changelog

## Version 1.1.0 - Cross-Platform Release (2025-05-23)

### 🎉 **MAJOR RELEASE: Linux & macOS Support**

**Cross-Platform Compatibility**:
- ✅ **Linux**: 100% functional with native Claude Code integration
- 🔧 **macOS**: 95% complete (final response format debug in progress)
- 📝 **Windows**: Archived (WSL compatibility challenges documented)

### ✨ **New Features**
- **Professional UI**: Fixed window title and added Exit menu option
- **Update Mechanism**: "Check for Updates" and "Send Feedback" in Trinity menu
- **Clean Installation**: Fresh clone process for resolving cached file issues
- **Cross-Platform Architecture**: Removed WSL dependencies for native execution

### 🔧 **Technical Improvements**
- **claude-watcher.js**: Updated for cross-platform Claude Code execution
- **File Communication**: Enhanced queue system with better error handling  
- **Installation Scripts**: Streamlined setup for Linux and macOS
- **Codebase Cleanup**: Removed Windows testing artifacts for cleaner release

### 📁 **Repository Structure Changes**
- **Archived**: All Windows testing scripts moved to `/windows-archive/`
- **Removed**: Duplicate testing files and Windows platform integration
- **Kept**: Core Trinity functionality and Linux/macOS installation scripts

### 🐛 **Bug Fixes**
- Fixed WSL dependency causing undefined responses on macOS
- Resolved window title showing "Electron" instead of "Trinity MVP"
- Fixed file communication timeout issues
- Enhanced error handling and logging

### 📋 **Known Issues**
- **macOS**: Response format alignment needed (95% complete)
- **Auto-start**: claude-watcher requires manual start on some systems

### 🚀 **Coming Next**
- Complete macOS response format fix
- Automated claude-watcher startup
- Enhanced memory hierarchy integration
- Professional workflow templates

---
**Note**: Windows support archived due to Claude Code WSL compatibility limitations. Focus shifted to delivering excellence on Linux and macOS platforms.