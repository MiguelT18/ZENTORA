#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Iniciar servicios de base de datos
echo -e "${BLUE}🐳 Iniciando servicios de base de datos...${NC}"
docker compose up -d postgres redis

# Esperar a que los servicios estén listos
echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10  # Dar tiempo a que los servicios se inicien completamente

# Crear archivo .env si no existe
if [ ! -f apps/backend/.env ]; then
    echo -e "${BLUE}📝 Creando archivo .env...${NC}"
    cat > apps/backend/.env << EOL
DATABASE_URL=postgresql://zentora:zentora@localhost:5432/zentora_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=1
ENVIRONMENT=development
EOL
fi

# Inicializar la base de datos
echo -e "${BLUE}🗄️ Inicializando la base de datos...${NC}"
cd apps/backend
poetry run alembic upgrade head
cd ../..

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo -e "${GREEN}🎉 Puedes iniciar todos los servicios con:${NC} make start"
