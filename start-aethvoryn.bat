@echo off
title AETHVORYN Ecosystem Server

if exist "%~dp0package.json" (
    cd /d "%~dp0"
) else (
    cd /d "c:\Users\dakos\OneDrive\Documents\AntiGravity\3d Site"
)

:: Check if port 3456 is already listening
netstat -ano | findstr ":3456 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo AETHVORYN server is already running on port 3456.
    start http://localhost:3456
    exit /b 0
)

:: Build production bundle if not built yet
if not exist ".next\BUILD_ID" (
    echo Building production bundle...
    call npm run build
)

:: Open browser automatically when server is ready
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3456"

:: Start production server on port 3456
echo Starting AETHVORYN server on http://localhost:3456...
call npm run start
