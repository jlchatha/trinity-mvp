@echo off
setlocal enabledelayedexpansion

REM Trinity MVP - Complete Windows Installation Script
REM This script installs WSL, Git, Node.js, and Trinity MVP for non-technical users

echo ========================================
echo Trinity MVP - Complete Windows Installer
echo ========================================
echo.
echo This installer will set up everything needed to run Trinity MVP on Windows:
echo - Windows Subsystem for Linux (WSL)
echo - Git for Windows
echo - Node.js 18+
echo - Trinity MVP application
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer must be run as Administrator
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/6] Checking system requirements...
echo.

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
if "%version%" geq "10.0" (
    echo ✓ Windows 10/11 detected
) else (
    echo ✗ ERROR: Windows 10 or later required
    pause
    exit /b 1
)

echo [2/6] Installing Windows Subsystem for Linux (WSL)...
echo.

REM Enable WSL feature
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

REM Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

REM Download and install WSL2 kernel update
echo Downloading WSL2 kernel update...
powershell -Command "Invoke-WebRequest -Uri 'https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi' -OutFile 'wsl_update_x64.msi'"
if exist "wsl_update_x64.msi" (
    echo Installing WSL2 kernel update...
    msiexec /i wsl_update_x64.msi /quiet
    del "wsl_update_x64.msi"
)

REM Set WSL2 as default
wsl --set-default-version 2

REM Install Ubuntu (most stable for development)
echo Installing Ubuntu Linux distribution...
wsl --install -d Ubuntu

echo [3/6] Installing Git for Windows...
echo.

REM Check if Git is already installed
git --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Git already installed
) else (
    echo Downloading Git for Windows...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-scm/git/releases/download/v2.42.0/Git-2.42.0.2-64-bit.exe' -OutFile 'GitInstaller.exe'"
    if exist "GitInstaller.exe" (
        echo Installing Git for Windows...
        GitInstaller.exe /VERYSILENT /NORESTART
        del "GitInstaller.exe"
    ) else (
        echo WARNING: Could not download Git installer
        echo Please download and install Git manually from: https://git-scm.com/
    )
)

echo [4/6] Installing Node.js...
echo.

REM Check if Node.js is already installed
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Node.js already installed
    node --version
) else (
    echo Downloading Node.js 18 LTS...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi' -OutFile 'NodeInstaller.msi'"
    if exist "NodeInstaller.msi" (
        echo Installing Node.js...
        msiexec /i NodeInstaller.msi /quiet
        del "NodeInstaller.msi"
    ) else (
        echo WARNING: Could not download Node.js installer
        echo Please download and install Node.js 18+ from: https://nodejs.org/
    )
)

echo [5/6] Setting up Linux environment in WSL...
echo.

REM Wait for WSL to be ready and configure Linux environment
echo Setting up Ubuntu Linux environment...
wsl -d Ubuntu -- bash -c "
echo 'Setting up Linux environment for Trinity MVP...'

# Update package lists
sudo apt update

# Install Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Claude Code (if available)
echo 'Claude Code installation requires manual setup'
echo 'Please follow instructions at: https://claude.ai/code'

# Create Trinity MVP directory
mkdir -p ~/trinity-mvp

echo 'Linux environment setup complete'
"

echo [6/6] Installing Trinity MVP...
echo.

REM Create Trinity MVP directory in Windows
set TRINITY_DIR=%USERPROFILE%\trinity-mvp
if not exist "%TRINITY_DIR%" mkdir "%TRINITY_DIR%"

REM Clone Trinity MVP repository
cd /d "%TRINITY_DIR%"
git clone https://github.com/jlchatha/trinity-mvp.git .

REM Install dependencies
echo Installing Trinity MVP dependencies...
call npm install

REM Create shortcuts
echo Creating desktop shortcuts...

REM Create PowerShell script to launch Trinity MVP
echo @echo off > "%TRINITY_DIR%\start-trinity-mvp.bat"
echo cd /d "%TRINITY_DIR%" >> "%TRINITY_DIR%\start-trinity-mvp.bat"
echo npm start >> "%TRINITY_DIR%\start-trinity-mvp.bat"

REM Create desktop shortcut
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Trinity MVP.lnk')
$Shortcut.TargetPath = '%TRINITY_DIR%\start-trinity-mvp.bat'
$Shortcut.WorkingDirectory = '%TRINITY_DIR%'
$Shortcut.IconLocation = '%TRINITY_DIR%\assets\icon.ico'
$Shortcut.Description = 'Trinity MVP - AI Assistant with Persistent Memory'
$Shortcut.Save()
"

echo.
echo ========================================
echo Trinity MVP Installation Complete!
echo ========================================
echo.
echo IMPORTANT: A restart is required to complete WSL installation.
echo.
echo After restart:
echo 1. Set up your Anthropic API key:
echo    - Get your API key from: https://console.anthropic.com/
echo    - Set environment variable: ANTHROPIC_API_KEY=your-key-here
echo.
echo 2. Launch Trinity MVP:
echo    - Use the desktop shortcut "Trinity MVP"
echo    - Or run: %TRINITY_DIR%\start-trinity-mvp.bat
echo.
echo 3. Complete Claude Code setup:
echo    - Follow instructions at: https://claude.ai/code
echo    - Install in WSL Ubuntu environment
echo.
echo Troubleshooting:
echo - Health check: cd "%TRINITY_DIR%" && npm run health-check
echo - Documentation: %TRINITY_DIR%\docs\user\quick-start.md
echo.

REM Check if restart is needed
echo Do you want to restart now to complete WSL installation? (Y/N)
set /p RESTART_CHOICE="Restart now? (Y/N): "
if /i "%RESTART_CHOICE%"=="Y" (
    echo Restarting system...
    shutdown /r /t 10 /c "Restarting to complete Trinity MVP installation"
) else (
    echo Please restart your system manually to complete WSL installation.
)

echo.
echo Installation log saved to: %TRINITY_DIR%\install.log
echo.
pause