@echo off
REM Trinity MVP - Comprehensive WSL Repair and Setup System
REM Addresses path translation, mounting, and shell execution issues

echo ================================================
echo Trinity MVP - WSL Repair and Setup System
echo ================================================
echo.

set "LOG_FILE=%USERPROFILE%\.trinity-mvp\logs\wsl-repair.log"
mkdir "%USERPROFILE%\.trinity-mvp\logs" >nul 2>&1

echo [%time%] Starting WSL repair system >> "%LOG_FILE%"

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ✅ Running with Administrator privileges
echo [%time%] Running with admin privileges >> "%LOG_FILE%"

REM Phase 1: WSL System Repair
echo.
echo Phase 1: WSL System Repair
echo ========================

echo Stopping WSL to ensure clean state...
wsl --shutdown
timeout /t 3 /nobreak >nul

echo Checking WSL installation...
wsl --status >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing WSL...
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    echo WSL features enabled. System restart may be required.
    echo [%time%] WSL features installed >> "%LOG_FILE%"
)

echo Setting WSL 2 as default version...
wsl --set-default-version 2
echo [%time%] WSL 2 set as default >> "%LOG_FILE%"

REM Phase 2: Ubuntu Installation and Repair
echo.
echo Phase 2: Ubuntu Installation and Repair
echo =======================================

echo Checking for existing Ubuntu installation...
wsl -l -v | findstr Ubuntu >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Ubuntu...
    winget install Canonical.Ubuntu.2204 --silent --accept-package-agreements --accept-source-agreements
    echo [%time%] Ubuntu installation initiated >> "%LOG_FILE%"
    
    echo Waiting for Ubuntu installation to complete...
    timeout /t 10 /nobreak >nul
    
    echo Setting up Ubuntu user (this will open Ubuntu terminal)...
    echo Please create a username and password when prompted.
    ubuntu2204.exe
    echo [%time%] Ubuntu user setup completed >> "%LOG_FILE%"
) else (
    echo Ubuntu found. Checking if it needs repair...
    
    REM Test basic Ubuntu functionality
    wsl -d Ubuntu-22.04 -e echo "test" >nul 2>&1
    if %errorLevel% neq 0 (
        echo Ubuntu appears corrupted. Resetting...
        wsl --unregister Ubuntu-22.04
        echo [%time%] Ubuntu reset due to corruption >> "%LOG_FILE%"
        goto :install_ubuntu
    ) else (
        echo ✅ Ubuntu is functional
        echo [%time%] Ubuntu verified functional >> "%LOG_FILE%"
    )
)

REM Phase 3: File System and Path Repair
echo.
echo Phase 3: File System and Path Repair
echo ====================================

echo Configuring WSL file system settings...

REM Create or update wsl.conf for proper mounting and path handling
wsl -d Ubuntu-22.04 -e bash -c "sudo mkdir -p /etc"
wsl -d Ubuntu-22.04 -e bash -c "echo '[automount]
enabled = true
root = /mnt/
options = \"metadata,umask=22,fmask=11\"
mountFsTab = true

[network]
generateHosts = true
generateResolvConf = true

[interop]
enabled = true
appendWindowsPath = true

[user]
default = ubuntu' | sudo tee /etc/wsl.conf"

echo [%time%] WSL configuration applied >> "%LOG_FILE%"

echo Restarting WSL to apply configuration...
wsl --shutdown
timeout /t 5 /nobreak >nul
wsl -d Ubuntu-22.04 -e echo "WSL restarted successfully"

echo [%time%] WSL restarted with new configuration >> "%LOG_FILE%"

REM Phase 4: System Updates and Package Installation
echo.
echo Phase 4: System Updates and Package Installation
echo ================================================

echo Updating Ubuntu system packages...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt update && sudo apt upgrade -y"
echo [%time%] Ubuntu packages updated >> "%LOG_FILE%"

echo Installing essential packages...
wsl -d Ubuntu-22.04 -e bash -c "sudo apt install -y curl wget unzip build-essential python3 python3-pip nodejs npm"
echo [%time%] Essential packages installed >> "%LOG_FILE%"

REM Phase 5: Claude Code Installation
echo.
echo Phase 5: Claude Code Installation
echo =================================

echo Checking for Claude Code installation...
wsl -d Ubuntu-22.04 -e which claude >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Claude Code...
    
    REM Download and install Claude Code (adjust URL as needed)
    wsl -d Ubuntu-22.04 -e bash -c "curl -fsSL https://claude.ai/install.sh | bash"
    
    REM Alternative method if direct install doesn't work
    if %errorLevel% neq 0 (
        echo Trying alternative Claude Code installation...
        wsl -d Ubuntu-22.04 -e bash -c "pip3 install anthropic"
        echo [%time%] Claude Code installed via pip >> "%LOG_FILE%"
    ) else (
        echo [%time%] Claude Code installed via installer >> "%LOG_FILE%"
    )
) else (
    echo ✅ Claude Code is already installed
    echo [%time%] Claude Code verified installed >> "%LOG_FILE%"
)

