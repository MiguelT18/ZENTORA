#!/bin/bash

echo "🔍 Ejecutando linters..."

# Frontend
echo "📱 Verificando Frontend..."
cd apps/frontend && bun run lint

# Backend
echo "🔧 Verificando Backend..."
cd ../backend && poetry run flake8

echo "✅ Verificación completada!"
