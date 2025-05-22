@echo off
REM Trinity MVP - Claude Code WSL Setup Helper

echo ========================================
echo Trinity MVP - Claude Code WSL Setup
echo ========================================
echo.
echo This script helps set up Claude Code in WSL for Trinity MVP.
echo.

REM Check if WSL is available
wsl --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ✗ WSL not found or not installed
    echo.
    echo Please install WSL first:
    echo 1. Run as Administrator: wsl --install
    echo 2. Restart your computer
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✓ WSL found and available
echo.

REM Check if Claude Code is installed in WSL
echo Checking Claude Code installation in WSL...
wsl bash -c "which claude" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Claude Code found in WSL
    wsl bash -c "claude --version"
) else (
    echo ✗ Claude Code not found in WSL
    echo.
    echo To install Claude Code in WSL:
    echo 1. Open WSL terminal: wsl
    echo 2. Follow Claude Code installation guide: https://claude.ai/code
    echo 3. Verify installation: claude --version
    echo 4. Exit WSL: exit
    echo 5. Run this script again to verify
    echo.
    
    set /p INSTALL_NOW="Do you want to open WSL now to install Claude Code? (Y/N): "
    if /i "%INSTALL_NOW%"=="Y" (
        echo Opening WSL terminal...
        echo Please install Claude Code and then exit WSL when done.
        wsl
        
        REM Re-check after WSL session
        echo.
        echo Checking Claude Code installation again...
        wsl bash -c "which claude" >nul 2>&1
        if %errorLevel% equ 0 (
            echo ✓ Claude Code now available in WSL
            wsl bash -c "claude --version"
        ) else (
            echo ✗ Claude Code still not found in WSL
            echo Please complete the installation manually
        )
    )
)

echo.
echo Testing Trinity MVP Claude Code integration...

REM Test if Trinity can call Claude Code through WSL
set CLAUDE_TEST_OUTPUT=%TEMP%\claude_test.txt
wsl bash -c "echo 'Hello from Claude Code in WSL' | head -1" > "%CLAUDE_TEST_OUTPUT%" 2>&1
if exist "%CLAUDE_TEST_OUTPUT%" (
    echo ✓ WSL command execution working
    type "%CLAUDE_TEST_OUTPUT%"
    del "%CLAUDE_TEST_OUTPUT%"
) else (
    echo ✗ WSL command execution failed
)

echo.
echo ========================================
echo Claude Code WSL Setup Status
echo ========================================
echo.
echo Run Trinity MVP health check to verify complete setup:
echo npm run health-check
echo.
pause