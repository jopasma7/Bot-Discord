const BuildingUpgradeAnalyzer = require('./buildingUpgradeAnalyzer');
const GTDataManager = require('./gtData');

/**
 * Tracker que monitorea periódicamente los puntos de las aldeas para detectar mejoras de edificios
 */
class VillagePointsTracker {
    constructor() {
        this.wallAnalyzer = new BuildingUpgradeAnalyzer(); // Mantenemos el nombre por compatibilidad
        this.gtDataManager = new GTDataManager();
        this.isTracking = false;
        this.trackingInterval = null;
        this.monitoredVillages = new Set(); // Aldeas específicas a monitorear
        
        // Configuración por defecto: cada 2 horas
        this.defaultInterval = 2 * 60 * 60 * 1000; // 2 horas en ms
    }

    /**
     * Inicializar el tracker
     */
    async initialize() {
        try {
            console.log('🏰 [VillageTracker] Inicializando tracker de puntos de aldeas...');
            
            // Inicializar GT Data Manager
            await this.gtDataManager.initialize();
            
            console.log('✅ [VillageTracker] Tracker inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ [VillageTracker] Error inicializando tracker:', error);
            return false;
        }
    }

    /**
     * Agregar aldea a monitoreo
     */
    addVillageToMonitoring(villageId) {
        this.monitoredVillages.add(villageId);
        console.log(`🎯 [VillageTracker] Aldea ${villageId} agregada al monitoreo`);
    }

    /**
     * Remover aldea del monitoreo
     */
    removeVillageFromMonitoring(villageId) {
        this.monitoredVillages.delete(villageId);
        console.log(`🚫 [VillageTracker] Aldea ${villageId} removida del monitoreo`);
    }

    /**
     * Obtener lista de aldeas monitoreadas
     */
    getMonitoredVillages() {
        return Array.from(this.monitoredVillages);
    }

    /**
     * Iniciar tracking automático
     */
    startTracking(intervalMs = null) {
        if (this.isTracking) {
            console.log('⚠️ [VillageTracker] El tracking ya está en curso');
            return false;
        }

        const interval = intervalMs || this.defaultInterval;
        
        console.log(`🚀 [VillageTracker] Iniciando tracking automático cada ${interval / (1000 * 60)} minutos`);
        
        // Ejecutar inmediatamente una vez
        this.performTracking();
        
        // Programar ejecuciones periódicas
        this.trackingInterval = setInterval(() => {
            this.performTracking();
        }, interval);
        
        this.isTracking = true;
        return true;
    }

    /**
     * Detener tracking automático
     */
    stopTracking() {
        if (!this.isTracking) {
            console.log('⚠️ [VillageTracker] No hay tracking activo para detener');
            return false;
        }

        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
        this.isTracking = false;
        
        console.log('🛑 [VillageTracker] Tracking automático detenido');
        return true;
    }

    /**
     * Realizar un ciclo de tracking
     */
    async performTracking() {
        try {
            console.log('📊 [VillageTracker] Iniciando ciclo de tracking...');
            
            const startTime = Date.now();
            let processedVillages = 0;
            let errors = 0;

            // Si no hay aldeas específicas monitoreadas, obtener todas las aldeas conocidas
            let villagesToTrack = Array.from(this.monitoredVillages);
            
            if (villagesToTrack.length === 0) {
                // Obtener aldeas de jugadores conocidos (por ejemplo, de tribus monitoreadas)
                const players = await this.gtDataManager.getAllPlayers();
                const knownVillages = new Set();
                
                // Recopilar aldeas de los primeros 100 jugadores más activos
                const activePlayers = players
                    .filter(p => p.points > 1000) // Solo jugadores con más de 1000 puntos
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 100);

                for (const player of activePlayers) {
                    const villages = await this.gtDataManager.getPlayerVillages(player.id);
                    villages.forEach(village => knownVillages.add(village.villageId));
                }
                
                villagesToTrack = Array.from(knownVillages);
                console.log(`🏘️ [VillageTracker] Tracking automático de ${villagesToTrack.length} aldeas`);
            }

            // Procesar aldeas en lotes para no sobrecargar
            const batchSize = 20;
            for (let i = 0; i < villagesToTrack.length; i += batchSize) {
                const batch = villagesToTrack.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (villageId) => {
                    try {
                        await this.trackSingleVillage(villageId);
                        processedVillages++;
                    } catch (error) {
                        console.error(`❌ [VillageTracker] Error tracking aldea ${villageId}:`, error);
                        errors++;
                    }
                }));
                
