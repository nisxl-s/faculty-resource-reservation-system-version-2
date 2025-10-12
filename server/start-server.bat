@echo off
cd /d "%~dp0"
echo Starting Faculty Reservation System Server...
echo.
node src/server.js
pause
