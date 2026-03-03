#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Pulse — One-Line Bootstrap
# Usage: curl -fsSL https://raw.githubusercontent.com/JohnPitter/pulse/master/setup.sh | bash
# =============================================================================

REPO="https://github.com/JohnPitter/pulse.git"
PULSE_USER="pulse"
PULSE_HOME="/opt/pulse"
SERVICE_NAME="pulse"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { printf "${CYAN}[INFO]${NC}  %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()    { printf "${RED}[ERROR]${NC} %s\n" "$1" >&2; exit 1; }
step()    { printf "\n${CYAN}${BOLD}▸ %s${NC}\n" "$1"; }

# Detect OS type
if [ -f /etc/os-release ]; then
  . /etc/os-release
  case "$ID" in
    ubuntu|debian|pop|linuxmint|elementary|zorin) OS_TYPE="debian" ;;
    fedora|rhel|centos|rocky|alma|amzn) OS_TYPE="rhel" ;;
    arch|manjaro|endeavouros) OS_TYPE="arch" ;;
    opensuse*|sles) OS_TYPE="suse" ;;
    *) OS_TYPE="unknown" ;;
  esac
else
  OS_TYPE="unknown"
fi

printf "\n${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${BOLD}║        Pulse — One-Line Setup            ║${NC}\n"
printf "${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

# --- Must run as root ---
if [ "$(id -u)" -ne 0 ]; then
  fail "This script must be run as root. Use: curl -fsSL ... | sudo bash"
fi

# --- Ensure git is available ---
step "Checking Git"
if ! command -v git &>/dev/null; then
  info "Installing git..."
  apt-get update -qq && apt-get install -y -qq git 2>/dev/null \
    || dnf install -y git 2>/dev/null \
    || yum install -y git 2>/dev/null \
    || fail "Could not install git. Please install manually."
fi
success "Git $(git --version | awk '{print $3}') available"

# --- Create pulse user ---
step "Creating '${PULSE_USER}' user"
if id "$PULSE_USER" &>/dev/null; then
  success "User '${PULSE_USER}' already exists"
else
  useradd --system --create-home --home-dir "$PULSE_HOME" --shell /bin/bash "$PULSE_USER"
  success "User '${PULSE_USER}' created (home: ${PULSE_HOME})"
fi

# Ensure home directory exists with correct ownership (handles reinstalls)
mkdir -p "$PULSE_HOME"
chown "${PULSE_USER}:${PULSE_USER}" "$PULSE_HOME"

# --- Clone / update repo ---
step "Cloning repository"
if [ -d "${PULSE_HOME}/app/.git" ]; then
  info "Repository exists — pulling latest..."
  cd "${PULSE_HOME}/app"
  sudo -u "$PULSE_USER" env "HOME=${PULSE_HOME}" git pull --ff-only
else
  # Clean any leftover non-git directory
  rm -rf "${PULSE_HOME}/app"
  sudo -u "$PULSE_USER" env "HOME=${PULSE_HOME}" git clone "$REPO" "${PULSE_HOME}/app"
  cd "${PULSE_HOME}/app"
fi
success "Repository ready at ${PULSE_HOME}/app"

# --- Run the full installer as pulse user ---
step "Running installer as '${PULSE_USER}'"
sudo -u "$PULSE_USER" env "HOME=${PULSE_HOME}" bash install.sh

# --- Create systemd service ---
step "Configuring systemd service"

cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Pulse — Claude Code Agent Dashboard
After=network.target

[Service]
Type=simple
User=${PULSE_USER}
Group=${PULSE_USER}
WorkingDirectory=${PULSE_HOME}/app
ExecStart=/usr/bin/env node packages/server/dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=HOME=${PULSE_HOME}

# Load env file
EnvironmentFile=${PULSE_HOME}/app/.env

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=${PULSE_HOME}
ReadWritePaths=/tmp
ProtectHome=false
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF

# Ensure data directory exists and is owned by pulse
mkdir -p "${PULSE_HOME}/app/data"
chown -R "${PULSE_USER}:${PULSE_USER}" "${PULSE_HOME}"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# Wait a moment and check status
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
  success "Pulse service is running"
else
  warn "Service may have failed to start. Check: journalctl -u ${SERVICE_NAME} -n 20"
fi

# --- HTTPS / TLS with Caddy ---
step "Configuring HTTPS (Caddy reverse proxy)"

PULSE_DOMAIN=""

# Accept domain via PULSE_DOMAIN env var or prompt interactively
if [ -n "${PULSE_DOMAIN:-}" ]; then
  info "Using domain from environment: ${PULSE_DOMAIN}"
elif [ -t 0 ]; then
  printf "${BOLD}Enter your domain for HTTPS (e.g. pulse.example.com)${NC}\n"
  printf "  Leave empty to skip HTTPS and use http://<ip>:3000 instead\n"
  printf "  ${CYAN}Domain: ${NC}"
  read -r PULSE_DOMAIN