                // Pausa entre lotes para evitar saturar la API
                if (i + batchSize < villagesToTrack.length) {
                    await this.sleep(1000); // 1 segundo de pausa
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✅ [VillageTracker] Ciclo completado en ${duration}ms`);
            console.log(`📈 [VillageTracker] Procesadas: ${processedVillages}, Errores: ${errors}`);
            
            return {
                success: true,
                processedVillages,
                errors,
                duration
            };

        } catch (error) {
            console.error('❌ [VillageTracker] Error durante el ciclo de tracking:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Trackear una aldea específica
     */
    async trackSingleVillage(villageId) {
        try {
            // Obtener información actual de la aldea
            const villageInfo = await this.gtDataManager.getVillageInfo(villageId);
            
            if (!villageInfo || !villageInfo.points) {
                console.warn(`⚠️ [VillageTracker] No se pudo obtener info de aldea ${villageId}`);
                return false;
            }

            // Guardar snapshot de puntos
            const success = await this.wallAnalyzer.saveVillageSnapshot(
                villageId, 
                villageInfo.points
            );

            if (success) {
                console.log(`📝 [VillageTracker] Snapshot guardado para aldea ${villageId}: ${villageInfo.points} puntos`);
            }

            return success;
        } catch (error) {
            console.error(`❌ [VillageTracker] Error tracking aldea ${villageId}:`, error);
            return false;
        }
    }

    /**
     * Obtener análisis de mejoras de muralla para una aldea
     */
    /**
     * Analizar mejoras de muralla de una aldea
     * @deprecated - Usar analyzeBuildingUpgrades en su lugar
     */
    async analyzeVillageWallUpgrades(villageId, hoursBack = 24) {
        try {
            const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
            const analysis = this.wallAnalyzer.analyzeWallUpgrades(villageId, startTime);
            
            return analysis;
        } catch (error) {
            console.error(`❌ [VillageTracker] Error analizando mejoras de aldea ${villageId}:`, error);
            return {
                success: false,
                message: 'Error interno durante el análisis'
            };
        }
    }

    /**
     * Analizar mejoras de edificios de una aldea
     */
    async analyzeBuildingUpgrades(villageId, buildingType = 'all', hoursBack = 24) {
        try {
            const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
            const analysis = this.wallAnalyzer.analyzeBuildingUpgrades(villageId, buildingType, startTime);
            
            return analysis;
        } catch (error) {
            console.error(`❌ [VillageTracker] Error analizando mejoras de edificios de aldea ${villageId}:`, error);
            return {
                success: false,
                message: 'Error interno durante el análisis'
            };
        }
    }

    /**
     * Obtener estadísticas del tracker
     */
    getTrackerStats() {
        return {
            isTracking: this.isTracking,
            monitoredVillages: this.monitoredVillages.size,
            interval: this.defaultInterval / (1000 * 60), // en minutos
            nextRun: this.isTracking ? 
                new Date(Date.now() + this.defaultInterval).toISOString() : 
                null
        };
    }

    /**
     * Función de utilidad para pausas
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        if (this.isTracking) {
            this.stopTracking();
        }
        console.log('🧹 [VillageTracker] Recursos limpiados');
    }
}

module.exports = VillagePointsTracker;