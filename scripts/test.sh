#!/bin/bash

echo "🧪 Ejecutando tests..."

# Frontend
echo "📱 Testing Frontend..."
cd apps/frontend && bun run test

# Backend
echo "🔧 Testing Backend..."
cd ../backend && poetry run pytest

echo "✅ Tests completados!"
