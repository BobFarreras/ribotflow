#!/bin/bash
# ==========================================
# RIBOTFLOW - Remote Installer (Standalone)
# Usage: curl -fsSL https://raw.githubusercontent.com/BobFarreras/ribotflow/main/scripts/install-remote.sh | bash
# ==========================================
# This script downloads the deployment files directly from GitHub
# and runs the installer. No git clone required. No source code on the server.

set -e

# ─── Colors ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

REPO="BobFarreras/ribotflow"
BRANCH="main"
RAW_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
INSTALL_DIR="${INSTALL_DIR:-/opt/ribotflow}"

# ─── Banner ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}"
cat << 'BANNER'

     ██████╗ ██╗████████╗████████╗██████╗ ██╗ ██████╗ ██╗     ██╗
     ██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔══██╗██║██╔═══██╗██║     ██║
     ██████╔╝██║   ██║      ██║   ██████╔╝██║██║   ██║██║     ██║
     ██╔══██╗██║   ██║      ██║   ██╔══██╗██║██║   ██║██║     ██║
     ██║  ██║██║   ██║      ██║   ██║  ██║██║╚██████╔╝███████╗██║
     ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝╚═╝

BANNER
echo -e "${NC}"
echo -e "  ${DIM}RIBOTFLOW${NC}"
echo -e "  ${DIM}v0.1.0 ${DIM}│${NC} ${DIM}https://github.com/BobFarreras/ribotflow${NC}"
echo ""

# ==========================================
# 0. PRE-FLIGHT CHECKS
# ==========================================
echo -e "${BOLD}${BLUE}  ◈ Pre-flight Checks${NC}"
echo -e "${DIM}──────────────────────────────────────────────────────────${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "  ${YELLOW}⚠ Warning: Not running as root. Some operations may fail.${NC}"
    echo "  Consider running with sudo for system-wide installation."
    echo ""
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "  ${RED}✗ Docker is not installed.${NC}"
    echo "  Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
if ! command -v docker compose &> /dev/null; then
    echo -e "  ${RED}✗ Docker Compose is not installed.${NC}"
    echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check curl
if ! command -v curl &> /dev/null; then
    echo -e "  ${RED}✗ curl is not installed.${NC}"
    echo "  Install curl: apt-get install curl / yum install curl"
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    echo -e "  ${RED}✗ git is not installed.${NC}"
    echo "  Install git: apt-get install git / yum install git"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Docker $(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)"
echo -e "  ${GREEN}✓${NC} Docker Compose"
echo -e "  ${GREEN}✓${NC} curl"
echo -e "  ${GREEN}✓${NC} git"
echo ""

# ==========================================
# 1. DOWNLOAD FILES FROM GITHUB
# ==========================================
echo -e "${BOLD}${BLUE}  ◈ Downloading from GitHub (${BRANCH} branch)${NC}"
echo -e "${DIM}──────────────────────────────────────────────────────────${NC}"

# Create install directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Shallow clone the repo (needed for Docker build)
if [ -d ".git" ]; then
    git pull --ff-only origin "$BRANCH" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Repository updated"
else
    git clone --depth 1 --branch "$BRANCH" "https://github.com/${REPO}.git" _source
    # Move files from cloned repo to install dir
    mv _source/* _source/.* . 2>/dev/null || true
    rm -rf _source
    echo -e "  ${GREEN}✓${NC} Repository cloned"
fi

# Ensure scripts are executable
chmod +x scripts/install.sh scripts/manage.sh docker/scripts/start.sh 2>/dev/null || true
echo ""

# ==========================================
# 2. RUN WIZARD
# ==========================================
echo -e "${BOLD}${BLUE}  ◈ Launching Installation Wizard${NC}"
echo -e "${DIM}──────────────────────────────────────────────────────────${NC}"
echo ""

# The install.sh will handle everything from here.
if [ -r /dev/tty ]; then
    exec ./scripts/install.sh < /dev/tty
fi

exec ./scripts/install.sh
