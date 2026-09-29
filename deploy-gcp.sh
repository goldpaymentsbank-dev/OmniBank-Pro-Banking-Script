#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue en Google Cloud Build & Google Cloud Run
# Gold Payments Bank (Next.js 15 Standalone en Puerto 3000)
# ==============================================================================

set -e

# Obtener o solicitar el ID de Proyecto de Google Cloud
GCP_PROJECT="${1:-$GCP_PROJECT}"

if [ -z "$GCP_PROJECT" ]; then
  # Intentar obtener el proyecto configurado actualmente en gcloud
  GCP_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -z "$GCP_PROJECT" ] || [ "$GCP_PROJECT" = "(unset)" ]; then
  echo "Error: Debes especificar el ID de tu proyecto de Google Cloud."
  echo "Uso: ./deploy-gcp.sh TU_PROYECTO_GCP"
  echo "O configúralo con: gcloud config set project TU_PROYECTO_GCP"
  exit 1
fi

echo "=========================================================="
echo "Iniciando despliegue de Gold Payments Bank..."
echo "Proyecto GCP: $GCP_PROJECT"
echo "Servicio Cloud Run: gold-payments-bank"
echo "Puerto: 3000"
echo "=========================================================="

echo "[1/2] Compilando imagen de contenedor con Google Cloud Build..."
gcloud builds submit --tag "gcr.io/${GCP_PROJECT}/gold-payments-bank" --project "$GCP_PROJECT"

echo "[2/2] Desplegando en Google Cloud Run..."
gcloud run deploy gold-payments-bank \
  --image "gcr.io/${GCP_PROJECT}/gold-payments-bank" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --region us-east1 \
  --project "$GCP_PROJECT"

echo "=========================================================="
echo "¡Despliegue completado exitosamente en Google Cloud Run!"
echo "=========================================================="
