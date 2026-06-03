@echo off
echo ========================================
echo   DistriFlow - Sales ^& Distribution
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Installing dependencies...
call npm run install-all
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Seeding demo data...
call npm run seed
if errorlevel 1 (
    echo Warning: Seed failed - make sure MongoDB is running
)

echo.
echo [3/3] Starting server and client...
echo.
echo   Frontend: http://localhost:3020
echo   Backend:  http://localhost:5010
echo.
echo   Login: admin@distriFlow.com / admin123
echo.
call npm run dev
