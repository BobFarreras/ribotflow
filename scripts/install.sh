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

# ─── Colors & Formatting ───────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Symbols ────────────────────────────────────────────────────
ARROW="${CYAN}▸${NC}"
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"
DOT="${DIM}●${NC}"
LINE="${DIM}──────────────────────────────────────────────────────────${NC}"

# ─── Helpers ────────────────────────────────────────────────────
step()  { echo -e "\n${BLUE}${LINE}${NC}"; echo -e "${BOLD}${BLUE}  ◈ $1${NC}"; echo -e "${BLUE}${LINE}${NC}"; }
info()  { echo -e "  ${ARROW} ${WHITE}$1${NC}"; }
ok()    { echo -e "  ${CHECK} ${GREEN}$1${NC}"; }
warn()  { echo -e "  ${WARN} ${YELLOW}$1${NC}"; }
fail()  { echo -e "  ${CROSS} ${RED}$1${NC}"; }

# ─── ASCII Art Title ────────────────────────────────────────────
print_banner() {
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
    echo -e "  ${BOLD}${WHITE}RIBOTFLOW${NC}"
    echo -e "  ${DIM}v0.1.0 ${DIM}│${NC} ${DIM}https://github.com/BobFarreras/ribotflow${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════
#  PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

preflight_checks() {
    step "Pre-flight Checks"

    local errors=0

    # Docker
    if command -v docker &> /dev/null; then
        ok "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)"
    else
        fail "Docker is not installed"
        echo "     Install: https://docs.docker.com/engine/install/"
        errors=$((errors + 1))
    fi

    # Docker Compose
    if docker compose version &> /dev/null; then
        ok "Docker Compose $(docker compose version | grep -oP '\d+\.\d+\.\d+' | head -1)"
    else
        fail "Docker Compose is not installed"
        echo "     Install: https://docs.docker.com/compose/install/"
        errors=$((errors + 1))
    fi

    # curl
    if command -v curl &> /dev/null; then
        ok "curl"
    else
        fail "curl is not installed"
        errors=$((errors + 1))
    fi

    # openssl
    if command -v openssl &> /dev/null; then
        ok "openssl"
    else
        fail "openssl is not installed (required for secret generation)"
        errors=$((errors + 1))
    fi

    # Disk space (min 2GB)
    local avail_kb=$(df / --output=avail 2>/dev/null | tail -1 | tr -d ' ')
    if [ -n "$avail_kb" ] && [ "$avail_kb" -gt 2097152 ]; then
        local avail_gb=$((avail_kb / 1048576))
        ok "Disk space: ${avail_gb}GB available"
    elif [ -n "$avail_kb" ]; then
        warn "Low disk space: $((avail_kb / 1048576))GB (recommended: 2GB+)"
    fi

    # Memory
    local total_mem=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}')
    if [ -n "$total_mem" ] && [ "$total_mem" -gt 1024 ]; then
        ok "Memory: ${total_mem}MB"
    elif [ -n "$total_mem" ]; then
        warn "Low memory: ${total_mem}MB (recommended: 1GB+)"
    fi

    if [ "$errors" -gt 0 ]; then
        echo ""
        fail "$errors critical issue(s) found. Please fix before continuing."
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════
#  SECURITY CHECKS
# ═══════════════════════════════════════════════════════════════

security_checks() {
    step "Security Assessment"

    # SSH root login
    if [ -f /etc/ssh/sshd_config ]; then
        if grep -qE "^PermitRootLogin\s+yes" /etc/ssh/sshd_config 2>/dev/null; then
            warn "SSH root login is enabled"
            echo "     ${DIM}Recommend: PermitRootLogin prohibit-password${NC}"
        else
            ok "SSH root login restricted"
        fi
    fi

    # Firewall
    if command -v ufw &> /dev/null && ufw status 2>/dev/null | grep -q "active"; then
        ok "UFW firewall active"
    elif command -v firewall-cmd &> /dev/null && firewall-cmd --state 2>/dev/null | grep -q "running"; then
        ok "firewalld active"
    elif command -v iptables &> /dev/null; then
        local rules=$(iptables -L -n 2>/dev/null | grep -c "ACCEPT" || true)
        if [ "$rules" -gt 5 ]; then
            ok "iptables rules detected ($rules rules)"
        else
            warn "No firewall detected"
            echo "     ${DIM}Consider: ufw allow 22,80,443 && ufw enable${NC}"
        fi
    else
        warn "No firewall detected"
    fi

    # Automatic security updates
    if [ -f /etc/apt/apt.conf.d/20auto-upgrades ]; then
        ok "Automatic security updates configured"
    else
        info "Automatic security updates not configured"
        echo "     ${DIM}Optional: apt install unattended-upgrades${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════
#  1. DOMAIN CONFIGURATION
# ═══════════════════════════════════════════════════════════════

configure_domain() {
    step "Step 1/7 — Domain Configuration"

    if [ -z "$DOMAIN" ] && [ -t 0 ]; then
        read -p "  Enter your domain (e.g., ribotflow.yourdomain.com): " DOMAIN
    fi

    if [ -z "$DOMAIN" ]; then
        fail "Domain is required."
        echo "     Set DOMAIN env var or provide interactively."
        exit 1
    fi

    ok "Domain: ${BOLD}$DOMAIN${NC}"
}

# ═══════════════════════════════════════════════════════════════
#  2. REVERSE PROXY SELECTION
# ═══════════════════════════════════════════════════════════════

configure_proxy() {
    step "Step 2/7 — Reverse Proxy"

    if [ -n "$PROXY" ]; then
        ok "Using $PROXY (from env var)"
    elif [ -n "$TRAEFIK_NETWORK" ] || docker ps --format '{{.Names}}' 2>/dev/null | grep -q traefik; then
        PROXY="traefik"
        ok "Traefik auto-detected"
    else
        echo ""
        echo -e "  ${DIM}Select your reverse proxy:${NC}"
        echo ""
        echo -e "    ${BOLD}1)${NC} ${CYAN}Caddy${NC}       — Auto HTTPS (recommended for single server)"
        echo -e "    ${BOLD}2)${NC} ${CYAN}Traefik${NC}     — I have Traefik running"
        echo -e "    ${BOLD}3)${NC} ${CYAN}Nginx${NC}       — I have Nginx running"
        echo -e "    ${BOLD}4)${NC} ${CYAN}None${NC}        — External proxy (port 3000)"
        echo ""
        read -p "  Choice [1-4]: " PROXY_CHOICE

        case $PROXY_CHOICE in
            1) PROXY="caddy" ;;
            2) PROXY="traefik" ;;
            3) PROXY="nginx" ;;
            4) PROXY="none" ;;
            *) fail "Invalid choice"; exit 1 ;;
        esac
    fi

    # Traefik specifics
    if [ "$PROXY" = "traefik" ]; then
        if [ -z "$TRAEFIK_NETWORK" ]; then
            TRAEFIK_NETWORK=$(docker inspect traefik --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' 2>/dev/null | grep -E 'traefik|proxy|web' | head -1)
            TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-$(docker network ls --filter "name=traefik" --format '{{.Name}}' | head -1)}
            TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}
        fi
        TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT:-websecure}
        TRAEFIK_CONSTRAINT_LABEL=${TRAEFIK_CONSTRAINT_LABEL:-traefik-public}
        if [ -z "$TRAEFIK_CERT_RESOLVER" ]; then
            TRAEFIK_CERT_RESOLVER=$(docker inspect traefik --format='{{json .Config.Cmd}}' 2>/dev/null | grep -oP 'certificatesresolvers\.\K[^.]+' | head -1 || true)
            TRAEFIK_CERT_RESOLVER=${TRAEFIK_CERT_RESOLVER:-letsencrypt}
        fi
        ok "Network: $TRAEFIK_NETWORK"
        ok "Entrypoint: $TRAEFIK_ENTRYPOINT"
        ok "Cert resolver: $TRAEFIK_CERT_RESOLVER"
    fi
}

