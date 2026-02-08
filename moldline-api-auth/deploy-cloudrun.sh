#!/bin/bash
# Deploy MoldLine Auth API a Google Cloud Run
# Requiere: gcloud CLI, autenticado (gcloud auth login)

set -e

PROJECT_ID="${GCP_PROJECT_ID:-senderos-dev}"
REGION="${GCP_REGION:-europe-southwest1}"
REPOSITORY="${GCP_REPOSITORY:-senderos-dev}"
SERVICE_NAME="moldline-auth"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:latest"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Deploying MoldLine Auth API to Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"
echo "   Service: ${SERVICE_NAME}"
echo ""

echo "📦 Verificando Artifact Registry..."
gcloud artifacts repositories describe ${REPOSITORY} \
  --location=${REGION} \
  --project=${PROJECT_ID} 2>/dev/null || \
gcloud artifacts repositories create ${REPOSITORY} \
  --repository-format=docker \
  --location=${REGION} \
  --project=${PROJECT_ID} \
  --description="MoldLine containers"

echo ""
echo "🔨 Building image (Cloud Build)..."
gcloud builds submit \
  --tag "${IMAGE_NAME}" \
  --project ${PROJECT_ID} \
  .

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
echo "🌐 Auth API URL: ${URL}"
echo "   Endpoints: ${URL}/register, ${URL}/login, ${URL}/me, ${URL}/health"
