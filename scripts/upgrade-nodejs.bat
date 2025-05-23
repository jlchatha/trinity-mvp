@echo off
REM Trinity MVP - Upgrade Node.js to support Claude Code

echo ================================================
echo Trinity MVP - Node.js Upgrade for Claude Code
echo ================================================
echo.

echo Current Node.js version:
wsl -d Ubuntu-22.04 -e node --version
echo.

echo Claude Code requires Node.js 18+. Upgrading...
echo.

echo Step 1: Remove old Node.js
echo ============================
wsl -d Ubuntu-22.04 -e bash -c "sudo apt remove -y nodejs npm"
echo.

echo Step 2: Install NodeSource repository (official Node.js)
echo =========================================================
wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
echo.

echo Step 3: Install Node.js 20 LTS
echo ================================
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y nodejs"
echo.

echo Step 4: Verify new installation
echo =================================
echo New Node.js version:
wsl -d Ubuntu-22.04 -e node --version
echo New npm version:
wsl -d Ubuntu-22.04 -e npm --version
echo.

echo Step 5: Reinstall Claude Code with new Node.js
echo ================================================
echo Reinstalling Claude Code...
wsl -d Ubuntu-22.04 -e bash -c "sudo npm install -g @anthropic-ai/claude-code"
echo.

echo Step 6: Test Claude Code
echo =========================
echo Testing Claude Code command...
wsl -d Ubuntu-22.04 -e claude --version
if %errorLevel%==0 (
    echo ✅ Claude Code working!
) else (
    echo ❌ Still having issues. Trying alternative test...
    wsl -d Ubuntu-22.04 -e claude --help
)
echo.

echo ================================================
echo Node.js Upgrade Complete
echo ================================================
echo.

pause