#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Cotents - Deploy Script
#  Usage:
#    bash deploy.sh           → full deploy (build + start)
#    bash deploy.sh start     → start existing containers
#    bash deploy.sh stop      → stop all containers
#    bash deploy.sh restart   → restart all containers
#    bash deploy.sh logs      → tail all logs
#    bash deploy.sh status    → show container status
#    bash deploy.sh update    → pull latest + rebuild + restart
# ═══════════════════════════════════════════════════════════

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

banner() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  🚀  Cotents Deployment${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

check_env() {
  if [ ! -f ".env" ]; then
    echo -e "${RED}❌  .env file not found!${NC}"
    echo -e "${YELLOW}    Copy .env.production to .env and fill in your values:${NC}"
    echo -e "    cp .env.production .env && nano .env"
    exit 1
  fi

  # Load env
  set -a; source .env; set +a

  # Check required secrets
  MISSING=0
  for VAR in JWT_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY; do
    val="${!VAR}"
    if [ -z "$val" ] || [[ "$val" == *"CHANGE_THIS"* ]]; then
      echo -e "${RED}❌  $VAR is not set in .env${NC}"
      MISSING=1
    fi
  done

  if [ "$MISSING" -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Generate secure secrets with:${NC}"
    echo "  openssl rand -hex 32"
    exit 1
  fi

  echo -e "${GREEN}✅  Environment validated${NC}"
}

generate_secrets() {
  echo -e "${BLUE}Generating secure secrets...${NC}"
  JWT_S=$(openssl rand -hex 32)
  JWT_R=$(openssl rand -hex 32)
  ENC_K=$(openssl rand -hex 16)
  DB_P=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  echo ""
  echo -e "${YELLOW}Add these to your .env file:${NC}"
  echo "JWT_SECRET=${JWT_S}"
  echo "JWT_REFRESH_SECRET=${JWT_R}"
  echo "ENCRYPTION_KEY=${ENC_K}"
  echo "DB_PASSWORD=${DB_P}"
  echo ""
}

CMD="${1:-deploy}"

banner

case "$CMD" in

  deploy)
    check_env
    echo -e "${BLUE}Building and starting all services...${NC}"
    echo ""
    docker compose pull postgres 2>/dev/null || true
    docker compose build --no-cache
    docker compose up -d
    echo ""
    echo -e "${GREEN}✅  Deployment complete!${NC}"
    echo ""
    echo -e "  Frontend : ${CYAN}http://localhost${NC}"
    echo -e "  API      : ${CYAN}http://localhost/api${NC}"
    echo -e "  Health   : ${CYAN}http://localhost/health${NC}"
    echo ""
    echo -e "${YELLOW}Watching logs (Ctrl+C to exit)...${NC}"
    docker compose logs -f --tail=50
    ;;

  start)
    check_env
    echo -e "${BLUE}Starting containers...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅  Started${NC}"
    docker compose ps
    ;;

  stop)
    echo -e "${YELLOW}Stopping containers...${NC}"
    docker compose down
    echo -e "${GREEN}✅  Stopped${NC}"
    ;;

  restart)
    check_env
    echo -e "${YELLOW}Restarting containers...${NC}"
    docker compose restart
    echo -e "${GREEN}✅  Restarted${NC}"
    docker compose ps
    ;;

  update)
    check_env
    echo -e "${BLUE}Pulling latest code and rebuilding...${NC}"
    git pull 2>/dev/null || true
    docker compose build --no-cache
    docker compose up -d --force-recreate
    echo -e "${GREEN}✅  Updated and restarted${NC}"
    docker compose ps
    ;;

  logs)
    SERVICE="${2:-}"
    if [ -n "$SERVICE" ]; then
      docker compose logs -f --tail=100 "$SERVICE"
    else
      docker compose logs -f --tail=50
    fi
    ;;

  status)
    echo -e "${BLUE}Container status:${NC}"
    docker compose ps
    echo ""
    echo -e "${BLUE}Resource usage:${NC}"
    docker stats --no-stream --format \
      "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
      cotents_frontend cotents_backend cotents_postgres 2>/dev/null || true
    ;;

  secrets)
    generate_secrets
    ;;

  db-shell)
    echo -e "${BLUE}Connecting to database...${NC}"
    docker compose exec postgres psql -U "${DB_USER:-cotents}" -d "${DB_NAME:-cotents_db}"
    ;;

  db-backup)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backup_${TIMESTAMP}.sql"
    echo -e "${BLUE}Creating backup: ${BACKUP_FILE}${NC}"
    docker compose exec -T postgres pg_dump \
      -U "${DB_USER:-cotents}" "${DB_NAME:-cotents_db}" > "$BACKUP_FILE"
    echo -e "${GREEN}✅  Backup saved: ${BACKUP_FILE}${NC}"
    ;;

  *)
    echo "Usage: bash deploy.sh [deploy|start|stop|restart|update|logs|status|secrets|db-shell|db-backup]"
    exit 1
    ;;
esac
