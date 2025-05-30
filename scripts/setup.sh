#!/bin/bash

echo "🚀 Configurando el proyecto..."

# Dar permisos de ejecución a los scripts
chmod +x scripts/*.sh

# Frontend
echo "📱 Instalando dependencias del Frontend..."
cd apps/frontend && bun install

# Backend
echo "🔧 Instalando dependencias del Backend..."
cd ../backend && poetry install

echo "✅ Configuración completada!"
