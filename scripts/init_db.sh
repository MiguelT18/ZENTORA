#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Inicializando la base de datos...${NC}"

# Cambiar al directorio del backend
cd apps/backend || exit

# Verificar si poetry está instalado
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}Poetry no está instalado. Por favor, instálalo primero.${NC}"
    echo "Puedes instalarlo con: curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

# Instalar dependencias
echo -e "${GREEN}Instalando dependencias...${NC}"
poetry install

# Ejecutar las migraciones
echo -e "${GREEN}Aplicando migraciones...${NC}"
poetry run alembic upgrade head

echo -e "${GREEN}¡Base de datos inicializada correctamente!${NC}"
