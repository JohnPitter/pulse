#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Pulse — Install Script (Linux / macOS / Git Bash)
# =============================================================================

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { printf "${BLUE}[INFO]${NC}  %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()    { printf "${RED}[ERROR]${NC} %s\n" "$1" >&2; exit 1; }
step()    { printf "\n${CYAN}${BOLD}▸ %s${NC}\n" "$1"; }

# ---------------------------------------------------------------------------
# Change to the directory where this script lives (project root)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

printf "\n${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║        Pulse — Installation Script       ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

# -------------------------------------------------------------------------
# 1. Check Node.js
# -------------------------------------------------------------------------
step "Checking Node.js"

if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Please install Node.js >= 22 and try again."
fi

NODE_VERSION_RAW="$(node --version)"           # e.g. v22.5.1
NODE_MAJOR="${NODE_VERSION_RAW#v}"              # 22.5.1
NODE_MAJOR="${NODE_MAJOR%%.*}"                  # 22

if [ "$NODE_MAJOR" -lt 22 ] 2>/dev/null; then
  fail "Node.js >= 22 is required (found ${NODE_VERSION_RAW}). Please upgrade and try again."
fi

success "Node.js ${NODE_VERSION_RAW} detected"

# -------------------------------------------------------------------------
# 2. Check npm
# -------------------------------------------------------------------------
step "Checking npm"

if ! command -v npm &>/dev/null; then
  fail "npm is not installed. Please install npm and try again."
fi

NPM_VERSION="$(npm --version)"
success "npm v${NPM_VERSION} detected"

# -------------------------------------------------------------------------
# 3. Check openssl (needed for secret generation)
# -------------------------------------------------------------------------
step "Checking openssl"

if ! command -v openssl &>/dev/null; then
  fail "openssl is not installed. It is required to generate secure secrets."
fi

success "openssl available"

# -------------------------------------------------------------------------
# 4. Install dependencies
# -------------------------------------------------------------------------
step "Installing dependencies (npm install)"

npm install
success "Dependencies installed"

# -------------------------------------------------------------------------
# 5. Generate .env file (only if it does not already exist)
# -------------------------------------------------------------------------
step "Configuring environment"

ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  warn ".env file already exists — skipping generation (your existing config is preserved)"
else
  JWT_SECRET="$(openssl rand -hex 32)"
  ENCRYPTION_KEY="$(openssl rand -hex 32)"

  cat > "$ENV_FILE" <<EOF
# Pulse — Environment Configuration
# Generated on $(date -u +"%Y-%m-%dT%H:%M:%SZ")

PORT=3000
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
DB_PATH=./data/pulse.db
CORS_ORIGIN=http://localhost:3000
EOF

  success ".env file created with secure random secrets"
fi

# -------------------------------------------------------------------------
# 6. Build the project
# -------------------------------------------------------------------------
step "Building the project (npm run build)"

npm run build
success "Build completed successfully"

# -------------------------------------------------------------------------
# 7. Done!
# -------------------------------------------------------------------------
printf "\n${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${GREEN}${BOLD}║       Installation complete!              ║${NC}\n"
printf "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

printf "${BOLD}Getting started:${NC}\n"
printf "  1. Start the server:   ${CYAN}npm start${NC}\n"
printf "  2. Open your browser:  ${CYAN}http://localhost:3000${NC}\n"
printf "  3. On first visit you will be prompted to set an admin password.\n"
printf "\n"
printf "${BOLD}Useful commands:${NC}\n"
printf "  ${CYAN}npm run dev${NC}       — Start in development mode (hot reload)\n"
printf "  ${CYAN}npm run build${NC}     — Rebuild the project\n"
printf "  ${CYAN}npm start${NC}         — Start in production mode\n"
printf "\n"
