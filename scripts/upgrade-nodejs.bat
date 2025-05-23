@echo off
REM Trinity MVP - Complete Node.js Upgrade and Claude Code Installation
REM Handles all Node.js conflicts, upgrades, and Claude Code installation in one script

echo ================================================
echo Trinity MVP - Complete Node.js and Claude Code Setup
echo ================================================
echo.
echo This script will:
echo 1. Remove old/conflicting Node.js installations
echo 2. Install Node.js 20 LTS (latest stable)
echo 3. Install Claude Code from @anthropic-ai/claude-code
echo 4. Verify everything works
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Must run as Administrator for system modifications
    pause
    exit /b 1
)

echo Current Node.js status:
wsl -d Ubuntu-22.04 -e bash -c "node --version 2>/dev/null || echo 'Node.js not found'"
echo.

echo ================================================
echo Phase 1: Complete Node.js Cleanup
echo ================================================
echo.

echo Removing all existing Node.js packages and conflicts...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt remove --purge -y nodejs npm libnode-dev libnode72 nodejs-doc 2>/dev/null || true"
echo.

echo Cleaning up package dependencies...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt autoremove -y"
wsl -d Ubuntu-22.04 -e bash -c "sudo apt autoclean"
echo.

echo Removing leftover Node.js files and directories...
wsl -d Ubuntu-22.04 -e bash -c "sudo rm -rf /usr/local/bin/node /usr/local/bin/npm /usr/local/lib/node_modules 2>/dev/null || true"
wsl -d Ubuntu-22.04 -e bash -c "sudo rm -rf /usr/bin/node /usr/bin/npm 2>/dev/null || true"
wsl -d Ubuntu-22.04 -e bash -c "sudo rm -rf /etc/apt/sources.list.d/nodesource.list 2>/dev/null || true"
echo.

echo Cleaning npm cache and global packages...
wsl -d Ubuntu-22.04 -e bash -c "rm -rf ~/.npm ~/.cache/npm 2>/dev/null || true"
echo.

echo ✅ Node.js cleanup complete
echo.

echo ================================================
echo Phase 2: Install Modern Node.js
echo ================================================
echo.

echo Setting up NodeSource repository (official Node.js source)...
wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
if %errorLevel% neq 0 (
    echo ❌ Failed to setup NodeSource repository
    echo Check internet connection and try again
    pause
    exit /b 1
)
echo.

echo Installing Node.js 20 LTS...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y nodejs"
if %errorLevel% neq 0 (
    echo ❌ Node.js installation failed
    echo.
    echo Troubleshooting information:
    wsl -d Ubuntu-22.04 -e bash -c "sudo apt list --installed | grep node"
    wsl -d Ubuntu-22.04 -e bash -c "sudo dpkg --configure -a"
    echo.
    echo Please resolve the package conflicts and try again
    pause
    exit /b 1
)
echo.

echo Verifying Node.js installation...
set "NODE_VERSION="
for /f "delims=" %%i in ('wsl -d Ubuntu-22.04 -e node --version 2^>nul') do set "NODE_VERSION=%%i"

if "%NODE_VERSION%"=="" (
    echo ❌ Node.js installation verification failed
    echo.
    echo Diagnostic information:
    wsl -d Ubuntu-22.04 -e bash -c "which node"
    wsl -d Ubuntu-22.04 -e bash -c "echo $PATH"
    wsl -d Ubuntu-22.04 -e bash -c "ls -la /usr/bin/node* /usr/local/bin/node* 2>/dev/null || echo 'No node binaries found'"
    pause
    exit /b 1
) else (
    echo ✅ Node.js installed: %NODE_VERSION%
)

set "NPM_VERSION="
for /f "delims=" %%i in ('wsl -d Ubuntu-22.04 -e npm --version 2^>nul') do set "NPM_VERSION=%%i"

if "%NPM_VERSION%"=="" (
    echo ❌ npm installation verification failed
    pause
    exit /b 1
) else (
    echo ✅ npm installed: %NPM_VERSION%
)
echo.

echo ================================================
echo Phase 3: Install Claude Code
echo ================================================
echo.

