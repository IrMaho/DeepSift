@echo off
echo ==============================================
echo       DeepSift Windows Installer Builder      
echo ==============================================
echo.

echo [1/2] Building the standalone release folder and ZIP...
call node scripts\build-release.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error: Failed to build the release folder.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Compiling Inno Setup Installer (.exe)...
"C:\Program Files (x86)\Inno Setup 6\iscc.exe" "deepsift.iss"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Error: Failed to compile the installer.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================
echo   ✅ SUCCESS! Installer generated in \Output\
echo ==============================================
pause

