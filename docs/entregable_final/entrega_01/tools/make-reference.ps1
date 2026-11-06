<#
  make-reference.ps1
  Genera reference.docx a partir de la plantilla por defecto de Pandoc, con los
  ajustes de formato exigidos en documentos academicos: Times New Roman 12,
  texto justificado con interlineado 1.5, titulos en negro y negrita, hoja A4
  con margenes de 2.5 cm.

  Uso:  powershell -ExecutionPolicy Bypass -File tools\make-reference.ps1
#>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$here    = Split-Path -Parent $MyInvocation.MyCommand.Path
$root    = Split-Path -Parent $here
$target  = Join-Path $root 'reference.docx'
$tmpDir  = Join-Path $env:TEMP 'opencode\refgen'
$tmpDocx = Join-Path $tmpDir 'ref-base.docx'

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

# 1. Volcar la reference.docx por defecto de Pandoc (redireccion binaria via cmd).
if (Test-Path $tmpDocx) { Remove-Item $tmpDocx -Force }
$cmdLine = 'pandoc --print-default-data-file reference.docx > "' + $tmpDocx + '"'
cmd /c $cmdLine | Out-Null
Copy-Item $tmpDocx $target -Force

function Read-ZipEntry([string]$zipPath, [string]$entryName) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entry = $zip.GetEntry($entryName)
        $reader = New-Object System.IO.StreamReader($entry.Open(), (New-Object System.Text.UTF8Encoding($false)))
        return $reader.ReadToEnd()
    } finally { $zip.Dispose() }
}

function Write-ZipEntry([string]$zipPath, [string]$entryName, [string]$content) {
    $zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Update')
    try {
        $entry = $zip.GetEntry($entryName)
        $stream = $entry.Open()
        $stream.SetLength(0)
        $writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($false)))
        $writer.Write($content)
        $writer.Flush()
        $writer.Close()
    } finally { $zip.Dispose() }
}

# 2. Ajustar word/styles.xml
$styles = Read-ZipEntry $target 'word/styles.xml'

# Fuente por defecto: Times New Roman 12 pt (sz 24 = 12 pt), idioma espanol.
$styles = $styles -replace '<w:rFonts w:asciiTheme="minorHAnsi"[^>]*/>',
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" />'
$styles = $styles -replace '<w:lang w:val="en-US"[^>]*/>',
    '<w:lang w:val="es-PE" w:eastAsia="es-PE" w:bidi="ar-SA" />'

# Interlineado 1.5 y espacio posterior uniforme en todo el documento.
$styles = $styles -replace '<w:spacing w:after="200" />',
    '<w:spacing w:after="120" w:line="360" w:lineRule="auto" />'
$styles = $styles -replace '(<w:style w:type="paragraph" w:styleId="BodyText">.*?)<w:spacing w:before="180" w:after="180" />',
    '$1<w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto" /><w:jc w:val="both" />'

# Titulos: misma fuente, color negro y negrita.
$styles = $styles -replace '<w:rFonts w:asciiTheme="majorHAnsi"[^>]*/>',
    '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" />'
$styles = $styles -replace '<w:color w:val="0F4761"[^>]*/>', '<w:color w:val="000000" />'
$styles = [regex]::Replace($styles,
    '(<w:style w:type="paragraph" w:styleId="Heading\d">.*?<w:rPr>)',
    '$1<w:b />')

# Pie de imagen centrado y en negrita; tablas en 10 pt para que quepan.
$styles = $styles -replace '(<w:style w:type="paragraph" w:styleId="ImageCaption">.*?<w:pPr>)',
    '$1<w:spacing w:before="80" w:after="240" w:line="240" w:lineRule="auto" /><w:jc w:val="center" />'
$styles = [regex]::Replace($styles,
    '(<w:style w:type="paragraph" w:styleId="ImageCaption">.*?<w:rPr>)',
    '$1<w:b /><w:sz w:val="20" /><w:szCs w:val="20" />')
$styles = [regex]::Replace($styles,
    '(<w:style w:type="paragraph" w:styleId="Compact">.*?<w:pPr>)',
    '$1<w:spacing w:before="40" w:after="40" w:line="240" w:lineRule="auto" />')
$styles = [regex]::Replace($styles,
    '(<w:style w:type="paragraph" w:styleId="Compact">.*?<w:rPr>)',
    '$1<w:sz w:val="20" /><w:szCs w:val="20" />')

Write-ZipEntry $target 'word/styles.xml' $styles

# 3. Ajustar word/document.xml: hoja A4 y margenes de 2.5 cm.
$doc = Read-ZipEntry $target 'word/document.xml'
$pageSetup = '<w:pgSz w:w="11906" w:h="16838" /><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="708" w:footer="708" w:gutter="0" />'
if ($doc -match '<w:sectPr>') {
    $doc = $doc -replace '<w:sectPr>', ('<w:sectPr>' + $pageSetup)
} else {
    $doc = $doc -replace '</w:body>', ('<w:sectPr>' + $pageSetup + '</w:sectPr></w:body>')
}
Write-ZipEntry $target 'word/document.xml' $doc

Write-Host "reference.docx generado en: $target"