# 🏰 Filtro de Tribus - Guía de Uso

## ✨ Nueva Funcionalidad: `/monitoreo-conquistas tribus`

### 🎯 ¿Qué hace?
Permite configurar qué tribus mostrar en el canal de **ganancias de conquistas**. Las pérdidas de "Bollo" siempre se muestran independientemente del filtro.

### 📋 Opciones Disponibles

#### 🌍 **Todas las tribus**
```
/monitoreo-conquistas tribus filtro:🌍 Todas las tribus
```
- **Efecto**: Muestra conquistas de CUALQUIER tribu en el canal de ganancias
- **Uso recomendado**: Para tener vista completa de toda la actividad del mundo
- **Ventaja**: Máxima información, detecta patrones globales
- **Desventaja**: Puede ser mucha información si hay muchas conquistas

#### 🏰 **Tribu específica**
```
/monitoreo-conquistas tribus filtro:🏰 Tribu específica nombre-tribu:SiN TeMoR
```
- **Efecto**: Solo muestra conquistas de la tribu especificada
- **Uso recomendado**: Para monitorear enemigos específicos o aliados
- **Ventaja**: Información muy enfocada y relevante
- **Desventaja**: Puede perderse actividad de otras tribus importantes

### 🔍 Ejemplos de Tribus Disponibles
Basado en el ranking actual:
- `GORDOS y CALVOS`
- `SiN TeMoR` 
- `Los Bollitos` (nuestra tribu)
- `Horda Dormilona`
- `Cantaba la Rana`
- `Holocausto Caníbal`
- `aNs-Team`
- `SIEMPRE PATOS`

### 📊 Cómo Ver la Configuración Actual
```
/monitoreo-conquistas estado
```
Ahora muestra una línea adicional con el filtro activo:
- `🌍 Filtro: Todas las tribus`
- `🏰 Filtro: Solo "SiN TeMoR"`

### ⚠️ Notas Importantes

1. **Las pérdidas NO se filtran**: Siempre verás cuando "Bollo" pierde aldeas, independientemente del filtro
2. **Búsqueda flexible**: El nombre de tribu se busca de forma parcial (no tiene que ser exacto)
3. **Configuración persistente**: El filtro se mantiene hasta que lo cambies
4. **Solo administradores**: Como otros comandos de monitoreo, solo los admins pueden configurar

### 🚀 Casos de Uso Recomendados

#### **Modo Guerra** 🔥
```
/monitoreo-conquistas modo velocidad:⚡ Intensivo
/monitoreo-conquistas tribus filtro:🏰 Tribu específica nombre-tribu:SiN TeMoR
```
Para monitorear intensivamente a un enemigo específico durante conflictos.

#### **Modo Vigilancia General** 👁️
```
/monitoreo-conquistas modo velocidad:🔄 Normal
/monitoreo-conquistas tribus filtro:🌍 Todas las tribus
```
Para tener una vista completa de toda la actividad del mundo.

#### **Modo Aliado** 🤝
```
/monitoreo-conquistas tribus filtro:🏰 Tribu específica nombre-tribu:aNs-Team
```
Para seguir las conquistas de una tribu aliada.

### 🔧 Comandos Completos de Configuración

```bash
# Configuración recomendada para guerra
/monitoreo-conquistas activar canal-ganancias:#conquistas canal-perdidas:#alertas
/monitoreo-conquistas modo velocidad:⚡ Intensivo
/monitoreo-conquistas tribus filtro:🏰 Tribu específica nombre-tribu:SiN TeMoR

# Configuración para monitoreo general
/monitoreo-conquistas modo velocidad:🔄 Normal  
/monitoreo-conquistas tribus filtro:🌍 Todas las tribus

# Ver estado actual
/monitoreo-conquistas estado
```