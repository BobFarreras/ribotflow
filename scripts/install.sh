#!/bin/bash
# ==========================================
# RIBOTFLOW - Installation Script
# Fully non-interactive when env vars are provided.
# Usage (non-interactive):
#   DOMAIN=app.example.com ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret123 bash install.sh
# Usage (interactive):
#   bash install.sh
# ==========================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              RIBOTFLOW - Installation Wizard              ║${NC}"
echo -e "${CYAN}║         Field Service Management Platform                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

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

if [ -z "$DOMAIN" ]; then
    if [ -t 0 ]; then
        read -p "Enter your domain (e.g., ribotflow.yourdomain.com): " DOMAIN
    fi
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain is required. Set DOMAIN env var or provide interactively.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Domain: $DOMAIN${NC}"
echo ""

# ==========================================
# 2. REVERSE PROXY SELECTION
# ==========================================
echo -e "${BLUE}━━━ Step 2: Reverse Proxy ━━━${NC}"
echo ""

if [ -n "$PROXY" ]; then
    # Non-interactive: use env var
    PROXY_CHOICE=""
    echo -e "${GREEN}✓ Using $PROXY (from env var)${NC}"
elif [ -n "$TRAEFIK_NETWORK" ] || docker ps --format '{{.Names}}' | grep -q traefik; then
    # Auto-detect: Traefik already running
    PROXY="traefik"
    echo -e "${GREEN}✓ Traefik detected automatically${NC}"
else
    # Interactive
    echo "Select your reverse proxy setup:"
    echo "  1) Caddy (auto HTTPS — Caddy runs inside Docker)"
    echo "  2) Traefik (I already have Traefik running)"
    echo "  3) Nginx (I already have Nginx running)"
    echo "  4) None / External (expose port 3000 only — you bring your own proxy)"
    echo ""
    read -p "Enter choice [1-4]: " PROXY_CHOICE

    case $PROXY_CHOICE in
        1) PROXY="caddy" ;;
        2) PROXY="traefik" ;;
        3) PROXY="nginx" ;;
        4) PROXY="none" ;;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
    esac
fi

# Traefik network name
if [ "$PROXY" = "traefik" ]; then
    if [ -z "$TRAEFIK_NETWORK" ]; then
        # Auto-detect from running Traefik container
        TRAEFIK_NETWORK=$(docker inspect traefik --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' 2>/dev/null | grep -E 'traefik|proxy|web' | head -1)
        TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-$(docker network ls --filter "name=traefik" --format '{{.Name}}' | head -1)}
        TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}
    fi
    TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT:-websecure}
    if [ -z "$TRAEFIK_CERT_RESOLVER" ]; then
        TRAEFIK_CERT_RESOLVER=$(docker inspect traefik --format='{{json .Config.Cmd}}' 2>/dev/null | grep -oP 'certificatesresolvers\.\K[^.]+' | head -1 || true)
        TRAEFIK_CERT_RESOLVER=${TRAEFIK_CERT_RESOLVER:-letsencrypt}
    fi
    echo -e "${GREEN}✓ Traefik network: $TRAEFIK_NETWORK${NC}"
    echo -e "${GREEN}✓ Traefik entrypoint: $TRAEFIK_ENTRYPOINT${NC}"
    echo -e "${GREEN}✓ Traefik cert resolver: $TRAEFIK_CERT_RESOLVER${NC}"
fi
echo ""

# ==========================================
# 3. GENERATE SECRETS
# ==========================================
echo -e "${BLUE}━━━ Step 3: Generating Secrets ━━━${NC}"
echo ""

AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_USER=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
MINIO_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
ENCRYPTION_KEY=$(openssl rand -base64 32)

echo -e "${GREEN}✓ All secrets generated${NC}"
echo ""

# ==========================================
# 4. ADMIN USER CONFIGURATION
# ==========================================
echo -e "${BLUE}━━━ Step 4: Admin User Configuration ━━━${NC}"
echo ""

if [ -z "$COMPANY_NAME" ] && [ -t 0 ]; then
    read -p "Enter company name [RIBOTFLOW]: " COMPANY_NAME
