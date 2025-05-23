@echo off
REM Trinity MVP - Install Real Claude Code (not just API wrapper)
REM Systematic approach to finding and installing actual Claude Code CLI

echo ================================================
echo Trinity MVP - Install Real Claude Code
echo ================================================
echo.

echo Entering Ubuntu to install Claude Code...
echo.

wsl -d Ubuntu-22.04 -e bash -c "
echo '=== Searching for Claude Code Installation Methods ==='
echo

echo 'Method 1: Official Claude Code installer...'
curl -fsSL https://claude.ai/install.sh 2>/dev/null | head -10
if curl -fsSL https://claude.ai/install.sh >/dev/null 2>&1; then
    echo 'Official installer found, attempting install...'
    curl -fsSL https://claude.ai/install.sh | bash
else
    echo 'Official installer not available'
fi

echo
echo 'Method 2: Checking for Claude Code in apt repositories...'
apt search claude 2>/dev/null | grep -i code || echo 'No Claude Code in apt'

echo
echo 'Method 3: Checking npm for Claude Code...'
if command -v npm >/dev/null 2>&1; then
    npm search claude-code 2>/dev/null | head -5 || echo 'No Claude Code in npm'
else
    echo 'npm not available'
fi

echo
echo 'Method 4: Checking GitHub releases...'
echo 'Checking: https://github.com/anthropics/claude-code'
curl -s https://api.github.com/repos/anthropics/claude-code/releases/latest 2>/dev/null | grep -o '\"tag_name\": \"[^\"]*\"' || echo 'GitHub repo not found or no releases'

echo
echo 'Method 5: Direct download attempt...'
echo 'Trying to download from claude.ai...'
wget -q --spider https://claude.ai/code/download/linux && echo 'Linux download available' || echo 'No direct Linux download'

echo
echo 'Method 6: Check if Claude Code requires different installation...'
echo 'Testing alternative URLs...'
curl -s -I https://claude.ai/code | head -1
curl -s -I https://claude.ai/downloads | head -1

echo
echo '=== Current Environment Check ==='
echo 'Current PATH:'
echo \$PATH
echo
echo 'Available commands with claude in name:'
compgen -c | grep -i claude || echo 'No claude commands found'
echo
echo 'Available commands with anthropic in name:'
compgen -c | grep -i anthropic || echo 'No anthropic commands found'
echo
echo 'Python packages:'
pip3 list | grep -i anthropic || echo 'No anthropic Python packages'
pip3 list | grep -i claude || echo 'No claude Python packages'

echo
echo '=== Investigation Complete ==='
"

echo.
echo Investigation complete. Check output above for installation options.
echo.
pause