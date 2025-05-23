@echo off
REM Trinity MVP - WSL Health Check and Diagnostic Tool
REM Identifies specific WSL issues and recommends solutions

echo ================================================
echo Trinity MVP - WSL Health Check
echo ================================================
echo.

set "LOG_FILE=%USERPROFILE%\.trinity-mvp\logs\wsl-health.log"
mkdir "%USERPROFILE%\.trinity-mvp\logs" >nul 2>&1

echo [%time%] Starting WSL health check >> "%LOG_FILE%"

set "ISSUES_FOUND=0"
set "CRITICAL_ISSUES=0"

REM Check 1: Administrator privileges
echo Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ NOT running as administrator
    echo   Solution: Right-click and "Run as administrator"
    set /a CRITICAL_ISSUES+=1
    echo [%time%] CRITICAL: Not running as administrator >> "%LOG_FILE%"
) else (
    echo ✅ Running as administrator
    echo [%time%] OK: Running as administrator >> "%LOG_FILE%"
)

REM Check 2: WSL Installation
echo.
echo Checking WSL installation...
wsl --status >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ WSL not properly installed
    echo   Solution: Run 'wsl --install' or use our repair script
    set /a CRITICAL_ISSUES+=1
    echo [%time%] CRITICAL: WSL not installed >> "%LOG_FILE%"
) else (
    echo ✅ WSL is installed
    echo [%time%] OK: WSL installed >> "%LOG_FILE%"
)

REM Check 3: WSL Version
echo.
echo Checking WSL version...
for /f "tokens=*" %%i in ('wsl --version 2^>nul') do (
    echo   %%i
    echo [%time%] WSL version: %%i >> "%LOG_FILE%"
)

REM Check 4: Ubuntu Distribution
echo.
echo Checking Ubuntu distribution...
wsl -l -v 2>nul | findstr Ubuntu >nul
if %errorLevel% neq 0 (
    echo ❌ Ubuntu distribution not found
    echo   Solution: Install Ubuntu from Microsoft Store or use repair script
    set /a CRITICAL_ISSUES+=1
    echo [%time%] CRITICAL: Ubuntu not found >> "%LOG_FILE%"
) else (
    echo ✅ Ubuntu distribution found
    for /f "tokens=*" %%i in ('wsl -l -v 2^>nul') do echo   %%i
    echo [%time%] OK: Ubuntu found >> "%LOG_FILE%"
)

REM Check 5: Basic Shell Access
echo.
echo Testing basic shell access...
wsl -e echo "Shell test successful" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Shell access failed
    echo   Issue: Cannot execute commands in WSL
    echo   Solution: Run WSL repair script
    set /a CRITICAL_ISSUES+=1
    echo [%time%] CRITICAL: Shell access failed >> "%LOG_FILE%"
) else (
    echo ✅ Shell access working
    echo [%time%] OK: Shell access working >> "%LOG_FILE%"
)

REM Check 6: File System Mount
echo.
echo Testing file system mount...
wsl -e ls /mnt/c >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ File system mount failed
    echo   Issue: Cannot access Windows C: drive from WSL
    echo   Solution: Check WSL configuration, restart WSL
    set /a ISSUES_FOUND+=1
    echo [%time%] ERROR: File system mount failed >> "%LOG_FILE%"
) else (
    echo ✅ File system mount working
    echo [%time%] OK: File system mount working >> "%LOG_FILE%"
)

REM Check 7: Path Translation
echo.
echo Testing path translation...
set "TEST_PATH=C:\Windows"
wsl -e test -d "/mnt/c/Windows" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Path translation issues detected
    echo   Issue: Windows paths not properly accessible in WSL
    echo   Solution: Run WSL repair script to fix mounting
    set /a ISSUES_FOUND+=1
    echo [%time%] ERROR: Path translation failed >> "%LOG_FILE%"
) else (
    echo ✅ Path translation working
    echo [%time%] OK: Path translation working >> "%LOG_FILE%"
)

