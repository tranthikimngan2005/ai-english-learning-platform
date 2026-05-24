param(
    [switch]$SkipSeed,
    [switch]$SkipNpmInstall,
    [switch]$SkipEnvironmentSetup
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RepoRoot 'backend\lingai'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$VenvDir = Join-Path $RepoRoot 'venv'
$PythonExe = Join-Path $RepoRoot 'venv\Scripts\python.exe'

function Assert-CommandExists {
    param(
        [Parameter(Mandatory = $true)][string]$CommandName,
        [Parameter(Mandatory = $true)][string]$InstallHint
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw $InstallHint
    }
}

function Initialize-Environment {
    if (Test-Path $PythonExe) {
        return
    }

    Write-Host '[STEP] Creating Python virtual environment' -ForegroundColor Cyan

    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -m venv $VenvDir
    }
    elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python -m venv $VenvDir
    }
    else {
        throw 'Python is not installed, or a virtual environment could not be created. Install Python 3.11+ and rerun the script.'
    }

    if (-not (Test-Path $PythonExe)) {
        throw "Python executable not found: $PythonExe"
    }

    & $PythonExe -m pip install --upgrade pip
    & $PythonExe -m pip install -r (Join-Path $BackendDir 'requirements.txt')

    Write-Host '[DONE] Creating Python virtual environment' -ForegroundColor Green
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Script
    )
    Write-Host "[STEP] $Name" -ForegroundColor Cyan
    & $Script
    Write-Host "[DONE] $Name" -ForegroundColor Green
}

if (-not $SkipEnvironmentSetup) {
    Run-Step -Name 'Setting up local environment' -Script {
        Initialize-Environment
    }
}
else {
    Write-Host '[SKIP] Environment setup' -ForegroundColor Yellow
}

if (-not $SkipSeed) {
    Run-Step -Name 'Seeding backend demo data' -Script {
        Push-Location $BackendDir
        try {
            & $PythonExe 'seed.py'
            & $PythonExe 'seed_toeic_reading.py' '--reset'
            & $PythonExe 'seed_flashcards.py' '--reset'
        }
        finally {
            Pop-Location
        }
    }
}
else {
    Write-Host '[SKIP] Seeding data' -ForegroundColor Yellow
}

if (-not $SkipNpmInstall) {
    Run-Step -Name 'Installing frontend dependencies' -Script {
        Assert-CommandExists -CommandName 'npm' -InstallHint 'npm was not found. Install Node.js 18+ and rerun the script.'
        Push-Location $FrontendDir
        try {
            npm install
        }
        finally {
            Pop-Location
        }
    }
}
else {
    Write-Host '[SKIP] npm install' -ForegroundColor Yellow
}

$backendCommand = "Set-Location '$BackendDir'; & '$PythonExe' -m uvicorn app.main:app --reload"
$frontendCommand = "Set-Location '$FrontendDir'; npm start"

Run-Step -Name 'Opening backend terminal' -Script {
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) | Out-Null
}
Run-Step -Name 'Opening frontend terminal' -Script {
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) | Out-Null
}

Write-Host ''
Write-Host 'All done. Use these URLs:' -ForegroundColor Magenta
Write-Host '- Backend docs: http://127.0.0.1:8000/docs'
Write-Host '- Frontend:     http://localhost:3000'
