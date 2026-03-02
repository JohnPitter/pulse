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
# 1. Check Node.js
# -------------------------------------------------------------------------
Write-Step "Checking Node.js"

try {
    $nodeVersionRaw = (node --version 2>$null)
} catch {
    Write-Fail "Node.js is not installed. Please install Node.js >= 22 and try again."
}

if (-not $nodeVersionRaw) {
    Write-Fail "Node.js is not installed. Please install Node.js >= 22 and try again."
}

$nodeMajor = [int]($nodeVersionRaw -replace '^v(\d+)\..*', '$1')

if ($nodeMajor -lt 22) {
    Write-Fail "Node.js >= 22 is required (found $nodeVersionRaw). Please upgrade and try again."
}

Write-Ok "Node.js $nodeVersionRaw detected"

# -------------------------------------------------------------------------
# 2. Check npm
# -------------------------------------------------------------------------
Write-Step "Checking npm"

try {
    $npmVersion = (npm --version 2>$null)
} catch {
    Write-Fail "npm is not installed. Please install npm and try again."
}

if (-not $npmVersion) {
    Write-Fail "npm is not installed. Please install npm and try again."
}

Write-Ok "npm v$npmVersion detected"

# -------------------------------------------------------------------------
# 3. Install dependencies
# -------------------------------------------------------------------------
Write-Step "Installing dependencies (npm install)"

npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed." }

Write-Ok "Dependencies installed"

# -------------------------------------------------------------------------
# 4. Generate .env file (only if it does not already exist)
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
# 5. Build the project
# -------------------------------------------------------------------------
Write-Step "Building the project (npm run build)"

npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Build failed." }

Write-Ok "Build completed successfully"

# -------------------------------------------------------------------------
# 6. Done!
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
