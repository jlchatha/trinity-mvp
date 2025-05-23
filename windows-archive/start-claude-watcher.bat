@echo off
REM Trinity MVP - Start Claude Code Watcher Daemon

echo ================================================
echo Trinity MVP - Starting Claude Code Watcher
echo ================================================
echo.

REM Check if already running
tasklist /fi "imagename eq node.exe" | findstr "claude-watcher" >nul
if %errorLevel%==0 (
    echo Claude Watcher appears to be already running
    echo Use stop-claude-watcher.bat to stop it first
    pause
    exit /b 1
)

echo Setting API key for Claude Code...
if not defined ANTHROPIC_API_KEY (
    echo WARNING: ANTHROPIC_API_KEY not set!
    echo Claude Code will not work without API key
    echo.
    set /p "API_KEY=Enter your Anthropic API key (or press Enter to continue): "
    if not "!API_KEY!"=="" (
        set ANTHROPIC_API_KEY=!API_KEY!
        echo API key set for this session
    )
    echo.
)

echo Starting Claude Watcher daemon...
echo Press Ctrl+C to stop the watcher
echo.

REM Start the watcher
cd /d "%~dp0.."
node claude-watcher.js

echo.
echo Claude Watcher stopped.
pause