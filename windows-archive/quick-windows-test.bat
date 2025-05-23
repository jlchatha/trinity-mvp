@echo off
REM Trinity MVP - Quick Windows Test Setup
REM Assumes WSL, Git, and Node.js are already installed

echo ========================================
echo Trinity MVP - Quick Windows Test Setup
echo ========================================
echo.
echo This script sets up Trinity MVP for testing on Windows.
echo Prerequisites: WSL, Git, Node.js 18+ already installed
echo.

REM Check prerequisites
echo Checking prerequisites...

node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ ERROR: Node.js not found
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found: 
node --version

git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ ERROR: Git not found
    echo Please install Git from: https://git-scm.com/
    pause
    exit /b 1
)
echo ✓ Git found

wsl --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ ERROR: WSL not found
    echo Please install WSL first using the complete installer
    pause
    exit /b 1
)
echo ✓ WSL found

echo.
echo Setting up Trinity MVP...

REM Create Trinity MVP directory
set TRINITY_DIR=%USERPROFILE%\trinity-mvp-test
if exist "%TRINITY_DIR%" (
    echo Removing existing test directory...
    rmdir /s /q "%TRINITY_DIR%"
)
mkdir "%TRINITY_DIR%"

REM Clone repository
echo Cloning Trinity MVP repository...
cd /d "%TRINITY_DIR%"
git clone https://github.com/jlchatha/trinity-mvp.git .

REM Install dependencies
echo Installing dependencies...
call npm install

REM Run health check
echo.
echo Running health check...
call npm run health-check

echo.
echo ========================================
echo Trinity MVP Windows Test Setup Complete!
echo ========================================
echo.
echo Location: %TRINITY_DIR%
echo.
echo To test Trinity MVP:
echo 1. Set your API key: set ANTHROPIC_API_KEY=your-key-here
echo 2. Launch: npm start
echo.
echo For Claude Code integration:
echo - Install Claude Code in WSL: https://claude.ai/code
echo - Test WSL integration with: wsl claude --version
echo.

pause