@echo off
REM Trinity MVP Windows Setup Script

echo Trinity MVP - Windows Setup
echo ==============================

echo.
echo Checking system requirements...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

REM Check WSL
wsl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: WSL not found. Please enable Windows Subsystem for Linux
    echo Follow instructions at: https://docs.microsoft.com/en-us/windows/wsl/install
    pause
    exit /b 1
)

echo WSL found and available

REM Check Claude Code in WSL
wsl which claude >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Claude Code not found in WSL
    echo Please install Claude Code: https://claude.ai/code
    echo Then run this setup script again
    pause
)

echo.
echo Installing Trinity MVP dependencies...
npm install

echo.
echo Trinity MVP setup complete!
echo Run 'npm start' to launch Trinity MVP
pause
