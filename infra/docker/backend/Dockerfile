FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
  build-essential \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Instalar poetry
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VERSION=1.7.1
ENV POETRY_VENV=/opt/poetry-venv
ENV PYTHONPATH=/app

# Instalar poetry en su propio virtualenv
RUN python3 -m venv $POETRY_VENV \
  && $POETRY_VENV/bin/pip install -U pip setuptools \
  && $POETRY_VENV/bin/pip install poetry==${POETRY_VERSION}

# Agregar poetry al PATH
ENV PATH="${PATH}:${POETRY_VENV}/bin"

# Configurar poetry
RUN poetry config virtualenvs.create false

# Copiar archivos de configuración de Poetry
COPY pyproject.toml poetry.lock* ./

# Instalar dependencias
RUN poetry install --no-root --with dev

# Copiar el código
COPY . .

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
