@echo off
REM Trinity MVP - Quick Ubuntu Setup
REM Simple script to install Ubuntu and basic requirements

echo ================================================
echo Trinity MVP - Quick Ubuntu Setup
echo ================================================
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Must run as Administrator
    pause
    exit /b 1
)

echo Step 1: Installing Ubuntu from Microsoft Store...
winget install --id Canonical.Ubuntu.2204LTS --source msstore --silent --accept-package-agreements --accept-source-agreements

echo.
echo Step 2: Launch Ubuntu for setup...
echo IMPORTANT: When Ubuntu opens:
echo 1. Create a username (remember it!)
echo 2. Create a password (remember it!)
echo 3. Wait for setup to complete
echo 4. Close Ubuntu window when done
echo.
echo Press any key to launch Ubuntu...
pause

start /wait ubuntu2204.exe

echo.
echo Step 3: Testing Ubuntu...
wsl -d Ubuntu-22.04 -e echo "Ubuntu is working!"
if %errorLevel% neq 0 (
    echo ❌ Ubuntu test failed
    echo Try: wsl --list --verbose
    echo Then: wsl --set-default-version 2
    echo Then: wsl --set-default Ubuntu-22.04
) else (
    echo ✅ Ubuntu is working!
)

echo.
echo Step 4: Basic package update...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt update && sudo apt install -y curl"

echo.
echo Ubuntu setup complete!
echo Now run: scripts\wsl-health-check.bat
echo.
pause