fi
COMPANY_NAME=${COMPANY_NAME:-RIBOTFLOW}

if [ -z "$ADMIN_EMAIL" ] && [ -t 0 ]; then
    read -p "Enter admin email (e.g., admin@yourdomain.com): " ADMIN_EMAIL
fi
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@$DOMAIN}

if [ -z "$ADMIN_PASSWORD" ]; then
    if [ -t 0 ]; then
        while true; do
            read -s -p "Enter admin password (min 8 chars): " ADMIN_PASSWORD
            echo ""
            if [ ${#ADMIN_PASSWORD} -ge 8 ]; then
                read -s -p "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
                echo ""
                if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then
                    break
                else
                    echo -e "${RED}Passwords do not match. Try again.${NC}"
                fi
            else
                echo -e "${RED}Password must be at least 8 characters.${NC}"
            fi
        done
    else
        echo -e "${RED}Error: ADMIN_PASSWORD is required in non-interactive mode.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Admin password: (from env var)${NC}"
fi

echo -e "${GREEN}✓ Company: $COMPANY_NAME${NC}"
echo -e "${GREEN}✓ Admin user: $ADMIN_EMAIL${NC}"
echo ""

# ==========================================
# 5. SMTP CONFIGURATION (Optional)
# ==========================================
echo -e "${BLUE}━━━ Step 5: Email Configuration (Optional) ━━━${NC}"
echo ""

SMTP_ENV=""
if [ -n "$SMTP_HOST" ]; then
    # Non-interactive: all SMTP vars provided
    SMTP_PORT=${SMTP_PORT:-587}
    SMTP_SECURE=${SMTP_SECURE:-false}
    SMTP_FROM=${SMTP_FROM:-"noreply@$DOMAIN"}
    SMTP_ENV="
# SMTP Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM"
    echo -e "${GREEN}✓ SMTP configured: $SMTP_HOST:$SMTP_PORT${NC}"
elif [ -t 0 ]; then
    # Interactive: ask user
    read -p "Do you want to configure email (SMTP)? [y/N]: " CONFIGURE_SMTP
    if [[ $CONFIGURE_SMTP =~ ^[Yy]$ ]]; then
        echo ""
        echo "SMTP Presets:"
        echo "  1) Gmail (smtp.gmail.com:465)"
        echo "  2) Brevo (smtp.brevo.com:587)"
        echo "  3) Mailgun (smtp.mailgun.org:587)"
        echo "  4) Hostinger (smtp.hostinger.com:465)"
        echo "  5) Custom"
        echo ""
        read -p "Select SMTP provider [1-5]: " SMTP_PROVIDER

        case $SMTP_PROVIDER in
            1) SMTP_HOST="smtp.gmail.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
            2) SMTP_HOST="smtp.brevo.com"; SMTP_PORT="587"; SMTP_SECURE="false" ;;
            3) SMTP_HOST="smtp.mailgun.org"; SMTP_PORT="587"; SMTP_SECURE="false" ;;
            4) SMTP_HOST="smtp.hostinger.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
            5)
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

        SMTP_ENV="
# SMTP Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM"
        echo -e "${GREEN}✓ SMTP configured: $SMTP_HOST:$SMTP_PORT${NC}"
    else
        echo -e "${YELLOW}⚠ SMTP not configured. Email features will be disabled.${NC}"
        echo "  You can configure it later in Settings > Email."
    fi
else
    echo -e "${YELLOW}⚠ SMTP not configured. Set SMTP_HOST env var or configure later in Settings > Email.${NC}"
fi
echo ""

# ==========================================
# 6. CREATE ENVIRONMENT FILE
# ==========================================
echo -e "${BLUE}━━━ Step 6: Creating Configuration ━━━${NC}"
echo ""

# Stop existing containers if running
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Create .env (Docker Compose reads this automatically)
cat > .env << EOF
# ==========================================
# RIBOTFLOW - Production Environment
# Generated by install.sh on $(date)
# ==========================================

# Auth
AUTH_SECRET=$AUTH_SECRET
AUTH_TRUST_HOST=true

# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@db:5432/ribotflow

# App
DOMAIN=$DOMAIN
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_APP_MODE=self_hosted
NODE_ENV=production
RUN_MIGRATIONS=true

