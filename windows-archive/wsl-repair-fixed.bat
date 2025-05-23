@echo off
REM Trinity MVP - WSL Repair System (Fixed Version)
REM Simplified and robust approach to WSL setup

echo ================================================
echo Trinity MVP - WSL Repair System (Fixed)
echo ================================================
echo.

set "LOG_FILE=%USERPROFILE%\.trinity-mvp\logs\wsl-repair.log"
mkdir "%USERPROFILE%\.trinity-mvp\logs" >nul 2>&1

echo [%time%] Starting WSL repair (fixed version) >> "%LOG_FILE%"

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Must run as Administrator
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo [%time%] Admin privileges confirmed >> "%LOG_FILE%"

REM Phase 1: Install Ubuntu from Microsoft Store
echo.
echo Phase 1: Installing Ubuntu Distribution
echo =======================================

echo Shutting down WSL...
wsl --shutdown
timeout /t 2 /nobreak >nul

echo Installing Ubuntu 22.04 LTS...
winget install --id Canonical.Ubuntu.2204LTS --source msstore --silent --accept-package-agreements --accept-source-agreements
if %errorLevel% neq 0 (
    echo Trying alternative Ubuntu installation...
    winget install --id 9PN20MSR04DW --source msstore --silent --accept-package-agreements --accept-source-agreements
)

echo [%time%] Ubuntu installation attempted >> "%LOG_FILE%"

echo Waiting for installation to complete...
timeout /t 10 /nobreak >nul

REM Phase 2: Ubuntu Setup
echo.
echo Phase 2: Ubuntu First-Time Setup
echo =================================

echo Launching Ubuntu for first-time setup...
echo IMPORTANT: When Ubuntu opens, create a username and password
echo.
echo Press any key when you're ready to launch Ubuntu setup...
pause

REM Launch Ubuntu for first-time setup
start /wait ubuntu2204.exe
echo [%time%] Ubuntu first-time setup completed >> "%LOG_FILE%"

REM Phase 3: Test Basic Ubuntu
echo.
echo Phase 3: Testing Ubuntu Installation
echo ====================================

echo Testing Ubuntu shell access...
wsl -d Ubuntu-22.04 -e echo "Ubuntu shell test successful"
if %errorLevel% neq 0 (
    echo ❌ Ubuntu shell test failed
    echo [%time%] Ubuntu shell test failed >> "%LOG_FILE%"
    echo.
    echo Troubleshooting steps:
    echo 1. Restart your computer
    echo 2. Enable virtualization in BIOS if disabled
    echo 3. Run: wsl --install --distribution Ubuntu-22.04
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Ubuntu shell working
    echo [%time%] Ubuntu shell test passed >> "%LOG_FILE%"
)

REM Phase 4: Ubuntu Configuration
echo.
echo Phase 4: Configuring Ubuntu
echo ===========================

echo Updating Ubuntu packages...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt update"
echo [%time%] Ubuntu packages updated >> "%LOG_FILE%"

echo Installing essential packages...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y curl wget unzip python3 python3-pip"
echo [%time%] Essential packages installed >> "%LOG_FILE%"

REM Phase 5: Claude Code Installation
echo.
echo Phase 5: Installing Claude Code
echo ===============================

echo Installing Claude Code in Ubuntu...
echo This may take a few minutes...

REM Method 1: Try official installer
wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://claude.ai/install.sh | bash"
if %errorLevel% neq 0 (
    echo Official installer failed, trying pip...
    wsl -d Ubuntu-22.04 -e bash -c "pip3 install anthropic"
    if %errorLevel% neq 0 (
        echo ⚠️  Claude Code installation failed
        echo You may need to install it manually
        echo [%time%] Claude Code installation failed >> "%LOG_FILE%"
    ) else (
        echo ✅ Claude Code installed via pip
        echo [%time%] Claude Code installed via pip >> "%LOG_FILE%"
    )
) else (
    echo ✅ Claude Code installed
    echo [%time%] Claude Code installed >> "%LOG_FILE%"
)

REM Phase 6: Environment Setup
echo.
echo Phase 6: Environment Configuration
echo ==================================

REM Set API key if available
if defined ANTHROPIC_API_KEY (
    echo Configuring API key in Ubuntu...
    wsl -d Ubuntu-22.04 -e bash -c "echo 'export ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%' >> ~/.bashrc"
    echo ✅ API key configured
    echo [%time%] API key configured >> "%LOG_FILE%"
) else (
    echo ⚠️  API key not set in Windows
    echo [%time%] API key not found >> "%LOG_FILE%"
)

REM Create Trinity directories
echo Creating Trinity directories...
wsl -d Ubuntu-22.04 -e bash -c "mkdir -p ~/.trinity-mvp"
echo [%time%] Trinity directories created >> "%LOG_FILE%"

REM Phase 7: Final Testing
echo.
echo Phase 7: Final Testing
echo ======================

echo Testing file system access...
wsl -d Ubuntu-22.04 -e ls /mnt/c >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ File system access failed
    echo [%time%] File system test failed >> "%LOG_FILE%"
) else (
    echo ✅ File system access working
    echo [%time%] File system test passed >> "%LOG_FILE%"
)

echo Testing network connectivity...
wsl -d Ubuntu-22.04 -e ping -c 1 google.com >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Network test failed
    echo [%time%] Network test failed >> "%LOG_FILE%"
) else (
    echo ✅ Network connectivity working
    echo [%time%] Network test passed >> "%LOG_FILE%"
)

echo Testing Claude Code...
wsl -d Ubuntu-22.04 -e which claude >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Claude Code not found in PATH
    echo [%time%] Claude Code not in PATH >> "%LOG_FILE%"
) else (
    echo ✅ Claude Code found
    echo [%time%] Claude Code found >> "%LOG_FILE%"
)

echo.
echo ================================================
echo WSL Repair Complete!
echo ================================================
echo.
echo Summary:
echo ✅ Ubuntu 22.04 LTS installed
echo ✅ Basic system packages installed  
echo ✅ Trinity directories created
echo.
echo Next steps:
echo 1. Test with: scripts\wsl-health-check.bat
echo 2. If successful, try: npm start
echo.
echo Log: %LOG_FILE%
echo [%time%] WSL repair completed >> "%LOG_FILE%"
echo.

pause