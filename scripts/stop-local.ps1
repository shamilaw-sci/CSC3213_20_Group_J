[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$statePath = Join-Path $projectRoot 'icrowd_api\target\local-run\servers.json'
if (-not (Test-Path -LiteralPath $statePath)) {
    Write-Output 'No servers started by start-local.ps1 were recorded.'
    return
}
$state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
foreach ($record in $state.processes) {
    $server = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    $recordedStart = [DateTime]$record.startedAt
    if ($server -and $server.StartTime.ToUniversalTime().Ticks -eq $recordedStart.ToUniversalTime().Ticks) {
        Stop-Process -Id $server.Id
    }
}
Remove-Item -LiteralPath $statePath
Write-Output 'The recorded project servers are stopped.'
