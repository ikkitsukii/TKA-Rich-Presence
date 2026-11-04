$ErrorActionPreference = 'Stop'
try {
    $ue4ssRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
    $gameExe = Join-Path (Split-Path -Parent $ue4ssRoot) 'TheKillingAntidote-Win64-Shipping.exe'
    $gameProcess = Get-Process -Name 'TheKillingAntidote-Win64-Shipping' -ErrorAction SilentlyContinue | Where-Object {
        try { $_.MainModule.FileName -eq $gameExe } catch { $false }
    } | Select-Object -First 1
    if (-not $gameProcess) { throw 'Matching game process not found; helper not started.' }
    $exe = Join-Path $PSScriptRoot 'TKA-RPC.exe'
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Bridge/TKA-RPC.exe missing. Extract the complete mod folder.' }
    Start-Process -FilePath $exe -ArgumentList @('--auto', '--game-pid', $gameProcess.Id) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
} catch {
    Add-Content -LiteralPath (Join-Path $PSScriptRoot 'autostart.log') -Value ((Get-Date -Format o) + ' ' + $_.Exception.Message)
    exit 1
}
