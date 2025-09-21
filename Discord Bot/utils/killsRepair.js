const fs = require('fs').promises;
const path = require('path');

/**
 * Repara el sistema de kills reseteando el timestamp de referencia
 * para capturar actividad de las últimas 24 horas
 */
async function repairKillsSystem() {
    try {
        console.log('🔧 [KillsRepair] Iniciando reparación del sistema de kills...');
        
        const killsTrackerFile = path.join(__dirname, 'data', 'kills-tracker.json');
        
        // Verificar si existe el archivo
        try {
            await fs.access(killsTrackerFile);
        } catch (error) {
            console.log('🔧 [KillsRepair] Archivo kills-tracker.json no encontrado, creando uno nuevo...');
            // Si no existe, crear estructura básica con timestamp de hace 24 horas
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const basicTracker = {
                timestamp: yesterday.toISOString(),
                checkTime: yesterday.getTime(),
                all: {},
                attack: {},
                defense: {},
                support: {}
            };
            
            // Crear directorio si no existe
            await fs.mkdir(path.dirname(killsTrackerFile), { recursive: true });
            await fs.writeFile(killsTrackerFile, JSON.stringify(basicTracker, null, 2));
            console.log('✅ [KillsRepair] Archivo kills-tracker.json creado con timestamp de hace 24h');
            return;
        }
        
        // Leer el archivo existente
        const data = await fs.readFile(killsTrackerFile, 'utf8');
        const trackerData = JSON.parse(data);
        
        // Verificar si el timestamp es muy reciente (menos de 1 hora)
        const currentTime = Date.now();
        const lastCheckTime = trackerData.checkTime || 0;
        const timeDifference = currentTime - lastCheckTime;
        const oneHour = 60 * 60 * 1000;
        
        if (timeDifference < oneHour) {
            console.log('🔧 [KillsRepair] Detectado timestamp muy reciente, reseteando a 24h atrás...');
            
            // Resetear a hace 24 horas
            const yesterday = new Date(currentTime - 24 * 60 * 60 * 1000);
            trackerData.timestamp = yesterday.toISOString();
            trackerData.checkTime = yesterday.getTime();
            
            // Guardar los cambios
            await fs.writeFile(killsTrackerFile, JSON.stringify(trackerData, null, 2));
            console.log('✅ [KillsRepair] Timestamp reseteado exitosamente a:', yesterday.toISOString());
        } else {
            console.log('🔧 [KillsRepair] Timestamp está en rango normal, no se requiere reparación');
        }
        
    } catch (error) {
        console.error('❌ [KillsRepair] Error reparando sistema de kills:', error);
    }
}

module.exports = { repairKillsSystem };