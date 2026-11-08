$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (!$nodeCommand) { $nodeCommand = Get-Command node -ErrorAction SilentlyContinue }
if (!$nodeCommand) { throw 'Install Node.js 22+ and add it to PATH.' }
& $nodeCommand.Source (Join-Path $PSScriptRoot 'shop-app\server.js')
exit $LASTEXITCODE
