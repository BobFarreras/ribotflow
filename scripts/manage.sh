#!/bin/bash
# ==========================================
# RIBOTFLOW - Management Script
# Usage: ./manage.sh [start|stop|restart|logs|status|update|backup]
# ==========================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect which compose files to use
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

show_help() {
    echo ""
    echo "RIBOTFLOW Management Script"
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      View application logs"
    echo "  status    Show service status"
    echo "  update    Pull latest and rebuild"
    echo "  backup    Create manual database backup"
    echo "  restore   Restore from backup"
    echo "  shell     Open app shell"
    echo "  db        Open database shell"
    echo ""
}

start() {
    echo -e "${BLUE}Starting RIBOTFLOW...${NC}"
    $COMPOSE up -d
    echo -e "${GREEN}✓ Services started${NC}"
}

stop() {
    echo -e "${BLUE}Stopping RIBOTFLOW...${NC}"
    $COMPOSE down
    echo -e "${GREEN}✓ Services stopped${NC}"
}

restart() {
    echo -e "${BLUE}Restarting RIBOTFLOW...${NC}"
    $COMPOSE restart
    echo -e "${GREEN}✓ Services restarted${NC}"
}

logs() {
    $COMPOSE logs -f app
}

status() {
    echo -e "${BLUE}RIBOTFLOW Service Status${NC}"
    echo ""
    $COMPOSE ps
}

update() {
    echo -e "${BLUE}Updating RIBOTFLOW...${NC}"
    echo ""
    
    # Pull latest code
    echo "Pulling latest code..."
    git pull origin main
    
    # Rebuild and restart
    echo "Rebuilding containers..."
    $COMPOSE up -d --build
    
    echo ""
    echo -e "${GREEN}✓ Update complete!${NC}"
}

backup() {
    echo -e "${BLUE}Creating database backup...${NC}"
    
    # Source environment variables
    source .env.local 2>/dev/null || true
    
    BACKUP_NAME="ribotflow_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    $COMPOSE exec -T db pg_dump -U postgres ribotflow | gzip > "./backups/$BACKUP_NAME"
    
    echo -e "${GREEN}✓ Backup created: $BACKUP_NAME${NC}"
    echo "  Size: $(du -h "./backups/$BACKUP_NAME" | cut -f1)"
}

restore() {
    echo -e "${YELLOW}Available backups:${NC}"
    echo ""
    ls -la ./backups/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    
    read -p "Enter backup filename: " BACKUP_FILE
    
    if [ ! -f "./backups/$BACKUP_FILE" ]; then
        echo -e "${RED}Backup file not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠ This will OVERWRITE the current database!${NC}"
    read -p "Are you sure? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        echo -e "${BLUE}Restoring from $BACKUP_FILE...${NC}"
        gunzip < "./backups/$BACKUP_FILE" | $COMPOSE exec -T db psql -U postgres ribotflow
        echo -e "${GREEN}✓ Restore complete!${NC}"
    else
        echo "Restore cancelled."
    fi
}

shell() {
    $COMPOSE exec app sh
}

db_shell() {
    $COMPOSE exec db psql -U postgres ribotflow
}

# Main command handler
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
