Param(
  [Parameter(Mandatory=$false)][string]$MarkdownPath = "./ILE_Study_Guide.md",
  [Parameter(Mandatory=$false)][string]$HtmlOutPath = "./ILE_Study_Guide.html",
  [Parameter(Mandatory=$false)][string]$PdfOutPath = "./ILE_Study_Guide.pdf"
)

Write-Host "Converting Markdown to HTML..." -ForegroundColor Cyan
$md = Get-Content -Raw -LiteralPath $MarkdownPath
$htmlFragment = (ConvertFrom-Markdown -InputObject $md).Html
$style = @"
<style>
  body{font-family:Segoe UI,Arial,sans-serif;max-width:850px;margin:40px auto;line-height:1.55;color:#0f172a;background:#ffffff}
  h2,h3{color:#0f766e;margin-top:1.6em}
  pre,code{background:#f1f5f9;border-radius:4px}
  pre{padding:10px;overflow:auto}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #e2e8f0;padding:6px 8px}
</style>
"@
$html = "<html><head><meta charset='utf-8'>${style}</head><body>${htmlFragment}</body></html>"
Set-Content -LiteralPath $HtmlOutPath -Encoding UTF8 -Value $html

Write-Host "Exporting HTML to PDF with Microsoft Edge (headless)..." -ForegroundColor Cyan
$edge = Join-Path $Env:ProgramFiles "Microsoft/Edge/Application/msedge.exe"
if (-not (Test-Path $edge)) { $edge = Join-Path ${Env:ProgramFiles(x86)} "Microsoft/Edge/Application/msedge.exe" }
if (-not (Test-Path $edge)) { throw "Microsoft Edge not found. Please install Microsoft Edge to generate PDF." }

$absHtml = (Resolve-Path $HtmlOutPath).Path
$absPdf = (Resolve-Path (Split-Path -Parent $PdfOutPath)).Path + "/" + (Split-Path -Leaf $PdfOutPath)

& $edge --headless --disable-gpu --print-to-pdf="$absPdf" "file:///$absHtml"

Write-Host "PDF created at: $absPdf" -ForegroundColor Green


