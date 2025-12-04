#!/bin/bash

# Variables de entorno para Railway
# Ejecutar con: ./configure_railway.sh

echo "Configurando variables en Railway..."

# API (NestJS)
railway variables --service api --set PORT=3000
railway variables --service api --set DATABASE_URL="\${{Postgres.DATABASE_URL}}"
railway variables --service api --set JWT_SECRET="b6d9449d0348733f381355431636254054592938173645283940582736452839"
railway variables --service api --set AI_SERVICE_URL="\${{jarvis-service.RAILWAY_PUBLIC_DOMAIN}}"
railway variables --service api --set AWS_REGION="sa-east-1"
railway variables --service web --set BACKEND_API_URL="\${{api.RAILWAY_PUBLIC_DOMAIN}}"

# Web (Next.js)
railway variables --service web --set PORT=3000
railway variables --service web --set DATABASE_URL="\${{Postgres.DATABASE_URL}}"
railway variables --service web --set NEXTAUTH_SECRET="f8e9338d0348733f381355431636254054592938173645283940582736452839"
railway variables --service web --set NEXTAUTH_URL="\${{RAILWAY_PUBLIC_DOMAIN}}"
railway variables --service web --set BACKEND_API_URL="\${{leximetrics_ia_Full.RAILWAY_PUBLIC_DOMAIN}}"
railway variables --service web --set NEXT_PUBLIC_APP_URL="\${{RAILWAY_PUBLIC_DOMAIN}}"

# Jarvis (Python)
railway variables --service jarvis-service --set PORT=8000
railway variables --service jarvis-service --set GEMINI_API_KEY="AIzaSy..." # Placeholder, user should update if needed or I use the one from memory if safe
railway variables --service jarvis-service --set GEMINI_MODEL_NAME="gemini-1.5-flash"

echo "¡Configuración completada!"
