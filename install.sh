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

need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo &>/dev/null; then
      echo "sudo"
    else
      fail "Root privileges required. Run with sudo or as root."
    fi
  else
    echo ""
  fi
}

# ---------------------------------------------------------------------------
# Detect OS / Package Manager
# ---------------------------------------------------------------------------
detect_os() {
  if [ "$(uname)" = "Darwin" ]; then
    echo "macos"
  elif [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
      ubuntu|debian|pop|linuxmint|elementary|zorin) echo "debian" ;;
      fedora|rhel|centos|rocky|alma|amzn) echo "rhel" ;;
      arch|manjaro|endeavouros) echo "arch" ;;
      opensuse*|sles) echo "suse" ;;
      *) echo "unknown" ;;
    esac
  else
    echo "unknown"
  fi
}

# ---------------------------------------------------------------------------
# Change to the directory where this script lives (project root)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

printf "\n${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║        Pulse — Installation Script       ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

OS_TYPE="$(detect_os)"
info "Detected OS type: ${OS_TYPE}"

# -------------------------------------------------------------------------
# 1. Install Git (if not present)
# -------------------------------------------------------------------------
step "Checking Git"

if command -v git &>/dev/null; then
  GIT_VERSION="$(git --version | awk '{print $3}')"
  success "Git ${GIT_VERSION} detected"
else
  warn "Git not found — installing..."

  case "$OS_TYPE" in
    debian)
      SUDO="$(need_sudo)"
      $SUDO apt-get update -qq
      $SUDO apt-get install -y -qq git
      ;;
    rhel)
      SUDO="$(need_sudo)"
      $SUDO dnf install -y git 2>/dev/null || $SUDO yum install -y git
      ;;
    arch)
      SUDO="$(need_sudo)"
      $SUDO pacman -Sy --noconfirm git
      ;;
    suse)
      SUDO="$(need_sudo)"
      $SUDO zypper install -y git
      ;;
    macos)
      if command -v brew &>/dev/null; then
        brew install git
      else
        fail "Git not found. Install Xcode Command Line Tools: xcode-select --install"
      fi
      ;;
    *)
      fail "Cannot auto-install Git on this OS. Please install Git manually and try again."
      ;;
  esac

  if command -v git &>/dev/null; then
    success "Git $(git --version | awk '{print $3}') installed"
  else
    fail "Git installation failed. Please install manually."
  fi
fi

# -------------------------------------------------------------------------
# 2. Install Node.js 22 (if not present or version < 22)
# -------------------------------------------------------------------------
step "Checking Node.js"

NEED_NODE=false

if ! command -v node &>/dev/null; then
  NEED_NODE=true
  warn "Node.js not found — will install v22..."
else
  NODE_VERSION_RAW="$(node --version)"
  NODE_MAJOR="${NODE_VERSION_RAW#v}"
  NODE_MAJOR="${NODE_MAJOR%%.*}"

  if [ "$NODE_MAJOR" -lt 22 ] 2>/dev/null; then
    NEED_NODE=true
    warn "Node.js ${NODE_VERSION_RAW} found but >= 22 is required — will upgrade..."
  else
    success "Node.js ${NODE_VERSION_RAW} detected"
  fi
fi

if [ "$NEED_NODE" = true ]; then
  case "$OS_TYPE" in
    debian)
      SUDO="$(need_sudo)"
      info "Installing Node.js 22 via NodeSource..."
      $SUDO apt-get install -y -qq curl ca-certificates gnupg
      curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash -
      $SUDO apt-get install -y -qq nodejs
      ;;
    rhel)
      SUDO="$(need_sudo)"
      info "Installing Node.js 22 via NodeSource..."
      curl -fsSL https://rpm.nodesource.com/setup_22.x | $SUDO bash -
      $SUDO dnf install -y nodejs 2>/dev/null || $SUDO yum install -y nodejs
      ;;
    arch)
      SUDO="$(need_sudo)"
      info "Installing Node.js via pacman..."
      $SUDO pacman -Sy --noconfirm nodejs npm
      ;;
    suse)
      SUDO="$(need_sudo)"
      info "Installing Node.js 22 via NodeSource..."
      curl -fsSL https://rpm.nodesource.com/setup_22.x | $SUDO bash -
      $SUDO zypper install -y nodejs
      ;;
    macos)
      if command -v brew &>/dev/null; then
        info "Installing Node.js 22 via Homebrew..."
        brew install node@22
        brew link --overwrite node@22
      else
        info "Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv 2>/dev/null)"
        brew install node@22
        brew link --overwrite node@22
      fi
      ;;
    *)
      fail "Cannot auto-install Node.js on this OS. Please install Node.js >= 22 manually: https://nodejs.org"
      ;;
  esac

  # Verify installation
  if command -v node &>/dev/null; then
    NODE_VERSION_RAW="$(node --version)"
    NODE_MAJOR="${NODE_VERSION_RAW#v}"
    NODE_MAJOR="${NODE_MAJOR%%.*}"
    if [ "$NODE_MAJOR" -ge 22 ] 2>/dev/null; then
      success "Node.js ${NODE_VERSION_RAW} installed"
    else
      fail "Node.js was installed but version ${NODE_VERSION_RAW} is < 22. Please install manually: https://nodejs.org"
    fi
  else
    fail "Node.js installation failed. Please install manually: https://nodejs.org"
  fi
fi

# -------------------------------------------------------------------------
# 3. Check npm
# -------------------------------------------------------------------------
step "Checking npm"

if ! command -v npm &>/dev/null; then
  fail "npm is not installed. It should come with Node.js. Try reinstalling Node.js."
fi

NPM_VERSION="$(npm --version)"
success "npm v${NPM_VERSION} detected"

# -------------------------------------------------------------------------
# 4. Check openssl (needed for secret generation)
# -------------------------------------------------------------------------
step "Checking openssl"

if ! command -v openssl &>/dev/null; then
  warn "openssl not found — installing..."
  case "$OS_TYPE" in
    debian)
      SUDO="$(need_sudo)"
      $SUDO apt-get install -y -qq openssl
      ;;
    rhel)
      SUDO="$(need_sudo)"
      $SUDO dnf install -y openssl 2>/dev/null || $SUDO yum install -y openssl
      ;;
    arch)
      SUDO="$(need_sudo)"
      $SUDO pacman -Sy --noconfirm openssl
      ;;
    suse)
      SUDO="$(need_sudo)"
      $SUDO zypper install -y openssl
      ;;
    macos)
      # macOS ships with LibreSSL, but if missing:
      if command -v brew &>/dev/null; then
        brew install openssl
      else
        fail "openssl not found. Install via Homebrew: brew install openssl"
      fi
      ;;
    *)
      fail "openssl not found. Please install openssl manually and try again."
      ;;
  esac
fi

if command -v openssl &>/dev/null; then
  success "openssl available"
else
  fail "openssl installation failed. Please install manually."
fi

# -------------------------------------------------------------------------
# 5. Install dependencies
# -------------------------------------------------------------------------
step "Installing dependencies (npm install)"

npm install
success "Dependencies installed"

# -------------------------------------------------------------------------
# 6. Generate .env file (only if it does not already exist)
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
# 7. Build the project
# -------------------------------------------------------------------------
step "Building the project (npm run build)"

npm run build
success "Build completed successfully"

# -------------------------------------------------------------------------
# 8. Done!
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
