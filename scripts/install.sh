#!/bin/bash
# ==========================================
# RIBOTFLOW - Installation Script
# Interactive setup for production deployment
# ==========================================
set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              RIBOTFLOW - Installation Wizard              ║"
echo "║         Field Service Management Platform                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# ==========================================
# 1. DOMAIN CONFIGURATION
# ==========================================
echo -e "${BLUE}━━━ Step 1: Domain Configuration ━━━${NC}"
echo ""
read -p "Enter your domain (e.g., ribotflow.yourdomain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Domain: $DOMAIN${NC}"
echo ""

# ==========================================
# 2. REVERSE PROXY SELECTION
# ==========================================
echo -e "${BLUE}━━━ Step 2: Reverse Proxy ━━━${NC}"
echo ""
echo "Select your reverse proxy setup:"
echo "  1) Caddy (auto HTTPS — Caddy runs inside Docker)"
echo "  2) Traefik (I already have Traefik running)"
echo "  3) Nginx (I already have Nginx running)"
echo "  4) None / External (expose port 3000 only — you bring your own proxy)"
echo ""
read -p "Enter choice [1-4]: " PROXY_CHOICE

case $PROXY_CHOICE in
    1)
        PROXY="caddy"
        echo -e "${GREEN}✓ Using Caddy (auto HTTPS)${NC}"
        ;;
    2)
        PROXY="traefik"
        echo -e "${GREEN}✓ Using Traefik${NC}"
        echo ""
        read -p "Enter Traefik network name [traefik-public]: " TRAEFIK_NETWORK
        TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}
        echo -e "${GREEN}✓ Traefik network: $TRAEFIK_NETWORK${NC}"
        ;;
    3)
        PROXY="nginx"
        echo -e "${GREEN}✓ Using Nginx${NC}"
        ;;
    4)
        PROXY="none"
        echo -e "${GREEN}✓ No built-in reverse proxy. App exposed on port 3000.${NC}"
        echo "  Configure your own proxy to forward to http://localhost:3000"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
echo ""

# ==========================================
# 3. GENERATE SECRETS
# ==========================================
echo -e "${BLUE}━━━ Step 3: Generating Secrets ━━━${NC}"
echo ""

# Generate secrets using OpenSSL
AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_USER=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
MINIO_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
ENCRYPTION_KEY=$(openssl rand -base64 32)

echo -e "${GREEN}✓ AUTH_SECRET generated${NC}"
echo -e "${GREEN}✓ POSTGRES_PASSWORD generated${NC}"
echo -e "${GREEN}✓ MINIO credentials generated${NC}"
echo -e "${GREEN}✓ ENCRYPTION_KEY generated (for SMTP password encryption)${NC}"
echo ""

# ==========================================
# 4. SMTP CONFIGURATION (Optional)
# ==========================================
echo -e "${BLUE}━━━ Step 4: Email Configuration (Optional) ━━━${NC}"
echo ""
read -p "Do you want to configure email (SMTP)? [y/N]: " CONFIGURE_SMTP

if [[ $CONFIGURE_SMTP =~ ^[Yy]$ ]]; then
    echo ""
    echo "SMTP Presets:"
    echo "  1) Gmail (smtp.gmail.com:465)"
    echo "  2) Brevo (smtp.brevo.com:587)"
    echo "  3) Mailgun (smtp.mailgun.org:587)"
    echo "  4) Custom"
    echo ""
    read -p "Select SMTP provider [1-4]: " SMTP_PROVIDER

    case $SMTP_PROVIDER in
        1)
            SMTP_HOST="smtp.gmail.com"
            SMTP_PORT="465"
            SMTP_SECURE="true"
            ;;
        2)
            SMTP_HOST="smtp.brevo.com"
            SMTP_PORT="587"
            SMTP_SECURE="false"
            ;;
        3)
            SMTP_HOST="smtp.mailgun.org"
            SMTP_PORT="587"
            SMTP_SECURE="false"
            ;;
        4)
            read -p "SMTP Host: " SMTP_HOST
            read -p "SMTP Port [587]: " SMTP_PORT
            SMTP_PORT=${SMTP_PORT:-587}
            read -p "Use SSL? (true/false) [false]: " SMTP_SECURE
            SMTP_SECURE=${SMTP_SECURE:-false}
            ;;
    esac

    read -p "SMTP Username: " SMTP_USER
    read -s -p "SMTP Password: " SMTP_PASSWORD
    echo ""
    read -p "From email (noreply@$DOMAIN): " SMTP_FROM
    SMTP_FROM=${SMTP_FROM:-"noreply@$DOMAIN"}

    echo -e "${GREEN}✓ SMTP configured: $SMTP_HOST:$SMTP_PORT${NC}"

    # Build SMTP env block
    SMTP_ENV="
# SMTP Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM"
else
    echo -e "${YELLOW}⚠ SMTP not configured. Email features will be disabled.${NC}"
    echo "  You can configure it later in Settings > Email."
    SMTP_ENV=""