# ═══════════════════════════════════════════════════════════════
#  3. GENERATE SECRETS
# ═══════════════════════════════════════════════════════════════

generate_secrets() {
    step "Step 3/7 — Generating Cryptographic Secrets"

    AUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    MINIO_USER=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    MINIO_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    ENCRYPTION_KEY=$(openssl rand -base64 32)

    ok "AUTH_SECRET — 256-bit JWT signing key"
    ok "POSTGRES_PASSWORD — 192-bit database password"
    ok "MINIO credentials — generated"
    ok "ENCRYPTION_KEY — AES-256 for data at rest"
}

# ═══════════════════════════════════════════════════════════════
#  4. ADMIN USER
# ═══════════════════════════════════════════════════════════════

configure_admin() {
    step "Step 4/7 — Admin Account"

    # Company name
    if [ -z "$COMPANY_NAME" ] && [ -t 0 ]; then
        read -p "  Company name [RIBOTFLOW]: " COMPANY_NAME
    fi
    COMPANY_NAME=${COMPANY_NAME:-RIBOTFLOW}

    # Email with validation
    if [ -z "$ADMIN_EMAIL" ] && [ -t 0 ]; then
        while true; do
            read -p "  Admin email (e.g., admin@yourdomain.com): " ADMIN_EMAIL
            if [[ "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                break
            fi
            fail "Invalid email format. Must contain @ and a valid domain."
            ADMIN_EMAIL=""
        done
    fi
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@$DOMAIN}

    # Password with strength check
    if [ -z "$ADMIN_PASSWORD" ]; then
        if [ -t 0 ]; then
            while true; do
                read -s -p "  Admin password (min 8 chars): " ADMIN_PASSWORD
                echo ""
                local strength=0
                [ ${#ADMIN_PASSWORD} -ge 8 ] && strength=$((strength + 1))
                [ ${#ADMIN_PASSWORD} -ge 12 ] && strength=$((strength + 1))
                [[ "$ADMIN_PASSWORD" =~ [A-Z] ]] && strength=$((strength + 1))
                [[ "$ADMIN_PASSWORD" =~ [0-9] ]] && strength=$((strength + 1))
                [[ "$ADMIN_PASSWORD" =~ [^a-zA-Z0-9] ]] && strength=$((strength + 1))

                if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
                    fail "Password must be at least 8 characters."
                else
                    local label="" color=""
                    case $strength in
                        1|2) label="WEAK"; color="${RED}" ;;
                        3)   label="FAIR"; color="${YELLOW}" ;;
                        4)   label="GOOD"; color="${CYAN}" ;;
                        5)   label="STRONG"; color="${GREEN}" ;;
                    esac
                    echo -e "  ${ARROW} Strength: ${color}${BOLD}${label}${NC}"

                    read -s -p "  Confirm password: " ADMIN_PASSWORD_CONFIRM
                    echo ""
                    if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then
                        break
                    else
                        fail "Passwords do not match. Try again."
                        ADMIN_PASSWORD=""
                    fi
                fi
            done
        else
            fail "ADMIN_PASSWORD is required in non-interactive mode."
            exit 1
        fi
    else
        ok "Password: (from env var)"
    fi

    ok "Company: ${BOLD}$COMPANY_NAME${NC}"
    ok "Admin:   ${BOLD}$ADMIN_EMAIL${NC}"
}

# ═══════════════════════════════════════════════════════════════
#  5. SMTP CONFIGURATION (Optional)
# ═══════════════════════════════════════════════════════════════

configure_smtp() {
    step "Step 5/7 — Email (SMTP) ${DIM}[Optional]${NC}"

    SMTP_ENV=""
    if [ -n "$SMTP_HOST" ]; then
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
        ok "SMTP: $SMTP_HOST:$SMTP_PORT"
    elif [ -t 0 ]; then
        echo -e "  ${DIM}Configure email notifications (optional):${NC}"
        echo ""
        read -p "  Configure SMTP? [y/N]: " CONFIGURE_SMTP
        if [[ $CONFIGURE_SMTP =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "    ${BOLD}1)${NC} Gmail       ${DIM}(smtp.gmail.com:465)${NC}"
            echo -e "    ${BOLD}2)${NC} Brevo       ${DIM}(smtp.brevo.com:587)${NC}"
            echo -e "    ${BOLD}3)${NC} Mailgun     ${DIM}(smtp.mailgun.org:587)${NC}"
            echo -e "    ${BOLD}4)${NC} Hostinger   ${DIM}(smtp.hostinger.com:465)${NC}"
            echo -e "    ${BOLD}5)${NC} Custom"
            echo ""
            read -p "  Provider [1-5]: " SMTP_PROVIDER

            case $SMTP_PROVIDER in
                1) SMTP_HOST="smtp.gmail.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
                2) SMTP_HOST="smtp.brevo.com"; SMTP_PORT="587"; SMTP_SECURE="false" ;;
                3) SMTP_HOST="smtp.mailgun.org"; SMTP_PORT="587"; SMTP_SECURE="false" ;;
                4) SMTP_HOST="smtp.hostinger.com"; SMTP_PORT="465"; SMTP_SECURE="true" ;;
                5)
                    read -p "  SMTP Host: " SMTP_HOST
                    read -p "  SMTP Port [587]: " SMTP_PORT
                    SMTP_PORT=${SMTP_PORT:-587}
                    read -p "  SSL? (true/false) [false]: " SMTP_SECURE
                    SMTP_SECURE=${SMTP_SECURE:-false}
                    ;;
            esac

            read -p "  SMTP Username: " SMTP_USER
            read -s -p "  SMTP Password: " SMTP_PASSWORD
            echo ""
            read -p "  From email (noreply@$DOMAIN): " SMTP_FROM
            SMTP_FROM=${SMTP_FROM:-"noreply@$DOMAIN"}

            SMTP_ENV="
