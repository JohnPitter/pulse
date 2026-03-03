# =============================================================================
# Pulse — Install Script (Windows PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Write-Step  { param([string]$msg) Write-Host "`n> $msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }
function Write-Info  { param([string]$msg) Write-Host "[INFO]  $msg" -ForegroundColor Blue }

function Test-CommandExists {
    param([string]$cmd)
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Test-WingetAvailable {
    return [bool](Get-Command "winget" -ErrorAction SilentlyContinue)
}

function Refresh-Path {
    # Reload PATH from registry so newly installed tools are found
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

# ---------------------------------------------------------------------------
# Change to the directory where this script lives (project root)
# ---------------------------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host ""
Write-Host "=======================================" -ForegroundColor White
Write-Host "    Pulse - Installation Script        " -ForegroundColor White
Write-Host "=======================================" -ForegroundColor White
Write-Host ""

# -------------------------------------------------------------------------
# 1. Install Git (if not present)
# -------------------------------------------------------------------------
Write-Step "Checking Git"

if (Test-CommandExists "git") {
    $gitVersion = (git --version) -replace 'git version ', ''
    Write-Ok "Git $gitVersion detected"
} else {
    Write-Warn "Git not found - installing..."

    if (Test-WingetAvailable) {
        Write-Info "Installing Git via winget..."
        winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { Write-Fail "Git installation via winget failed." }
    } else {
        Write-Fail "Git is not installed and winget is not available. Please install Git manually from https://git-scm.com/download/win"
    }

    Refresh-Path

    if (Test-CommandExists "git") {
        $gitVersion = (git --version) -replace 'git version ', ''
        Write-Ok "Git $gitVersion installed"
    } else {
        Write-Warn "Git was installed but not found in PATH. You may need to restart your terminal."
        Write-Info "After restarting, run this script again."
        exit 0
    }
}

# -------------------------------------------------------------------------
# 2. Install Node.js 22 (if not present or version < 22)
# -------------------------------------------------------------------------
Write-Step "Checking Node.js"

$needNode = $false

try {
    $nodeVersionRaw = (node --version 2>$null)
} catch {
    $nodeVersionRaw = $null
}

if (-not $nodeVersionRaw) {
    $needNode = $true
    Write-Warn "Node.js not found - will install v22..."
} else {
    $nodeMajor = [int]($nodeVersionRaw -replace '^v(\d+)\..*', '$1')
    if ($nodeMajor -lt 22) {
        $needNode = $true
        Write-Warn "Node.js $nodeVersionRaw found but >= 22 is required - will upgrade..."
    } else {
        Write-Ok "Node.js $nodeVersionRaw detected"
    }
}

if ($needNode) {
    if (Test-WingetAvailable) {
        Write-Info "Installing Node.js 22 via winget..."
        winget install --id OpenJS.NodeJS --version-match "22." -e --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) {
            # Fallback: try without version match
            Write-Info "Retrying with latest Node.js LTS..."
            winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
            if ($LASTEXITCODE -ne 0) { Write-Fail "Node.js installation via winget failed." }
        }
    } else {
        Write-Fail "Node.js is not installed and winget is not available. Please install Node.js >= 22 manually from https://nodejs.org"
    }

    Refresh-Path

    try {
        $nodeVersionRaw = (node --version 2>$null)
    } catch {
        $nodeVersionRaw = $null
    }

    if ($nodeVersionRaw) {
        $nodeMajor = [int]($nodeVersionRaw -replace '^v(\d+)\..*', '$1')
        if ($nodeMajor -ge 22) {
            Write-Ok "Node.js $nodeVersionRaw installed"
        } else {
            Write-Fail "Node.js was installed but version $nodeVersionRaw is < 22. Please install manually from https://nodejs.org"
        }
    } else {
        Write-Warn "Node.js was installed but not found in PATH. You may need to restart your terminal."
        Write-Info "After restarting, run this script again."
        exit 0
    }
}

# -------------------------------------------------------------------------
# 3. Install GitHub CLI (gh)
# -------------------------------------------------------------------------
Write-Step "Checking GitHub CLI"

if (Test-CommandExists "gh") {
    Write-Ok "GitHub CLI detected"
} else {
    Write-Warn "GitHub CLI not found - installing..."

    if (Test-WingetAvailable) {
        Write-Info "Installing GitHub CLI via winget..."
        winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
        Refresh-Path

        if (Test-CommandExists "gh") {
            Write-Ok "GitHub CLI installed"
        } else {
            Write-Warn "GitHub CLI was installed but not found in PATH. You may need to restart your terminal."
        }
    } else {
        Write-Warn "GitHub CLI not found and winget is not available. Install from https://cli.github.com"
    }
}

# -------------------------------------------------------------------------
# 4. Check npm
# -------------------------------------------------------------------------
Write-Step "Checking npm"

try {
    $npmVersion = (npm --version 2>$null)
} catch {
    Write-Fail "npm is not installed. It should come with Node.js. Try reinstalling Node.js."
}

if (-not $npmVersion) {
    Write-Fail "npm is not installed. It should come with Node.js. Try reinstalling Node.js."
}

Write-Ok "npm v$npmVersion detected"

# -------------------------------------------------------------------------
# 5. Install dependencies
# -------------------------------------------------------------------------
Write-Step "Installing dependencies (npm install)"

npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed." }

Write-Ok "Dependencies installed"

# -------------------------------------------------------------------------
# 6. Generate .env file (only if it does not already exist)
# -------------------------------------------------------------------------
Write-Step "Configuring environment"

$envFile = Join-Path $ScriptDir ".env"

if (Test-Path $envFile) {
    Write-Warn ".env file already exists - skipping generation (your existing config is preserved)"
} else {
    # Generate cryptographically secure random secrets
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

    $jwtBytes = New-Object byte[] 32
    $rng.GetBytes($jwtBytes)
    $jwtSecret = ($jwtBytes | ForEach-Object { $_.ToString("x2") }) -join ""

    $encBytes = New-Object byte[] 32
    $rng.GetBytes($encBytes)
    $encryptionKey = ($encBytes | ForEach-Object { $_.ToString("x2") }) -join ""

    $rng.Dispose()

    $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    $envContent = @"
# Pulse - Environment Configuration
# Generated on $timestamp

PORT=3000
NODE_ENV=production
JWT_SECRET=$jwtSecret
ENCRYPTION_KEY=$encryptionKey
DB_PATH=./data/pulse.db
CORS_ORIGIN=http://localhost:3000
"@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Ok ".env file created with secure random secrets"
}

# -------------------------------------------------------------------------
# 7. Build the project
# -------------------------------------------------------------------------
Write-Step "Building the project (npm run build)"

npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed." }

Write-Ok "Build completed successfully"

# -------------------------------------------------------------------------
# 8. Done!
# -------------------------------------------------------------------------
Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "    Installation complete!             " -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Getting started:" -ForegroundColor White
Write-Host "  1. Start the server:   " -NoNewline; Write-Host "npm start" -ForegroundColor Cyan
Write-Host "  2. Open your browser:  " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "  3. On first visit you will be prompted to set an admin password."
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  npm run dev   " -NoNewline -ForegroundColor Cyan; Write-Host " - Start in development mode (hot reload)"
Write-Host "  npm run build " -NoNewline -ForegroundColor Cyan; Write-Host " - Rebuild the project"
Write-Host "  npm start     " -NoNewline -ForegroundColor Cyan; Write-Host " - Start in production mode"
Write-Host ""
