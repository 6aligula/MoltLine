#!/bin/bash
# deploy-remote.sh - Deploy desde máquina local al servidor
# Uso: ./deploy-remote.sh [all|frontend|backend]

set -e

# Configuración
SERVER="vinicionaranjo@experiment-ia"
ZONE="us-central1-c"
PROJECT_DIR="~/chat-stack"

# Colores
GREEN='\''\033[0;32m'\''
BLUE='\''\033[0;34m'\''
YELLOW='\''\033[1;33m'\''
RED='\''\033[0;31m'\''
NC='\''\033[0m'\''

DEPLOY_TYPE=${1:-all}

echo -e "${BLUE}🚀 Chat Stack - Remote Deploy${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "Server: ${YELLOW}${SERVER}${NC}"
echo -e "Type: ${YELLOW}${DEPLOY_TYPE}${NC}"
echo ""

# Push local changes to Git
echo -e "${BLUE}📤 Pushing local changes to Git...${NC}"
git add .
read -p "Commit message (Enter to skip): " COMMIT_MSG

if [ -n "$COMMIT_MSG" ]; then
    git commit -m "$COMMIT_MSG" || echo "Nothing to commit"
    git push origin modernized
    echo -e "${GREEN}✅ Changes pushed to Git${NC}"
else
    echo -e "${YELLOW}⚠ Skipping Git commit${NC}"
fi

echo ""

# Execute deploy on server
echo -e "${BLUE}🔄 Executing deploy on server...${NC}"
echo ""

gcloud compute ssh $SERVER --zone=$ZONE --command="
    cd $PROJECT_DIR && \
    bash deploy.sh $DEPLOY_TYPE
"

echo ""
echo -e "${GREEN}🎉 Remote deploy completed!${NC}"
