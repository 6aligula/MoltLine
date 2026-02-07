#!/bin/bash
# deploy.sh - Script de deploy automatizado para chat-stack
# Uso: ./deploy.sh [all|frontend|backend]

set -e  # Exit en caso de error

# Colores para output
GREEN='\''\033[0;32m'\''
BLUE='\''\033[0;34m'\''
YELLOW='\''\033[1;33m'\''
RED='\''\033[0;31m'\''
NC='\''\033[0m'\'' # No Color

DEPLOY_TYPE=${1:-all}

echo -e "${BLUE}🚀 Chat Stack - Deploy Automatizado${NC}"
echo -e "${BLUE}===================================${NC}"
echo -e "Tipo de deploy: ${YELLOW}${DEPLOY_TYPE}${NC}"
echo ""

# Función para deploy de backend
deploy_backend() {
    echo -e "${BLUE}📦 Deploying Backend...${NC}"
    
    # Pull latest changes
    echo "  → Pulling latest code..."
    git pull origin modernized
    
    # Rebuild and restart containers (usa prod: web-proxy, URLs producción)
    echo "  → Rebuilding Docker containers..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    # Verificar estado
    echo "  → Checking container status..."
    docker compose ps
    
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo ""
}

# Función para deploy de frontend
deploy_frontend() {
    echo -e "${BLUE}🎨 Deploying Frontend...${NC}"
    
    # Verificar si existe carpeta web
    if [ ! -d "web" ]; then
        echo -e "${RED}❌ Error: web/ directory not found${NC}"
        exit 1
    fi
    
    cd web
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        echo "  → Installing dependencies..."
        npm install
    fi
    
    # Build
    echo "  → Building frontend..."
    npm run build
    
    # Deploy to web server
    echo "  → Copying files to /var/www/chat/..."
    sudo cp -r dist/* /var/www/chat/
    
    cd ..
    
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "   🌐 https://chat.moldline.space"
    echo ""
}

# Main deploy logic
case "$DEPLOY_TYPE" in
    all)
        echo -e "${YELLOW}📋 Deploying BACKEND + FRONTEND${NC}"
        echo ""
        deploy_backend
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid deploy type '\'''\''${NC}"
        echo ""
        echo "Usage: ./deploy.sh [all|frontend|backend]"
        echo "  all       - Deploy both backend and frontend (default)"
        echo "  backend   - Deploy only backend services"
        echo "  frontend  - Deploy only frontend (web app)"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deploy completed successfully!${NC}"