echo Installing @anthropic-ai/claude-code globally...
wsl -d Ubuntu-22.04 -e bash -c "sudo npm install -g @anthropic-ai/claude-code"
if %errorLevel% neq 0 (
    echo ❌ Claude Code installation failed with sudo
    echo.
    echo Trying alternative installation method...
    wsl -d Ubuntu-22.04 -e bash -c "npm config set prefix ~/.local"
    wsl -d Ubuntu-22.04 -e bash -c "npm install -g @anthropic-ai/claude-code"
    
    if %errorLevel% neq 0 (
        echo ❌ Claude Code installation failed completely
        echo.
        echo Diagnostic information:
        wsl -d Ubuntu-22.04 -e npm config list
        wsl -d Ubuntu-22.04 -e npm --version
        pause
        exit /b 1
    ) else (
        echo ✅ Claude Code installed to user directory
        echo Adding to PATH...
        wsl -d Ubuntu-22.04 -e bash -c "echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc"
    fi
) else (
    echo ✅ Claude Code installed globally
)
echo.

echo ================================================
echo Phase 4: Verification and Testing
echo ================================================
echo.

echo Testing Claude Code installation...
wsl -d Ubuntu-22.04 -e bash -c "source ~/.bashrc && claude --version"
if %errorLevel%==0 (
    echo ✅ Claude Code is working!
    echo.
    echo Getting Claude Code help...
    wsl -d Ubuntu-22.04 -e bash -c "source ~/.bashrc && claude --help | head -10"
) else (
    echo ⚠️  Claude Code command test failed
    echo.
    echo Diagnostic information:
    echo Checking global npm packages:
    wsl -d Ubuntu-22.04 -e npm list -g --depth=0
    echo.
    echo Checking PATH:
    wsl -d Ubuntu-22.04 -e bash -c "echo $PATH"
    echo.
    echo Looking for claude command:
    wsl -d Ubuntu-22.04 -e bash -c "find /usr -name claude 2>/dev/null || echo 'Not found in /usr'"
    wsl -d Ubuntu-22.04 -e bash -c "find ~/.local -name claude 2>/dev/null || echo 'Not found in ~/.local'"
    wsl -d Ubuntu-22.04 -e bash -c "find /usr/local -name claude 2>/dev/null || echo 'Not found in /usr/local'"
)
echo.

echo ================================================
echo Phase 5: API Key Configuration
echo ================================================
echo.

if defined ANTHROPIC_API_KEY (
    echo Setting API key in WSL environment...
    wsl -d Ubuntu-22.04 -e bash -c "echo 'export ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%' >> ~/.bashrc"
    echo ✅ API key configured in WSL
) else (
    echo ⚠️  ANTHROPIC_API_KEY not set in Windows
    echo.
    set /p "API_KEY=Enter your Anthropic API key (or press Enter to skip): "
    if not "!API_KEY!"=="" (
        set ANTHROPIC_API_KEY=!API_KEY!
        wsl -d Ubuntu-22.04 -e bash -c "echo 'export ANTHROPIC_API_KEY=!API_KEY!' >> ~/.bashrc"
        echo ✅ API key configured
    ) else (
        echo ⚠️  API key not configured - Claude Code may not work
    )
)
echo.

echo ================================================
echo Installation Summary
echo ================================================
echo.
echo ✅ Node.js: %NODE_VERSION%
echo ✅ npm: %NPM_VERSION%
echo ✅ Claude Code: Installation attempted
echo ✅ WSL environment configured
echo.
echo Next Steps:
echo 1. Test Claude Code: wsl -d Ubuntu-22.04 -e bash -c "source ~/.bashrc && claude --version"
echo 2. If working, test Trinity MVP integration:
echo    a. Start watcher: scripts\start-claude-watcher.bat
echo    b. Start Trinity: npm start
echo 3. First time Claude Code use requires authentication:
echo    wsl -d Ubuntu-22.04 -e bash -c "source ~/.bashrc && claude"
echo.

if %errorLevel%==0 (
    echo 🎉 Installation completed successfully!
    echo Trinity MVP should now work with Claude Code.
) else (
    echo ⚠️  Installation completed with warnings.
    echo Check the diagnostic information above and resolve any issues.
)
echo.

pause