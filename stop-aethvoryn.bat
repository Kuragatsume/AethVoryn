@echo off
echo Stopping AETHVORYN server on port 3456...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3456 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
