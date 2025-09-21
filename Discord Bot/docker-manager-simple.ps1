# 🐳 Script simplificado de gestión Docker para Bot GT ES95
param([string]$Command)

function Write-Info($msg) { Write-Host "🔵 $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "❌ $msg" -ForegroundColor Red }

function Show-Help {
    Write-Host ""
    Write-Info "Gestor Docker - Bot GT ES95"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  setup        - Configuración inicial"
    Write-Host "  build        - Construir imagen Docker"
    Write-Host "  start        - Iniciar el bot"
    Write-Host "  stop         - Detener el bot"
    Write-Host "  restart      - Reiniciar el bot"
    Write-Host "  logs         - Ver logs en tiempo real"
    Write-Host "  status       - Ver estado del contenedor"
    Write-Host "  backup       - Crear backup de datos"
    Write-Host "  update       - Actualizar y reiniciar"
    Write-Host "  clean        - Limpiar Docker"
    Write-Host ""
}

function Test-DockerInstalled {
    try {
        $dockerVersion = docker --version 2>$null
        $composeVersion = docker-compose --version 2>$null
        return $true
    } catch {
        Write-Error "Docker o Docker Compose no están instalados"
        return $false
    }
}

function Initialize-Setup {
    Write-Info "Configuración inicial del Bot GT ES95"
    
    # Crear archivo de configuración
    if (!(Test-Path "gt-bot.env")) {
        Write-Warning "Creando archivo de configuración..."
        Copy-Item "gt-bot.env.example" "gt-bot.env" -ErrorAction SilentlyContinue
        Write-Success "Archivo gt-bot.env creado"
        Write-Warning "IMPORTANTE: Edita gt-bot.env con tus tokens de Discord"
    } else {
        Write-Success "Archivo gt-bot.env ya existe"
    }
    
    # Crear directorios
    Write-Info "Creando directorios necesarios..."
    New-Item -ItemType Directory -Force -Path "data" | Out-Null
    New-Item -ItemType Directory -Force -Path "logs" | Out-Null  
    New-Item -ItemType Directory -Force -Path "backups" | Out-Null
    Write-Success "Directorios creados"
    
    Write-Success "Configuración completada"
    Write-Warning "Siguiente paso: editar gt-bot.env con tus credenciales"
    Write-Warning "Después ejecutar: .\docker-manager-simple.ps1 build"
}

function Build-Image {
    Write-Info "Construyendo imagen Docker..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Imagen construida exitosamente"
    } else {
        Write-Error "Error construyendo imagen"
    }
}

function Start-Bot {
    Write-Info "Iniciando Bot GT ES95..."
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Bot iniciado correctamente"
        Write-Info "Para ver logs: .\docker-manager-simple.ps1 logs"
    } else {
        Write-Error "Error iniciando bot"
    }
}

function Stop-Bot {
    Write-Warning "Deteniendo Bot GT ES95..."
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Bot detenido"
    } else {
        Write-Error "Error deteniendo bot"
    }
}

function Restart-Bot {
    Write-Info "Reiniciando Bot GT ES95..."
    docker-compose restart
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Bot reiniciado"
    } else {
        Write-Error "Error reiniciando bot"
    }
}

function Show-Logs {
    Write-Info "Logs del Bot GT ES95 (Ctrl+C para salir):"
    docker-compose logs -f gt-discord-bot
}

function Show-Status {
    Write-Info "Estado del Bot GT ES95:"
    docker-compose ps
    Write-Host ""
    Write-Info "Uso de recursos:"
    docker stats gt-discord-bot --no-stream 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Contenedor no está ejecutándose"
    }
}

function Create-Backup {
    Write-Info "Creando backup de datos..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backups\backup_$timestamp"
    
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    Copy-Item -Recurse "data" "$backupDir\" -ErrorAction SilentlyContinue
    Copy-Item "gt-bot.env" "$backupDir\" -ErrorAction SilentlyContinue
    
    Write-Success "Backup creado en: $backupDir"
}

function Update-Bot {
    Write-Info "Actualizando Bot GT ES95..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Bot actualizado y reiniciado"
    } else {
        Write-Error "Error actualizando bot"
    }
}

function Clean-Docker {
    Write-Warning "Limpiando Docker..."
    docker system prune -f
    Write-Success "Limpieza completada"
}

# Función principal
if (!(Test-DockerInstalled)) {
    exit 1
}

switch ($Command.ToLower()) {
    "setup" { Initialize-Setup }
    "build" { Build-Image }
    "start" { Start-Bot }
    "stop" { Stop-Bot }
    "restart" { Restart-Bot }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "backup" { Create-Backup }
    "update" { Update-Bot }
    "clean" { Clean-Docker }
    "help" { Show-Help }
    "" { Show-Help }
    default {
        Write-Error "Comando desconocido: $Command"
        Show-Help
        exit 1
    }
}