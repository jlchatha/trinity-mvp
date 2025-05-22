@echo off
REM Trinity MVP - Claude Code WSL Wrapper
REM Handles path translation and proper WSL invocation for Claude Code

setlocal enabledelayedexpansion

REM Configuration
set "WSL_DISTRO=Ubuntu-22.04"
set "LOG_FILE=%USERPROFILE%\.trinity-mvp\logs\claude-wrapper.log"

REM Ensure log directory exists
mkdir "%USERPROFILE%\.trinity-mvp\logs" >nul 2>&1

REM Log the invocation
echo [%time%] Claude wrapper called with: %* >> "%LOG_FILE%"

REM Check if WSL is available
wsl --status >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: WSL not available
    echo [%time%] ERROR: WSL not available >> "%LOG_FILE%"
    exit /b 1
)

REM Check if Ubuntu distribution exists
wsl -l -v | findstr %WSL_DISTRO% >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: %WSL_DISTRO% not found
    echo [%time%] ERROR: %WSL_DISTRO% not found >> "%LOG_FILE%"
    exit /b 1
)

REM Process arguments and translate paths
set "TRANSLATED_ARGS="
set "ARG_COUNT=0"

:process_args
if "%~1"=="" goto :run_claude

REM Check if argument looks like a Windows path
echo %~1 | findstr /r "^[A-Za-z]:\\" >nul
if %errorLevel%==0 (
    REM This is a Windows path - translate it
    set "WIN_PATH=%~1"
    
    REM Convert to WSL path format
    REM Replace backslashes with forward slashes
    set "TEMP_PATH=!WIN_PATH:\=/!"
    
    REM Convert drive letter (C:\ -> /mnt/c/)
    set "DRIVE_LETTER=!TEMP_PATH:~0,1!"
    call :to_lower DRIVE_LETTER
    set "WSL_PATH=/mnt/!DRIVE_LETTER!!TEMP_PATH:~2!"
    
    set "TRANSLATED_ARGS=!TRANSLATED_ARGS! "!WSL_PATH!""
    echo [%time%] Path translated: %~1 -> !WSL_PATH! >> "%LOG_FILE%"
) else (
    REM Not a path - pass through as-is
    set "TRANSLATED_ARGS=!TRANSLATED_ARGS! "%~1""
)

shift
goto :process_args

:run_claude
REM Set up environment for Claude Code
set "WSL_CMD=cd /home/$USER && export ANTHROPIC_API_KEY='%ANTHROPIC_API_KEY%' && claude!TRANSLATED_ARGS!"

echo [%time%] Executing: %WSL_CMD% >> "%LOG_FILE%"

REM Execute Claude Code in WSL
wsl -d %WSL_DISTRO% -e bash -c "%WSL_CMD%"
set "EXIT_CODE=%errorLevel%"

echo [%time%] Claude execution completed with exit code: %EXIT_CODE% >> "%LOG_FILE%"
exit /b %EXIT_CODE%

REM Helper function to convert to lowercase
:to_lower
for %%i in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    call set "%1=!%1:%%i=%%i!"
)
goto :eof