# Admin
COMPANY_NAME=$COMPANY_NAME
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

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

# Traefik (used only with docker-compose.traefik.yml)
TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}
TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT:-websecure}
TRAEFIK_CERT_RESOLVER=${TRAEFIK_CERT_RESOLVER:-letsencrypt}

# Encryption (AES-256-GCM for SMTP passwords at rest)
ENCRYPTION_KEY=$ENCRYPTION_KEY
$SMTP_ENV
EOF

echo -e "${GREEN}✓ Configuration saved to .env${NC}"
echo ""

# ==========================================
# 7. UPDATE TRAEFIK CONFIG (if needed)
# ==========================================
if [ "$PROXY" = "traefik" ]; then
    echo -e "${GREEN}✓ Traefik settings saved to .env${NC}"
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
# 8. CREATE DIRECTORIES
# ==========================================
mkdir -p uploads
echo -e "${GREEN}✓ Created uploads directory${NC}"
echo ""

# ==========================================
# 9. START SERVICES
# ==========================================
echo -e "${BLUE}━━━ Step 7: Starting Services ━━━${NC}"
echo ""

case $PROXY in
    caddy)
        echo "Starting with Caddy..."
        docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d
        ;;
    traefik)
        echo "Starting with Traefik..."
        docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d
        echo ""
        echo -e "${YELLOW}⚠ Restarting Traefik to pick up new labels...${NC}"
        docker restart traefik 2>/dev/null || true
        ;;
    nginx)
        echo "Starting (configure Nginx separately)..."
        docker compose -f docker-compose.prod.yml up -d
        ;;
    none)
        echo "Starting (no built-in reverse proxy)..."
        docker compose -f docker-compose.prod.yml up -d
        echo ""
        echo "App is exposed on port 3000."
        echo "Configure your reverse proxy to forward to http://<server-ip>:3000"
        ;;
esac

echo ""
echo -e "${GREEN}✓ Services started!${NC}"
echo ""

# ==========================================
# 10. WAIT FOR HEALTH CHECK
# ==========================================
echo -e "${BLUE}━━━ Waiting for application to start... ━━━${NC}"
echo ""

sleep 15

# Check if app is running
if docker compose -f docker-compose.prod.yml ps app | grep -q "Up"; then
    echo -e "${GREEN}✓ Application is running!${NC}"
else
    echo -e "${YELLOW}⚠ Application might still be starting. Check logs with:${NC}"
    echo "  docker compose -f docker-compose.prod.yml logs -f app"
fi

# If Traefik, verify HTTPS
if [ "$PROXY" = "traefik" ]; then
    echo ""
    echo -e "${BLUE}━━━ Verifying HTTPS access... ━━━${NC}"
    echo ""
    sleep 10
    if curl -sk -L "https://$DOMAIN" 2>/dev/null | head -1 | grep -q "html"; then
        echo -e "${GREEN}✓ HTTPS access working! https://$DOMAIN${NC}"
    else
        echo -e "${YELLOW}⚠ HTTPS not yet available. Traefik may need a moment to obtain SSL certificate.${NC}"
        echo "  Try: curl -sk -L https://$DOMAIN | head -5"
        echo "  Or check Traefik logs: docker logs traefik --tail 20"
    fi
fi

echo ""

# ==========================================
# 11. PRINT SUMMARY
# ==========================================
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Installation Complete!                     ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║"
if [ "$PROXY" = "none" ]; then
    echo "║  URL:        http://$DOMAIN:3000"
else
    echo "║  URL:        https://$DOMAIN"
fi
echo "║  Login:      $ADMIN_EMAIL"
echo "║  Password:   [hidden]"
echo "║"
echo "║  SMTP:       ${SMTP_HOST:-Not configured}"
echo "║  Database:   PostgreSQL 16"
echo "║  Storage:    MinIO"
echo "║"
echo "║  Useful commands:"
echo "║     docker compose -f docker-compose.prod.yml logs -f app"
echo "║     docker compose -f docker-compose.prod.yml ps"
echo "║     docker compose -f docker-compose.prod.yml restart"
echo "║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
