@echo off
REM Trinity MVP - Simple Claude Code Investigation

echo ================================================
echo Trinity MVP - Claude Code Investigation
echo ================================================
echo.

echo Testing official Claude Code installer...
wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://claude.ai/install.sh"
echo.

echo Checking if installer works...
wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://claude.ai/install.sh | head -5"
echo.

echo Testing alternative: GitHub CLI method...
wsl -d Ubuntu-22.04 -e bash -c "curl -s https://api.github.com/repos/anthropics/claude-cli/releases/latest"
echo.

echo Testing: Is there a Snap package?
wsl -d Ubuntu-22.04 -e bash -c "snap search claude"
echo.

echo Testing: Is there an AppImage or direct download?
wsl -d Ubuntu-22.04 -e bash -c "wget -q --spider https://claude.ai/downloads/linux && echo 'Download available' || echo 'No download found'"
echo.

pause