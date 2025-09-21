const fetch = require('node-fetch');

class VillageActivityAnalyzer {
    constructor() {
        this.twstatsBaseUrl = 'https://es.twstats.com/es95';
    }

    /**
     * Convierte coordenadas X|Y al ID de village de TWStats
     */
    async getVillageIdFromCoordinates(x, y) {
        try {
            // Usar el sistema GT existente para obtener datos de aldeas
            const GTDataManager = require('./gtData');
            const gtData = new GTDataManager();
            
            const villages = await gtData.getVillages();
            const village = villages.find(v => v.x === x && v.y === y);
            
            if (village) {
                return village.id;
            }

            throw new Error('No se pudo encontrar el ID de la aldea');

        } catch (error) {
            console.error(`[ActivityAnalyzer] Error obteniendo village ID para ${x}|${y}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de actividad de una aldea desde TWStats
     */
    async getVillageHistory(villageId) {
        try {
            const villageUrl = `${this.twstatsBaseUrl}/index.php?page=village&id=${villageId}`;
            console.log(`[ActivityAnalyzer] Obteniendo historial de aldea ID: ${villageId}`);
            
            // Crear un AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
            
            const response = await fetch(villageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            
            // Parsear información básica de la aldea
            const villageInfo = this.parseVillageInfo(html);
            
            // Parsear historial de actividad
            const history = this.parseVillageHistory(html);
            
            return {
                ...villageInfo,
                history
            };

        } catch (error) {
            console.error(`[ActivityAnalyzer] Error obteniendo historial para village ${villageId}:`, error);
            
            // Crear un mensaje de error más específico según el tipo de error
            let errorMessage = 'Error desconocido';
            if (error.name === 'AbortError') {
                errorMessage = 'Timeout: TWStats tardó demasiado en responder';
            } else if (error.message.includes('HTTP')) {
                errorMessage = `TWStats respondió con error ${error.message}`;
            } else if (error.message.includes('fetch') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage = 'No se pudo conectar con TWStats (servidor no disponible)';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Timeout conectando con TWStats';
            }
            
            // Re-lanzar el error con más contexto
            throw new Error(errorMessage);
        }
    }

    /**
     * Parsea la información básica de la aldea desde el HTML
     */
    parseVillageInfo(html) {
        const info = {
            name: 'Desconocida',
            owner: 'Desconocido',
            tribe: null,
            points: 0,
            coordinates: { x: 0, y: 0 }
        };

        try {
            // Extraer nombre de la aldea
            const nameMatch = html.match(/<h2[^>]*>([^<]+)</);
            if (nameMatch) {
                info.name = nameMatch[1].trim();
            }

            // Extraer propietario
            const ownerMatch = html.match(/Propietario[^:]*:?\s*<[^>]*>([^<]+)</i);
            if (ownerMatch) {
                info.owner = ownerMatch[1].trim();
            }

            // Extraer tribu si existe
            const tribeMatch = html.match(/Tribu[^:]*:?\s*<[^>]*>([^<]+)</i);
            if (tribeMatch && tribeMatch[1].trim() !== '-' && tribeMatch[1].trim() !== '') {
                info.tribe = tribeMatch[1].trim();
            }

            // Extraer puntos
            const pointsMatch = html.match(/(\d{1,3}(?:[,\.]\d{3})*)\s*puntos/i);
            if (pointsMatch) {
                info.points = parseInt(pointsMatch[1].replace(/[,\.]/g, ''));
            }

            // Extraer coordenadas
            const coordMatch = html.match(/(\d{1,3})\|(\d{1,3})/);
            if (coordMatch) {
                info.coordinates.x = parseInt(coordMatch[1]);
                info.coordinates.y = parseInt(coordMatch[2]);
            }

        } catch (error) {
            console.error('[ActivityAnalyzer] Error parseando info básica:', error);
        }

        return info;
    }

    /**
     * Parsea el historial de la aldea desde el HTML de TWStats
     */
    parseVillageHistory(html) {
        const history = [];
        
        try {
            // Buscar la tabla del historial
            const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
            
            if (!tableMatch) {
                console.log('[ActivityAnalyzer] No se encontró tabla de historial');
                return history;
            }

            // Buscar la tabla que contiene el historial (normalmente la más grande)
            let historyTable = '';
            for (const table of tableMatch) {
                if (table.includes('2025-') && table.includes('+')) {
                    historyTable = table;
                    break;
                }
            }

            if (!historyTable) {
                console.log('[ActivityAnalyzer] No se encontró tabla de historial válida');
                return history;
            }

            // Extraer filas de la tabla
            const rowMatches = historyTable.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            
            for (const row of rowMatches) {
                const cells = row.match(/<td[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</gi);
                if (!cells || cells.length < 4) continue;

                // Limpiar contenido de las celdas
                const cleanCells = cells.map(cell => 
                    cell.replace(/<[^>]*>/g, '').trim()
                );

                // Parsear fecha y hora (formato esperado: 2025-09-21 14:04)
                const dateTimeMatch = cleanCells[0]?.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
                if (!dateTimeMatch) continue;

                const [, date, time] = dateTimeMatch;
                const points = parseInt(cleanCells[1]) || 0;
                const change = parseInt(cleanCells[2]?.replace('+', '')) || 0;
                
                // Parsear tiempo transcurrido (3º columna: 1h, 2h, 4h, 6h, etc.)
                const timeGapMatch = cleanCells[3]?.match(/(\d+)h/);
                const hoursGap = timeGapMatch ? parseInt(timeGapMatch[1]) : 1;

                if (points > 0) {
                    history.push({
                        timestamp: `${date} ${time}`,
                        points,
                        change,
                        hoursGap, // NUEVO: tiempo transcurrido desde la anterior
                        hour: parseInt(time.split(':')[0])
                    });
                }
            }

            console.log(`[ActivityAnalyzer] Parseadas ${history.length} entradas de historial`);
            
        } catch (error) {
            console.error('[ActivityAnalyzer] Error parseando historial:', error);
        }

        return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Analiza patrones de actividad considerando factores realistas del juego
     */
    analyzeActivityPatterns(history, playerPoints = null) {
        if (!history || history.length === 0) {
            return {
                confidence: 'low',
                timezone: 'unknown',
                pattern: 'Insuficientes datos para análisis'
            };
        }

        // Analizar el nivel del jugador basado en los puntos de los registros históricos
        // Los registros con puntos <= 2500 son más confiables (menos colas automáticas)
        const earlyGameEntries = history.filter(entry => entry.points && entry.points <= 2500);
        const totalReliableEntries = earlyGameEntries.length;
        const reliabilityPercentage = history.length > 0 ? (totalReliableEntries / history.length) * 100 : 0;
        
        const isEarlyGameDominant = reliabilityPercentage >= 50; // Más del 50% son registros confiables
        const analysisWeight = isEarlyGameDominant ? 'high' : 'medium';

        // Agrupar actividad por días para detectar patrones repetitivos
        const dailyPatterns = this.groupActivityByDays(history);
        
        // Detectar períodos de VERDADERA inactividad basándose en hoursGap
        const realInactivityPeriods = this.findRealInactivityPeriods(history);
        
        // Buscar patrones repetitivos de inactividad (mismo horario varios días)
        const consistentSleepPatterns = this.findConsistentSleepPatterns(realInactivityPeriods);

        // Contar actividad por hora del día (método original mejorado)
        const hourlyActivity = new Array(24).fill(0);
        let totalActivity = 0;

        history.forEach(entry => {
            if (entry.hour >= 0 && entry.hour < 24) {
                hourlyActivity[entry.hour]++;
                totalActivity++;
            }
        });

        // Calcular porcentajes
        const hourlyPercentages = hourlyActivity.map(count => 
            totalActivity > 0 ? (count / totalActivity * 100) : 0
        );

        // Determinar zona horaria basándose en patrones reales
        const timezoneAnalysis = this.determineTimezoneAdvanced(
            consistentSleepPatterns, 
            realInactivityPeriods, 
            isEarlyGameDominant
        );

        return {
            totalEntries: history.length,
            reliableEntries: totalReliableEntries,
            reliabilityPercentage: Math.round(reliabilityPercentage),
            playerLevel: isEarlyGameDominant ? 'early_game' : 'advanced',
            analysisWeight,
            analysisRange: {
                from: history[history.length - 1]?.timestamp,
                to: history[0]?.timestamp
            },
            hourlyActivity: hourlyPercentages.map((percentage, hour) => ({
                hour: `${hour.toString().padStart(2, '0')}:00`,
                percentage: Math.round(percentage * 10) / 10,
                count: hourlyActivity[hour]
            })),
            realInactivityPeriods,
            consistentSleepPatterns,
            timezone: timezoneAnalysis.timezone,
            confidence: timezoneAnalysis.confidence,
            pattern: timezoneAnalysis.pattern,
            insights: this.generateAdvancedInsights(
                hourlyPercentages, 
                realInactivityPeriods, 
                consistentSleepPatterns, 
                isEarlyGameDominant,
                totalReliableEntries,
                reliabilityPercentage
            )
        };
    }

    /**
     * Agrupa la actividad por días para detectar patrones repetitivos
     */
    groupActivityByDays(history) {
        const dailyPatterns = {};
        
        history.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dailyPatterns[date]) {
                dailyPatterns[date] = new Array(24).fill(false);
            }
            dailyPatterns[date][entry.hour] = true;
        });
        
        return dailyPatterns;
    }

    /**
     * Encuentra períodos de verdadera inactividad basándose en hoursGap largos
     */
    findRealInactivityPeriods(history) {
        const inactivityPeriods = [];
        
        // Buscar entradas con hoursGap >= 4 (indica inactividad real)
        for (let i = 0; i < history.length; i++) {
            const entry = history[i];
            
            if (entry.hoursGap >= 4) { // 4+ horas = inactividad real
                const timestamp = new Date(entry.timestamp);
                const startHour = (timestamp.getHours() - entry.hoursGap + 24) % 24;
                const endHour = timestamp.getHours();
                
                inactivityPeriods.push({
                    date: entry.timestamp.split(' ')[0],
                    start: startHour,
                    end: endHour,
                    duration: entry.hoursGap,
                    timestamp: entry.timestamp,
                    confidence: entry.hoursGap >= 6 ? 'high' : 'medium'
                });
            }
        }
        
        return inactivityPeriods;
    }

    /**
     * Encuentra patrones consistentes de sueño (mismo horario varios días)
     */
    findConsistentSleepPatterns(realInactivityPeriods) {
        const sleepPatterns = {};
        
        // Agrupar por rango de horas similar
        realInactivityPeriods.forEach(period => {
            const key = `${period.start}-${period.end}`;
            if (!sleepPatterns[key]) {
                sleepPatterns[key] = [];
            }
            sleepPatterns[key].push(period);
        });
        
        // Filtrar patrones que se repiten al menos 2 veces
        const consistentPatterns = Object.entries(sleepPatterns)
            .filter(([_, periods]) => periods.length >= 2)
            .map(([timeRange, periods]) => ({
                timeRange,
                frequency: periods.length,
                averageStart: Math.round(periods.reduce((sum, p) => sum + p.start, 0) / periods.length),
                averageEnd: Math.round(periods.reduce((sum, p) => sum + p.end, 0) / periods.length),
                averageDuration: Math.round(periods.reduce((sum, p) => sum + p.duration, 0) / periods.length),
                dates: periods.map(p => p.date)
            }));
        
        return consistentPatterns.sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Determina zona horaria con análisis avanzado
     */
    determineTimezoneAdvanced(consistentSleepPatterns, realInactivityPeriods, isEarlyGame) {
        if (consistentSleepPatterns.length === 0) {
            return {
                timezone: 'UTC±?',
                confidence: 'muy baja',
                pattern: 'Sin patrones consistentes de inactividad detectados'
            };
        }
        
        // Usar el patrón más frecuente como base
        const primaryPattern = consistentSleepPatterns[0];
        const sleepStart = primaryPattern.averageStart;
        const sleepEnd = primaryPattern.averageEnd;
        
        // Mapear horas de sueño típicas a zonas horarias
        // Asumiendo sueño típico entre 23:00-07:00 hora local
        let timezoneOffset = 0;
        
        if (sleepStart >= 21 && sleepStart <= 23) {
            // Sueño nocturno normal (21:00-23:00 UTC)
            // Si duerme a las 23:00 UTC, probablemente sea UTC+0 durmiendo a las 23:00 locales
            // Si duerme a las 22:00 UTC, probablemente sea UTC+1 durmiendo a las 23:00 locales
            timezoneOffset = 23 - sleepStart;
        } else if (sleepStart >= 0 && sleepStart <= 6) {
            // Sueño madrugada (00:00-06:00 UTC)
            // Si duerme a las 00:00 UTC, probablemente sea UTC+1 durmiendo a las 01:00 locales
            // Si duerme a las 01:00 UTC, probablemente sea UTC+2 durmiendo a las 03:00 locales
            // Si duerme a las 02:00 UTC, probablemente sea UTC+3 durmiendo a las 05:00 locales
            timezoneOffset = sleepStart + 1;
        } else if (sleepStart >= 7 && sleepStart <= 12) {
            // Sueño muy temprano - probablemente zonas asiáticas
            timezoneOffset = sleepStart - 1;
        } else {
            // Horarios poco comunes entre 13:00-20:00 UTC
            // Calcular basándose en horario más probable de sueño
            if (sleepStart >= 13 && sleepStart <= 17) {
                // Probablemente sea zona muy adelantada (Australia/Asia)
                timezoneOffset = sleepStart - 14;
            } else {
                // 18:00-20:00 UTC, zonas intermedias
                timezoneOffset = sleepStart - 20;
            }
        }
        
        // Limitar el offset a rangos válidos (-12 a +14)
        timezoneOffset = Math.max(-12, Math.min(14, timezoneOffset));
        
        const confidence = this.calculateConfidence(primaryPattern, realInactivityPeriods, isEarlyGame);
        
        return {
            timezone: this.formatTimezone(timezoneOffset),
            confidence: confidence.level,
            pattern: `Patrón de inactividad ${sleepStart}:00-${sleepEnd}:00 (${primaryPattern.frequency} días)`,
            details: {
                sleepWindow: `${sleepStart}:00-${sleepEnd}:00`,
                frequency: primaryPattern.frequency,
                duration: primaryPattern.averageDuration,
                confidence: confidence.percentage
            }
        };
    }

    /**
     * Calcula la confianza del análisis
     */
    calculateConfidence(primaryPattern, allInactivityPeriods, isEarlyGame) {
        let confidence = 0;
        
        // Factor base: frecuencia del patrón
        const frequencyScore = Math.min(primaryPattern.frequency * 15, 60);
        confidence += frequencyScore;
        
        // Factor: duración del período de inactividad
        const durationScore = Math.min(primaryPattern.averageDuration * 5, 30);
        confidence += durationScore;
        
        // Factor: consistencia horaria
        const timeConsistency = primaryPattern.frequency > 2 ? 10 : 0;
        confidence += timeConsistency;
        
        // Bonus para jugadores early game (datos más confiables)
        if (isEarlyGame) {
            confidence += 15;
        }
        
        // Penalización si hay muy pocos datos
        if (allInactivityPeriods.length < 5) {
            confidence -= 20;
        }
        
        confidence = Math.max(0, Math.min(100, confidence));
        
        let level;
        if (confidence >= 80) level = 'muy alta';
        else if (confidence >= 60) level = 'alta';
        else if (confidence >= 40) level = 'media';
        else if (confidence >= 20) level = 'baja';
        else level = 'muy baja';
        
        return {
            percentage: Math.round(confidence),
            level
        };
    }

    /**
     * Genera insights avanzados del análisis
     */
    generateAdvancedInsights(hourlyPercentages, realInactivityPeriods, consistentSleepPatterns, isEarlyGame, totalReliableEntries, reliabilityPercentage) {
        const insights = [];
        
        // Información de confiabilidad basada en puntos de registros
        const roundedPercentage = Math.round(reliabilityPercentage);
        if (reliabilityPercentage >= 70) {
            insights.push(`📈 ${roundedPercentage}% registros confiables (≤2500 puntos) - Análisis muy fiable`);
        } else if (reliabilityPercentage >= 40) {
            insights.push(`⚠️ ${roundedPercentage}% registros confiables (≤2500 puntos) - Análisis moderado`);
        } else {
            insights.push(`🔴 Solo ${roundedPercentage}% registros confiables (≤2500 puntos) - Muchas colas automáticas`);
        }
        
        // Nivel de desarrollo durante el período
        if (isEarlyGame) {
            insights.push('🌱 Período principalmente de desarrollo inicial (datos más confiables)');
        } else {
            insights.push('⚔️ Período de jugador avanzado (posibles colas de construcción automáticas)');
        }
        
        // Patrones de sueño
        if (consistentSleepPatterns.length > 0) {
            const main = consistentSleepPatterns[0];
            insights.push(`😴 Patrón de inactividad consistente: ${main.timeRange.replace('-', ':00-')}:00`);
            insights.push(`📊 Se repite ${main.frequency} veces en el período analizado`);
            
            if (main.averageDuration >= 6) {
                insights.push('✅ Períodos largos de inactividad sugieren sueño real');
            } else {
                insights.push('⚠️ Períodos cortos - podrían ser descansos o pausas');
            }
        } else {
            insights.push('❌ No se detectaron patrones consistentes de inactividad');
        }
        
        // Cantidad de datos
        if (realInactivityPeriods.length >= 10) {
            insights.push('📈 Suficientes datos para análisis confiable');
        } else {
            insights.push('⚠️ Pocos períodos de inactividad detectados');
        }
        
        // Recomendaciones
        if (consistentSleepPatterns.length === 0) {
            insights.push('💡 Recomendación: Esperar más datos o verificar actividad manual');
        }
        
        return insights;
    }

    /**
     * Formatea la zona horaria
     */
    /**
     * Formatea la zona horaria con continentes
     */
    formatTimezone(offset) {
        // Mapear offsets a continentes principales
        const timezoneMap = {
            '-12': 'Pacífico',
            '-11': 'Oceanía',
            '-10': 'Oceanía',
            '-9': 'América',
            '-8': 'América',
            '-7': 'América',
            '-6': 'América',
            '-5': 'América',
            '-4': 'América',
            '-3': 'América',
            '-2': 'América',
            '-1': 'Europa',
            '0': 'Europa',
            '1': 'Europa',
            '2': 'Europa',
            '3': 'Europa/Asia',
            '4': 'Asia',
            '5': 'Asia',
            '6': 'Asia',
            '7': 'Asia',
            '8': 'Asia',
            '9': 'Asia',
            '10': 'Asia/Oceanía',
            '11': 'Oceanía',
            '12': 'Oceanía',
            '13': 'Oceanía',
            '14': 'Oceanía'
        };

        const offsetStr = offset.toString();
        return timezoneMap[offsetStr] || 'Zona desconocida';
    }



    /**
     * Encuentra los picos de actividad
     */
    findActivityPeaks(hourlyPercentages) {
        const peaks = [];
        const threshold = Math.max(5, Math.max(...hourlyPercentages) * 0.6); // Umbral dinámico

        for (let i = 0; i < hourlyPercentages.length; i++) {
            if (hourlyPercentages[i] >= threshold) {
                peaks.push({
                    hour: i,
                    percentage: Math.round(hourlyPercentages[i] * 10) / 10
                });
            }
        }

        return peaks.sort((a, b) => b.percentage - a.percentage);
    }

    /**
     * Encuentra períodos de baja actividad/inactividad
     */
    findInactivityPeriods(hourlyPercentages) {
        const inactive = [];
        const threshold = Math.max(...hourlyPercentages) * 0.2; // 20% del pico máximo

        for (let i = 0; i < hourlyPercentages.length; i++) {
            if (hourlyPercentages[i] <= threshold) {
                inactive.push({
                    hour: i,
                    percentage: Math.round(hourlyPercentages[i] * 10) / 10
                });
            }
        }

        return inactive;
    }

    /**
     * Determina la zona horaria más probable basada en los patrones
     */
    determineTimezone(peaks, inactivePeriods) {
        // Analizar patrones típicos
        const nightHours = inactivePeriods.filter(p => p.hour >= 2 && p.hour <= 6);
        const morningActivity = peaks.filter(p => p.hour >= 7 && p.hour <= 11);
        const eveningActivity = peaks.filter(p => p.hour >= 19 && p.hour <= 23);

        let timezone = 'UTC+1 (España/Europa Central)';
        let confidence = 'medium';
        let pattern = '';

        if (nightHours.length >= 3 && (morningActivity.length > 0 || eveningActivity.length > 0)) {
            // Patrón típico europeo/español
            timezone = 'UTC+1 (España/Europa Central)';
            confidence = 'high';
            pattern = 'Patrón típico español: inactividad nocturna (2-6h) y actividad matutina/vespertina';
        } else if (inactivePeriods.find(p => p.hour >= 14 && p.hour <= 18)) {
            // Posible horario americano (inactivo durante día europeo)
            timezone = 'UTC-5/-6 (América)';
            confidence = 'medium';
            pattern = 'Posible horario americano: inactividad durante día europeo';
        } else if (peaks.find(p => p.hour >= 22 || p.hour <= 2)) {
            // Actividad nocturna, posible horario asiático o nocturno europeo
            timezone = 'UTC+1 (España) - Jugador nocturno';
            confidence = 'medium';
            pattern = 'Patrón nocturno: actividad durante horas tardías';
        } else {
            timezone = 'Indeterminado';
            confidence = 'low';
            pattern = 'Patrón irregular o datos insuficientes';
        }

        return { timezone, confidence, pattern };
    }

    /**
     * Genera insights adicionales sobre el comportamiento del jugador
     */
    generateInsights(hourlyPercentages, peaks, inactivePeriods) {
        const insights = [];

        // Análisis de consistencia
        const maxActivity = Math.max(...hourlyPercentages);
        const consistentHours = hourlyPercentages.filter(p => p >= maxActivity * 0.5).length;
        
        if (consistentHours <= 4) {
            insights.push('🎯 Jugador muy consistente: juega en horarios fijos');
        } else if (consistentHours >= 8) {
            insights.push('⏰ Jugador activo durante muchas horas del día');
        }

        // Análisis de tipo de jugador
        if (peaks.some(p => p.hour >= 6 && p.hour <= 9)) {
            insights.push('🌅 Jugador madrugador: actividad temprana');
        }
        
        if (peaks.some(p => p.hour >= 22 || p.hour <= 2)) {
            insights.push('🌙 Jugador nocturno: actividad tardía');
        }

        // Análisis de disponibilidad
        const workHours = peaks.filter(p => p.hour >= 9 && p.hour <= 17).length;
        if (workHours === 0) {
            insights.push('💼 Probable horario laboral/estudiantil: sin actividad 9-17h');
        } else if (workHours >= 3) {
            insights.push('🏠 Posible jugador con horario flexible o jubilado');
        }

        return insights;
    }
}

module.exports = VillageActivityAnalyzer;