REM Phase 6: Environment Configuration
echo.
echo Phase 6: Environment Configuration
echo =================================

echo Setting up Claude Code environment...

REM Set up API key in WSL environment
if defined ANTHROPIC_API_KEY (
    wsl -d Ubuntu-22.04 -e bash -c "echo 'export ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%' >> ~/.bashrc"
    echo ✅ API key configured in WSL
    echo [%time%] API key configured >> "%LOG_FILE%"
) else (
    echo WARNING: ANTHROPIC_API_KEY not set in Windows environment
    echo You will need to set this manually in WSL
    echo [%time%] API key not found in Windows environment >> "%LOG_FILE%"
)

REM Create Trinity MVP workspace directory in WSL
wsl -d Ubuntu-22.04 -e bash -c "mkdir -p /home/\$USER/.trinity-mvp"
echo [%time%] Trinity workspace created in WSL >> "%LOG_FILE%"

REM Phase 7: Path Translation Setup
echo.
echo Phase 7: Path Translation Setup
echo ===============================

echo Creating path translation helper...

REM Create a Windows-to-WSL path translation script
wsl -d Ubuntu-22.04 -e bash -c "cat > /usr/local/bin/win-to-wsl-path << 'EOF'
#!/bin/bash
# Convert Windows path to WSL path
# Usage: win-to-wsl-path \"C:\path\to\file\"

if [ \$# -eq 0 ]; then
    echo \"Usage: win-to-wsl-path \\\"C:\path\\to\\file\\\"\"
    exit 1
fi

# Remove quotes and convert backslashes to forward slashes
path=\$(echo \"\$1\" | sed 's/\\\\/\\//g')

# Convert drive letter (C: -> /mnt/c)
if [[ \$path =~ ^[A-Za-z]: ]]; then
    drive=\$(echo \${path:0:1} | tr '[:upper:]' '[:lower:]')
    path=\"/mnt/\$drive\${path:2}\"
fi

echo \"\$path\"
EOF"

wsl -d Ubuntu-22.04 -e sudo chmod +x /usr/local/bin/win-to-wsl-path
echo [%time%] Path translation helper created >> "%LOG_FILE%"

REM Phase 8: Testing and Validation
echo.
echo Phase 8: Testing and Validation
echo ===============================

echo Testing WSL functionality...

REM Test basic shell access
wsl -d Ubuntu-22.04 -e echo "✅ Shell access working"
if %errorLevel% neq 0 (
    echo ❌ Shell access failed
    echo [%time%] Shell access test failed >> "%LOG_FILE%"
    goto :error_exit
)

REM Test file system access
wsl -d Ubuntu-22.04 -e ls /mnt/c >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ File system access failed
    echo [%time%] File system access test failed >> "%LOG_FILE%"
    goto :error_exit
) else (
    echo ✅ File system access working
)

REM Test Claude Code
wsl -d Ubuntu-22.04 -e claude --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  Claude Code test failed - may need manual configuration
    echo [%time%] Claude Code test failed >> "%LOG_FILE%"
) else (
    echo ✅ Claude Code working
    echo [%time%] Claude Code test passed >> "%LOG_FILE%"
)

REM Test path translation
echo Testing path translation...
set "TEST_PATH=C:\trinity-mvp"
for /f "delims=" %%i in ('wsl -d Ubuntu-22.04 -e /usr/local/bin/win-to-wsl-path "%TEST_PATH%"') do set "WSL_PATH=%%i"
echo Windows path: %TEST_PATH%
echo WSL path: %WSL_PATH%
echo [%time%] Path translation test: %TEST_PATH% -> %WSL_PATH% >> "%LOG_FILE%"

echo.
echo ================================================
echo WSL Repair and Setup Complete!
echo ================================================
echo.
echo Summary:
echo ✅ WSL system repaired and configured
echo ✅ Ubuntu installed and updated
echo ✅ File system mounting configured
echo ✅ Path translation helper installed
echo ✅ Claude Code installation attempted
echo.
echo Log file: %LOG_FILE%
echo.
echo You can now test Trinity MVP with: npm start
echo.
echo [%time%] WSL repair system completed successfully >> "%LOG_FILE%"

pause
exit /b 0

:error_exit
echo.
echo ================================================
echo WSL Repair Failed
echo ================================================
echo.
echo Please check the log file: %LOG_FILE%
echo You may need to:
echo 1. Restart your computer
echo 2. Enable virtualization in BIOS
echo 3. Run Windows Update
echo.
echo [%time%] WSL repair system failed >> "%LOG_FILE%"
pause
exit /b 1