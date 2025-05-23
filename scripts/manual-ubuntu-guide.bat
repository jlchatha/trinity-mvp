@echo off
REM Trinity MVP - Manual Ubuntu Installation Guide
REM Step-by-step guide for manual Ubuntu installation

echo ================================================
echo Trinity MVP - Manual Ubuntu Installation Guide
echo ================================================
echo.

echo Since automated installation failed, let's do this manually:
echo.

echo Step 1: Install Ubuntu from Microsoft Store
echo ==========================================
echo.
echo 1. Open Microsoft Store (click Start, type "store")
echo 2. Search for "Ubuntu 22.04"
echo 3. Find "Ubuntu 22.04.1 LTS" (by Canonical Group Limited)
echo 4. Click "Install" or "Get"
echo 5. Wait for installation to complete
echo.
echo Press any key when Ubuntu is installed from the Store...
pause

echo.
echo Step 2: Launch Ubuntu
echo =====================
echo.
echo 1. Click Start menu
echo 2. Type "Ubuntu" 
echo 3. Click "Ubuntu 22.04.1 LTS"
echo 4. Ubuntu terminal will open
echo 5. Follow the setup prompts:
echo    - Enter new UNIX username (lowercase, no spaces)
echo    - Enter new password (type it twice)
echo    - Wait for "Installation successful!"
echo.
echo Press any key when Ubuntu setup is complete...
pause

echo.
echo Step 3: Test Ubuntu
echo ===================
echo.
echo Testing if Ubuntu is working...

wsl --list --verbose
echo.

wsl -d Ubuntu-22.04 -e echo "Ubuntu test successful!"
if %errorLevel%==0 (
    echo ✅ Ubuntu is working perfectly!
    echo.
    echo Ubuntu details:
    wsl -d Ubuntu-22.04 -e lsb_release -a
) else (
    echo ❌ Ubuntu test failed
    echo.
    echo Troubleshooting:
    echo 1. Make sure Ubuntu setup completed successfully
    echo 2. Try: wsl --set-default Ubuntu-22.04
    echo 3. Try: wsl --set-version Ubuntu-22.04 2
    echo 4. Restart computer if needed
)

echo.
echo Step 4: What's Next?
echo ===================
echo.
echo Once Ubuntu is working:
echo 1. Run: scripts\wsl-health-check.bat
echo 2. Install Claude Code in Ubuntu
echo 3. Configure Trinity MVP
echo.

echo For Claude Code installation:
echo 1. Open Ubuntu: wsl -d Ubuntu-22.04
echo 2. Update packages: sudo apt update
echo 3. Install pip: sudo apt install python3-pip
echo 4. Install Claude: pip3 install anthropic
echo 5. Test: which claude (or python3 -c "import anthropic; print('OK')")
echo.

pause