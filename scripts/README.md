# Scripts de Diagnóstico y Red para ZENTORA

## Compatibilidad

- **Linux (Debian/Ubuntu/WSL2):** Totalmente soportado. Los scripts instalan dependencias automáticamente usando `apt-get` y `sudo`.
- **MacOS:** Soportado. Los scripts intentan instalar dependencias usando `brew` si está disponible.
- **Windows:** Ejecuta los scripts desde WSL2 (recomendado) o usa los comandos equivalentes en PowerShell (ver más abajo).

## Uso Rápido

```bash
cd scripts
./check_connectivity.sh
./diagnose_network.sh
./check_container_network.sh
./fix_wsl_dns.sh
```

Si algún comando requiere permisos, te pedirá la contraseña de `sudo`.

## ¿Qué hace cada script?

- **check_connectivity.sh**: Verifica conectividad, DNS y acceso a servicios externos.
- **diagnose_network.sh**: Diagnóstico completo de red, interfaces, rutas, DNS, puertos y Docker.
- **check_container_network.sh**: Verifica la conectividad desde los contenedores Docker.
- **fix_wsl_dns.sh**: Soluciona problemas de DNS en WSL2 y hace la configuración persistente.

## Dependencias

- Linux: `curl`, `wget`, `ping`, `getent`, `nslookup`, `ip`, `netstat`, `docker` (según el script)
- MacOS: `curl`, `wget`, `ping`, `docker`, `dig`, `ifconfig`, `netstat` (instalables con [Homebrew](https://brew.sh/))
- Windows: Usar WSL2 para máxima compatibilidad. Si usas PowerShell, consulta la sección siguiente.

## Adaptación para MacOS

Los scripts intentan instalar dependencias usando `brew` si no están presentes. Si no tienes Homebrew, instálalo desde https://brew.sh/

## Adaptación para Windows

- **WSL2:** Ejecuta los scripts normalmente desde la terminal de Ubuntu/Debian.
- **PowerShell:** Usa los siguientes comandos equivalentes:
  - `Test-NetConnection google.com` (ping y DNS)
  - `Invoke-WebRequest https://api.github.com` (HTTP request)
  - `Get-NetIPConfiguration` (interfaces)
  - `Get-NetRoute` (rutas)
  - `docker ps` (contenedores)

## Notas

- Si usas otra distribución de Linux, instala manualmente las utilidades requeridas si el script no puede hacerlo automáticamente.
- Si reinicias WSL2, ejecuta `sudo /usr/local/bin/fix-dns.sh` para restaurar el DNS.
- Si tienes problemas de permisos, ejecuta el script con `sudo`.

---

¿Dudas o problemas? ¡Pregunta en el equipo de desarrollo!
