param(
    [ValidateSet('absent', 'present')]
    [string]$Expected = 'absent',
    [string]$Label = 'baseline'
)

$ErrorActionPreference = 'Stop'
if ($Label -notmatch '^[A-Za-z0-9_-]+$') {
    throw 'Label must contain only letters, numbers, underscores, and hyphens.'
}

$repo = Split-Path -Parent $PSScriptRoot
$command = Get-Command codeql -ErrorAction SilentlyContinue
if ($command) {
    $codeql = $command.Source
} else {
    $codeql = Join-Path $env:LOCALAPPDATA 'Programs\ghas-demo-tools\codeql-bundle\codeql\codeql.exe'
    if (-not (Test-Path -LiteralPath $codeql)) {
        throw 'CodeQL is not installed. Install the official Windows CodeQL bundle or add codeql to PATH.'
    }
}

$output = Join-Path $repo "artifacts\$Label"
if (Test-Path -LiteralPath $output) {
    throw "Output already exists: $output. Choose a fresh -Label; existing evidence is never overwritten."
}
New-Item -ItemType Directory -Path $output -Force | Out-Null
$database = Join-Path $output 'database'
$sarif = Join-Path $output 'results.sarif'
$config = Join-Path $repo '.github\codeql\codeql-config.yml'

& $codeql database create $database --language=javascript-typescript "--source-root=$repo" "--codescanning-config=$config" --threads=2 --ram=4096
if ($LASTEXITCODE -ne 0) { throw "CodeQL database creation failed with exit code $LASTEXITCODE" }

& $codeql database analyze $database codeql/javascript-queries:codeql-suites/javascript-security-extended.qls --format=sarif-latest "--output=$sarif" --threads=2 --ram=4096
if ($LASTEXITCODE -ne 0) { throw "CodeQL analysis failed with exit code $LASTEXITCODE" }

& node (Join-Path $PSScriptRoot 'verify-sarif.js') $sarif $Expected
if ($LASTEXITCODE -ne 0) { throw 'SARIF did not meet the expected demo outcome.' }
