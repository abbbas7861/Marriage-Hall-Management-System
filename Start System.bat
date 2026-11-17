@echo off
title Marriage Hall System Launcher
color 0A
echo ========================================================
echo       MARRIAGE HALL MANAGEMENT SYSTEM
echo ========================================================
echo.
echo Starting Servers, please wait...
echo.

:: Start Backend Server (Django on Port 8000)
echo [1/2] Starting Backend Server on Port 8000...
start "Marriage Hall - Backend (Port 8000)" cmd /k "cd backend && call venv\Scripts\activate && python manage.py runserver 8000"

:: Start Frontend Server (React on Port 3000)
echo [2/2] Starting Frontend Server on Port 3000...
start "Marriage Hall - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

:: Wait for 5 seconds to let servers boot up
timeout /t 5 /nobreak >nul

:: Open the browser automatically
echo.
echo Opening Browser...
start http://localhost:3000

echo.
echo ========================================================
echo DONE! Both servers are running.
echo Please DO NOT close the new black windows.
echo ========================================================
pause