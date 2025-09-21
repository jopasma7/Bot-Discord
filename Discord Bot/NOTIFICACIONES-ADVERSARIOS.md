# 🏆 Sistema de Notificaciones de Adversarios - GT ES95

## 📋 Descripción
Sistema automático que monitorea los adversarios ganados por los jugadores cada hora y envía reportes detallados a un canal de Discord configurado.

## 🚀 Comandos Disponibles

### `/kills-channel set`
Configura el canal donde se enviarán las notificaciones automáticas.

**Parámetros:**
- `canal` (obligatorio): Canal de texto donde enviar las notificaciones
- `intervalo` (opcional): Frecuencia de las notificaciones
  - `1 hora` (por defecto)
  - `2 horas`
  - `4 horas` 
  - `6 horas`
  - `12 horas`

**Ejemplo:** `/kills-channel set #adversarios-ganados 2h`

### `/kills-channel status`
Muestra la configuración actual del sistema de notificaciones.

### `/kills-channel disable`
Desactiva las notificaciones automáticas de adversarios.

## 📊 Contenido de las Notificaciones

### Embed Principal
- **Resumen general** con total de jugadores activos
- **Estadísticas por categoría:**
  - ⚔️ Total de adversarios ganados
  - ⚡ Adversarios atacando  
  - 🛡️ Adversarios defendiendo
  - 🤝 Adversarios de apoyo
- **Período:** Última hora/intervalo configurado

### Embed de Top Ganadores
- **Top 5 jugadores** que más adversarios ganaron
- **Información detallada:**
  - Nombre del jugador y tribu
  - Total de adversarios ganados
  - Desglose por categorías (ataque/defensa/apoyo)

## ⚙️ Configuración del Sistema

### Permisos Necesarios
El bot necesita estos permisos en el canal configurado:
- `Enviar Mensajes`
- `Insertar Enlaces` (para embeds)

### Intervalos de Verificación
- **Cada hora en punto**: 00:00, 01:00, 02:00, etc.
- **Filtrado inteligente**: Solo envía cuando el intervalo coincide
  - Ejemplo: Si configuras 2 horas, enviará a las 00:00, 02:00, 04:00, etc.

## 🔧 Funcionalidades Técnicas

### Sistema de Tracking
- **Comparación automática**: Detecta diferencias entre verificaciones
- **Caché persistente**: Guarda datos base para comparaciones futuras
- **Análisis enriquecido**: Incluye nombres de jugadores y tribus

### Datos Monitoreados
- **kill_all.txt**: Adversarios totales (924 jugadores)
- **kill_att.txt**: Adversarios atacando (296 jugadores)  
- **kill_def.txt**: Adversarios defendiendo (624 jugadores)
- **kill_sup.txt**: Adversarios de apoyo (153 jugadores)

### Almacenamiento
- **Configuraciones**: `data/kills-notifications.json`
- **Datos de tracking**: `data/kills-tracker.json`

## 📅 Cronograma de Funcionamiento

```
🕐 00:00 - Verificación automática (envía según intervalo)
🕑 01:00 - Verificación automática (envía según intervalo)
🕒 02:00 - Verificación automática (envía según intervalo)
...y así sucesivamente cada hora
```

## 💡 Casos de Uso

### Para Líderes de Tribu
- Monitorear la actividad de combate de los miembros
- Identificar jugadores más activos en conquistas
- Comparar rendimiento entre diferentes períodos

### Para Jugadores Competitivos  
- Seguir el progreso personal y de rivales
- Identificar patrones de actividad por horarios
- Mantener motivación con rankings automáticos

### Para Análisis Estratégico
- Detectar picos de actividad bélica
- Monitorear cambios en el meta de combate
- Planificar operaciones según actividad enemiga

## 🚨 Mensajes del Sistema

### Primera Configuración
Al configurar por primera vez, el sistema:
1. Guarda datos base actuales
2. Programa verificaciones automáticas  
3. Enviará el primer reporte en la próxima hora

### Sin Cambios
Si no hay adversarios ganados, envía un mensaje informativo con:
- Confirmación de que el sistema está funcionando
- Próxima verificación programada

### Con Adversarios Ganados
Cuando detecta cambios, envía:
- Embed con resumen estadístico completo
- Embed con top gainers y detalles por categoría

## 🔍 Ejemplo de Notificación

```
🏆 Adversarios Ganados - Reporte Automático
15 jugadores ganaron adversarios en la última hora

👤 Jugadores Activos: 15
⚔️ Total Kills: 1,247
⚡ Atacando: 856  
🛡️ Defendiendo: 391
🤝 Apoyo: 0

🥇 Top Adversarios Ganados

🥇 [WAR] Alexander
+127 adversarios
Atacando: +95 Defendiendo: +32

🥈 [BOL] Raba  
+89 adversarios
Atacando: +67 Defendiendo: +22

🥉 [MUR] Striker
+76 adversarios
Defendiendo: +76
```

¡Sistema listo para usar! 🎉