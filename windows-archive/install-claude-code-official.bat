@echo off
REM Trinity MVP - Official Claude Code Installation
REM Based on Medium article: Comprehensive guide to setting up Claude Code on Windows using WSL

echo ================================================
echo Trinity MVP - Official Claude Code Installation
echo ================================================
echo.
echo Based on: Comprehensive guide to setting up Claude Code on Windows using WSL
echo Source: https://medium.com/ai-insights-cobet/comprehensive-guide-to-setting-up-claude-code-on-windows-using-wsl-d3a3f3b5a128
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Must run as Administrator for WSL setup
    pause
    exit /b 1
)

echo Step 1: Verify WSL Installation
echo ===============================
wsl --version
if %errorLevel% neq 0 (
    echo Installing WSL...
    wsl --install
    echo.
    echo IMPORTANT: Computer restart may be required.
    echo After restart, run this script again.
    pause
    exit /b 2
)

echo ✅ WSL is installed
echo.

echo Step 2: Update Ubuntu System
echo ============================
echo Updating package lists...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt update && sudo apt upgrade -y"
echo ✅ Ubuntu system updated
echo.

echo Step 3: Install Node.js and npm
echo ================================
echo Installing Node.js and npm...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y nodejs npm"

echo Verifying Node.js installation...
wsl -d Ubuntu-22.04 -e node -v
wsl -d Ubuntu-22.04 -e npm -v
echo ✅ Node.js and npm installed
echo.

echo Step 4: Install Git and Ripgrep
echo =================================
echo Installing Git...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y git"

echo Installing Ripgrep...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y ripgrep"

echo Verifying installations...
wsl -d Ubuntu-22.04 -e git --version
wsl -d Ubuntu-22.04 -e rg --version
echo ✅ Git and Ripgrep installed
echo.

echo Step 5: Install Claude Code
echo ============================
echo Installing @anthropic-ai/claude-code globally...
wsl -d Ubuntu-22.04 -e bash -c "sudo npm install -g @anthropic-ai/claude-code"

if %errorLevel%==0 (
    echo ✅ Claude Code installed successfully
) else (
    echo ❌ Claude Code installation failed
    echo Checking npm global directory...
    wsl -d Ubuntu-22.04 -e npm config get prefix
    echo.
    echo Trying alternative installation without sudo...
    wsl -d Ubuntu-22.04 -e bash -c "npm install -g @anthropic-ai/claude-code"
)
echo.

echo Step 6: Verify Claude Code Installation
echo ========================================
echo Testing Claude Code command...
wsl -d Ubuntu-22.04 -e which claude
if %errorLevel%==0 (
    echo ✅ Claude Code command found
    echo Getting Claude Code version/help...
    wsl -d Ubuntu-22.04 -e claude --help
) else (
    echo ⚠️  Claude Code command not found in PATH
    echo Checking global npm packages...
    wsl -d Ubuntu-22.04 -e npm list -g --depth=0
    echo.
    echo Checking if claude command exists elsewhere...
    wsl -d Ubuntu-22.04 -e bash -c "find /usr -name claude 2>/dev/null"
    wsl -d Ubuntu-22.04 -e bash -c "find /home -name claude 2>/dev/null"
)
echo.

echo Step 7: Configure API Key
echo =========================
if defined ANTHROPIC_API_KEY (
    echo Setting API key in WSL environment...
    wsl -d Ubuntu-22.04 -e bash -c "echo 'export ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%' >> ~/.bashrc"
    echo ✅ API key configured
) else (
    echo ⚠️  ANTHROPIC_API_KEY not set in Windows
    echo Please set your API key:
    echo   set ANTHROPIC_API_KEY=your_key_here
    echo   Then run this script again
)
echo.

echo ================================================
echo Installation Summary
echo ================================================
echo.
echo ✅ WSL installed and updated
echo ✅ Ubuntu system updated  
echo ✅ Node.js and npm installed
echo ✅ Git and Ripgrep installed
echo ✅ Claude Code installation attempted
echo.
echo Next steps:
echo 1. Test Claude Code: wsl -d Ubuntu-22.04 -e claude --version
echo 2. If working, test Trinity MVP: npm start
echo 3. First time: Authenticate with: wsl -d Ubuntu-22.04 -e claude
echo.
echo For Trinity MVP testing:
echo 1. Start watcher: scripts\start-claude-watcher.bat
echo 2. Start Trinity: npm start
echo.

pause