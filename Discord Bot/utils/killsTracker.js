const fs = require('fs').promises;
const path = require('path');
const KillsDataManager = require('./killsData');
const GTDataManager = require('./gtData');

class KillsTracker {
    constructor() {
        this.killsManager = new KillsDataManager();
        this.gtManager = new GTDataManager();
        this.dataPath = path.join(__dirname, '..', 'data');
        this.trackerFile = path.join(this.dataPath, 'kills-tracker.json');
        this.backupPath = path.join(__dirname, '..', 'backups');
        this.lastData = null;
        
        // Cache en memoria para tracking entre verificaciones
        this.memoryCache = {
            lastCheck: null,
            data: null
        };
    }

    /**
     * Inicializa el tracker creando directorios si no existen
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            await fs.mkdir(this.backupPath, { recursive: true });
            console.log('[KillsTracker] Inicializado correctamente');
        } catch (error) {
            console.error('[KillsTracker] Error al inicializar:', error);
        }
    }

    /**
     * Carga los datos anteriores con múltiples fuentes
     */
    async loadPreviousData() {
        try {
            // Intentar cargar desde archivo principal
            const data = await fs.readFile(this.trackerFile, 'utf8');
            this.lastData = JSON.parse(data);
            console.log(`[KillsTracker] Datos anteriores cargados: ${this.lastData.timestamp}`);
            return true;
        } catch (error) {
            // Si no existe, intentar desde backup más reciente
            try {
                const backupFile = await this.getLatestBackup();
                if (backupFile) {
                    const data = await fs.readFile(backupFile, 'utf8');
                    this.lastData = JSON.parse(data);
                    console.log(`[KillsTracker] Datos cargados desde backup: ${this.lastData.timestamp}`);
                    return true;
                }
            } catch (backupError) {
                console.log('[KillsTracker] No se encontraron backups');
            }

            // Si no hay datos, usar el cache en memoria si existe
            if (this.memoryCache.data) {
                this.lastData = this.memoryCache.data;
                console.log(`[KillsTracker] Usando datos del cache en memoria: ${this.lastData.timestamp}`);
                return true;
            }

            console.log('[KillsTracker] No hay datos anteriores, iniciando tracking...');
            this.lastData = null;
            return false;
        }
    }

    /**
     * Obtiene el backup más reciente
     */
    async getLatestBackup() {
        try {
            const files = await fs.readdir(this.backupPath);
            const backupFiles = files
                .filter(file => file.startsWith('kills-tracker-') && file.endsWith('.json'))
                .sort()
                .reverse();

            if (backupFiles.length > 0) {
                return path.join(this.backupPath, backupFiles[0]);
            }
        } catch (error) {
            console.log('[KillsTracker] Error accediendo a backups:', error.message);
        }
        return null;
    }

    /**
     * Guarda los datos con backup y cache
     */
    async saveCurrentData(data) {
        try {
            // Guardar en archivo principal
            await fs.writeFile(this.trackerFile, JSON.stringify(data, null, 2));
            
            // Crear backup con timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupPath, `kills-tracker-${timestamp}.json`);
            await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
            
            // Actualizar cache en memoria
            this.memoryCache = {
                lastCheck: Date.now(),
                data: data
            };

            // Limpiar backups antiguos (mantener últimos 24)
            await this.cleanOldBackups();
            
            console.log(`[KillsTracker] Datos guardados: ${data.timestamp}`);
        } catch (error) {
            console.error('[KillsTracker] Error al guardar datos:', error);
            // Guardar al menos en cache si falla el archivo
            this.memoryCache = {
                lastCheck: Date.now(),
                data: data
            };
        }
    }

