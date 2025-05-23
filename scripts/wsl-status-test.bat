@echo off
REM Trinity MVP - Quick WSL Status Test
REM Tests what's actually working vs what scripts think

echo ================================================
echo Trinity MVP - WSL Reality Check
echo ================================================
echo.

echo Test 1: WSL List
echo =================
wsl --list --verbose
echo.

echo Test 2: Ubuntu Direct Test
echo ===========================
wsl -d Ubuntu-22.04 -e echo "✅ Ubuntu shell working"
echo Exit code: %errorLevel%
echo.

echo Test 3: File System Access
echo ===========================
wsl -d Ubuntu-22.04 -e ls /mnt/c
echo Exit code: %errorLevel%
echo.

echo Test 4: Ubuntu Version
echo =======================
wsl -d Ubuntu-22.04 -e lsb_release -a
echo.

echo Test 5: Network Test
echo =====================
wsl -d Ubuntu-22.04 -e ping -c 1 8.8.8.8
echo Exit code: %errorLevel%
echo.

echo Test 6: Package Manager
echo =========================
wsl -d Ubuntu-22.04 -e apt --version
echo Exit code: %errorLevel%
echo.

echo ================================================
echo Reality Check Complete
echo ================================================
echo.
echo If most tests show "Exit code: 0" then Ubuntu is working
echo and we can proceed with Claude Code installation.
echo.

pause