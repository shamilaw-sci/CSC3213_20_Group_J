[CmdletBinding()]
param([switch]$EnableMarketing)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiDirectory = Join-Path $projectRoot 'icrowd_api'
$uiDirectory = Join-Path $projectRoot 'iCrowd_UI'
$runDirectory = Join-Path $apiDirectory 'target\local-run'
$statePath = Join-Path $runDirectory 'servers.json'
$jarName = 'icrowd-backend-0.0.1-SNAPSHOT.jar'

if (-not (Test-Path -LiteralPath (Join-Path $apiDirectory "target\$jarName"))) {
    throw 'Build the backend first: in icrowd_api, run .\mvnw.cmd -DskipTests package.'
}
if (-not (Test-Path -LiteralPath (Join-Path $uiDirectory 'node_modules\vite\bin\vite.js'))) {
    throw 'Install frontend dependencies first: in iCrowd_UI, run npm.cmd ci.'
}
if (-not (Test-Path -LiteralPath (Join-Path $apiDirectory '.env'))) {
    throw 'Configure icrowd_api/.env before starting. See README.md in the project root.'
}
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8080, 5173 })
if ($listeners.Count -gt 0) {
    throw 'Port 8080 or 5173 is already in use. If this project is running, use scripts/stop-local.ps1 first.'
}

$javaPath = Join-Path $env:ProgramFiles 'Java\jdk-21\bin\java.exe'
if (-not (Test-Path -LiteralPath $javaPath)) {
    if ($env:JAVA_HOME) { $javaPath = Join-Path $env:JAVA_HOME 'bin\java.exe' }
    else { $javaPath = (Get-Command java.exe -ErrorAction Stop).Source }
}
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$logDirectory = Join-Path $runDirectory ('servers-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $logDirectory | Out-Null
$started = @()

function Wait-ForServer([string]$Url, [System.Diagnostics.Process]$Server, [int]$Attempts) {
    for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
        $Server.Refresh()
        if ($Server.HasExited) { throw "A server stopped during startup. Check logs in $logDirectory." }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Seconds 1
    }
    throw "Startup did not finish. Check logs in $logDirectory."
}

try {
    $backend = Start-Process -FilePath $javaPath -ArgumentList @(
        '-jar', "target\$jarName", '--spring.profiles.active=prod',
        '--server.address=127.0.0.1', '--server.port=8080',
        '--spring.jpa.hibernate.ddl-auto=validate', '--server.forward-headers-strategy=framework',
        ('--app.marketing.enabled=' + $EnableMarketing.IsPresent.ToString().ToLowerInvariant())
    ) -WorkingDirectory $apiDirectory -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logDirectory 'backend.log') `
        -RedirectStandardError (Join-Path $logDirectory 'backend-error.log')
    $started += $backend
    Wait-ForServer 'http://127.0.0.1:8080/api/products?size=1' $backend 60

    $previousApiUrl = $env:VITE_API_BASE_URL
    try {
        $env:VITE_API_BASE_URL = 'http://localhost:8080/api'
        $frontend = Start-Process -FilePath $nodePath -ArgumentList @(
            'node_modules\vite\bin\vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'
        ) -WorkingDirectory $uiDirectory -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $logDirectory 'frontend.log') `
            -RedirectStandardError (Join-Path $logDirectory 'frontend-error.log')
    } finally { $env:VITE_API_BASE_URL = $previousApiUrl }
    $started += $frontend
    Wait-ForServer 'http://127.0.0.1:5173' $frontend 30

    $processRecords = @($started | ForEach-Object {
        [pscustomobject]@{ id = $_.Id; startedAt = $_.StartTime.ToUniversalTime().ToString('o') }
    })
    [pscustomobject]@{ processes = $processRecords; logs = $logDirectory } |
        ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding UTF8
    Write-Output 'Project is running: http://localhost:5173'
    Write-Output 'Backend: http://localhost:8080/api/products?size=1'
    Write-Output 'To stop both servers, run scripts/stop-local.ps1.'
} catch {
    foreach ($server in $started) {
        $server.Refresh()
        if (-not $server.HasExited) { Stop-Process -Id $server.Id -ErrorAction SilentlyContinue }
    }
    throw
}