# SMTP Configuration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM"
            ok "SMTP: $SMTP_HOST:$SMTP_PORT"
        else
            warn "Skipped. Configure later in Settings > Email."
        fi
    else
        warn "Skipped. Set SMTP_HOST env var or configure later."
    fi
}

# ═══════════════════════════════════════════════════════════════
#  6. CREATE .ENV FILE
# ═══════════════════════════════════════════════════════════════

create_env() {
    step "Step 6/7 — Writing Configuration"

    docker compose -f docker-compose.prod.yml down 2>/dev/null || true

    # Write .env using printf to avoid heredoc expansion issues
    printf '%s\n' \
        "# ═══════════════════════════════════════════" \
        "# RIBOTFLOW - Production Environment" \
        "# Generated by install.sh on $(date -u '+%Y-%m-%d %H:%M:%S UTC')" \
        "# ═══════════════════════════════════════════" \
        "" \
        "# Auth" \
        "AUTH_SECRET=$AUTH_SECRET" \
        "AUTH_TRUST_HOST=true" \
        "AUTH_URL=https://$DOMAIN" \
        "" \
        "# Database" \
        "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
        "DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@db:5432/ribotflow" \
        "" \
        "# App" \
        "DOMAIN=$DOMAIN" \
        "NEXT_PUBLIC_APP_URL=https://$DOMAIN" \
        "NEXT_PUBLIC_APP_MODE=self_hosted" \
        "NODE_ENV=production" \
        "RUN_MIGRATIONS=true" \
        "" \
        "# Admin" \
        "COMPANY_NAME=$COMPANY_NAME" \
        "ADMIN_EMAIL=$ADMIN_EMAIL" \
        "ADMIN_PASSWORD=$ADMIN_PASSWORD" \
        "" \
        "# MinIO" \
        "MINIO_ROOT_USER=$MINIO_USER" \
        "MINIO_ROOT_PASSWORD=$MINIO_PASSWORD" \
        "MINIO_ACCESS_KEY=$MINIO_USER" \
        "MINIO_SECRET_KEY=$MINIO_PASSWORD" \
        "MINIO_ENDPOINT=minio" \
        "MINIO_PORT=9000" \
        "MINIO_BUCKET=ribotflow-uploads" \
        "MINIO_USE_SSL=false" \
        "" \
        "# Storage" \
        "STORAGE_PROVIDER=minio" \
        "" \
        "# Traefik" \
        "TRAEFIK_NETWORK=${TRAEFIK_NETWORK:-traefik-public}" \
        "TRAEFIK_ENTRYPOINT=${TRAEFIK_ENTRYPOINT:-websecure}" \
        "TRAEFIK_CERT_RESOLVER=${TRAEFIK_CERT_RESOLVER:-letsencrypt}" \
        "TRAEFIK_CONSTRAINT_LABEL=${TRAEFIK_CONSTRAINT_LABEL:-traefik-public}" \
        "" \
        "# Encryption (AES-256-GCM for SMTP passwords at rest)" \
        "ENCRYPTION_KEY=$ENCRYPTION_KEY" \
        "$SMTP_ENV" > .env

    chmod 600 .env
    ok ".env created (permissions: 600 — owner-only read/write)"
}

