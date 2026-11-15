$ErrorActionPreference = 'Stop'
$serverFolder = Join-Path $PSScriptRoot '../server'
& npm.cmd --prefix $serverFolder run db:setup
if ($LASTEXITCODE -ne 0) { throw 'Database setup failed. Check server/.env and database permissions.' }