elif [ -e /dev/tty ]; then
  # Running via pipe (curl | bash) — read from tty
  printf "${BOLD}Enter your domain for HTTPS (e.g. pulse.example.com)${NC}\n"
  printf "  Leave empty to skip HTTPS and use http://<ip>:3000 instead\n"
  printf "  ${CYAN}Domain: ${NC}"
  read -r PULSE_DOMAIN < /dev/tty
else
  info "Non-interactive mode — skipping HTTPS. Set PULSE_DOMAIN env var to enable."
fi

if [ -n "$PULSE_DOMAIN" ]; then
  # Install Caddy
  if ! command -v caddy &>/dev/null; then
    info "Installing Caddy..."
    case "$OS_TYPE" in
      debian)
        apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl 2>/dev/null || true
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
        apt-get update -qq
        apt-get install -y -qq caddy
        ;;
      rhel)
        dnf install -y 'dnf-command(copr)' 2>/dev/null && dnf copr enable -y @caddy/caddy 2>/dev/null && dnf install -y caddy 2>/dev/null \
          || { curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/setup.rpm.sh' | bash && dnf install -y caddy 2>/dev/null; } \
          || fail "Could not install Caddy. Install manually: https://caddyserver.com/docs/install"
        ;;
      arch)
        pacman -Sy --noconfirm caddy
        ;;
      *)
        warn "Auto-install not supported for this OS. Install Caddy manually: https://caddyserver.com/docs/install"
        PULSE_DOMAIN=""
        ;;
    esac
  fi

  if command -v caddy &>/dev/null && [ -n "$PULSE_DOMAIN" ]; then
    success "Caddy $(caddy version 2>/dev/null | head -1) available"

    # Write Caddyfile
    cat > /etc/caddy/Caddyfile <<CADDYEOF
${PULSE_DOMAIN} {
    reverse_proxy localhost:3000
}
CADDYEOF

    # Update .env CORS_ORIGIN to use HTTPS domain
    ENV_FILE="${PULSE_HOME}/app/.env"
    if [ -f "$ENV_FILE" ]; then
      sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${PULSE_DOMAIN}|" "$ENV_FILE"
      success "Updated CORS_ORIGIN to https://${PULSE_DOMAIN}"
    fi

    # Restart services
    systemctl enable caddy
    systemctl restart caddy
    systemctl restart "$SERVICE_NAME"

    # Wait for Caddy to obtain certificate
    sleep 3
    if systemctl is-active --quiet caddy; then
      success "Caddy is running — TLS certificate will be auto-provisioned by Let's Encrypt"
    else
      warn "Caddy may have failed. Check: journalctl -u caddy -n 20"
      warn "Ensure DNS for ${PULSE_DOMAIN} points to this server and ports 80/443 are open"
    fi
  fi
else
  info "Skipping HTTPS setup"
fi

# --- Claude CLI check ---
CLAUDE_BIN="${PULSE_HOME}/.local/bin/claude"

if [ -x "$CLAUDE_BIN" ]; then
  success "Claude CLI installed at ${CLAUDE_BIN}"
else
  warn "Claude CLI not found. Install it later:"
  warn "  su - ${PULSE_USER} -c 'curl -fsSL https://claude.ai/install.sh | bash'"
fi

# --- Done ---
printf "\n${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${GREEN}${BOLD}║         Setup complete!                   ║${NC}\n"
printf "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

# Get server IP
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')" || SERVER_IP="<your-server-ip>"

printf "${BOLD}Access:${NC}\n"
if [ -n "$PULSE_DOMAIN" ]; then
  printf "  ${CYAN}https://${PULSE_DOMAIN}${NC}\n"
else
  printf "  ${CYAN}http://${SERVER_IP}:3000${NC}\n"
fi
printf "\n"
printf "${BOLD}Service commands:${NC}\n"
printf "  ${CYAN}systemctl status pulse${NC}    — Check status\n"
printf "  ${CYAN}systemctl restart pulse${NC}   — Restart\n"
printf "  ${CYAN}systemctl stop pulse${NC}      — Stop\n"
printf "  ${CYAN}journalctl -u pulse -f${NC}    — View logs\n"
if [ -n "$PULSE_DOMAIN" ]; then
  printf "\n"
  printf "${BOLD}HTTPS (Caddy):${NC}\n"
  printf "  ${CYAN}systemctl status caddy${NC}    — Check Caddy status\n"
  printf "  ${CYAN}cat /etc/caddy/Caddyfile${NC} — View Caddy config\n"
  printf "  ${CYAN}journalctl -u caddy -f${NC}   — View Caddy logs\n"
fi
printf "\n"
printf "${BOLD}Claude authentication:${NC}\n"
printf "  ${CYAN}su - ${PULSE_USER} -c 'claude login'${NC}\n"
printf "  Then go to Settings → CLI Token → Import from CLI\n"
printf "\n"
printf "${BOLD}Files:${NC}\n"
printf "  App:    ${CYAN}${PULSE_HOME}/app/${NC}\n"
printf "  Config: ${CYAN}${PULSE_HOME}/app/.env${NC}\n"
printf "  DB:     ${CYAN}${PULSE_HOME}/app/data/pulse.db${NC}\n"
printf "\n"
