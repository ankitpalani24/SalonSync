@echo off
title SalonSync - Enterprise Workspace Bootloader
echo ===================================================
echo   SalonSync - Enterprise Salon Management SaaS
echo   Installing and Running Workspace...
echo ===================================================
echo.
echo [1/3] Checking and updating core dependencies...
call npm install
echo.
echo [2/3] Checking and updating frontend packages...
cd frontend
call npm install
cd ..
echo.
echo [3/3] Checking and updating backend database packages...
cd backend
call npm install
cd ..
echo.
echo ===================================================
echo   Launching Development Servers (Vite client + Express API)...
echo ===================================================
call npm run dev-all
echo.
pause
