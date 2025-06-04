# ZENTORA

## 🚀 Descripción
ZENTORA es un proyecto moderno que utiliza una arquitectura monorepo con Next.js para el frontend y FastAPI para el backend.

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js (v20 o superior)
- Python (3.11 o superior)
- [Bun](https://bun.sh/) para gestión de paquetes del frontend
- [Poetry](https://python-poetry.org/) para gestión de paquetes del backend
- Make (opcional, pero recomendado)

## 🛠 Estructura del Proyecto

```
ZENTORA/
├── apps/
│   ├── frontend/          # Aplicación Next.js
│   └── backend/          # API FastAPI
├── infra/
│   └── docker/           # Configuraciones de Docker
│       ├── frontend/     # Dockerfile del frontend
│       ├── backend/      # Dockerfile del backend
│       └── nginx/        # Dockerfile y config de Nginx
├── scripts/              # Scripts de automatización
├── packages/             # Paquetes compartidos
└── docker-compose.yml    # Configuración de servicios
```

## 🚀 Inicio Rápido

1. **Configuración Inicial**
   ```bash
   # Este comando:
   # - Instalará todas las dependencias del frontend y backend
   # - Inicializará la base de datos automáticamente
   # - Aplicará todas las migraciones necesarias
   make setup
   ```

2. **Iniciar Servicios**
   ```bash
   make start
   ```

3. **Acceder a las Aplicaciones**
   - Frontend: http://localhost
   - API Backend: http://localhost/api
   - pgAdmin: http://localhost:5050
     - Email: admin@zentora.com
     - Password: zentora
   - RedisInsight: http://localhost:8001

## 🗄️ Base de Datos

### Configuración de pgAdmin
1. Acceder a http://localhost:5050
2. Iniciar sesión con las credenciales mencionadas arriba
3. Agregar nuevo servidor:
   - Name: ZENTORA
   - Host: postgres
   - Port: 5432
   - Database: zentora_db
   - Username: zentora
   - Password: zentora

### Configuración de RedisInsight
1. Acceder a http://localhost:8001
2. Agregar nueva conexión Redis:
   - Host: redis
   - Port: 6379
   - Name: ZENTORA-REDIS

### Migraciones
La base de datos se inicializa automáticamente cuando ejecutas `make setup`. Sin embargo, si necesitas gestionar las migraciones manualmente, puedes usar estos comandos:

```bash
# Crear nueva migración
cd apps/backend
poetry run alembic revision --autogenerate -m "descripción"

# Aplicar migraciones manualmente
poetry run alembic upgrade head

# Ver estado actual de las migraciones
poetry run alembic current

# Ver historial de migraciones
poetry run alembic history

# Inicializar la base de datos manualmente (si es necesario)
./scripts/init_db.sh
```

## 💻 Desarrollo

### Comandos Principales

```bash
# Desarrollo local
make dev-frontend    # Iniciar frontend en modo desarrollo
make dev-backend    # Iniciar backend en modo desarrollo

# Formateo y Linting
make format         # Formatear código
make lint          # Ejecutar linters

# Testing
make test          # Ejecutar tests

# Docker
make start         # Iniciar servicios
make stop          # Detener servicios
make restart       # Reiniciar servicios
make logs          # Ver logs
```

### Acceso a Contenedores

```bash
make frontend-shell    # Shell del frontend
make backend-shell     # Shell del backend
make nginx-shell       # Shell de nginx
make redis-shell      # Shell de redis
```

## 🔧 Tecnologías Principales

### Frontend
- Next.js
- TypeScript
- Bun (gestor de paquetes)
- ESLint + Prettier (2 espacios)

### Backend
- FastAPI
- Python 3.11
- Poetry (gestor de paquetes)
- Black + isort + flake8 (4 espacios)
- Redis para caché y colas de tareas

### Infraestructura
- Docker + Docker Compose
- Nginx (proxy inverso)
- Redis + RedisInsight
- Make (automatización)

## 📝 Convenciones de Código

### Frontend (TypeScript/JavaScript)
- Indentación: 2 espacios
- Formateo: Prettier
- Linting: ESLint
- Imports: absolutos desde `src/`

### Backend (Python)
- Indentación: 4 espacios
- Formateo: Black
- Ordenamiento de imports: isort
- Linting: flake8
- Tipado: mypy

## 🔍 Testing

### Frontend
```bash
cd apps/frontend
bun run test
```

### Backend
```bash
cd apps/backend
poetry run pytest
```

## 🛠 Scripts Disponibles

Ver todos los comandos disponibles:
```bash
make help
```

## 🔐 Variables de Entorno

### Frontend (.env)
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost/api
```

### Backend (.env)
```env
ENVIRONMENT=development
DEBUG=1
DATABASE_URL=postgresql://zentora:zentora@postgres:5432/zentora_db
REDIS_URL=redis://redis:6379/0
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guía de Contribución
- Sigue las convenciones de código establecidas
- Añade tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Asegúrate de que todos los tests pasen antes de hacer PR

## 🐛 Reporte de Bugs
Usa el sistema de issues de GitHub para reportar bugs:
- Describe el bug
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si aplica
- Entorno (OS, navegador, versiones)

## 📄 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte
Para soporte o preguntas, por favor usa:
- Issues de GitHub para bugs
- Discussions de GitHub para preguntas
- Pull Requests para contribuciones
