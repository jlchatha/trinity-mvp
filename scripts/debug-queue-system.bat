@echo off
REM Trinity MVP - Debug Queue System
REM Investigate what's happening in the file communication system

echo ================================================
echo Trinity MVP - Queue System Debug
echo ================================================
echo.

set "TRINITY_DIR=%USERPROFILE%\.trinity-mvp"

echo Checking Trinity MVP queue directories...
echo.

echo Directory structure:
dir "%TRINITY_DIR%" /s
echo.

echo Input queue contents:
if exist "%TRINITY_DIR%\queue\input\*" (
    echo Found files in input queue:
    dir "%TRINITY_DIR%\queue\input\" /b
    echo.
    echo Content of latest request file:
    for /f %%f in ('dir "%TRINITY_DIR%\queue\input\req-*.json" /b /o:d 2^>nul') do (
        echo File: %%f
        type "%TRINITY_DIR%\queue\input\%%f"
        echo.
    )
) else (
    echo No files in input queue
)

echo Processing queue contents:
if exist "%TRINITY_DIR%\queue\processing\*" (
    dir "%TRINITY_DIR%\queue\processing\" /b
) else (
    echo No files in processing queue
)

echo Output queue contents:
if exist "%TRINITY_DIR%\queue\output\*" (
    dir "%TRINITY_DIR%\queue\output\" /b
) else (
    echo No files in output queue
)

echo Failed queue contents:
if exist "%TRINITY_DIR%\queue\failed\*" (
    dir "%TRINITY_DIR%\queue\failed\" /b
) else (
    echo No files in failed queue
)

echo.
echo ================================================
echo Analysis
echo ================================================
echo.
echo If you see request files in input/ but nothing in output/,
echo then the Claude Code watcher daemon is missing.
echo.

pause