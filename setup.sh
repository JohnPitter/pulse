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

# --- Clone / update repo ---
step "Cloning repository"
if [ -d "${PULSE_HOME}/app" ]; then
  info "Directory exists — pulling latest..."
  cd "${PULSE_HOME}/app"
  sudo -u "$PULSE_USER" git pull --ff-only
else
  sudo -u "$PULSE_USER" git clone "$REPO" "${PULSE_HOME}/app"
  cd "${PULSE_HOME}/app"
fi
success "Repository ready at ${PULSE_HOME}/app"

# --- Run the full installer as pulse user ---
step "Running installer as '${PULSE_USER}'"
sudo -u "$PULSE_USER" bash install.sh

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
ReadWritePaths=${PULSE_HOME}/app/data
ProtectHome=read-only
PrivateTmp=true

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

# --- Done ---
printf "\n${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}\n"
printf "${GREEN}${BOLD}║         Setup complete!                   ║${NC}\n"
printf "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}\n\n"

# Get server IP
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')" || SERVER_IP="<your-server-ip>"

printf "${BOLD}Access:${NC}\n"
printf "  ${CYAN}http://${SERVER_IP}:3000${NC}\n"
printf "\n"
printf "${BOLD}Service commands:${NC}\n"
printf "  ${CYAN}systemctl status pulse${NC}    — Check status\n"
printf "  ${CYAN}systemctl restart pulse${NC}   — Restart\n"
printf "  ${CYAN}systemctl stop pulse${NC}      — Stop\n"
printf "  ${CYAN}journalctl -u pulse -f${NC}    — View logs\n"
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
