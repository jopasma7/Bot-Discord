# Bot Discord GT - ES95

Bot de Discord para el mundo ES95 de Tribal Wars con funcionalidades de monitoreo de conquistas y estadísticas de kills.

## Características

- 🏰 **Monitoreo de Conquistas**: Detecta automáticamente nuevas conquistas en TWStats
- ⚔️ **Estadísticas de Kills**: Tracking y notificaciones de adversarios/defensores
- 📍 **Información de Coordenadas**: Detecta coordenadas en chat y muestra información del pueblo
- 🎯 **Comandos Interactivos**: Slash commands para diversas funcionalidades

## Configuración

### 1. Instalación

```bash
npm install
```

### 2. Variables de Entorno

Copia `gt-bot.env.example` a `gt-bot.env` y completa los valores:

```bash
cp gt-bot.env.example gt-bot.env
```

Edita `gt-bot.env` con tus valores:

- `DISCORD_TOKEN`: Token de tu bot de Discord
- `DISCORD_CLIENT_ID`: ID del cliente de Discord
- `MONGODB_URI`: String de conexión a MongoDB Atlas
- Otros valores opcionales según necesidades

### 3. Deployment de Comandos

```bash
node deploy-commands.js
```

### 4. Ejecutar el Bot

```bash
npm start
# o
node index.js
```

## Estructura del Proyecto

```
├── commands/           # Comandos slash del bot
├── utils/             # Utilidades y módulos principales
│   ├── twstatsConquestMonitor.js
│   ├── killsNotificationScheduler.js
│   ├── villageInfoHandler.js
│   └── ...
├── data/              # Datos persistentes
├── index.js           # Archivo principal
└── deploy-commands.js # Script para deployar comandos
```

## Comandos Principales

- `/ping` - Test de conectividad
- Detección automática de coordenadas en chat
- Sistema de notificaciones programadas

## Railway Deployment

El proyecto está configurado para deployment automático en Railway:

- Dockerfile incluido
- railway.json configurado
- Variables de entorno configuradas en Railway dashboard

## Correcciones Aplicadas

### v1.2.1 - Septiembre 2025
- ✅ **Fix Timezone Conquistas**: Corregido problema de 2 horas de adelanto en timestamps
- ✅ **Fix TOP 10 Kills**: Verificado que el sistema muestra correctamente TOP 10 adversarios
- ✅ **Coordenadas**: Sistema de detección automática de coordenadas con enlaces al juego

### Características Técnicas

- **Timezone**: Manejo correcto de horario español (UTC+1/+2)
- **Formato Kills**: TOP 10 jugadores con barras de progreso y porcentajes
- **Links**: Enlaces directos al mapa del juego con screen=map

## Soporte

Para soporte técnico o reportar bugs, contacta al desarrollador.