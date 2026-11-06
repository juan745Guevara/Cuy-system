<#
  Descarga el jar de PlantUML usado por tools/build.mjs para los diagramas UML
  (capítulo 7). El jar no se versiona en el repositorio.

  Uso:  powershell -ExecutionPolicy Bypass -File tools\fetch-plantuml.ps1
#>
$ErrorActionPreference = 'Stop'

$destino = Join-Path $PSScriptRoot 'plantuml.jar'

if (Test-Path -LiteralPath $destino) {
    Write-Host "Ya existe: $destino"
    exit 0
}

$api = 'https://api.github.com/repos/plantuml/plantuml/releases/latest'
$release = Invoke-RestMethod -Uri $api -Headers @{ 'User-Agent' = 'opencode' }
$version = $release.tag_name.TrimStart('v')
$asset = $release.assets | Where-Object { $_.name -eq "plantuml-$version.jar" } | Select-Object -First 1

if (-not $asset) {
    throw "No se encontro el jar plantuml-$version.jar en la release $($release.tag_name)"
}

Write-Host "Descargando $($asset.browser_download_url)"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $destino -UseBasicParsing
Write-Host "Guardado: $destino ($((Get-Item -LiteralPath $destino).Length) bytes)"