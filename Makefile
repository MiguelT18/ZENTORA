.PHONY: help setup start stop restart clean format lint test logs build

# Variables
DOCKER_COMPOSE = docker compose

help: ## Mostrar este mensaje de ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Configurar el proyecto por primera vez
	@./scripts/setup.sh

start: ## Iniciar todos los servicios
	$(DOCKER_COMPOSE) up -d

stop: ## Detener todos los servicios
	$(DOCKER_COMPOSE) down

restart: stop start ## Reiniciar todos los servicios

clean: ## Limpiar contenedores, imágenes y volúmenes no utilizados
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

build: ## Reconstruir todos los servicios
	$(DOCKER_COMPOSE) build --no-cache

format: ## Formatear código (frontend y backend)
	@./scripts/format.sh

lint: ## Ejecutar linters (frontend y backend)
	@./scripts/lint.sh

test: ## Ejecutar tests (frontend y backend)
	@./scripts/test.sh

logs: ## Ver logs de todos los servicios
	$(DOCKER_COMPOSE) logs -f

frontend-shell: ## Acceder al shell del contenedor frontend
	$(DOCKER_COMPOSE) exec frontend /bin/sh

backend-shell: ## Acceder al shell del contenedor backend
	$(DOCKER_COMPOSE) exec backend /bin/sh

nginx-shell: ## Acceder al shell del contenedor nginx
	$(DOCKER_COMPOSE) exec nginx /bin/sh

dev-frontend: ## Iniciar solo el frontend en modo desarrollo
	cd apps/frontend && bun run dev

dev-backend: ## Iniciar solo el backend en modo desarrollo
	cd apps/backend && poetry run uvicorn app.main:app --reload

install-frontend: ## Instalar dependencias del frontend
	cd apps/frontend && bun install

install-backend: ## Instalar dependencias del backend
	cd apps/backend && poetry install
