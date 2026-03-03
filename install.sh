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
# 5. Check tmux (needed for agent persistence)
# -------------------------------------------------------------------------
step "Checking tmux"

if command -v tmux &>/dev/null; then
  TMUX_VERSION="$(tmux -V | awk '{print $2}')"
  success "tmux ${TMUX_VERSION} detected"
else
  warn "tmux not found — installing..."
  case "$OS_TYPE" in
    debian)
      SUDO="$(need_sudo)"
      $SUDO apt-get install -y -qq tmux
      ;;
    rhel)
      SUDO="$(need_sudo)"
      $SUDO dnf install -y tmux 2>/dev/null || $SUDO yum install -y tmux
      ;;
    arch)
      SUDO="$(need_sudo)"
      $SUDO pacman -Sy --noconfirm tmux
      ;;
    suse)
      SUDO="$(need_sudo)"
      $SUDO zypper install -y tmux
      ;;
    macos)
      if command -v brew &>/dev/null; then
        brew install tmux
      else
        fail "tmux not found. Install via Homebrew: brew install tmux"
      fi
      ;;
    *)
      fail "tmux not found. Please install tmux manually and try again."
      ;;
  esac

  if command -v tmux &>/dev/null; then
    success "tmux $(tmux -V | awk '{print $2}') installed"
  else
    fail "tmux installation failed. Please install manually."
  fi
fi

# -------------------------------------------------------------------------
# 6. Install GitHub CLI (gh)
# -------------------------------------------------------------------------
step "Checking GitHub CLI"

if command -v gh &>/dev/null; then
  GH_VERSION="$(gh --version | head -1 | awk '{print $3}')"
  success "GitHub CLI ${GH_VERSION} detected"
else
  warn "GitHub CLI not found — installing..."
  case "$OS_TYPE" in
    debian)
      SUDO="$(need_sudo)"
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | $SUDO dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | $SUDO tee /etc/apt/sources.list.d/github-cli.list > /dev/null
      $SUDO apt-get update -qq && $SUDO apt-get install -y -qq gh
      ;;
    rhel) SUDO="$(need_sudo)"; $SUDO dnf install -y gh 2>/dev/null || $SUDO yum install -y gh ;;
    arch) SUDO="$(need_sudo)"; $SUDO pacman -Sy --noconfirm github-cli ;;
    suse) SUDO="$(need_sudo)"; $SUDO zypper install -y gh ;;
    macos) brew install gh ;;
    *) warn "Cannot auto-install GitHub CLI. Install manually: https://cli.github.com" ;;
  esac

  if command -v gh &>/dev/null; then
    success "GitHub CLI $(gh --version | head -1 | awk '{print $3}') installed"
  else
    warn "GitHub CLI installation may have failed. Install manually: https://cli.github.com"
  fi
fi

# -------------------------------------------------------------------------
# 7. Install Claude Code CLI (native binary)
# -------------------------------------------------------------------------
step "Checking Claude Code CLI"

if command -v claude &>/dev/null; then
  CLAUDE_VERSION="$(claude --version 2>/dev/null | head -1)" || CLAUDE_VERSION="unknown"
  success "Claude Code CLI already installed (${CLAUDE_VERSION})"
else
  info "Installing Claude Code CLI..."
  curl -fsSL https://claude.ai/install.sh | bash

  # Ensure ~/.local/bin is in PATH for this session and future sessions
  export PATH="$HOME/.local/bin:$PATH"

  # Persist PATH in .bashrc if not already there
  if [ -d "$HOME/.local/bin" ] && ! grep -q '\.local/bin' "$HOME/.bashrc" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  fi

  if command -v claude &>/dev/null; then
    CLAUDE_VERSION="$(claude --version 2>/dev/null | head -1)" || CLAUDE_VERSION="unknown"
    success "Claude Code CLI installed (${CLAUDE_VERSION})"
  else
    warn "Claude Code CLI installation may have failed. You can install it manually later:"
    warn "  su - pulse -c 'curl -fsSL https://claude.ai/install.sh | bash'"
  fi
fi

# -------------------------------------------------------------------------
# 8. Install dependencies
# -------------------------------------------------------------------------
step "Installing dependencies (npm install)"

npm install
success "Dependencies installed"

# -------------------------------------------------------------------------
# 9. Generate .env file (only if it does not already exist)
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
# 10. Build the project
# -------------------------------------------------------------------------
step "Building the project (npm run build)"

npm run build
success "Build completed successfully"

# -------------------------------------------------------------------------
# 11. Open firewall port (only when running as root)
# -------------------------------------------------------------------------
step "Configuring firewall"

# Read PORT from .env (default 3000)
PULSE_PORT="$(grep -E '^PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')"
PULSE_PORT="${PULSE_PORT:-3000}"

if [ "$(id -u)" -eq 0 ]; then
  open_firewall_port() {
    local port="$1"
    if command -v ufw &>/dev/null; then
      ufw allow "${port}/tcp" >/dev/null 2>&1 && success "ufw: allowed port ${port}/tcp" || warn "ufw: failed to allow port ${port}"
    elif command -v firewall-cmd &>/dev/null; then
      firewall-cmd --permanent --add-port="${port}/tcp" >/dev/null 2>&1 \
        && firewall-cmd --reload >/dev/null 2>&1 \
        && success "firewalld: allowed port ${port}/tcp" \
        || warn "firewalld: failed to allow port ${port}"
    elif command -v iptables &>/dev/null; then
      iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null \
        || iptables -A INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null
      success "iptables: allowed port ${port}/tcp"
    else
      warn "No firewall tool found (ufw, firewalld, iptables). Please open port ${port}/tcp manually."
    fi
  }

  case "$OS_TYPE" in
    debian|rhel|arch|suse)
      open_firewall_port "$PULSE_PORT"
      ;;
    macos)
      info "macOS — firewall port opening is usually not needed for local development"
      ;;
    *)
      warn "Could not detect firewall. Please ensure port ${PULSE_PORT}/tcp is open."
      ;;
  esac
else
  info "Not running as root — skipping firewall config (setup.sh handles this)"
fi

# -------------------------------------------------------------------------
# 12. Done!
# -------------------------------------------------------------------------
printf "\n${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${GREEN}${BOLD}║       Installation complete!              ║${NC}\n"
printf "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

printf "${BOLD}Getting started:${NC}\n"
printf "  1. Start the server:   ${CYAN}npm start${NC}\n"
printf "  2. Open your browser:  ${CYAN}http://localhost:3000${NC}\n"
printf "  3. On first visit you will be prompted to set an admin password.\n"
printf "  4. Authenticate with Claude: ${CYAN}claude login${NC}\n"
printf "     Then go to Settings → CLI Token → Import from CLI\n"
printf "\n"
printf "${BOLD}Useful commands:${NC}\n"
printf "  ${CYAN}npm run dev${NC}       — Start in development mode (hot reload)\n"
printf "  ${CYAN}npm run build${NC}     — Rebuild the project\n"
printf "  ${CYAN}npm start${NC}         — Start in production mode\n"
printf "  ${CYAN}claude login${NC}      — Authenticate with Claude (for agent features)\n"
printf "\n"