    /**
     * Limpia backups antiguos manteniendo los últimos 24
     */
    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupPath);
            const backupFiles = files
                .filter(file => file.startsWith('kills-tracker-') && file.endsWith('.json'))
                .sort()
                .reverse();

            // Eliminar archivos antiguos (mantener últimos 24)
            if (backupFiles.length > 24) {
                const filesToDelete = backupFiles.slice(24);
                for (const file of filesToDelete) {
                    await fs.unlink(path.join(this.backupPath, file));
                }
                console.log(`[KillsTracker] Limpiados ${filesToDelete.length} backups antiguos`);
            }
        } catch (error) {
            console.log('[KillsTracker] Error limpiando backups:', error.message);
        }
    }

    /**
     * Guarda los datos actuales para la próxima comparación
     */
    async saveCurrentDataOld(data) {
        try {
            await fs.writeFile(this.trackerFile, JSON.stringify(data, null, 2));
            console.log(`[KillsTracker] Datos guardados: ${data.timestamp}`);
        } catch (error) {
            console.error('[KillsTracker] Error al guardar datos:', error);
        }
    }

    /**
     * Obtiene los datos actuales de kills
     */
    async getCurrentKillsData() {
        const [allKills, attackKills, defenseKills, supportKills] = await Promise.all([
            this.killsManager.getAllKills(),
            this.killsManager.getAttackKills(),
            this.killsManager.getDefenseKills(),
            this.killsManager.getSupportKills()
        ]);

        const killsData = {
            timestamp: new Date().toISOString(),
            checkTime: Date.now(),
            all: this.arrayToMap(allKills),
            attack: this.arrayToMap(attackKills),
            defense: this.arrayToMap(defenseKills),
            support: this.arrayToMap(supportKills)
        };

        return killsData;
    }

    /**
     * Convierte array de kills a mapa con playerId como clave
     */
    arrayToMap(killsArray) {
        const map = {};
        killsArray.forEach(item => {
            map[item.playerId] = {
                kills: item.kills,
                ranking: item.ranking
            };
        });
        return map;
    }

    /**
     * Compara datos actuales con anteriores considerando tiempo transcurrido
     */
    compareKillsData(currentData, previousData) {
        const changes = {
            timestamp: currentData.timestamp,
            previousTimestamp: previousData.timestamp,
            timeDiff: new Date(currentData.timestamp) - new Date(previousData.timestamp),
            players: {}
        };

        const categories = ['all', 'attack', 'defense', 'support'];
        const categoryNames = {
            all: 'Totales',
            attack: 'Atacando', 
            defense: 'Defendiendo',
            support: 'Apoyo'
        };

        // Para cada categoría de kills
        categories.forEach(category => {
            const current = currentData[category];
            const previous = previousData[category] || {};

            // Revisar cada jugador en datos actuales
            Object.keys(current).forEach(playerId => {
                const currentKills = current[playerId].kills;
                const previousKills = previous[playerId]?.kills || 0;
                const killsDiff = currentKills - previousKills;

                // Solo considerar cambios significativos (>= 1 kill)
                if (killsDiff >= 1) {
                    if (!changes.players[playerId]) {
                        changes.players[playerId] = {
                            playerId: playerId,
                            categories: {}
                        };
                    }

                    changes.players[playerId].categories[category] = {
                        name: categoryNames[category],
                        previous: previousKills,
                        current: currentKills,
                        gained: killsDiff,
                        currentRanking: current[playerId].ranking,
                        previousRanking: previous[playerId]?.ranking || null
                    };
                }
            });
        });

        return changes;
    }

    /**
     * Enriquece los cambios con información de jugadores y tribus
     */
    async enrichChangesWithPlayerData(changes) {
        const playerIds = Object.keys(changes.players);
        if (playerIds.length === 0) return changes;

        try {
            // Limpiar cache para forzar datos frescos
            this.gtManager.cache.clear();
            
            const players = await this.gtManager.getPlayers();
            const tribes = await this.gtManager.getTribes();

            console.log(`[KillsTracker] Enriqueciendo datos para ${playerIds.length} jugadores con ${players.length} jugadores disponibles`);

            // Crear mapas para búsqueda rápida
            const playerMap = new Map(players.map(p => [p.id.toString(), p]));
            const tribeMap = new Map(tribes.map(t => [t.id.toString(), t]));

            // Enriquecer cada cambio de jugador
            Object.keys(changes.players).forEach(playerId => {
                const player = playerMap.get(playerId);
                if (player) {
                    const tribe = player.tribe ? tribeMap.get(player.tribe.toString()) : null;
                    
                    changes.players[playerId].playerData = {
                        name: player.name,
                        points: player.points,
                        rank: player.rank,
                        tribe: tribe ? {
                            tag: tribe.tag,
                            name: tribe.name,
                            rank: tribe.rank
                        } : null
                    };
                    
                    console.log(`[KillsTracker] Jugador ${playerId} -> ${player.name} [${tribe?.tag || 'Sin tribu'}]`);
                } else {
                    console.warn(`[KillsTracker] Jugador ${playerId} no encontrado en datos GT`);
                }
            });

            return changes;
        } catch (error) {
            console.error('[KillsTracker] Error enriqueciendo datos:', error);
            return changes;
        }
    }

    /**
     * Genera resumen de cambios
     */
    getChangesSummary(changes) {
        const players = Object.values(changes.players);
        
        if (players.length === 0) {
            return {
                hasChanges: false,
                totalPlayers: 0,
                totals: { all: 0, attack: 0, defense: 0, support: 0 },
                topGainers: [],
                summary: 'No se detectaron nuevos adversarios ganados',
                timeDiff: changes.timeDiff
            };
        }

        // Calcular totales por categoría
        const totals = { all: 0, attack: 0, defense: 0, support: 0 };

        players.forEach(player => {
            Object.keys(player.categories).forEach(category => {
                if (totals.hasOwnProperty(category)) {
                    totals[category] += player.categories[category].gained;
                }
            });
        });
        
        // No recalcular 'all' - debería venir directamente de los datos GT
        // La categoría 'all' ya incluye todos los adversarios (attack + defense + support)

        // Encontrar top gainers
        const topGainers = players
            .map(player => {
                // Si existe la categoría 'all', usar ese valor, si no sumar las específicas
                const totalGained = player.categories.all ? 
                    player.categories.all.gained : 
                    Object.values(player.categories).reduce((sum, cat) => sum + cat.gained, 0);
                return { ...player, totalGained };
            })
            .sort((a, b) => b.totalGained - a.totalGained)
            .slice(0, 5);

        return {
            hasChanges: true,
            totalPlayers: players.length,
            totals,
            topGainers,
            summary: `${players.length} jugadores ganaron adversarios en la última hora`
        };
    }

    /**
     * Ejecuta un ciclo completo de tracking con lógica mejorada
     */
    async trackKills(saveData = true) {
        console.log('[KillsTracker] Iniciando tracking de adversarios...');

        try {
            await this.initialize();
            const hadPreviousData = await this.loadPreviousData();
            const currentData = await this.getCurrentKillsData();

            if (hadPreviousData && this.lastData) {
                // Verificar que no sea un check muy reciente (evitar spam para verificaciones manuales)
                const timeSinceLastCheck = Date.now() - (this.lastData.checkTime || 0);
                const isRecentCheck = timeSinceLastCheck < 5 * 60 * 1000; // 5 minutos
                
                if (isRecentCheck) {
                    console.log(`[KillsTracker] Check reciente (${Math.round(timeSinceLastCheck/1000/60)} min), continuando con comparación normal`);
                }

                // Siempre hacer la comparación, independientemente del tiempo
                const changes = this.compareKillsData(currentData, this.lastData);
                const enrichedChanges = await this.enrichChangesWithPlayerData(changes);
                const summary = this.getChangesSummary(enrichedChanges);

                // Añadir información del tiempo transcurrido al summary
                summary.timeText = this.formatTimeDiff(changes.timeDiff);
                summary.timeDiff = changes.timeDiff;

                console.log(`[KillsTracker] Tracking completado: ${summary.summary}`);

                // IMPORTANTE: Solo guardar datos si se especifica (por defecto true)
                if (saveData) {
                    await this.saveCurrentData(currentData);
                    console.log('[KillsTracker] Datos guardados para próxima comparación');
                } else {
                    console.log('[KillsTracker] Modo preview - timestamp NO actualizado');
                }

                return {
                    changes: enrichedChanges,
                    summary
                };
            } else {
                // Primera ejecución o sin datos anteriores
                if (saveData) {
                    await this.saveCurrentData(currentData);
                    console.log('[KillsTracker] Datos base guardados. Tracking iniciará en la próxima verificación.');
                } else {
                    console.log('[KillsTracker] Modo preview - sin datos anteriores para comparar');
                }
                
                return {
                    changes: null,
                    summary: {
                        hasChanges: false,
                        totalPlayers: 0,
                        summary: saveData ? 'Datos base guardados. Tracking iniciará en la próxima verificación.' : 'Modo preview - sin datos anteriores para comparar',
                        timeDiff: 0
                    }
                };
            }

        } catch (error) {
            console.error('[KillsTracker] Error durante tracking:', error);
            throw error;
        }
    }

    /**
     * Preview de tracking sin guardar datos (para /kills-update)
     */
    async previewKills() {
        console.log('[KillsTracker] Ejecutando preview de tracking (sin actualizar timestamp)...');
        return await this.trackKills(false);
    }

    /**
     * Fuerza una actualización manual (para comando /kills-update)
     */
    async forceUpdate() {
        console.log('[KillsTracker] Forzando actualización manual...');
        return await this.trackKills();
    }

    /**
     * Formatea la diferencia de tiempo en texto legible
     */
    formatTimeDiff(timeDiffMs) {
        const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return hours === 1 ? '1 hora' : `${hours} horas`;
        } else if (minutes > 0) {
            return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
        } else {
            return 'menos de 1 minuto';
        }
    }

    /**
     * Obtiene información del estado del tracker
     */
    async getTrackerStatus() {
        try {
            await this.loadPreviousData();
            
            return {
                hasData: !!this.lastData,
                lastCheck: this.lastData?.timestamp || null,
                cacheStatus: this.memoryCache.data ? 'activo' : 'vacío',
                backupsAvailable: await this.countBackups()
            };
        } catch (error) {
            return {
                hasData: false,
                lastCheck: null,
                cacheStatus: 'error',
                backupsAvailable: 0
            };
        }
    }

    /**
     * Cuenta los backups disponibles
     */
    async countBackups() {
        try {
            const files = await fs.readdir(this.backupPath);
            return files.filter(file => file.startsWith('kills-tracker-') && file.endsWith('.json')).length;
        } catch (error) {
            return 0;
        }
    }
}

module.exports = KillsTracker;