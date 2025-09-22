/**
 * Analizador de conquistas híbrido - Compatible con datos de TWStats y GT oficial
 * Procesa conquistas para determinar qué notifi        return {
            timestamp: conquest.timestamp,
            coordinates: conquest.coordinates,
            points: conquest.points,
            oldOwner: {
                name: conquest.oldOwner?.name || 'Desconocido',
                tribe: conquest.oldOwner?.tribe || 'Sin tribu'
            },
            newOwner: {
                name: conquest.newOwner?.name || 'Desconocido',
                tribe: conquest.newOwner?.tribe || 'Sin tribu',
                tribeId: conquest.newOwner?.tribe === 'Bollo' ? 47 : null
            },ar
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
        console.log(`🌍 [Analyzer] Configuración: showAllConquests=${showAllConquests}, tribeFilter=${JSON.stringify(tribeFilter)}`);
        
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
            
            // Determinar qué tipo de conquista es respecto a Bollo
            const bolloType = this.determineConquestType(conquest, targetTribeId);
            
            // Procesar según la configuración de filtros
            const processedConquests = this.processConquestByFilter(conquest, bolloType, tribeFilter);
            
            // Agregar conquistas procesadas
            for (const processedConquest of processedConquests) {
                if (processedConquest && processedConquest.villageName) {
                    relevantConquests.push(processedConquest);
                    this.processedConquests.add(conquestKey);
                    console.log(`✅ [Analyzer] ${processedConquest.type}: ${processedConquest.villageName} por ${processedConquest.newOwner.name}`);
                }
            }
        }
        
        console.log(`🎯 [Analyzer] Resultado: ${relevantConquests.length} conquistas relevantes`);
        return relevantConquests;
    }
    
    /**
     * Procesa una conquista según el filtro configurado
     * Retorna array de conquistas procesadas (puede ser 0, 1 o 2 conquistas)
     */
    processConquestByFilter(conquest, bolloType, tribeFilter) {
        const results = [];
        
        // Determinar configuración del filtro
        const isAllTribes = !tribeFilter || tribeFilter.type === 'all';
        const specificTribe = tribeFilter?.type === 'specific' ? tribeFilter.specificTribe : null;
        
        console.log(`🔍 [Filter] Procesando: ${conquest.villageName} | BolloType: ${bolloType} | Filtro: ${isAllTribes ? 'TODAS' : specificTribe}`);
        
        if (isAllTribes) {
            // FILTRO: "Todas las tribus"
            // Canal GAIN: TODAS las conquistas del mundo
            // Canal LOSS: Solo pérdidas de Bollo
            
            if (bolloType === 'LOSS') {
                // Pérdida de Bollo → Canal LOSS
                results.push(this.createUnifiedConquest(conquest, 'LOSS'));
                console.log(`🔴 [Filter] → Canal LOSS (pérdida de Bollo)`);
            }
            
            // TODAS las conquistas → Canal GAIN (como información general)
            // Pero marcamos diferente las que no son de Bollo
            const gainType = bolloType === 'GAIN' ? 'GAIN' : 'GAIN_INFO';
            results.push(this.createUnifiedConquest(conquest, gainType));
            console.log(`🟢 [Filter] → Canal GAIN (${gainType})`);
            
        } else if (specificTribe) {
            // FILTRO: "Tribu específica"
            // Canal GAIN: Solo conquistas de la tribu específica
            // Canal LOSS: Pérdidas de Bollo + pérdidas de tribu específica
            
            const involvesSpecificTribe = conquest.oldOwner?.tribe === specificTribe || conquest.newOwner?.tribe === specificTribe;
            
            if (bolloType === 'LOSS') {
                // Pérdida de Bollo → siempre Canal LOSS
                results.push(this.createUnifiedConquest(conquest, 'LOSS'));
                console.log(`🔴 [Filter] → Canal LOSS (pérdida de Bollo)`);
            }
            
            if (involvesSpecificTribe) {
                if (conquest.oldOwner?.tribe === specificTribe) {
                    // La tribu específica perdió → Canal LOSS
                    results.push(this.createUnifiedConquest(conquest, 'LOSS_SPECIFIC'));
                    console.log(`🔴 [Filter] → Canal LOSS (pérdida de ${specificTribe})`);
                }
                
                if (conquest.newOwner?.tribe === specificTribe) {
                    // La tribu específica ganó → Canal GAIN
                    results.push(this.createUnifiedConquest(conquest, 'GAIN'));
                    console.log(`🟢 [Filter] → Canal GAIN (conquista de ${specificTribe})`);
                }
            }
        }
        
        return results;
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
        console.log(`🔍 [Filter] Aplicando filtro: ${JSON.stringify(tribeFilter)} a conquista de ${conquest.villageName}`);
        
        // Si el filtro es para mostrar todas las tribus
        if (tribeFilter === 'all' || (typeof tribeFilter === 'object' && tribeFilter.type === 'all')) {
            console.log(`🌍 [Filter] Mostrando TODAS las tribus - pero solo relevantes para Bollo`);
            
            // Para "todas las tribus", solo mostrar conquistas que involucren a Bollo
            const conquestType = this.determineConquestType(conquest, targetTribeId);
            
            // Solo procesar si involucra a Bollo (GAIN o LOSS), ignorar NEUTRAL
            if (conquestType === 'GAIN' || conquestType === 'LOSS') {
                console.log(`✅ [Filter] Conquista relevante para Bollo: ${conquestType}`);
                return {
                    isRelevant: true,
                    type: conquestType
                };
            } else {
                console.log(`❌ [Filter] Conquista NEUTRAL ignorada (no involucra a Bollo)`);
                return { isRelevant: false, type: null };
            }
        }
        
        // Si el filtro es para una tribu específica
        if (typeof tribeFilter === 'string') {
            const targetTribe = tribeFilter;
            console.log(`🏰 [Filter] Filtrando por tribu específica: "${targetTribe}"`);
            
            // Verificar si alguna de las tribus involucradas coincide
            if (conquest.oldOwner?.tribe === targetTribe || conquest.newOwner?.tribe === targetTribe) {
                console.log(`✅ [Filter] Conquista relevante para tribu "${targetTribe}"`);
                return {
                    isRelevant: true,
                    type: this.determineConquestType(conquest, targetTribeId)
                };
            }
        }
        
        console.log(`❌ [Filter] Conquista no relevante para el filtro configurado`);
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
        // Verificaciones de seguridad para evitar errores de undefined
        const oldOwner = conquest.oldOwner || {};
        const newOwner = conquest.newOwner || {};
        const coordinates = conquest.coordinates || { x: 0, y: 0 };
        
        // Formato unificado compatible con sendConquestAlert
        return {
            villageName: conquest.villageName || 'Unknown Village',
            coordinates: coordinates,
            points: conquest.points || 0,
            oldOwner: {
                name: oldOwner.name || 'Unknown Player',
                tribe: oldOwner.tribe || 'No Tribe'
            },
            newOwner: {
                name: newOwner.name || 'Unknown Player',
                tribe: newOwner.tribe || 'No Tribe',
                tribeId: newOwner.tribe === 'Bollo' ? 47 : null
            },
            // Crear objetos compatibles con el formato esperado por sendConquestAlert
            village: {
                name: conquest.villageName || 'Unknown Village',
                x: coordinates.x,
                y: coordinates.y,
                points: conquest.points || 0
            },
            player: {
                name: newOwner.name || 'Unknown Player',
                tribe: newOwner.tribe || 'No Tribe'
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