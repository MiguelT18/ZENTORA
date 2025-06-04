#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configurando el proyecto...${NC}"

# Dar permisos de ejecución a los scripts
chmod +x scripts/*.sh

# Frontend
echo -e "${BLUE}📱 Instalando dependencias del Frontend...${NC}"
cd apps/frontend && bun install
cd ../..

# Backend
echo -e "${BLUE}🔧 Instalando dependencias del Backend...${NC}"
cd apps/backend && poetry install
cd ../..

# Inicializar la base de datos
echo -e "${BLUE}🗄️ Inicializando la base de datos...${NC}"
./scripts/init_db.sh

echo -e "${GREEN}✅ Configuración completada!${NC}"
