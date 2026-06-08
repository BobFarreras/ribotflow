#!/bin/bash
# ==========================================
# RIBOTFLOW - Remote Installer (Standalone)
# Usage: curl -fsSL https://raw.githubusercontent.com/BobFarreras/ribotflow/main/scripts/install-remote.sh | bash
# ==========================================
# This script downloads the deployment files directly from GitHub
# and runs the installer. No git clone required. No source code on the server.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="BobFarreras/ribotflow"
BRANCH="main"
RAW_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
INSTALL_DIR="${INSTALL_DIR:-/opt/ribotflow}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              RIBOTFLOW - Remote Installer                   ║${NC}"
echo -e "${CYAN}║         Field Service Management Platform                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==========================================
# 0. PRE-FLIGHT CHECKS
# ==========================================
echo -e "${BLUE}━━━ Pre-flight checks ━━━${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠ Warning: Not running as root. Some operations may fail.${NC}"
    echo "  Consider running with sudo for system-wide installation."
    echo ""
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed.${NC}"
    echo "  Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed.${NC}"
    echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}✗ curl is not installed.${NC}"
    echo "  Install curl: apt-get install curl / yum install curl"
    exit 1
fi

echo -e "${GREEN}✓ Docker detected${NC}"
echo -e "${GREEN}✓ Docker Compose detected${NC}"
echo -e "${GREEN}✓ curl detected${NC}"
echo ""

# ==========================================
# 1. DOWNLOAD FILES FROM GITHUB
# ==========================================
echo -e "${BLUE}━━━ Downloading deployment files from GitHub ━━━${NC}"
echo ""

# Create install directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download all required files directly from GitHub (always latest)
curl -fsSL -o docker-compose.prod.yml "${RAW_URL}/docker-compose.prod.yml"
curl -fsSL -o docker-compose.traefik.yml "${RAW_URL}/docker-compose.traefik.yml"
curl -fsSL -o docker-compose.caddy.yml "${RAW_URL}/docker-compose.caddy.yml"
curl -fsSL -o install.sh "${RAW_URL}/scripts/install.sh"
curl -fsSL -o manage.sh "${RAW_URL}/scripts/manage.sh"

mkdir -p docker/caddy
curl -fsSL -o docker/caddy/Caddyfile "${RAW_URL}/docker/caddy/Caddyfile"

mkdir -p docker/postgres
curl -fsSL -o docker/postgres/init.sql "${RAW_URL}/docker/postgres/init.sql"

# Fix permissions
chmod +x install.sh manage.sh

echo -e "${GREEN}✓ Downloaded from GitHub (${BRANCH} branch)${NC}"
echo ""

# ==========================================
# 2. RUN WIZARD
# ==========================================
echo -e "${BLUE}━━━ Starting installation wizard ━━━${NC}"
echo ""

# The install.sh will handle everything from here
exec ./install.sh