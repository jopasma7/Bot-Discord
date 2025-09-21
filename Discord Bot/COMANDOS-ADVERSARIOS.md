# 🎮 Comandos del Sistema de Adversarios GT ES95

## 📊 **Comandos de Análisis**

### `/kills [subcommando]`
Sistema completo de análisis de adversarios ganados con 5 subcommandos:

- **`/kills jugador [nombre]`** - Análisis detallado de un jugador
- **`/kills tribu [nombre]`** - Análisis de adversarios de toda la tribu  
- **`/kills ranking [tipo]`** - Top killers con navegación por botones
- **`/kills comparar [jugadores]`** - Comparación entre múltiples jugadores
- **`/kills analisis`** - Análisis general del estado de adversarios

## 🔔 **Comandos de Notificaciones**

### `/kills-channel set [canal] [intervalo]`
Configura el canal donde se enviarán las notificaciones automáticas de adversarios.

**Parámetros:**
- `canal` (obligatorio): Canal de texto para notificaciones
- `intervalo` (opcional): Frecuencia - 1h, 2h, 4h, 6h, 12h

**Ejemplo:** `/kills-channel set #adversarios-ganados 2h`

### `/kills-channel status`
Muestra la configuración actual del sistema de notificaciones.

### `/kills-channel disable`
Desactiva las notificaciones automáticas.

## ⚡ **Comando de Actualización Manual**

### `/kills-update [enviar-notificacion]`
**¡NUEVO!** Fuerza una actualización inmediata de adversarios sin esperar la hora programada.

**Parámetros:**
- `enviar-notificacion` (opcional): `True` para forzar notificación aunque no haya cambios

**Funcionalidades:**
- ✅ Ejecuta tracking inmediato
- ✅ Muestra progreso en tiempo real
- ✅ Envía notificación al canal configurado si hay cambios
- ✅ Opción de forzar notificación
- ✅ Resumen detallado con top gainers
- ✅ Estado de la notificación automática

**Ejemplos:**
- `/kills-update` - Actualización básica
- `/kills-update enviar-notificacion:True` - Forzar notificación

---

## 🚀 **Flujo de Trabajo Típico**

### **1. Configuración Inicial**
```
/kills-channel set #adversarios-ganados 1h
```

### **2. Verificación Manual**
```
/kills-update
```

### **3. Análisis Detallado**
```
/kills ranking all
/kills jugador [tu-nombre]
/kills tribu [tu-tribu]
```

### **4. Monitoreo Automático**
El sistema enviará reportes automáticamente cada hora (o según el intervalo configurado)

---

## 🎯 **Estados del Sistema**

### **✅ Funcionando Correctamente:**
- Bot online y ambos sistemas activos
- Canal configurado con permisos correctos
- Verificaciones cada hora en punto
- Datos guardados y actualizándose

### **⚠️ Configuración Pendiente:**
- Bot online pero sin canal configurado
- Usar `/kills-channel set` para activar notificaciones

### **❌ Problemas Comunes:**
- Canal eliminado → Reconfigurar con `/kills-channel set`
- Sin permisos → Verificar permisos de bot en canal
- Bot offline → Reiniciar bot

---

## 🏆 **Ejemplo de Uso Completo**

```
Usuario: /kills-channel set #adversarios-ganados 2h
Bot: ✅ Canal configurado. Notificaciones cada 2 horas.

Usuario: /kills-update
Bot: 🔄 Actualizando... 
     📊 12 jugadores ganaron 247 adversarios
     🥇 [BOL] Raba +116 adversarios
     📨 Notificación enviada a #adversarios-ganados

Usuario: /kills jugador Raba
Bot: 👤 Análisis completo con botones navegables
     ⚔️ 1,650 kills totales (#45)
     🛡️ 1,534 defendiendo (#12)
```

¡Sistema completo y listo para usar! 🎉