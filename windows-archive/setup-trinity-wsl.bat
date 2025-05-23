@echo off
REM Trinity MVP - Complete WSL Setup for Trinity
REM One-click solution for all WSL and Claude Code integration issues

echo ================================================
echo Trinity MVP - Complete WSL Setup
echo ================================================
echo.
echo This script will:
echo 1. Check and repair WSL installation
echo 2. Install and configure Ubuntu
echo 3. Install Claude Code in WSL
echo 4. Set up path translation
echo 5. Configure Trinity MVP integration
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires Administrator privileges.
    echo Please right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Running as Administrator ✅
echo.

REM Step 1: Run health check first
echo Step 1: Running WSL health check...
call "%~dp0wsl-health-check.bat"
set "HEALTH_STATUS=%errorLevel%"

if %HEALTH_STATUS% gtr 2 (
    echo.
    echo Critical issues detected. Running full repair...
    call "%~dp0wsl-repair-system.bat"
    
    echo.
    echo Re-running health check after repair...
    call "%~dp0wsl-health-check.bat"
    set "HEALTH_STATUS=%errorLevel%"
)

REM Step 2: Test Trinity integration
echo.
echo Step 2: Testing Trinity MVP integration...

REM Check if Trinity is in current directory
if not exist "package.json" (
    echo WARNING: Not in Trinity MVP directory
    echo Please run this from the Trinity MVP folder
    echo Current directory: %CD%
    echo.
    set /p "CONTINUE=Continue anyway? (y/n): "
    if /i not "%CONTINUE%"=="y" exit /b 1
)

REM Test Claude wrapper
echo Testing Claude wrapper...
if exist "%~dp0claude-wsl-wrapper.bat" (
    echo ✅ Claude wrapper found
    
    REM Test wrapper execution
    "%~dp0claude-wsl-wrapper.bat" --version >nul 2>&1
    if %errorLevel%==0 (
        echo ✅ Claude wrapper working
    ) else (
        echo ⚠️  Claude wrapper needs configuration
    )
) else (
    echo ❌ Claude wrapper missing
    echo Please ensure all Trinity scripts are present
)

REM Step 3: Environment Configuration
echo.
echo Step 3: Configuring environment...

REM Check API key
if defined ANTHROPIC_API_KEY (
    echo ✅ API key found in Windows environment
    
    REM Set API key in WSL
    wsl -e bash -c "echo 'export ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%' >> ~/.bashrc"
    echo ✅ API key configured in WSL
) else (
    echo ❌ ANTHROPIC_API_KEY not set
    echo.
    echo Please set your API key:
    set /p "API_KEY=Enter your Anthropic API key: "
    if not "!API_KEY!"=="" (
        setx ANTHROPIC_API_KEY "!API_KEY!"
        wsl -e bash -c "echo 'export ANTHROPIC_API_KEY=!API_KEY!' >> ~/.bashrc"
        echo ✅ API key configured
    ) else (
        echo ⚠️  API key not set - you'll need to set it manually
    )
)

REM Step 4: Trinity Directory Setup
echo.
echo Step 4: Setting up Trinity directories...

set "TRINITY_DIR=%USERPROFILE%\.trinity-mvp"
mkdir "%TRINITY_DIR%\queue\input" >nul 2>&1
mkdir "%TRINITY_DIR%\queue\processing" >nul 2>&1
mkdir "%TRINITY_DIR%\queue\output" >nul 2>&1
mkdir "%TRINITY_DIR%\queue\failed" >nul 2>&1
mkdir "%TRINITY_DIR%\sessions" >nul 2>&1
mkdir "%TRINITY_DIR%\logs" >nul 2>&1

echo ✅ Trinity directories created: %TRINITY_DIR%

REM Create WSL symlink for easier access
wsl -e bash -c "ln -sf '/mnt/c/Users/%USERNAME%/.trinity-mvp' ~/.trinity-mvp"
echo ✅ WSL symlink created: ~/.trinity-mvp

REM Step 5: Final Test
echo.
echo Step 5: Final integration test...

echo Testing Trinity MVP startup capability...
if exist "main.js" (
    echo ✅ Trinity MVP files found
    
    REM Quick test of require statements
    node -e "try { require('./main.js'); console.log('✅ Main.js loads successfully'); } catch(e) { console.log('❌ Main.js error:', e.message); }" 2>nul
) else (
    echo ⚠️  Trinity MVP main.js not found in current directory
)

echo.
echo ================================================
echo Trinity WSL Setup Complete!
echo ================================================
echo.

if %HEALTH_STATUS% leq 1 (
    echo 🎉 SUCCESS: Trinity MVP should now work with WSL!
    echo.
    echo You can now run:
    echo   npm start
    echo.
    echo If you encounter issues:
    echo 1. Restart your computer
    echo 2. Run this script again
    echo 3. Check logs in: %TRINITY_DIR%\logs
) else (
    echo ⚠️  PARTIAL SUCCESS: Some issues remain
    echo.
    echo Trinity MVP may work but could have problems.
    echo Check the health check results above for specific issues.
    echo.
    echo You can try:
    echo   npm start
    echo.
    echo If it doesn't work, resolve the issues shown in health check.
)

echo.
echo Log files created in: %TRINITY_DIR%\logs
echo For support, check: https://github.com/jlchatha/trinity-mvp/issues
echo.

pause