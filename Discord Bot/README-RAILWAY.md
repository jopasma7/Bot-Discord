# 🚀 GT ES95 Discord Bot - Railway Deployment

Bot de Discord para el mundo ES95 de Guerras Tribales con sistema completo de análisis de adversarios y notificaciones automatizadas.

## 🎯 Características Principales

- **Sistema de análisis de adversarios** con 4 categorías (total, ataque, defensa, soporte)
- **Notificaciones automatizadas** cada hora con cambios detectados
- **10 comandos slash** para consultas de jugadores, tribus y estadísticas
- **Monitoreo de conquistas** en tiempo real
- **Sistema de tracking** con persistencia de datos

## 🔧 Variables de Entorno Requeridas

Configura estas variables en Railway Dashboard:

```bash
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here (opcional)
NODE_ENV=production
```

## 📱 Comandos Disponibles

- `/kills` - Análisis completo de adversarios con botones interactivos
- `/kills-channel` - Configurar canal de notificaciones
- `/kills-update` - Forzar actualización manual
- `/jugador [nombre]` - Información detallada de jugador
- `/tribu [tag]` - Análisis territorial de tribu
- `/ranking [tipo]` - Rankings interactivos
- `/stats` - Estadísticas del mundo
- Y más...

## 🎮 Sistema de Notificaciones

- **Verificación automática**: Cada hora
- **Detección de cambios**: Solo notifica diferencias reales
- **Categorías**: Total kills, Attack, Defense, Support
- **Formato**: Embeds organizados por tipo de cambio

## 🏆 Desarrollado para GT ES95

Bot especializado en el mundo ES95 con integración completa a la API oficial de Guerras Tribales.