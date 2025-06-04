#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configurando el proyecto...${NC}"

# Dar permisos de ejecución a los scripts
chmod +x scripts/*.sh

# Verificar si bun está instalado
if ! command -v bun &> /dev/null; then
    echo -e "${RED}⚠️ Bun no está instalado. Saltando la instalación de dependencias del frontend.${NC}"
    echo -e "${BLUE}ℹ️ Puedes instalar Bun más tarde con:${NC}"
    echo "  curl -fsSL https://bun.sh/install | bash"
else
    # Frontend
    echo -e "${BLUE}📱 Instalando dependencias del Frontend...${NC}"
    cd apps/frontend && bun install
    cd ../..
fi

# Backend
echo -e "${BLUE}🔧 Instalando dependencias del Backend...${NC}"
cd apps/backend && poetry install
# Instalar psycopg2-binary explícitamente
poetry add psycopg2-binary
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

# Crear y aplicar el archivo env.py de Alembic con conexión síncrona
echo -e "${BLUE}📝 Configurando Alembic...${NC}"
cat > apps/backend/alembic/env.py << EOL
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection
from alembic import context

from app.core.config import settings
from app.db.base import Base
from app.db.models.user import User  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    return "postgresql://zentora:zentora@postgres:5432/zentora_db"

def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    url = get_url()
    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
EOL

# Construir la imagen del backend
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
