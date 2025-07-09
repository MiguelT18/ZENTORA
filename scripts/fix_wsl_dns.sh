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
install_if_missing getent libc-bin
install_if_missing nslookup bind9-dnsutils

echo "🔧 Configurando DNS persistente para WSL2"
echo "=========================================="

# Verificar si estamos en WSL2
if ! grep -q Microsoft /proc/version; then
    echo "❌ Este script debe ejecutarse en WSL2"
    exit 1
fi

echo "📋 Detectado WSL2"

# Crear script de configuración DNS
echo "📝 Creando script de configuración DNS..."
sudo tee /etc/wsl.conf > /dev/null << EOF
[network]
generateResolvConf = false

[boot]
systemd = true
EOF

# Crear script para configurar DNS automáticamente
echo "🔧 Creando script de configuración automática..."
sudo tee /usr/local/bin/fix-dns.sh > /dev/null << 'EOF'
#!/bin/bash
# Script para configurar DNS en WSL2

# Verificar si resolv.conf es un symlink
if [ -L /etc/resolv.conf ]; then
    echo "🔗 /etc/resolv.conf es un symlink, eliminando..."
    sudo rm /etc/resolv.conf
fi

# Configurar DNS manualmente
echo "📡 Configurando DNS..."
sudo tee /etc/resolv.conf > /dev/null << 'DNS_EOF'
nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1
DNS_EOF

echo "✅ DNS configurado correctamente"
EOF

# Hacer el script ejecutable
sudo chmod +x /usr/local/bin/fix-dns.sh

# Ejecutar el script ahora
echo "🚀 Ejecutando configuración DNS..."
/usr/local/bin/fix-dns.sh

# Verificar la configuración
echo ""
echo "🔍 Verificando configuración:"
echo "  Archivo /etc/resolv.conf:"
cat /etc/resolv.conf

echo ""
echo "📡 Probando conectividad:"
if getent hosts google.com > /dev/null 2>&1; then
    echo "  ✅ DNS lookup: OK"
else
    echo "  ❌ DNS lookup: FALLÓ"
fi

if curl -s --connect-timeout 10 https://httpbin.org/get > /dev/null 2>&1; then
    echo "  ✅ HTTP requests: OK"
else
    echo "  ❌ HTTP requests: FALLÓ"
fi

echo ""
echo "📋 Instrucciones para hacer la configuración persistente:"
echo "  1. Cada vez que reinicies WSL2, ejecuta: sudo /usr/local/bin/fix-dns.sh"
echo "  2. O agrega el comando a tu ~/.bashrc para que se ejecute automáticamente"
echo ""
echo "✅ Configuración completada"
