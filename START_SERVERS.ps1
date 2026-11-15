param([switch]$Stop, [int]$BackendPort = 5000, [int]$FrontendPort = 3000)
$ErrorActionPreference = 'Stop'
$projectFolder = $PSScriptRoot
$runtimeFolder = Join-Path $projectFolder '.runtime'
$stateFile = Join-Path $runtimeFolder 'servers.json'

if ($Stop) {
    if (Test-Path -LiteralPath $stateFile) {
        $raw = Get-Content -LiteralPath $stateFile -Raw
        if ($raw) {
            $parsed = $raw | ConvertFrom-Json
            $items = if ($parsed.value) { $parsed.value } else { $parsed }
            foreach ($entry in @($items)) {
                if ($entry -and $entry.id) {
                    $ownedProcess = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
                    if ($ownedProcess -and $ownedProcess.ProcessName -eq 'node' -and $ownedProcess.StartTime.ToUniversalTime().ToString('o') -eq $entry.started) {
                        Stop-Process -Id $entry.id -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        }
        Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host 'Stopped only servers recorded by this launcher.'
    exit
}

New-Item -ItemType Directory -Force -Path $runtimeFolder | Out-Null
$nodePath = (Get-Command node.exe).Source
$entries = @()
if (Test-Path -LiteralPath $stateFile) {
    $existing = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    $entries = if ($existing.value) { @($existing.value) } else { @($existing) }
}
$env:BROWSER = 'none'
$env:PORT = [string]$BackendPort
$env:VITE_API_URL = "http://localhost:$BackendPort/api"
foreach ($service in @(
    @{ name = 'backend'; port = $BackendPort; folder = 'server'; script = 'src/server.js' },
    @{ name = 'frontend'; port = $FrontendPort; folder = 'client'; script = 'node_modules/vite/bin/vite.js' }
)) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $busy = $client.ConnectAsync('127.0.0.1', $service.port).Wait(500) -and $client.Connected } catch { $busy = $false } finally { $client.Dispose() }
    if ($busy) { Write-Host "$($service.name): port $($service.port) already in use; leaving it alone."; continue }
    $arguments = @($service.script)
    if ($service.name -eq 'frontend') { $arguments += @('--port', [string]$FrontendPort, '--strictPort') }
    if ($service.extra) { $arguments += $service.extra }
    $serviceProcess = Start-Process -FilePath $nodePath -ArgumentList $arguments -WorkingDirectory (Join-Path $projectFolder $service.folder) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeFolder "$($service.name).log") -RedirectStandardError (Join-Path $runtimeFolder "$($service.name).error.log")
    $entries += @{ id = $serviceProcess.Id; started = $serviceProcess.StartTime.ToUniversalTime().ToString('o'); name = $service.name }
    Write-Host "$($service.name) started. Logs: .runtime/$($service.name).log"
}
@($entries) | ConvertTo-Json | Set-Content -LiteralPath $stateFile
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Backend: http://localhost:$BackendPort/api"
Write-Host 'To stop servers launched here: .\START_SERVERS.ps1 -Stop'

