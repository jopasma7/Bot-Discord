# 🐳 Guía Docker - Bot GT ES95

## 📋 Requisitos Previos

### 1. Instalar Docker
**Windows:**
- Descargar Docker Desktop desde [docker.com](https://docs.docker.com/desktop/install/windows/)
- Seguir el instalador y reiniciar si es necesario
- Verificar instalación: `docker --version` y `docker-compose --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
# Reiniciar sesión después de este comando
```

### 2. Preparar Credenciales de Discord
- Token del bot de Discord
- Client ID de la aplicación de Discord
- Guild ID del servidor (opcional)

---

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno
```powershell
# Windows PowerShell
.\docker-manager.ps1 setup
```

```bash
# Linux/Mac
chmod +x docker-manager.sh
./docker-manager.sh setup
```

### 2. Editar Configuración
Abrir el archivo `gt-bot.env` creado y completar:
```env
DISCORD_TOKEN=tu_token_real_aqui
DISCORD_CLIENT_ID=tu_client_id_aqui
DISCORD_GUILD_ID=tu_guild_id_aqui
```

### 3. Construir la Imagen Docker
```powershell
# Windows
.\docker-manager.ps1 build
```

```bash
# Linux/Mac  
./docker-manager.sh build
```

---

## 🎮 Comandos de Gestión

### Comandos Básicos

| Comando | Descripción | Windows | Linux/Mac |
|---------|-------------|---------|-----------|
| **Iniciar bot** | Ejecutar el contenedor | `.\docker-manager.ps1 start` | `./docker-manager.sh start` |
| **Detener bot** | Parar el contenedor | `.\docker-manager.ps1 stop` | `./docker-manager.sh stop` |
| **Reiniciar bot** | Reiniciar contenedor | `.\docker-manager.ps1 restart` | `./docker-manager.sh restart` |
| **Ver logs** | Logs en tiempo real | `.\docker-manager.ps1 logs` | `./docker-manager.sh logs` |
| **Estado** | Info del contenedor | `.\docker-manager.ps1 status` | `./docker-manager.sh status` |

### Comandos Avanzados

| Comando | Descripción | Windows | Linux/Mac |
|---------|-------------|---------|-----------|
| **Actualizar** | Rebuild y restart | `.\docker-manager.ps1 update` | `./docker-manager.sh update` |
| **Shell** | Acceder al contenedor | `.\docker-manager.ps1 shell` | `./docker-manager.sh shell` |
| **Backup** | Respaldar datos | `.\docker-manager.ps1 backup` | `./docker-manager.sh backup` |
| **Limpiar** | Limpiar Docker | `.\docker-manager.ps1 clean` | `./docker-manager.sh clean` |

---

## 📁 Estructura de Archivos

```
Discord Bot/
├── 🐳 Docker Files
│   ├── Dockerfile              # Configuración de imagen
│   ├── docker-compose.yml      # Orchestración de servicios
│   ├── .dockerignore           # Archivos a ignorar
│   ├── gt-bot.env.example      # Plantilla de configuración
│   └── gt-bot.env              # Tu configuración (crear)
│
├── 🛠️ Gestión Scripts
│   ├── docker-manager.ps1      # Script Windows PowerShell
│   └── docker-manager.sh       # Script Linux/Mac Bash
│
├── 📊 Datos Persistentes
│   ├── data/                   # Datos del bot (montado como volumen)
│   ├── logs/                   # Logs del contenedor
│   └── backups/                # Backups automáticos
│
└── 📝 Código del Bot
    ├── index.js                # Archivo principal
    ├── commands/               # Comandos slash
    ├── utils/                  # Utilidades y managers
    └── package.json            # Dependencias
```

---

## 🔧 Workflow Típico

### 1. Primer Uso
```powershell
# 1. Configurar
.\docker-manager.ps1 setup

# 2. Editar gt-bot.env con tus tokens

# 3. Construir imagen
.\docker-manager.ps1 build

# 4. Iniciar bot
.\docker-manager.ps1 start

# 5. Ver que todo funcione
.\docker-manager.ps1 logs
```

### 2. Uso Diario
```powershell
# Ver estado
.\docker-manager.ps1 status

# Ver logs
.\docker-manager.ps1 logs

# Reiniciar si es necesario
.\docker-manager.ps1 restart
```

### 3. Actualizaciones de Código
```powershell
# Después de modificar código
.\docker-manager.ps1 update
```

### 4. Backup Periódico
```powershell
# Crear backup de datos
.\docker-manager.ps1 backup
```

---

## 💾 Persistencia de Datos

### Volúmenes Docker
Los siguientes datos se mantienen entre reinicios:
- **`./data/`** → `/app/data/` (datos del bot)
  - `kills-tracker.json` - Historial de adversarios
  - `kills-notifications.json` - Configuración de canales
  - `known-tribes.json` - Tribus conocidas
  - `conquest-config.json` - Configuración de conquistas

- **`./logs/`** → `/app/logs/` (logs del contenedor)

### Backups
Los backups se crean en:
```
backups/
└── backup_YYYYMMDD_HHMMSS/
    ├── data/              # Todos los datos del bot
    └── gt-bot.env         # Configuración (sin token por seguridad)
```

---

## 🔍 Troubleshooting

### Bot no inicia
```powershell
# Ver logs detallados
.\docker-manager.ps1 logs

# Verificar configuración
.\docker-manager.ps1 status

# Reconstruir imagen
.\docker-manager.ps1 build
.\docker-manager.ps1 start
```

### Error de permisos (Linux)
```bash
# Dar permisos al script
chmod +x docker-manager.sh

# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
# Reiniciar sesión
```

### Limpiar espacio en disco
```powershell
# Limpiar imágenes y contenedores unused
.\docker-manager.ps1 clean

# Limpiar todo Docker (¡CUIDADO!)
docker system prune -a
```

### Acceso al contenedor
```powershell
# Entrar al shell del contenedor
.\docker-manager.ps1 shell

# Una vez dentro:
cd /app
ls -la
cat package.json
```

---

## 🎯 Ventajas del Docker

### ✅ **Beneficios**
- **Aislamiento**: El bot funciona en su propio entorno
- **Portabilidad**: Funciona igual en Windows, Linux, Mac
- **Fácil deploy**: Un solo comando para iniciar
- **Consistencia**: Mismo entorno en desarrollo y producción
- **Backup simple**: Datos en volúmenes persistentes
- **Actualizaciones**: Rebuild automático con nuevo código

### 📊 **Recursos del Contenedor**
- **Imagen base**: Node.js 18 Alpine (~50MB)
- **RAM**: ~50-100MB en funcionamiento normal
- **CPU**: Mínimo (solo procesa comandos Discord)
- **Disco**: ~200MB total con datos

---

## 🚀 **¡Listo para Usar!**

Una vez configurado:
1. El bot iniciará automáticamente al arrancar Docker
2. Los datos se mantienen entre reinicios
3. Las notificaciones programadas funcionarán 24/7
4. Los logs se rotan automáticamente
5. Los backups se pueden crear cuando quieras

**Comando rápido para verificar todo:**
```powershell
.\docker-manager.ps1 status
```

¡Tu bot GT ES95 ahora funciona en un contenedor Docker profesional! 🎉