REM Check 8: Network Connectivity
echo.
echo Testing network connectivity...
wsl -e ping -c 1 google.com >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Network connectivity issues
    echo   Issue: WSL cannot reach external networks
    echo   Solution: Check Windows firewall and WSL network settings
    set /a ISSUES_FOUND+=1
    echo [%time%] ERROR: Network connectivity failed >> "%LOG_FILE%"
) else (
    echo ✅ Network connectivity working
    echo [%time%] OK: Network connectivity working >> "%LOG_FILE%"
)

REM Check 9: Claude Code Installation
echo.
echo Checking Claude Code installation...
wsl -e which claude >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Claude Code not found
    echo   Issue: Claude Code not installed in WSL
    echo   Solution: Install Claude Code using repair script
    set /a ISSUES_FOUND+=1
    echo [%time%] ERROR: Claude Code not found >> "%LOG_FILE%"
) else (
    echo ✅ Claude Code found
    echo   Version:
    for /f "tokens=*" %%i in ('wsl -e claude --version 2^>nul') do echo     %%i
    echo [%time%] OK: Claude Code found >> "%LOG_FILE%"
)

REM Check 10: API Key Configuration
echo.
echo Checking API key configuration...
if defined ANTHROPIC_API_KEY (
    echo ✅ API key set in Windows environment
    echo   Key: %ANTHROPIC_API_KEY:~0,10%...
    
    REM Check if key is also set in WSL
    wsl -e bash -c "echo \$ANTHROPIC_API_KEY" | findstr sk- >nul 2>&1
    if %errorLevel% neq 0 (
        echo ⚠️  API key not configured in WSL environment
        echo   Solution: Run repair script to sync API key to WSL
        set /a ISSUES_FOUND+=1
        echo [%time%] WARNING: API key not in WSL >> "%LOG_FILE%"
    ) else (
        echo ✅ API key configured in WSL
        echo [%time%] OK: API key in WSL >> "%LOG_FILE%"
    )
) else (
    echo ❌ API key not set
    echo   Issue: ANTHROPIC_API_KEY environment variable not found
    echo   Solution: Set API key with: set ANTHROPIC_API_KEY=your_key_here
    set /a ISSUES_FOUND+=1
    echo [%time%] ERROR: API key not set >> "%LOG_FILE%"
)

REM Check 11: Trinity Directory Structure
echo.
echo Checking Trinity directory structure...
if exist "%USERPROFILE%\.trinity-mvp" (
    echo ✅ Trinity MVP directory exists
    if exist "%USERPROFILE%\.trinity-mvp\queue" (
        echo ✅ Queue directory exists
        echo [%time%] OK: Trinity directories exist >> "%LOG_FILE%"
    ) else (
        echo ⚠️  Queue directory missing
        echo   Solution: Will be created automatically on first run
        echo [%time%] WARNING: Queue directory missing >> "%LOG_FILE%"
    )
) else (
    echo ⚠️  Trinity MVP directory missing
    echo   Solution: Will be created automatically on first run
    echo [%time%] WARNING: Trinity directory missing >> "%LOG_FILE%"
)

REM Summary Report
echo.
echo ================================================
echo WSL Health Check Summary
echo ================================================
echo.

if %CRITICAL_ISSUES% gtr 0 (
    echo 🚨 CRITICAL ISSUES: %CRITICAL_ISSUES%
    echo   Trinity MVP will NOT work until these are resolved.
    echo   Recommended action: Run wsl-repair-system.bat as administrator
) else if %ISSUES_FOUND% gtr 0 (
    echo ⚠️  ISSUES FOUND: %ISSUES_FOUND%
    echo   Trinity MVP may have problems.
    echo   Recommended action: Run wsl-repair-system.bat to fix issues
) else (
    echo ✅ ALL CHECKS PASSED
    echo   Trinity MVP should work correctly with WSL!
    echo   You can now run: npm start
)

echo.
echo Detailed log: %LOG_FILE%
echo.

if %CRITICAL_ISSUES% gtr 0 (
    echo [%time%] Health check completed with %CRITICAL_ISSUES% critical issues >> "%LOG_FILE%"
) else if %ISSUES_FOUND% gtr 0 (
    echo [%time%] Health check completed with %ISSUES_FOUND% issues >> "%LOG_FILE%"
) else (
    echo [%time%] Health check completed successfully - all checks passed >> "%LOG_FILE%"
)

pause
exit /b %ISSUES_FOUND%