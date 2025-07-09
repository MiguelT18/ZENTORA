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

install_if_missing curl curl
install_if_missing wget wget
install_if_missing ping iputils-ping
install_if_missing getent libc-bin
install_if_missing nslookup bind9-dnsutils
install_if_missing ip iproute2
install_if_missing netstat net-tools

echo "🔍 Diagnóstico de Red para WSL2"
echo "=================================="

# Verificar sistema operativo
echo "📋 Información del Sistema:"
echo "  OS: $(uname -a)"
echo "  WSL Version: $(wsl.exe -l -v 2>/dev/null || echo 'No disponible')"

# Verificar interfaces de red
echo ""
echo "🌐 Interfaces de Red:"
ip addr show | grep -E "inet|UP" | head -10

# Verificar rutas
echo ""
echo "🛣️  Tabla de Rutas:"
ip route show | head -5

# Verificar DNS
echo ""
echo "🔍 Configuración DNS:"
cat /etc/resolv.conf

# Verificar conectividad básica
echo ""
echo "📡 Pruebas de Conectividad:"

# Ping a Google DNS
echo "  Ping a 8.8.8.8 (Google DNS):"
if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
    echo "    ✅ Conectividad IP básica: OK"
else
    echo "    ❌ Conectividad IP básica: FALLÓ"
fi

# DNS lookup
echo "  DNS Lookup de google.com:"
if nslookup google.com > /dev/null 2>&1; then
    echo "    ✅ Resolución DNS: OK"
else
    echo "    ❌ Resolución DNS: FALLÓ"
fi

# HTTP requests
echo "  HTTP Request a https://httpbin.org/get:"
if curl -s --connect-timeout 10 https://httpbin.org/get > /dev/null 2>&1; then
    echo "    ✅ HTTP requests: OK"
else
    echo "    ❌ HTTP requests: FALLÓ"
fi

# Verificar servicios Docker
echo ""
echo "🐳 Estado de Servicios Docker:"
if docker ps > /dev/null 2>&1; then
    echo "  ✅ Docker está ejecutándose"
    echo "  Contenedores activos:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
else
    echo "  ❌ Docker no está ejecutándose"
fi

# Verificar puertos
echo ""
echo "🔌 Puertos en Uso:"
netstat -tlnp 2>/dev/null | grep -E ":(80|443|3000|8000)" || echo "  No se encontraron puertos relevantes"

# Verificar variables de entorno de red
echo ""
echo "🔧 Variables de Entorno de Red:"
echo "  HTTP_PROXY: ${HTTP_PROXY:-'No configurado'}"
echo "  HTTPS_PROXY: ${HTTPS_PROXY:-'No configurado'}"
echo "  NO_PROXY: ${NO_PROXY:-'No configurado'}"

# Verificar configuración de WSL2
echo ""
echo "⚙️  Configuración WSL2:"
if [ -f /etc/wsl.conf ]; then
    echo "  Archivo wsl.conf encontrado:"
    cat /etc/wsl.conf
else
    echo "  No se encontró archivo wsl.conf"
fi

echo ""
echo "✅ Diagnóstico completado"