# ═══════════════════════════════════════════════════════════════
#  7. START SERVICES
# ═══════════════════════════════════════════════════════════════

start_services() {
    step "Step 7/7 — Starting Services"

    # Save compose profile for manage.sh
    case $PROXY in
        caddy)   echo "COMPOSE_FILES='-f docker-compose.prod.yml -f docker-compose.caddy.yml'" > .compose-profile ;;
        traefik) echo "COMPOSE_FILES='-f docker-compose.prod.yml -f docker-compose.traefik.yml'" > .compose-profile ;;
        *)       echo "COMPOSE_FILES='-f docker-compose.prod.yml'" > .compose-profile ;;
    esac

    mkdir -p uploads

    info "Building application image..."
    docker compose -f docker-compose.prod.yml build
    ok "Image built"

    case $PROXY in
        caddy)
            info "Starting with Caddy (auto HTTPS)..."
            docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml up -d
            ;;
        traefik)
            info "Starting with Traefik..."
            docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml up -d
            info "Restarting Traefik to pick up new labels..."
            docker restart traefik 2>/dev/null || true
            ;;
        nginx)
            info "Starting (configure Nginx separately)..."
            docker compose -f docker-compose.prod.yml up -d
            ;;
        none)
            info "Starting (port 3000 exposed)..."
            docker compose -f docker-compose.prod.yml up -d
            ;;
    esac

    ok "Containers launched"
}

