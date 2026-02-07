#!/bin/bash
# Deploy MoldLine API a Google Cloud Run
# Build con Cloud Build (2500 min/mes gratis) + deploy
# Requiere: gcloud CLI, autenticado (gcloud auth login)

set -e

PROJECT_ID="senderos-dev"
REGION="europe-southwest1"
REPOSITORY="senderos-dev"
SERVICE_NAME="moldline-api"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:latest"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Deploying MoldLine API to Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"
echo "   Service: ${SERVICE_NAME}"
echo ""

# Crear repositorio si no existe
echo "📦 Verificando Artifact Registry..."
gcloud artifacts repositories describe ${REPOSITORY} \
  --location=${REGION} \
  --project=${PROJECT_ID} 2>/dev/null || \
gcloud artifacts repositories create ${REPOSITORY} \
  --repository-format=docker \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --description="MoldLine containers"

# Build y push con Cloud Build
echo ""
echo "🔨 Building image (Cloud Build)..."
gcloud builds submit \
  --tag "${IMAGE_NAME}" \
  --project ${PROJECT_ID} \
  .

# Deploy a Cloud Run
echo ""
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image "${IMAGE_NAME}" \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --platform managed \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --port 8080

echo ""
echo "✅ Deploy completado!"
URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format='value(status.url)')
echo ""
echo "🌐 API URL: ${URL}"
echo "   Para el frontend .env: VITE_API_BASE_URL=${URL}  VITE_WS_URL=${URL/https/wss}"
