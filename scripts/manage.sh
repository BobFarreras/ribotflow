#!/bin/bash
# ==========================================
# RIBOTFLOW - Management Script
# Usage: ./manage.sh [start|stop|restart|logs|status|update|backup|restore|shell|db]
# ==========================================
set -e

# ─── Colors & Formatting ───────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Symbols ────────────────────────────────────────────────────
ARROW="${CYAN}▸${NC}"
CHECK="${GREEN}✓${NC}"
WARN="${YELLOW}⚠${NC}"
LINE="${DIM}──────────────────────────────────────────────────────────${NC}"

# ─── Detect Compose Files ──────────────────────────────────────
if [ -f ".compose-profile" ]; then
    source .compose-profile
    COMPOSE="docker compose $COMPOSE_FILES"
elif [ -f "docker-compose.caddy.yml" ] && grep -q "caddy" docker-compose.caddy.yml 2>/dev/null; then
    COMPOSE="docker compose -f docker-compose.prod.yml -f docker-compose.caddy.yml"
elif [ -f "docker-compose.traefik.yml" ] && grep -q "traefik" docker-compose.traefik.yml 2>/dev/null; then
    COMPOSE="docker compose -f docker-compose.prod.yml -f docker-compose.traefik.yml"
else
    COMPOSE="docker compose -f docker-compose.prod.yml"
fi

# ─── Commands ───────────────────────────────────────────────────

show_help() {
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
    echo -e "  ${DIM}Management CLI${NC}"
    echo ""
    echo -e "  ${BOLD}Usage:${NC} ./manage.sh [command]"
    echo ""
    echo -e "  ${BOLD}Commands:${NC}"
    echo -e "    ${CYAN}start${NC}     Start all services"
    echo -e "    ${CYAN}stop${NC}      Stop all services"
    echo -e "    ${CYAN}restart${NC}   Restart all services"
    echo -e "    ${CYAN}logs${NC}      View application logs"
    echo -e "    ${CYAN}status${NC}    Show service status"
    echo -e "    ${CYAN}update${NC}    Pull latest and rebuild"
    echo -e "    ${CYAN}backup${NC}    Create manual database backup"
    echo -e "    ${CYAN}restore${NC}   Restore from backup"
    echo -e "    ${CYAN}shell${NC}     Open app shell"
    echo -e "    ${CYAN}db${NC}        Open database shell"
    echo ""
}

start() {
    echo -e "\n${BOLD}${BLUE}  ◈ Starting RIBOTFLOW${NC}"
    echo -e "${DIM}${LINE}${NC}"
    $COMPOSE up -d
    echo -e "  ${CHECK} ${GREEN}Services started${NC}\n"
}

stop() {
    echo -e "\n${BOLD}${BLUE}  ◈ Stopping RIBOTFLOW${NC}"
    echo -e "${DIM}${LINE}${NC}"
    $COMPOSE down
    echo -e "  ${CHECK} ${GREEN}Services stopped${NC}\n"
}

restart() {
    echo -e "\n${BOLD}${BLUE}  ◈ Restarting RIBOTFLOW${NC}"
    echo -e "${DIM}${LINE}${NC}"
    $COMPOSE restart
    echo -e "  ${CHECK} ${GREEN}Services restarted${NC}\n"
}

logs() {
    $COMPOSE logs -f app
}

status() {
    echo -e "\n${BOLD}${BLUE}  ◈ RIBOTFLOW Service Status${NC}"
    echo -e "${DIM}${LINE}${NC}"
    echo ""
    $COMPOSE ps
    echo ""
}

update() {
    echo -e "\n${BOLD}${BLUE}  ◈ Updating RIBOTFLOW${NC}"
    echo -e "${DIM}${LINE}${NC}"
    echo ""
    echo -e "  ${ARROW} Pulling latest image..."
    $COMPOSE pull
    echo ""
    echo -e "  ${ARROW} Restarting containers..."
    $COMPOSE up -d
    echo ""
    echo -e "  ${CHECK} ${GREEN}Update complete!${NC}\n"
}

backup() {
    echo -e "\n${BOLD}${BLUE}  ◈ Creating Database Backup${NC}"
    echo -e "${DIM}${LINE}${NC}"

    mkdir -p ./backups

    # Source environment variables
    source .env 2>/dev/null || true

    BACKUP_NAME="ribotflow_$(date +%Y%m%d_%H%M%S).sql.gz"

    $COMPOSE exec -T db pg_dump -U postgres ribotflow | gzip > "./backups/$BACKUP_NAME"

    echo -e "  ${CHECK} ${GREEN}Backup created: $BACKUP_NAME${NC}"
    echo -e "  ${DIM}Size: $(du -h "./backups/$BACKUP_NAME" | cut -f1)${NC}\n"
}

restore() {
    echo -e "\n${BOLD}${BLUE}  ◈ Restore from Backup${NC}"
    echo -e "${DIM}${LINE}${NC}"
    echo ""
    echo -e "  ${WARN} ${YELLOW}Available backups:${NC}"
    echo ""
    ls -la ./backups/*.sql.gz 2>/dev/null || echo -e "  ${DIM}No backups found${NC}"
    echo ""

    read -p "  Enter backup filename: " BACKUP_FILE

    if [ ! -f "./backups/$BACKUP_FILE" ]; then
        echo -e "  ${RED}✗ Backup file not found${NC}\n"
        exit 1
    fi

    echo ""
    echo -e "  ${WARN} ${RED}This will OVERWRITE the current database!${NC}"
    read -p "  Are you sure? (yes/no): " CONFIRM

    if [ "$CONFIRM" = "yes" ]; then
        echo -e "\n  ${ARROW} Restoring from $BACKUP_FILE..."
        gunzip < "./backups/$BACKUP_FILE" | $COMPOSE exec -T db psql -U postgres ribotflow
        echo -e "  ${CHECK} ${GREEN}Restore complete!${NC}\n"
    else
        echo -e "  ${DIM}Restore cancelled.${NC}\n"
    fi
}

shell() {
    $COMPOSE exec app sh
}

db_shell() {
    $COMPOSE exec db psql -U postgres ribotflow
}

# ─── Main ───────────────────────────────────────────────────────
case "${1:-help}" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    logs)    logs ;;
    status)  status ;;
    update)  update ;;
    backup)  backup ;;
    restore) restore ;;
    shell)   shell ;;
    db)      db_shell ;;
    *)       show_help ;;
esac
