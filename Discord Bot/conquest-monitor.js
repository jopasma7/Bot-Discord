const fetch = require('node-fetch');

class ConquestMonitor {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.conquerUrl = 'https://es95.guerrastribales.es/map/conquer.txt';
        this.lastConquestId = null;
        this.processedConquests = new Set();
    }

    /**
     * Parsea una línea del archivo conquer.txt
     * Formato: village_id,timestamp,new_owner_id,old_owner_id
     */
    parseConquestLine(line) {
        const parts = line.trim().split(',');
        if (parts.length !== 4) return null;

        return {
            villageId: parseInt(parts[0]),
            timestamp: parseInt(parts[1]),
            newOwnerId: parseInt(parts[2]) || 0,
            oldOwnerId: parseInt(parts[3]) || 0,
            date: new Date(parseInt(parts[1]) * 1000)
        };
    }

    /**
     * Obtiene las conquistas más recientes desde el archivo conquer.txt
     */
    async fetchRecentConquests() {
        try {
            const response = await fetch(this.conquerUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const lines = text.trim().split('\n');
            
            const conquests = [];
            for (const line of lines) {
                const conquest = this.parseConquestLine(line);
                if (conquest) {
                    conquests.push(conquest);
                }
            }
            
            // Ordenar por timestamp (más reciente primero)
            return conquests.sort((a, b) => b.timestamp - a.timestamp);
            
        } catch (error) {
            console.error('Error fetching conquests:', error);
            return [];
        }
    }

    /**
     * Verifica si un jugador pertenece a una tribu específica
     */
    async getPlayerTribe(playerId) {
        try {
            const players = await this.dataManager.getPlayers();
            const player = players.find(p => p.id === playerId);
            return player ? (player.tribeId || player.tribe || 0) : 0;
        } catch (error) {
            console.error('Error getting player tribe:', error);
            return 0;
        }
    }

    /**
     * Obtiene información detallada de una aldea
     */
    async getVillageInfo(villageId) {
        try {
            const villages = await this.dataManager.getVillages();
            const village = villages.find(v => v.id === villageId);
            return village || null;
        } catch (error) {
            console.error('Error getting village info:', error);
            return null;
        }
    }

    /**
     * Obtiene información detallada de un jugador
     */
    async getPlayerInfo(playerId) {
        try {
            const players = await this.dataManager.getPlayers();
            const player = players.find(p => p.id === playerId);
            return player || null;
        } catch (error) {
            console.error('Error getting player info:', error);
            return null;
        }
    }

    /**
     * Obtiene el nombre de una tribu por su ID
     */
    async getTribeName(tribeId) {
        try {
            const tribes = await this.dataManager.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            return tribe ? tribe.name : null;
        } catch (error) {
            console.error('Error getting tribe name:', error);
            return null;
        }
    }

    /**
     * Analiza las conquistas y detecta las relevantes para la tribu monitoreada
     */
    async analyzeConquests(conquests, targetTribeId, sinceTimestamp = 0, showAllConquests = false, tribeFilter = null) {
        const relevantConquests = [];
        
        for (const conquest of conquests) {
            // Solo procesar conquistas más recientes que el último check
            if (conquest.timestamp <= sinceTimestamp) continue;
            
            // Evitar procesar la misma conquista múltiples veces
            const conquestKey = `${conquest.villageId}_${conquest.timestamp}`;
            if (this.processedConquests.has(conquestKey)) continue;
            
            let isRelevant = false;
            let conquestType = null;
            let relevantPlayerId = null;
            
            // Caso 1: Miembro de la tribu objetivo pierde una aldea
            if (conquest.oldOwnerId > 0) {
                const oldOwnerTribe = await this.getPlayerTribe(conquest.oldOwnerId);
                if (oldOwnerTribe === targetTribeId) {
                    isRelevant = true;
                    conquestType = 'LOSS';
                    relevantPlayerId = conquest.oldOwnerId;
                }
            }
            
            // Caso 2: Conquistas basadas en filtro de tribus
            if (conquest.newOwnerId > 0) {
                if (showAllConquests) {
                    // Mostrar TODAS las conquistas
                    isRelevant = true;
                    conquestType = 'GAIN';
                    relevantPlayerId = conquest.newOwnerId;
                } else if (tribeFilter) {
                    // Aplicar filtro de tribus para ganancias
                    if (tribeFilter.type === 'all') {
                        // Mostrar conquistas de todas las tribus
                        isRelevant = true;
                        conquestType = 'GAIN';
                        relevantPlayerId = conquest.newOwnerId;
                    } else if (tribeFilter.type === 'specific' && tribeFilter.specificTribe) {
                        // Solo mostrar conquistas de una tribu específica
                        const newOwnerTribe = await this.getPlayerTribe(conquest.newOwnerId);
                        if (newOwnerTribe > 0) {
                            const tribeName = await this.getTribeName(newOwnerTribe);
                            if (tribeName && 
                                tribeName.toLowerCase().includes(tribeFilter.specificTribe.toLowerCase())) {
                                isRelevant = true;
                                conquestType = 'GAIN';
                                relevantPlayerId = conquest.newOwnerId;
                            }
                        }
                    }
                } else {
                    // Solo conquistas de la tribu objetivo (comportamiento por defecto)
                    const newOwnerTribe = await this.getPlayerTribe(conquest.newOwnerId);
                    if (newOwnerTribe === targetTribeId) {
                        isRelevant = true;
                        conquestType = 'GAIN';
                        relevantPlayerId = conquest.newOwnerId;
                    }
                }
            }
            
            if (isRelevant) {
                const villageInfo = await this.getVillageInfo(conquest.villageId);
                const playerInfo = await this.getPlayerInfo(relevantPlayerId);
                const oldOwnerInfo = conquest.oldOwnerId > 0 ? await this.getPlayerInfo(conquest.oldOwnerId) : null;
                const newOwnerInfo = conquest.newOwnerId > 0 ? await this.getPlayerInfo(conquest.newOwnerId) : null;
                
                relevantConquests.push({
                    ...conquest,
                    type: conquestType,
                    village: villageInfo,
                    player: playerInfo,
                    oldOwner: oldOwnerInfo,
                    newOwner: newOwnerInfo
                });
                
                // Marcar como procesada
                this.processedConquests.add(conquestKey);
            }
        }
        
        return relevantConquests;
    }

    /**
     * Limpia conquistas procesadas antiguas (más de 24 horas)
     */
    cleanOldProcessedConquests() {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        // En un entorno real, deberías persistir esto en un archivo o base de datos
        // Por simplicidad, mantenemos solo las últimas 1000 conquistas procesadas
        if (this.processedConquests.size > 1000) {
            const conquestsArray = Array.from(this.processedConquests);
            this.processedConquests = new Set(conquestsArray.slice(-500));
        }
    }
}

module.exports = ConquestMonitor;