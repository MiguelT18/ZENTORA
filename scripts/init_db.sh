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

# Intentar las migraciones con reintentos
max_attempts=3
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker compose run --rm backend bash -c "cd /app && poetry install && poetry run alembic upgrade head"; then
        echo -e "${GREEN}✅ Migraciones aplicadas correctamente!${NC}"
        break
    else
        echo -e "${RED}⚠️ Intento $attempt de $max_attempts falló${NC}"
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ No se pudieron aplicar las migraciones después de $max_attempts intentos${NC}"
            exit 1
        fi
        echo -e "${BLUE}🔄 Esperando antes de reintentar...${NC}"
        sleep 5
        attempt=$((attempt + 1))
    fi
done

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo -e "${GREEN}🎉 Puedes iniciar todos los servicios con:${NC} make start"
