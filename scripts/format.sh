#!/bin/bash

echo "🎨 Formateando código..."

# Frontend
echo "📱 Formateando Frontend..."
cd apps/frontend && bun run format

# Backend
echo "🔧 Formateando Backend..."
cd ../backend && poetry run black . && poetry run isort .

echo "✅ Formateo completado!"
