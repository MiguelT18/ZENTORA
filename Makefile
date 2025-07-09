.PHONY: help setup start stop restart clean format lint test logs build

# Variables
DOCKER_COMPOSE = docker compose

# Colores para el mensaje de ayuda
CYAN := \033[36m
YELLOW := \033[33m
GREEN := \033[32m
RESET := \033[0m
BOLD := \033[1m

help: ## Mostrar este mensaje de ayuda
	@echo "$(BOLD)🚀 ZENTORA - Comandos Disponibles:$(RESET)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Comandos de Desarrollo:$(RESET)"
	@echo "  make $(CYAN)dev-frontend$(RESET)        Iniciar solo el frontend en modo desarrollo"
	@echo "  make $(CYAN)dev-frontend-local$(RESET)  Iniciar frontend en modo desarrollo local con bun"
	@echo "  make $(CYAN)dev-backend$(RESET)         Iniciar backend y bases de datos en modo desarrollo"
	@echo "  make $(CYAN)dev-backend-local$(RESET)   Iniciar backend en modo desarrollo local"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Gestión de Servicios:$(RESET)"
	@echo "  make $(CYAN)start$(RESET)               Iniciar todos los servicios"
	@echo "  make $(CYAN)stop$(RESET)                Detener todos los servicios"
	@echo "  make $(CYAN)restart$(RESET)             Reiniciar todos los servicios"
	@echo "  make $(CYAN)logs$(RESET)                Ver logs de todos los servicios"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Herramientas de Desarrollo:$(RESET)"
	@echo "  make $(CYAN)format$(RESET)              Formatear código (frontend y backend)"
	@echo "  make $(CYAN)lint$(RESET)                Ejecutar linters (frontend y backend)"
	@echo "  make $(CYAN)test$(RESET)                Ejecutar tests (frontend y backend)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Acceso a Contenedores:$(RESET)"
	@echo "  make $(CYAN)frontend-shell$(RESET)      Acceder al shell del contenedor frontend"
	@echo "  make $(CYAN)backend-shell$(RESET)       Acceder al shell del contenedor backend"
	@echo "  make $(CYAN)nginx-shell$(RESET)         Acceder al shell del contenedor nginx"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Configuración:$(RESET)"
	@echo "  make $(CYAN)setup$(RESET)               Configurar el proyecto por primera vez"
	@echo "  make $(CYAN)build$(RESET)               Reconstruir todos los servicios"
	@echo "  make $(CYAN)clean$(RESET)               Limpiar contenedores, imágenes y volúmenes"
	@echo "  make $(CYAN)install-frontend$(RESET)    Instalar dependencias del frontend"
	@echo "  make $(CYAN)install-backend$(RESET)     Instalar dependencias del backend"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Diagnóstico:$(RESET)"
	@echo "  make $(CYAN)check-connectivity$(RESET)  Verificar conectividad de servicios externos"
	@echo "  make $(CYAN)check-dns$(RESET)           Verificar resolución DNS desde contenedores"
	@echo "  make $(CYAN)check-network$(RESET)       Diagnóstico completo de red"
	@echo "  make $(CYAN)fix-dns$(RESET)             Configurar DNS para WSL2"
	@echo ""
	@echo "$(BOLD)$(GREEN)Para más detalles sobre un comando, ejecuta: make <comando> --help$(RESET)"

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
	$(DOCKER_COMPOSE) up -d frontend

dev-frontend-local: ## Iniciar solo el frontend en modo desarrollo local con bun
	cd apps/frontend && bun run dev

dev-backend: ## Iniciar solo el backend en modo desarrollo
	$(DOCKER_COMPOSE) up -d backend postgres redis pgadmin redisinsight

dev-backend-local: ## Iniciar solo el backend en modo desarrollo local
	cd apps/backend && poetry run uvicorn app.main:app --reload

install-frontend: ## Instalar dependencias del frontend
	cd apps/frontend && bun install

install-backend: ## Instalar dependencias del backend
	cd apps/backend && poetry install

check-connectivity: ## Verificar conectividad de servicios externos
	@./scripts/check_connectivity.sh

check-dns: ## Verificar resolución DNS desde contenedores
	@./scripts/check_container_network.sh

check-network: ## Diagnóstico completo de red
	@./scripts/diagnose_network.sh

fix-dns: ## Configurar DNS para WSL2
	@./scripts/fix_wsl_dns.sh
