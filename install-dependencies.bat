@echo off
chcp 65001 >nul
title Установка зависимостей AETHVORYN [OS]
color 0B

echo =====================================================================
echo           AETHVORYN [OS] // УСТАНОВЩИК ЗАВИСИМОСТЕЙ
echo =====================================================================
echo.

if exist "%~dp0package.json" (
    cd /d "%~dp0"
)

echo [1/3] Проверка окружения Node.js и npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ОШИБКА] Node.js не обнаружен в системе!
    echo Пожалуйста, установите Node.js (рекомендуется LTS 20+) с https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo  - Node.js: %NODE_VER%
echo  - npm:     %NPM_VER%
echo.

echo [2/3] Установка пакетов npm (npm install)...
echo Это может занять пару минут в зависимости от скорости сети...
echo.
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ОШИБКА] Произошла ошибка при установке зависимостей.
    pause
    exit /b 1
)

echo.
echo [3/3] Сборка оптимизированного продакшен-бандла Next.js...
call npm run build
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo [ВНИМАНИЕ] Продакшен-сборка завершилась с предупреждением, но зависимости установлены.
) else (
    echo.
    echo [УСПЕХ] Сборка успешно завершена!
)

echo.
echo =====================================================================
echo  Установка завершена!
echo  Для запуска используйте: start-aethvoryn.bat или npm run start
echo =====================================================================
echo.
set /p START_NOW="Запустить AETHVORYN прямо сейчас? (Y/N): "
if /i "%START_NOW%"=="Y" (
    call "%~dp0start-aethvoryn.bat"
)
exit /b 0
