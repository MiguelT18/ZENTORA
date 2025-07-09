#!/bin/bash

set -e

echo "🔍 Verificando conectividad de servicios externos..."

# Función para instalar una utilidad si no existe
install_if_missing() {
  if ! command -v "$1" > /dev/null 2>&1; then
    echo "🔧 Instalando $1..."
    if command -v apt-get > /dev/null 2>&1; then
      sudo apt-get update && sudo apt-get install -y "$2"
    elif command -v brew > /dev/null 2>&1; then
      brew install "$2"
    else
      echo "❌ No se pudo instalar $1 automáticamente. Instálalo manualmente."
      exit 1
    fi
  fi
}

# Detectar Windows sin WSL2
if grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
  # WSL2 o WSL1
  :
elif [[ "$(uname -s)" == *"NT"* ]]; then
  echo "❗ Este script debe ejecutarse en WSL2, MacOS o Linux. En Windows nativo, usa PowerShell."
  exit 1
fi

# Instalar dependencias necesarias
install_if_missing curl curl
install_if_missing wget wget
install_if_missing ping iputils-ping
install_if_missing getent libc-bin
install_if_missing nslookup bind9-dnsutils

# Verificar conectividad básica
echo "📡 Verificando conectividad básica..."
ping -c 3 google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Conectividad básica: OK"
else
    echo "❌ Conectividad básica: FALLÓ"
fi

# Verificar DNS
echo "🌐 Verificando resolución DNS..."
nslookup google.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Resolución DNS: OK"
else
    echo "❌ Resolución DNS: FALLÓ"
fi

# Verificar GitHub API
echo "🐙 Verificando GitHub API..."
curl -s --connect-timeout 10 https://api.github.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ GitHub API: OK"
else
    echo "❌ GitHub API: FALLÓ"
fi

# Verificar Google OAuth
echo "🔐 Verificando Google OAuth..."
curl -s --connect-timeout 10 https://oauth2.googleapis.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Google OAuth: OK"
else
    echo "❌ Google OAuth: FALLÓ"
fi

# Verificar servicios Docker
echo "🐳 Verificando servicios Docker..."
install_if_missing docker docker.io

docker ps | grep -q zentora-backend
if [ $? -eq 0 ]; then
    echo "✅ Backend Docker: OK"
else
    echo "❌ Backend Docker: NO ENCONTRADO"
fi

docker ps | grep -q zentora-frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend Docker: OK"
else
    echo "❌ Frontend Docker: NO ENCONTRADO"
fi

echo "✅ Verificación completada"
