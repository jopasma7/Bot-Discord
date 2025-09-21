# 🐳 Script de gestión del Bot GT ES95 con Docker (PowerShell)
# Uso: .\docker-manager.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command
)

# Colores para output (usando Write-Host)
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message -ForegroundColor White }
    }
}

# Función para mostrar ayuda
function Show-Help {
    Write-ColorOutput "🐳 Gestor Docker - Bot GT ES95" "Blue"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-ColorOutput "  build        - Construir la imagen Docker" "Green"
    Write-ColorOutput "  start        - Iniciar el bot" "Green"
    Write-ColorOutput "  stop         - Detener el bot" "Green"
    Write-ColorOutput "  restart      - Reiniciar el bot" "Green"
    Write-ColorOutput "  logs         - Ver logs en tiempo real" "Green"
    Write-ColorOutput "  status       - Ver estado del contenedor" "Green"
    Write-ColorOutput "  shell        - Acceder al shell del contenedor" "Green"
    Write-ColorOutput "  update       - Actualizar y reiniciar el bot" "Green"
    Write-ColorOutput "  clean        - Limpiar imágenes y contenedores unused" "Green"
    Write-ColorOutput "  backup       - Hacer backup de los datos" "Green"
    Write-ColorOutput "  setup        - Configuración inicial" "Green"
}

# Función para verificar que Docker está instalado
function Test-Docker {
    try {
        $null = docker --version
        $null = docker-compose --version
        return $true
    } catch {
        Write-ColorOutput "❌ Docker o Docker Compose no están instalados" "Red"
        return $false
    }
}

# Función de configuración inicial
function Initialize-Setup {
    Write-ColorOutput "🛠️ Configuración inicial del Bot GT ES95" "Blue"
    
    # Verificar archivo de entorno
    if (!(Test-Path "gt-bot.env")) {
        Write-ColorOutput "📝 Creando archivo de configuración..." "Yellow"
        Copy-Item "gt-bot.env.example" "gt-bot.env"
        Write-ColorOutput "✅ Archivo gt-bot.env creado" "Green"
        Write-ColorOutput "⚠️ IMPORTANTE: Edita gt-bot.env con tus tokens de Discord" "Yellow"
    } else {
        Write-ColorOutput "✅ Archivo gt-bot.env ya existe" "Green"
    }
    
    # Crear directorios necesarios
    Write-ColorOutput "📁 Creando directorios necesarios..." "Blue"
    New-Item -ItemType Directory -Force -Path "data" | Out-Null
    New-Item -ItemType Directory -Force -Path "logs" | Out-Null
    Write-ColorOutput "✅ Directorios creados" "Green"
    
    Write-ColorOutput "🎯 Configuración completada" "Blue"
    Write-ColorOutput "➡️ Siguiente paso: editar gt-bot.env con tus credenciales" "Yellow"
    Write-ColorOutput "➡️ Después ejecutar: .\docker-manager.ps1 build" "Yellow"
}

# Función para construir la imagen
function Build-Image {
    Write-ColorOutput "🔨 Construyendo imagen Docker..." "Blue"
    docker-compose build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Imagen construida exitosamente" "Green"
    } else {
        Write-ColorOutput "❌ Error construyendo imagen" "Red"
    }
}

# Función para iniciar el bot
function Start-Bot {
    Write-ColorOutput "🚀 Iniciando Bot GT ES95..." "Blue"
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Bot iniciado" "Green"
        Write-ColorOutput "📋 Para ver logs: .\docker-manager.ps1 logs" "Blue"
    } else {
        Write-ColorOutput "❌ Error iniciando bot" "Red"
    }
}

# Función para detener el bot
function Stop-Bot {
    Write-ColorOutput "🛑 Deteniendo Bot GT ES95..." "Yellow"
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Bot detenido" "Green"
    } else {
        Write-ColorOutput "❌ Error deteniendo bot" "Red"
    }
}

# Función para reiniciar el bot
function Restart-Bot {
    Write-ColorOutput "🔄 Reiniciando Bot GT ES95..." "Blue"
    docker-compose restart
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Bot reiniciado" "Green"
    } else {
        Write-ColorOutput "❌ Error reiniciando bot" "Red"
    }
}

# Función para ver logs
function Show-Logs {
    Write-ColorOutput "📋 Logs del Bot GT ES95 (Ctrl+C para salir):" "Blue"
    docker-compose logs -f gt-discord-bot
}

# Función para ver estado
function Show-Status {
    Write-ColorOutput "📊 Estado del Bot GT ES95:" "Blue"
    docker-compose ps
    Write-Host ""
    Write-ColorOutput "💾 Uso de recursos:" "Blue"
    try {
        docker stats gt-discord-bot --no-stream
    } catch {
        Write-Host "Contenedor no está ejecutándose"
    }
}

# Función para acceder al shell
function Enter-Shell {
    Write-ColorOutput "🐚 Accediendo al shell del contenedor..." "Blue"
    docker-compose exec gt-discord-bot /bin/sh
}

# Función para actualizar
function Update-Bot {
    Write-ColorOutput "🔄 Actualizando Bot GT ES95..." "Blue"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Bot actualizado y reiniciado" "Green"
    } else {
        Write-ColorOutput "❌ Error actualizando bot" "Red"
    }
}

# Función para limpiar
function Clean-Docker {
    Write-ColorOutput "🧹 Limpiando imágenes y contenedores unused..." "Yellow"
    docker system prune -f
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Limpieza completada" "Green"
    } else {
        Write-ColorOutput "❌ Error en limpieza" "Red"
    }
}

# Función para backup
function Create-Backup {
    Write-ColorOutput "💾 Creando backup de datos..." "Blue"
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backup_$timestamp"
    
    New-Item -ItemType Directory -Force -Path "backups\$backupDir" | Out-Null
    Copy-Item -Recurse "data" "backups\$backupDir\"
    
    if (Test-Path "gt-bot.env") {
        Copy-Item "gt-bot.env" "backups\$backupDir\"
    }
    
    Write-ColorOutput "✅ Backup creado en: backups\$backupDir" "Green"
}

# Función principal
function Main {
    if (!(Test-Docker)) {
        exit 1
    }
    
    switch ($Command.ToLower()) {
        "build" { Build-Image }
        "start" { Start-Bot }
        "stop" { Stop-Bot }
        "restart" { Restart-Bot }
        "logs" { Show-Logs }
        "status" { Show-Status }
        "shell" { Enter-Shell }
        "update" { Update-Bot }
        "clean" { Clean-Docker }
        "backup" { Create-Backup }
        "setup" { Initialize-Setup }
        "help" { Show-Help }
        "" { Show-Help }
        default {
            Write-ColorOutput "❌ Comando desconocido: $Command" "Red"
            Write-Host ""
            Show-Help
            exit 1
        }
    }
}

# Ejecutar función principal
Main