# ═══════════════════════════════════════════════════════════════
#  WAIT & VERIFY
# ═══════════════════════════════════════════════════════════════

wait_and_verify() {
    step "Health Check"

    info "Waiting for application to initialize..."
    local retries=0
    local max_retries=20

    while [ $retries -lt $max_retries ]; do
        if docker compose -f docker-compose.prod.yml ps app 2>/dev/null | grep -q "healthy\|Up"; then
            break
        fi
        sleep 2
        retries=$((retries + 1))
        echo -ne "\r  ${DIM}● Waiting... ($retries/$max_retries)${NC}  "
    done
    echo ""

    if docker compose -f docker-compose.prod.yml ps app 2>/dev/null | grep -q "Up"; then
        ok "Application is running"
    else
        warn "Application might still be starting."
        echo "     Check: docker compose -f docker-compose.prod.yml logs -f app"
    fi

    # HTTPS check for Traefik/Caddy
    if [ "$PROXY" = "traefik" ] || [ "$PROXY" = "caddy" ]; then
        info "Verifying HTTPS..."
        sleep 5
        if curl -sk -L --max-time 10 "https://$DOMAIN" 2>/dev/null | grep -q "html\|RIBOTFLOW"; then
            ok "HTTPS working: https://$DOMAIN"
        else
            warn "HTTPS not ready yet. SSL certificate may take a moment."
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════
#  SECURITY SUMMARY
# ═══════════════════════════════════════════════════════════════

print_security_summary() {
    step "Security Summary"

    ok ".env file permissions: 600 (owner-only)"
    ok "AUTH_SECRET: 256-bit random key"
    ok "Database password: 192-bit random"
    ok "Admin password: hashed with bcrypt (12 rounds)"
    ok "AUTH_TRUST_HOST: enabled for reverse proxy"
    ok "AUTH_URL: configured for JWT verification"
    echo ""
    info "Post-install recommendations:"
    echo -e "     ${DIM}• Enable UFW: ufw allow 22,80,443 && ufw enable${NC}"
    echo -e "     ${DIM}• Restrict SSH: PermitRootLogin prohibit-password${NC}"
    echo -e "     ${DIM}• Enable auto-updates: apt install unattended-upgrades${NC}"
    echo -e "     ${DIM}• Change your SSH password immediately${NC}"
}

# ═══════════════════════════════════════════════════════════════
#  FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════

print_summary() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}            ${BOLD}${WHITE}Installation Complete!${NC}                         ${CYAN}║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}"
    if [ "$PROXY" = "none" ]; then
        echo -e "${CYAN}║${NC}  ${BOLD}URL:${NC}        http://$DOMAIN:3000"
    else
        echo -e "${CYAN}║${NC}  ${BOLD}URL:${NC}        https://$DOMAIN"
    fi
    echo -e "${CYAN}║${NC}  ${BOLD}Login:${NC}      $ADMIN_EMAIL"
    echo -e "${CYAN}║${NC}  ${BOLD}Password:${NC}   [hidden — use what you entered]"
    echo -e "${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${DIM}─── Services ───────────────────────────────────${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Database:${NC}   PostgreSQL 16"
    echo -e "${CYAN}║${NC}  ${BOLD}Storage:${NC}    MinIO (S3-compatible)"
    echo -e "${CYAN}║${NC}  ${BOLD}Proxy:${NC}      $PROXY"
    echo -e "${CYAN}║${NC}  ${BOLD}SMTP:${NC}       ${SMTP_HOST:-Not configured}"
    echo -e "${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${DIM}─── Management ─────────────────────────────────${NC}"
    echo -e "${CYAN}║${NC}  ${DIM}docker compose -f docker-compose.prod.yml logs -f app${NC}"
    echo -e "${CYAN}║${NC}  ${DIM}docker compose -f docker-compose.prod.yml ps${NC}"
    echo -e "${CYAN}║${NC}  ${DIM}docker compose -f docker-compose.prod.yml restart${NC}"
    echo -e "${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════

main() {
    print_banner
    preflight_checks
    security_checks
    configure_domain
    configure_proxy
    generate_secrets
    configure_admin
    configure_smtp
    create_env
    start_services
    wait_and_verify
    print_security_summary
    print_summary
}

main "$@"
