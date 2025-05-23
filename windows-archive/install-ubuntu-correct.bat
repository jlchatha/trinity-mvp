@echo off
REM Trinity MVP - Correct Ubuntu Installation
REM Uses the proper methods to install Ubuntu on Windows

echo ================================================
echo Trinity MVP - Ubuntu Installation
echo ================================================
echo.

REM Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Must run as Administrator
    pause
    exit /b 1
)

echo Method 1: Using WSL built-in install...
echo.

REM Try the official WSL install method first
echo Installing Ubuntu using WSL command...
wsl --install -d Ubuntu-22.04
if %errorLevel%==0 (
    echo ✅ WSL install command succeeded
    echo.
    echo IMPORTANT: Your computer will need to restart after this.
    echo After restart, Ubuntu will automatically set up.
    echo.
    echo Press any key to continue and restart when prompted...
    pause
    goto :end
)

echo WSL install method failed, trying alternatives...
echo.

echo Method 2: Manual Microsoft Store installation...
echo.
echo Option A - Using Store URL:
echo Opening Microsoft Store for Ubuntu...
start ms-windows-store://pdp/?ProductId=9PN20MSR04DW
echo.
echo Please install Ubuntu 22.04.1 LTS from the Store that just opened.
echo After installation, come back here and press any key...
pause

REM Test if Ubuntu is now available
wsl --list --verbose 2>nul | findstr Ubuntu
if %errorLevel%==0 (
    echo ✅ Ubuntu found after Store installation
    goto :setup_ubuntu
)

echo.
echo Method 3: PowerShell App Store method...
echo.
powershell -Command "Get-AppxPackage *Ubuntu* | Select-Object Name, PackageFullName"
echo.
echo Trying PowerShell installation...
powershell -Command "Add-AppxPackage -RegisterByFamilyName -MainPackage CanonicalGroupLimited.Ubuntu22.04LTS_79rhkp1fndgsc"

REM Check again
wsl --list --verbose 2>nul | findstr Ubuntu
if %errorLevel%==0 (
    echo ✅ Ubuntu found after PowerShell method
    goto :setup_ubuntu
)

echo.
echo Method 4: Direct download method...
echo.
echo Downloading Ubuntu directly...
mkdir "%TEMP%\ubuntu-install" >nul 2>&1
cd /d "%TEMP%\ubuntu-install"

echo Downloading Ubuntu 22.04...
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/wslubuntu2204' -OutFile 'ubuntu2204.appx'"
if exist "ubuntu2204.appx" (
    echo Installing Ubuntu from downloaded file...
    powershell -Command "Add-AppxPackage .\ubuntu2204.appx"
) else (
    echo Download failed.
)

REM Final check
wsl --list --verbose 2>nul | findstr Ubuntu
if %errorLevel%==0 (
    echo ✅ Ubuntu found after direct install
    goto :setup_ubuntu
) else (
    echo ❌ All installation methods failed
    echo.
    echo Manual steps required:
    echo 1. Open Microsoft Store
    echo 2. Search for "Ubuntu 22.04"
    echo 3. Install "Ubuntu 22.04.1 LTS"
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

:setup_ubuntu
echo.
echo ================================================
echo Ubuntu Installation Successful!
echo ================================================
echo.

echo Launching Ubuntu for first-time setup...
echo.
echo IMPORTANT: When Ubuntu launches, you will be asked to:
echo 1. Create a username (lowercase, no spaces)
echo 2. Create a password (you'll type it twice)
echo 3. Wait for "Installation successful!" message
echo.
echo Press any key to launch Ubuntu setup...
pause

REM Launch Ubuntu
start /wait ubuntu2204
if %errorLevel% neq 0 (
    start /wait ubuntu
    if %errorLevel% neq 0 (
        start /wait wsl -d Ubuntu-22.04
    )
)

echo.
echo Testing Ubuntu installation...
wsl -d Ubuntu-22.04 -e echo "Ubuntu is working!"
if %errorLevel%==0 (
    echo ✅ Ubuntu setup successful!
    echo.
    echo Ubuntu version:
    wsl -d Ubuntu-22.04 -e lsb_release -a
) else (
    echo ⚠️  Ubuntu may need manual completion
    echo Try running: wsl -d Ubuntu-22.04
)

:end
echo.
echo ================================================
echo Next Steps:
echo ================================================
echo.
echo 1. If computer needs restart, restart now
echo 2. After restart, run: scripts\wsl-health-check.bat
echo 3. If health check passes, try: npm start
echo.
echo If Ubuntu setup isn't complete, run: wsl -d Ubuntu-22.04
echo.
pause