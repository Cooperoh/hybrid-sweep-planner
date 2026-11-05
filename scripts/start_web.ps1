param([int]$Port = 8765, [switch]$Rebuild, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$plannerRoot = Split-Path -Parent $PSScriptRoot
if ($Rebuild -or -not (Test-Path -LiteralPath (Join-Path $plannerRoot 'web\dist\index.html'))) {
    if (Test-Path -LiteralPath 'D:\Node\Use-SharedNode.ps1') {
        . 'D:\Node\Use-SharedNode.ps1' -ProjectPath (Join-Path $plannerRoot 'web')
    }
    Push-Location -LiteralPath (Join-Path $plannerRoot 'web')
    try {
        & node (Join-Path $plannerRoot 'web\node_modules\vite\bin\vite.js') build
        if ($LASTEXITCODE -ne 0) { throw '网页构建失败。' }
    } finally { Pop-Location }
}
$serverArguments = @('-B', '-m', 'planner.web_server', '--port', "$Port")
if (-not $NoBrowser) { $serverArguments += '--open' }
Push-Location -LiteralPath $plannerRoot
try {
    & python @serverArguments
    if ($LASTEXITCODE -ne 0) { throw '网页服务启动失败，请检查Python依赖和端口。' }
} finally { Pop-Location }
