@echo off
echo =========================================
echo Faculty Resource Reservation System
echo Starting Backend and Frontend Servers...
echo =========================================
echo.

REM Start backend server
echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd /d "%~dp0server" && npm run dev"
timeout /t 3 /nobreak >nul

REM Start frontend server
echo [2/2] Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d "%~dp0client" && npm start"

echo.
echo =========================================
echo Servers are starting...
echo.
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the application in browser...
echo =========================================
pause >nul

start http://localhost:3000
