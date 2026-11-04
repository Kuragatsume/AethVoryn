@echo off
chcp 65001 >nul
echo Остановка сервера AETHVORYN (порт 3456)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3456 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Готово.
timeout /t 2 >nul
