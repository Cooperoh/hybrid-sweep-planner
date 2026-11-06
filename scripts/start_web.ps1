param([int]$Port = 8765, [switch]$Rebuild, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$plannerRoot = Split-Path -Parent $PSScriptRoot
if ($Rebuild -or -not (Test-Path -LiteralPath (Join-Path $plannerRoot 'web\dist\index.html'))) {
    $nodeEntry = 'D:\Node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $nodeEntry)) { throw '共享Node.js不存在，请先在D:\Node准备运行时。' }
    & $nodeEntry (Join-Path $PSScriptRoot 'shared-node.mjs') build
    if ($LASTEXITCODE -ne 0) { throw '网页构建失败。' }
}
$serverArguments = @('-B', '-m', 'planner.web_server', '--port', "$Port")
if (-not $NoBrowser) { $serverArguments += '--open' }
Push-Location -LiteralPath $plannerRoot
try {
    & python @serverArguments
    if ($LASTEXITCODE -ne 0) { throw '网页服务启动失败，请检查Python依赖和端口。' }
} finally { Pop-Location }
