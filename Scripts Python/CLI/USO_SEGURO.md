# 🛡️ Guía de Uso Seguro - Analizador GT

## ⚠️ IMPORTANTE: Cambios por Detección de Automatismo

Este programa ha sido modificado para **evitar la detección automática** por parte de los administradores de Guerras Tribales.

## 🔒 Nuevas Características de Seguridad

### ✅ Comportamiento Humano Simulado
- **User-Agent consistente**: Mantiene el mismo navegador durante toda la sesión
- **Delays variables**: Entre 20-90 segundos, con patrones impredecibles
- **Pausas de lectura**: Simula tiempo humano leyendo páginas
- **Descansos de sesión**: Pausas automáticas de 5-10 minutos cada 15 requests
- **Procesamiento 100% secuencial**: Sin hilos ni paralelismo (más seguro)

### ✅ Límites Conservadores
- **Máximo 30 requests por sesión**
- **Máximo 5 mundos por sesión** 
- **Sesiones limitadas a 30 minutos**
- **Paradas automáticas** para evitar sobrecargar
- **Una sola petición a la vez** (no hay paralelismo)

### ✅ Headers Realistas y Consistentes
- Simula que siempre usas el mismo navegador desde tu PC
- Headers completos y consistentes durante toda la sesión
- Solo varia detalles menores ocasionalmente (como hace un navegador real)
- No cambia constantemente de navegador (más realista)

### ✅ Seguridad de Credenciales
- **Variables de entorno**: Credenciales no están en el código
- **Cookies protegidas**: No se suben al repositorio
- **Archivo .gitignore**: Evita subir datos sensibles
- **Configuración externa**: Credenciales fuera del código fuente

## 📋 Recomendaciones de Uso

### 🕐 **Timing Recomendado**
```
✅ BUENO:
- Usarlo 1-2 veces al día máximo
- Sesiones cortas (15-30 minutos)
- Horarios humanos normales (9:00-22:00)

❌ EVITAR:
- Uso 24/7 o muy frecuente
- Sesiones de varias horas
- Uso en horarios raros (3:00 AM)
```

### 🎯 **Estrategia Segura**
1. **Planifica tu análisis**: Decide qué necesitas antes de empezar
2. **Usa el modo manual**: Selecciona mundos específicos en lugar de "todos"
3. **Respeta las pausas**: No canceles los descansos obligatorios
4. **Sesiones distribuidas**: Si necesitas más datos, hazlo en varias sesiones separadas

### 🚫 **Cosas que NO Hacer**
- No ejecutar el programa en bucle
- No usar múltiples instancias simultáneas
- No intentar saltar las limitaciones de seguridad
- No usar en servidores/VPS (usar desde PC personal)

## 🛠️ Configuración de Seguridad

### 🔑 Configuración de Credenciales (IMPORTANTE)
**Las credenciales ya NO están en el código.** Debes configurarlas como variables de entorno:

#### Windows (CMD):
```cmd
set GT_USERNAME=tu_usuario
set GT_PASSWORD=tu_contraseña
```

#### Windows (PowerShell):
```powershell
$env:GT_USERNAME="tu_usuario"
$env:GT_PASSWORD="tu_contraseña"
```

#### Linux/Mac:
```bash
export GT_USERNAME=tu_usuario
export GT_PASSWORD=tu_contraseña
```

### Archivos modificados:
- `utils/stealth.py` - Simulación de comportamiento humano
- `utils/safe_mode.py` - Límites y restricciones de seguridad
- `funciones/registro.py` - Delays y headers mejorados (SIN threading)
- `funciones/bans.py` - Comportamiento más humano (CON límites)
- `funciones/players.py` - Búsquedas menos agresivas
- `utils/config.py` - Credenciales por variables de entorno
- `.gitignore` - Protección de archivos sensibles

### Configuración actual:
```python
LÍMITES_SEGUROS = {
    "max_requests_per_session": 30,     # Máximo por sesión
    "max_worlds_per_session": 5,        # Máximo mundos
    "min_delay": 20,                    # Mínimo entre requests
    "max_delay": 90,                    # Máximo entre requests
    "mandatory_breaks": True,           # Descansos obligatorios
}
```

## 🚨 Señales de Alarma

### Si ves estos mensajes, PARA inmediatamente:
- Errores 429 (Too Many Requests)
- Errores 403 (Forbidden)  
- Páginas que piden CAPTCHA
- Mensajes de "actividad sospechosa"
- Respuestas extrañamente lentas del servidor

### En caso de problemas:
1. **Para el programa inmediatamente**
2. **Espera al menos 24 horas** antes de volver a usarlo
3. **Contacta con administradores** si recibes advertencias
4. **Considera usar métodos manuales** temporalmente

## 💡 Alternativas Manuales

Si el riesgo es muy alto, considera:
- Consultas manuales ocasionales
- Uso de la interfaz web normal
- Análisis de datos ya recopilados
- Herramientas oficiales si están disponibles

## 📞 Soporte

Si tienes dudas sobre el uso seguro:
1. Revisa este README
2. Consulta los logs del programa
3. Usa el modo más conservador posible
4. Cuando en duda, usa menos, no más

---

**Recuerda**: Es mejor obtener menos datos de forma segura que arriesgarse a una prohibición permanente.
