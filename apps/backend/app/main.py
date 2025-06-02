from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

# Configuración global del logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.scheduler import init_scheduler

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas de la API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Inicializar el scheduler
init_scheduler(app)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Welcome to ZENTORA API"}
