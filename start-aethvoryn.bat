@echo off
chcp 65001 >nul
title AETHVORYN Ecosystem Server

if exist "%~dp0package.json" (
    cd /d "%~dp0"
) else (
    cd /d "c:\Users\dakos\OneDrive\Documents\AntiGravity\3d Site"
)

:: Check if port 3456 is already listening
netstat -ano | findstr ":3456 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    exit /b 0
)

:: Build production bundle if not built yet
if not exist ".next\BUILD_ID" (
    call npm run build
)

:: Start production server on port 3456
call npm run start
