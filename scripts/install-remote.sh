#!/bin/bash
# ==========================================
# RIBOTFLOW - Remote Installer (Standalone)
# Usage: curl -fsSL https://raw.githubusercontent.com/.../install-remote.sh | bash
# ==========================================
# This script downloads the latest deployment bundle and runs the installer.
# No git clone required. No source code on the server.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="BobFarreras/ribotflow"
BRANCH="features/Fxboix"
BUNDLE_URL="https://github.com/${REPO}/releases/latest/download/ribotflow-deploy.tar.gz"
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
# 1. DOWNLOAD BUNDLE
# ==========================================
echo -e "${BLUE}━━━ Downloading deployment bundle ━━━${NC}"
echo ""

# Create install directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Try to download from GitHub Releases first
if curl -fsSL -o ribotflow-deploy.tar.gz "$BUNDLE_URL" 2>/dev/null; then
    echo -e "${GREEN}✓ Downloaded latest release bundle${NC}"
else
    echo -e "${YELLOW}⚠ No release bundle found. Downloading from source...${NC}"
    
    # Fallback: download individual files from raw GitHub
    mkdir -p tmp-bundle
    cd tmp-bundle
    
    curl -fsSL -o docker-compose.prod.yml "${RAW_URL}/docker-compose.prod.yml"
    curl -fsSL -o docker-compose.caddy.yml "${RAW_URL}/docker-compose.caddy.yml"
    curl -fsSL -o docker-compose.traefik.yml "${RAW_URL}/docker-compose.traefik.yml"
    curl -fsSL -o install.sh "${RAW_URL}/scripts/install.sh"
    curl -fsSL -o manage.sh "${RAW_URL}/scripts/manage.sh"
    
    mkdir -p docker/caddy
    curl -fsSL -o docker/caddy/Caddyfile "${RAW_URL}/docker/caddy/Caddyfile"
    
    mkdir -p docker/postgres
    curl -fsSL -o docker/postgres/init.sql "${RAW_URL}/docker/postgres/init.sql"
    
    curl -fsSL -o .env.production "${RAW_URL}/.env.production"
    curl -fsSL -o INSTALL.md "${RAW_URL}/INSTALL.md"
    
    cd ..
    tar -czf ribotflow-deploy.tar.gz -C tmp-bundle .
    rm -rf tmp-bundle
    
    echo -e "${GREEN}✓ Downloaded from source${NC}"
fi

# ==========================================
# 2. EXTRACT BUNDLE
# ==========================================
echo -e "${BLUE}━━━ Extracting bundle ━━━${NC}"
echo ""

tar -xzf ribotflow-deploy.tar.gz
rm ribotflow-deploy.tar.gz

# Fix permissions
chmod +x install.sh manage.sh

echo -e "${GREEN}✓ Extracted to $INSTALL_DIR${NC}"
echo ""

# ==========================================
# 3. RUN WIZARD
# ==========================================
echo -e "${BLUE}━━━ Starting installation wizard ━━━${NC}"
echo ""

# The install.sh will handle everything from here
exec ./install.sh
