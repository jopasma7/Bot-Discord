/**
 * Analizador de conquistas híbrido - Compatible con datos de TWStats y GT oficial
 * Procesa conquistas para determinar qué notificaciones enviar
 */
class HybridConquestAnalyzer {
    constructor() {
        this.processedConquests = new Set();
    }

    /**
     * Analiza conquistas para determinar cuáles notificar
     * Compatible con datos de TWStats (nombres) y GT oficial (IDs)
     */
    async analyzeConquests(conquests, targetTribeId, sinceTimestamp = 0, showAllConquests = false, tribeFilter = null) {
        console.log(`🔍 [Analyzer] Analizando ${conquests.length} conquistas`);
        console.log(`📅 [Analyzer] Filtrar desde: ${new Date(sinceTimestamp * 1000)}`);
        console.log(`🌍 [Analyzer] Mostrar todas: ${showAllConquests}`);
        
        const relevantConquests = [];
        
        for (const conquest of conquests) {
            // Solo procesar conquistas más recientes que el último check
            if (conquest.timestamp <= sinceTimestamp) {
                continue;
            }
            
            // Evitar procesar la misma conquista múltiples veces
            const conquestKey = this.getConquestKey(conquest);
            if (this.processedConquests.has(conquestKey)) {
                continue;
            }
            
            let isRelevant = false;
            let conquestType = null;
            
            // Determinar si la conquista es relevante
            if (showAllConquests) {
                // Mostrar TODAS las conquistas del mundo
                isRelevant = true;
                conquestType = this.determineConquestType(conquest, targetTribeId);
            } else if (tribeFilter) {
                // Aplicar filtro específico de tribus
                const filterResult = this.applyTribeFilter(conquest, tribeFilter, targetTribeId);
                isRelevant = filterResult.isRelevant;
                conquestType = filterResult.type;
            } else {
                // Solo conquistas que involucran a la tribu objetivo
                const tribeResult = this.checkTargetTribeInvolvement(conquest, targetTribeId);
                isRelevant = tribeResult.isRelevant;
                conquestType = tribeResult.type;
            }
            
            if (isRelevant) {
                // Crear objeto de conquista unificado
                const processedConquest = this.createUnifiedConquest(conquest, conquestType);
                relevantConquests.push(processedConquest);
                
                // Marcar como procesada
                this.processedConquests.add(conquestKey);
                
                console.log(`✅ [Analyzer] ${conquestType}: ${processedConquest.villageName} por ${processedConquest.newOwner.name}`);
            }
        }
        
        console.log(`🎯 [Analyzer] Resultado: ${relevantConquests.length} conquistas relevantes`);
        return relevantConquests;
    }
    
    /**
     * Genera clave única para identificar conquista
     */
    getConquestKey(conquest) {
        // Para TWStats: usar nombre + timestamp
        if (conquest.source === 'twstats') {
            return `twstats_${conquest.villageName}_${conquest.timestamp}`;
        }
        // Para GT oficial: usar villageId + timestamp
        return `gt_${conquest.villageId}_${conquest.timestamp}`;
    }
    
    /**
     * Determina tipo de conquista (GAIN/LOSS/NEUTRAL) para mostrar todas
     */
    determineConquestType(conquest, targetTribeId) {
        // Para TWStats, verificar por nombres de tribu
        if (conquest.source === 'twstats') {
            // Si conocemos el nombre de la tribu objetivo, podemos detectar GAIN/LOSS
            // Por ahora, marcamos como GAIN (conquista general)
            if (conquest.oldOwner.tribe === 'Bollo') {
                return 'LOSS';
            } else if (conquest.newOwner.tribe === 'Bollo') {
                return 'GAIN';
            } else {
                return 'NEUTRAL'; // Conquista entre otras tribus
            }
        }
        
        // Para GT oficial (si implementamos respaldo)
        return 'NEUTRAL';
    }
    
    /**
     * Aplica filtros específicos de tribus
     */
    applyTribeFilter(conquest, tribeFilter, targetTribeId) {
        if (tribeFilter.type === 'all') {
            return {
                isRelevant: true,
                type: this.determineConquestType(conquest, targetTribeId)
            };
        }
        
        // Otros tipos de filtros se pueden implementar aquí
        return { isRelevant: false, type: null };
    }
    
    /**
     * Verifica si la conquista involucra a la tribu objetivo
     */
    checkTargetTribeInvolvement(conquest, targetTribeId) {
        // Para TWStats, verificar por nombre "Bollo"
        if (conquest.source === 'twstats') {
            if (conquest.oldOwner.tribe === 'Bollo') {
                return { isRelevant: true, type: 'LOSS' };
            } else if (conquest.newOwner.tribe === 'Bollo') {
                return { isRelevant: true, type: 'GAIN' };
            }
        }
        
        return { isRelevant: false, type: null };
    }
    
    /**
     * Crea objeto de conquista unificado compatible con el sistema de notificaciones
     */
    createUnifiedConquest(conquest, conquestType) {
        // Formato unificado compatible con sendConquestAlert
        return {
            villageName: conquest.villageName,
            coordinates: conquest.coordinates,
            points: conquest.points,
            oldOwner: {
                name: conquest.oldOwner.name,
                tribe: conquest.oldOwner.tribe
            },
            newOwner: {
                name: conquest.newOwner.name,
                tribe: conquest.newOwner.tribe,
                tribeId: conquest.newOwner.tribe === 'Bollo' ? 47 : null
            },
            // Crear objetos compatibles con el formato esperado por sendConquestAlert
            village: {
                name: conquest.villageName,
                x: conquest.coordinates.x,
                y: conquest.coordinates.y,
                points: conquest.points
            },
            player: {
                name: conquest.newOwner.name,
                tribe: conquest.newOwner.tribe
            },
            timestamp: conquest.timestamp,
            date: conquest.date,
            type: conquestType,
            source: conquest.source || 'twstats'
        };
    }
    
    /**
     * Limpia conquistas procesadas antiguas
     */
    cleanOldProcessedConquests() {
        // Mantener solo las últimas 1000 conquistas procesadas
        if (this.processedConquests.size > 1000) {
            const conquestsArray = Array.from(this.processedConquests);
            this.processedConquests = new Set(conquestsArray.slice(-500));
        }
        
        console.log(`🧹 [Analyzer] Limpieza: ${this.processedConquests.size} conquistas en memoria`);
    }
}

module.exports = HybridConquestAnalyzer;