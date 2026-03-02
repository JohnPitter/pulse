#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Pulse — One-Line Bootstrap
# Usage: curl -fsSL https://raw.githubusercontent.com/JohnPitter/pulse/master/setup.sh | bash
# =============================================================================

REPO="https://github.com/JohnPitter/pulse.git"
DIR="pulse"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

printf "\n${BOLD}${CYAN}Pulse — One-Line Setup${NC}\n\n"

# --- Ensure git is available (minimal check) ---
if ! command -v git &>/dev/null; then
  printf "${RED}Git is not installed.${NC} The install script will handle it.\n"
  printf "On Debian/Ubuntu:  ${CYAN}sudo apt-get install -y git${NC}\n"
  printf "On macOS:          ${CYAN}xcode-select --install${NC}\n"
  printf "\nThen re-run this command.\n"
  exit 1
fi

# --- Clone ---
if [ -d "$DIR" ]; then
  printf "Directory ${CYAN}${DIR}/${NC} already exists — pulling latest...\n"
  cd "$DIR"
  git pull --ff-only
else
  printf "Cloning ${CYAN}${REPO}${NC}...\n"
  git clone "$REPO" "$DIR"
  cd "$DIR"
fi

# --- Run the full installer ---
printf "\n"
bash install.sh
