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

# Crear archivo .env si no existe
if [ ! -f apps/backend/.env ]; then
    echo -e "${BLUE}📝 Creando archivo .env...${NC}"
    cat > apps/backend/.env << EOL
DATABASE_URL=postgresql://zentora:zentora@postgres:5432/zentora_db
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=1
ENVIRONMENT=development
EOL
fi

# Iniciar servicios necesarios
echo -e "${BLUE}🐳 Iniciando servicios...${NC}"
docker compose up -d postgres redis

# Función para esperar a que un servicio esté listo
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    echo -e "${BLUE}⏳ Esperando a que $service esté listo...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if docker compose ps $service | grep -q "healthy"; then
            echo -e "${GREEN}✅ $service está listo!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Timeout esperando a $service${NC}"
    return 1
}

# Esperar a que los servicios estén listos
wait_for_service postgres || exit 1
wait_for_service redis || exit 1

# Construir la imagen del backend si es necesario
echo -e "${BLUE}🏗️ Construyendo imagen del backend...${NC}"
docker compose build backend

# Inicializar la base de datos
echo -e "${BLUE}🗄️ Inicializando la base de datos...${NC}"

# Ejecutar las migraciones dentro de un contenedor temporal
echo -e "${BLUE}📦 Aplicando migraciones...${NC}"
docker compose run --rm backend poetry run alembic upgrade head

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo -e "${GREEN}🎉 Puedes iniciar todos los servicios con:${NC} make start"
