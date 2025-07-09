#!/bin/bash

set -e

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

install_if_missing docker docker
install_if_missing curl curl
install_if_missing wget wget
install_if_missing ping iputils-ping
install_if_missing getent libc-bin
install_if_missing nslookup bind9-dnsutils

echo "🔍 Verificando conectividad desde contenedores..."
echo "================================================"

# Verificar backend
echo ""
echo "🐳 Backend Container:"
echo "  Verificando si el contenedor está ejecutándose..."
if docker ps | grep -q zentora-backend; then
    echo "    ✅ Contenedor backend está activo"

    echo "  Probando conectividad desde backend:"

    # Ping a Google DNS (si ping está disponible)
    echo "    Ping a 8.8.8.8:"
    if docker exec zentora-backend which ping > /dev/null 2>&1; then
        if docker exec zentora-backend ping -c 3 8.8.8.8 > /dev/null 2>&1; then
            echo "      ✅ Ping IP: OK"
        else
            echo "      ❌ Ping IP: FALLÓ"
        fi
    else
        echo "      ⚠️  Ping IP: NO DISPONIBLE (ping no instalado en el contenedor)"
    fi

    # DNS lookup usando getent (más común en contenedores)
    echo "    DNS lookup de github.com:"
    if docker exec zentora-backend getent hosts github.com > /dev/null 2>&1; then
        echo "      ✅ DNS lookup: OK"
    else
        echo "      ❌ DNS lookup: FALLÓ"
    fi

    # HTTP request usando wget o curl si está disponible
    echo "    HTTP request a https://api.github.com:"
    if docker exec zentora-backend wget -q --timeout=10 -O - https://api.github.com > /dev/null 2>&1; then
        echo "      ✅ HTTP request: OK"
    elif docker exec zentora-backend curl -s --connect-timeout 10 https://api.github.com > /dev/null 2>&1; then
        echo "      ✅ HTTP request: OK"
    else
        echo "      ❌ HTTP request: FALLÓ"
    fi

    # Verificar configuración DNS del contenedor
    echo "    Configuración DNS del contenedor:"
    docker exec zentora-backend cat /etc/resolv.conf 2>/dev/null || echo "      No se pudo leer resolv.conf"

else
    echo "    ❌ Contenedor backend no está activo"
fi

# Verificar frontend
echo ""
echo "🐳 Frontend Container:"
echo "  Verificando si el contenedor está ejecutándose..."
if docker ps | grep -q zentora-frontend; then
    echo "    ✅ Contenedor frontend está activo"

    echo "  Probando conectividad desde frontend:"

    # Ping a Google DNS (si ping está disponible)
    echo "    Ping a 8.8.8.8:"
    if docker exec zentora-frontend which ping > /dev/null 2>&1; then
        if docker exec zentora-frontend ping -c 3 8.8.8.8 > /dev/null 2>&1; then
            echo "      ✅ Ping IP: OK"
        else
            echo "      ❌ Ping IP: FALLÓ"
        fi
    else
        echo "      ⚠️  Ping IP: NO DISPONIBLE (ping no instalado en el contenedor)"
    fi

    # DNS lookup
    echo "    DNS lookup de google.com:"
    if docker exec zentora-frontend getent hosts google.com > /dev/null 2>&1; then
        echo "      ✅ DNS lookup: OK"
    else
        echo "      ❌ DNS lookup: FALLÓ"
    fi

    # HTTP request
    echo "    HTTP request a https://oauth2.googleapis.com:"
    if docker exec zentora-frontend wget -q --timeout=10 -O - https://oauth2.googleapis.com > /dev/null 2>&1; then
        echo "      ✅ HTTP request: OK"
    elif docker exec zentora-frontend curl -s --connect-timeout 10 https://oauth2.googleapis.com > /dev/null 2>&1; then
        echo "      ✅ HTTP request: OK"
    else
        echo "      ❌ HTTP request: FALLÓ"
    fi

    # Verificar configuración DNS del contenedor
    echo "    Configuración DNS del contenedor:"
    docker exec zentora-frontend cat /etc/resolv.conf 2>/dev/null || echo "      No se pudo leer resolv.conf"

else
    echo "    ❌ Contenedor frontend no está activo"
fi

echo ""
echo "✅ Verificación de contenedores completada"
