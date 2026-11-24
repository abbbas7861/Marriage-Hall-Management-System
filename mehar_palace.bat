@echo off
title Mehar Palace Marquee - Startup
color 0A

echo ==========================================================
echo    Mehar Palace Marquee Management System Launcher
echo ==========================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking and freeing ports :8000 and :3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "8000, 3000 | ForEach-Object { $p = $_; Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host ('Cleared busy port :' + $p) } }"

timeout /t 1 /nobreak >nul

REM Find Python executable
set "PY_EXE=backend\venv\Scripts\python.exe"
if not exist "%PY_EXE%" (
    set "PY_EXE=python"
)

echo [2/4] Verifying database schema & migrations...
"%PY_EXE%" backend\manage.py migrate --noinput >nul 2>&1

echo [3/4] Starting Django Backend Server (Port 8000)...
start "Mehar Palace Backend" /min "%PY_EXE%" backend\manage.py runserver 127.0.0.1:8000

echo [4/4] Starting Frontend Server (Port 3000)...
cd frontend
start "Mehar Palace Frontend" /min cmd /c "npm run dev -- --host 0.0.0.0 --port 3000"
cd ..

echo.
echo Waiting for servers to initialize...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Milliseconds 600 } }; if ($ready) { Write-Host 'Servers online!' }"

echo.
echo Opening Mehar Palace in your browser...
start http://localhost:3000

echo.
echo ==========================================================
echo  Mehar Palace is running!
echo  URL: http://localhost:3000
echo  Keep this window open, or close it when done.
echo ==========================================================
pause
