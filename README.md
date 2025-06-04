# ZENTORA

## 🚀 Configuración Inicial

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Poetry](https://python-poetry.org/docs/#installation)
- [Bun](https://bun.sh/) (opcional, solo necesario para desarrollo frontend local)

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/ZENTORA.git
   cd ZENTORA
   ```

2. Ejecutar el script de configuración:
   ```bash
   make setup
   ```
   Este comando:
   - Instala las dependencias del frontend (si Bun está instalado)
   - Instala las dependencias del backend con Poetry
   - Crea el archivo `.env` con la configuración por defecto
   - Inicia los servicios de Docker (PostgreSQL y Redis)
   - Configura la base de datos y aplica las migraciones

3. Iniciar todos los servicios:
   ```bash
   make start
   ```

### Comandos Útiles

- `make help` - Muestra todos los comandos disponibles
- `make start` - Inicia todos los servicios
- `make stop` - Detiene todos los servicios
- `make restart` - Reinicia todos los servicios
- `make logs` - Muestra los logs de todos los servicios

### Desarrollo Local

#### Frontend
```bash
make dev-frontend-local  # Inicia el frontend en modo desarrollo local
```

#### Backend
```bash
make dev-backend-local   # Inicia el backend en modo desarrollo local
```

### Estructura del Proyecto

```
ZENTORA/
├── apps/
│   ├── frontend/        # Aplicación frontend (Bun + React)
│   └── backend/         # API backend (FastAPI)
├── scripts/            # Scripts de utilidad
├── docker/            # Configuraciones de Docker
└── docker-compose.yml  # Configuración de servicios
```

### Solución de Problemas

#### Error de DNS al ejecutar `make setup`
Si encuentras errores de DNS al ejecutar `make setup`, asegúrate de que:
1. Docker está corriendo correctamente
2. Los servicios de PostgreSQL y Redis están iniciados
3. La red de Docker está configurada correctamente

Si el problema persiste, puedes intentar:
```bash
docker compose down -v  # Limpia todos los contenedores y volúmenes
make setup             # Intenta la configuración nuevamente
```

### Contribuir

1. Crea un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