fi
echo ""

# ==========================================
# 5. CREATE ENVIRONMENT FILE
# ==========================================
echo -e "${BLUE}━━━ Step 5: Creating Configuration ━━━${NC}"
echo ""

# Stop existing containers if running
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Create .env.local
cat > .env.local << EOF
# ==========================================
# RIBOTFLOW - Production Environment
# Generated by install.sh on $(date)
# ==========================================

# Auth
AUTH_SECRET=$AUTH_SECRET

# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@db:5432/ribotflow

# App
DOMAIN=$DOMAIN
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_APP_MODE=self-hosted
NODE_ENV=production

# MinIO
MINIO_ROOT_USER=$MINIO_USER
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_ACCESS_KEY=$MINIO_USER
MINIO_SECRET_KEY=$MINIO_PASSWORD
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=ribotflow-uploads
MINIO_USE_SSL=false

# Storage
STORAGE_PROVIDER=minio

# Encryption (AES-256-GCM for SMTP passwords at rest)
ENCRYPTION_KEY=$ENCRYPTION_KEY
$SMTP_ENV
EOF

echo -e "${GREEN}✓ Configuration saved to .env.local${NC}"
echo ""

# ==========================================
# 6. UPDATE TRAEFIK CONFIG (if needed)
# ==========================================
if [ "$PROXY" = "traefik" ]; then
    # Update traefik network name in docker-compose
    sed -i "s/name: traefik-public/name: $TRAEFIK_NETWORK/g" docker-compose.traefik.yml
    echo -e "${GREEN}✓ Traefik network updated to: $TRAEFIK_NETWORK${NC}"
    echo ""
fi

# Save compose profile for manage.sh
case $PROXY in
    caddy)
        echo "COMPOSE_FILES='-f docker-compose.prod.yml -f docker-compose.caddy.yml'" > .compose-profile
        ;;
    traefik)
        echo "COMPOSE_FILES='-f docker-compose.prod.yml -f docker-compose.traefik.yml'" > .compose-profile
        ;;
    nginx|none)
        echo "COMPOSE_FILES='-f docker-compose.prod.yml'" > .compose-profile
        ;;
esac

# ==========================================
# 7. CREATE DIRECTORIES
# ==========================================
mkdir -p uploads
echo -e "${GREEN}✓ Created uploads directory${NC}"
echo ""

# ==========================================
# 8. START SERVICES
# ==========================================
echo -e "${BLUE}━━━ Step 6: Starting Services ━━━${NC}"
echo ""

case $PROXY in
    caddy)
        echo "Starting with Caddy..."
        docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml --env-file .env.local up -d
        ;;
    traefik)
        echo "Starting with Traefik..."
        docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml --env-file .env.local up -d
        ;;
    nginx)
        echo "Starting (configure Nginx separately)..."
        docker compose -f docker-compose.prod.yml --env-file .env.local up -d
        ;;
    none)
        echo "Starting (no built-in reverse proxy)..."
        docker compose -f docker-compose.prod.yml --env-file .env.local up -d
        echo ""
        echo "App is exposed on port 3000."
        echo "Configure your reverse proxy to forward to http://<server-ip>:3000"
        ;;
esac

echo ""
echo -e "${GREEN}✓ Services started!${NC}"
echo ""

# ==========================================
# 9. WAIT FOR HEALTH CHECK
# ==========================================
echo -e "${BLUE}━━━ Waiting for application to start... ━━━${NC}"
echo ""

sleep 10

# Check if app is running
if docker compose -f docker-compose.prod.yml ps app | grep -q "Up"; then
    echo -e "${GREEN}✓ Application is running!${NC}"
else
    echo -e "${YELLOW}⚠ Application might still be starting. Check logs with:${NC}"
    echo "  docker compose -f docker-compose.prod.yml logs -f app"
fi

echo ""

# ==========================================
# 10. PRINT SUMMARY
# ==========================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Installation Complete!                     ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║"
if [ "$PROXY" = "none" ]; then
    echo "║  🌐 URL:        http://$DOMAIN:3000"
else
    echo "║  🌐 URL:        https://$DOMAIN"
fi
echo "║  🔐 Login:      dais@test.com"
echo "║  🔑 Password:   12345678"
echo "║"
echo "║  📧 SMTP:       ${SMTP_HOST:-Not configured}"
echo "║  💾 Database:   PostgreSQL 16"
echo "║  📁 Storage:    MinIO"
echo "║  🔒 Encryption: ${ENCRYPTION_KEY:0:8}..."
echo "║"
echo "║  📋 Useful commands:"
echo "║     docker compose -f docker-compose.prod.yml logs -f app"
echo "║     docker compose -f docker-compose.prod.yml ps"
echo "║     docker compose -f docker-compose.prod.yml restart"
echo "║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
