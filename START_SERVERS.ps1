Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Faculty Resource Reservation System   " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Kill any existing node processes
Write-Host "[0/3] Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start backend server
Write-Host "[1/3] Starting Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\server'; npm run dev"
Start-Sleep -Seconds 8

# Start frontend server  
Write-Host "[2/3] Starting Frontend Server (Port 3000)..." -ForegroundColor Green
$env:BROWSER = 'none'
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\client'; `$env:BROWSER='none'; npm start"
Start-Sleep -Seconds 15

# Check if servers are running
Write-Host "[3/3] Checking server status..." -ForegroundColor Green
$backend = netstat -ano | Select-String ":5000" | Select-String "LISTENING"
$frontend = netstat -ano | Select-String ":3000" | Select-String "LISTENING"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($backend) {
    Write-Host "✅ Backend:  http://localhost:5000/api" -ForegroundColor Green
} else {
    Write-Host "❌ Backend:  NOT RUNNING" -ForegroundColor Red
}

if ($frontend) {
    Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: NOT RUNNING (may still be starting...)" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open the application..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Servers are running! Keep the PowerShell windows open." -ForegroundColor Green
Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
