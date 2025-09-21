#!/bin/bash

# 🐳 Script de gestión del Bot GT ES95 con Docker
# Uso: ./docker-manager.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🐳 Gestor Docker - Bot GT ES95${NC}"
    echo ""
    echo "Comandos disponibles:"
    echo -e "  ${GREEN}build${NC}        - Construir la imagen Docker"
    echo -e "  ${GREEN}start${NC}        - Iniciar el bot"
    echo -e "  ${GREEN}stop${NC}         - Detener el bot"
    echo -e "  ${GREEN}restart${NC}      - Reiniciar el bot"
    echo -e "  ${GREEN}logs${NC}         - Ver logs en tiempo real"
    echo -e "  ${GREEN}status${NC}       - Ver estado del contenedor"
    echo -e "  ${GREEN}shell${NC}        - Acceder al shell del contenedor"
    echo -e "  ${GREEN}update${NC}       - Actualizar y reiniciar el bot"
    echo -e "  ${GREEN}clean${NC}        - Limpiar imágenes y contenedores unused"
    echo -e "  ${GREEN}backup${NC}       - Hacer backup de los datos"
    echo -e "  ${GREEN}setup${NC}        - Configuración inicial"
}

# Función para verificar que Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
}

# Función de configuración inicial
setup() {
    echo -e "${BLUE}🛠️ Configuración inicial del Bot GT ES95${NC}"
    
    # Verificar archivo de entorno
    if [ ! -f "gt-bot.env" ]; then
        echo -e "${YELLOW}📝 Creando archivo de configuración...${NC}"
        cp gt-bot.env.example gt-bot.env
        echo -e "${GREEN}✅ Archivo gt-bot.env creado${NC}"
        echo -e "${YELLOW}⚠️ IMPORTANTE: Edita gt-bot.env con tus tokens de Discord${NC}"
    else
        echo -e "${GREEN}✅ Archivo gt-bot.env ya existe${NC}"
    fi
    
    # Crear directorios necesarios
    echo -e "${BLUE}📁 Creando directorios necesarios...${NC}"
    mkdir -p data logs
    chmod 755 data logs
    echo -e "${GREEN}✅ Directorios creados${NC}"
    
    echo -e "${BLUE}🎯 Configuración completada${NC}"
    echo -e "${YELLOW}➡️ Siguiente paso: editar gt-bot.env con tus credenciales${NC}"
    echo -e "${YELLOW}➡️ Después ejecutar: ./docker-manager.sh build${NC}"
}

# Función para construir la imagen
build() {
    echo -e "${BLUE}🔨 Construyendo imagen Docker...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ Imagen construida exitosamente${NC}"
}

# Función para iniciar el bot
start() {
    echo -e "${BLUE}🚀 Iniciando Bot GT ES95...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Bot iniciado${NC}"
    echo -e "${BLUE}📋 Para ver logs: ./docker-manager.sh logs${NC}"
}

# Función para detener el bot
stop() {
    echo -e "${YELLOW}🛑 Deteniendo Bot GT ES95...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Bot detenido${NC}"
}

# Función para reiniciar el bot
restart() {
    echo -e "${BLUE}🔄 Reiniciando Bot GT ES95...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Bot reiniciado${NC}"
}

# Función para ver logs
logs() {
    echo -e "${BLUE}📋 Logs del Bot GT ES95 (Ctrl+C para salir):${NC}"
    docker-compose logs -f gt-discord-bot
}

# Función para ver estado
status() {
    echo -e "${BLUE}📊 Estado del Bot GT ES95:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}💾 Uso de recursos:${NC}"
    docker stats gt-discord-bot --no-stream 2>/dev/null || echo "Contenedor no está ejecutándose"
}

# Función para acceder al shell
shell() {
    echo -e "${BLUE}🐚 Accediendo al shell del contenedor...${NC}"
    docker-compose exec gt-discord-bot /bin/sh
}

# Función para actualizar
update() {
    echo -e "${BLUE}🔄 Actualizando Bot GT ES95...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✅ Bot actualizado y reiniciado${NC}"
}

# Función para limpiar
clean() {
    echo -e "${YELLOW}🧹 Limpiando imágenes y contenedores unused...${NC}"
    docker system prune -f
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para backup
backup() {
    echo -e "${BLUE}💾 Creando backup de datos...${NC}"
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backup_${timestamp}"
    
    mkdir -p "backups/${backup_dir}"
    cp -r data "backups/${backup_dir}/"
    cp gt-bot.env "backups/${backup_dir}/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup creado en: backups/${backup_dir}${NC}"
}

# Función principal
main() {
    check_docker
    
    case "$1" in
        "build")
            build
            ;;
        "start")
            start
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            ;;
        "logs")
            logs
            ;;
        "status")
            status
            ;;
        "shell")
            shell
            ;;
        "update")
            update
            ;;
        "clean")
            clean
            ;;
        "backup")
            backup
            ;;
        "setup")
            setup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando desconocido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Ejecutar función principal
main "$@"