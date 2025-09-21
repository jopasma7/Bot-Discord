const fs = require('fs');
const path = require('path');

/**
 * Sistema de análisis de mejoras de edificios basado en incremento de puntos
 */
class BuildingUpgradeAnalyzer {
    constructor() {
        this.buildingPointsPath = path.join(__dirname, '..', 'data', 'building-points', 'building-points.json');
        this.villageHistoryPath = path.join(__dirname, '..', 'data', 'village-history');
        this.buildingPoints = null;
        
        this.initializeDirectories();
        this.loadBuildingPoints();
    }

    /**
     * Inicializar directorios necesarios
     */
    initializeDirectories() {
        if (!fs.existsSync(this.villageHistoryPath)) {
            fs.mkdirSync(this.villageHistoryPath, { recursive: true });
            console.log('📁 [BuildingAnalyzer] Directorio de historial de aldeas creado');
        }
    }

    /**
     * Cargar datos de puntos por edificio
     */
    loadBuildingPoints() {
        try {
            const data = fs.readFileSync(this.buildingPointsPath, 'utf8');
            this.buildingPoints = JSON.parse(data);
            console.log('📊 [BuildingAnalyzer] Datos de puntos de edificios cargados');
        } catch (error) {
            console.error('❌ [BuildingAnalyzer] Error cargando puntos de edificios:', error);
            throw new Error('No se pudieron cargar los datos de puntos de edificios');
        }
    }

    /**
     * Guardar snapshot de puntos de una aldea
     */
    async saveVillageSnapshot(villageId, currentPoints, timestamp = null) {
        try {
            const snapshotTime = timestamp || new Date().toISOString();
            const villageFile = path.join(this.villageHistoryPath, `village_${villageId}.json`);
            
            let history = [];
            if (fs.existsSync(villageFile)) {
                const existingData = fs.readFileSync(villageFile, 'utf8');
                history = JSON.parse(existingData);
            }
            
            // Agregar nuevo snapshot
            history.push({
                timestamp: snapshotTime,
                points: currentPoints
            });
            
            // Mantener solo los últimos 30 días
            const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
            history = history.filter(snapshot => new Date(snapshot.timestamp) > thirtyDaysAgo);
            
            // Ordenar por timestamp
            history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            fs.writeFileSync(villageFile, JSON.stringify(history, null, 2));
            console.log(`📝 [BuildingAnalyzer] Snapshot guardado para aldea ${villageId}: ${currentPoints} puntos`);
            
            return true;
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error guardando snapshot de aldea ${villageId}:`, error);
            return false;
        }
    }

    /**
     * Obtener historial de una aldea
     */
    getVillageHistory(villageId) {
        try {
            const villageFile = path.join(this.villageHistoryPath, `village_${villageId}.json`);
            
            if (!fs.existsSync(villageFile)) {
                return [];
            }
            
            const data = fs.readFileSync(villageFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error obteniendo historial de aldea ${villageId}:`, error);
            return [];
        }
    }

    /**
     * Analizar posibles mejoras de edificios basándose en incremento de puntos
     */
    analyzeBuildingUpgrades(villageId, buildingType = 'all', startTime = null, endTime = null) {
        try {
            const history = this.getVillageHistory(villageId);
            
            if (history.length < 2) {
                return {
                    success: false,
                    message: 'No hay suficientes datos históricos para el análisis'
                };
            }
            
            // Filtrar por rango de tiempo si se especifica
            let filteredHistory = history;
            if (startTime) {
                filteredHistory = filteredHistory.filter(h => new Date(h.timestamp) >= new Date(startTime));
            }
            if (endTime) {
                filteredHistory = filteredHistory.filter(h => new Date(h.timestamp) <= new Date(endTime));
            }
            
            if (filteredHistory.length < 2) {
                return {
                    success: false,
                    message: 'No hay suficientes datos en el período especificado'
                };
            }
            
            const analysis = [];
            
            // Analizar cada par consecutivo de snapshots
            for (let i = 1; i < filteredHistory.length; i++) {
                const previous = filteredHistory[i - 1];
                const current = filteredHistory[i];
                const pointsDiff = current.points - previous.points;
                
                if (pointsDiff > 0) {
                    const possibleUpgrades = this.calculatePossibleBuildingUpgrades(pointsDiff, buildingType);
                    
                    if (possibleUpgrades.length > 0) {
                        analysis.push({
                            from: previous.timestamp,
                            to: current.timestamp,
                            pointsGained: pointsDiff,
                            previousPoints: previous.points,
                            currentPoints: current.points,
                            possibleUpgrades: possibleUpgrades,
                            timeSpan: this.formatTimeSpan(previous.timestamp, current.timestamp)
                        });
                    }
                }
            }
            
            return {
                success: true,
                villageId: villageId,
                buildingType: buildingType,
                totalSnapshots: filteredHistory.length,
                analysisCount: analysis.length,
                upgrades: analysis,
                summary: this.generateUpgradeSummary(analysis, buildingType)
            };
            
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error analizando mejoras de edificios para aldea ${villageId}:`, error);
            return {
                success: false,
                message: 'Error interno durante el análisis'
            };
        }
    }

    /**
     * Analizar posibles mejoras de muralla basándose en incremento de puntos
     * @deprecated - Usar analyzeBuildingUpgrades en su lugar
     */
    analyzeWallUpgrades(villageId, startTime = null, endTime = null) {
        return this.analyzeBuildingUpgrades(villageId, 'wall', startTime, endTime);
    }

    /**
     * Calcular posibles mejoras de edificios basándose en puntos ganados
     */
    calculatePossibleBuildingUpgrades(pointsGained, buildingType = 'all') {
        const possibleUpgrades = [];
        
        try {
            // Si se especifica un tipo de edificio específico
            if (buildingType !== 'all' && this.buildingPoints.buildings[buildingType]) {
                const building = this.buildingPoints.buildings[buildingType];
                return this.findUpgradesForBuilding(pointsGained, buildingType, building);
            }
            
            // Si es 'all', buscar en todos los edificios
            for (const [buildingName, buildingData] of Object.entries(this.buildingPoints.buildings)) {
                const upgrades = this.findUpgradesForBuilding(pointsGained, buildingName, buildingData);
                possibleUpgrades.push(...upgrades);
            }
            
            // También buscar combinaciones de múltiples edificios
            const combinations = this.findCombinationUpgrades(pointsGained, buildingType);
            possibleUpgrades.push(...combinations);
            
            // Ordenar por probabilidad (menos edificios involucrados = más probable)
            return possibleUpgrades.sort((a, b) => {
                if (a.buildings && b.buildings) {
                    return a.buildings.length - b.buildings.length;
                }
                return 0;
            });
            
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error calculando posibles mejoras:`, error);
            return [];
        }
    }

    /**
     * Buscar mejoras posibles para un edificio específico
     */
    findUpgradesForBuilding(pointsGained, buildingName, buildingData) {
        const upgrades = [];
        
        // Mejora de un solo nivel
        for (let level = 0; level < buildingData.points.length - 1; level++) {
            const upgradeCost = buildingData.points[level + 1] - buildingData.points[level];
            if (upgradeCost === pointsGained) {
                upgrades.push({
                    type: 'single',
                    building: buildingName,
                    fromLevel: level,
                    toLevel: level + 1,
                    pointsCost: upgradeCost,
                    probability: 'Alta'
                });
            }
        }
        
        // Mejoras de múltiples niveles consecutivos
        for (let startLevel = 0; startLevel < buildingData.points.length - 2; startLevel++) {
            for (let endLevel = startLevel + 2; endLevel < Math.min(buildingData.points.length, startLevel + 6); endLevel++) {
                const totalCost = buildingData.points[endLevel] - buildingData.points[startLevel];
                if (totalCost === pointsGained) {
                    upgrades.push({
                        type: 'multiple',
                        building: buildingName,
                        fromLevel: startLevel,
                        toLevel: endLevel,
                        pointsCost: totalCost,
                        levelsUpgraded: endLevel - startLevel,
                        probability: 'Media'
                    });
                }
            }
        }
        
        return upgrades;
    }

    /**
     * Buscar combinaciones de mejoras de múltiples edificios
     */
    findCombinationUpgrades(pointsGained, buildingType = 'all') {
        const combinations = [];
        const maxCombinations = 3; // Limitar para evitar explosión combinatoria
        
        try {
            const buildingList = buildingType === 'all' 
                ? Object.keys(this.buildingPoints.buildings)
                : [buildingType];
            
            // Combinaciones de 2 edificios
            for (let i = 0; i < buildingList.length; i++) {
                for (let j = i + 1; j < buildingList.length; j++) {
                    const combo = this.findTwoBuildingCombination(
                        pointsGained, 
                        buildingList[i], 
                        buildingList[j]
                    );
                    combinations.push(...combo);
                }
            }
            
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error buscando combinaciones:`, error);
        }
        
        return combinations.slice(0, 10); // Limitar resultados
    }

    /**
     * Buscar combinación de mejoras entre dos edificios
     */
    findTwoBuildingCombination(pointsGained, building1Name, building2Name) {
        const combinations = [];
        
        try {
            const building1 = this.buildingPoints.buildings[building1Name];
            const building2 = this.buildingPoints.buildings[building2Name];
            
            if (!building1 || !building2) return combinations;
            
            // Probar combinaciones de 1 nivel de cada edificio
            for (let level1 = 0; level1 < building1.points.length - 1; level1++) {
                const cost1 = building1.points[level1 + 1] - building1.points[level1];
                
                for (let level2 = 0; level2 < building2.points.length - 1; level2++) {
                    const cost2 = building2.points[level2 + 1] - building2.points[level2];
                    
                    if (cost1 + cost2 === pointsGained) {
                        combinations.push({
                            type: 'combination',
                            buildings: [
                                {
                                    building: building1Name,
                                    fromLevel: level1,
                                    toLevel: level1 + 1,
                                    pointsCost: cost1
                                },
                                {
                                    building: building2Name,
                                    fromLevel: level2,
                                    toLevel: level2 + 1,
                                    pointsCost: cost2
                                }
                            ],
                            totalPointsCost: pointsGained,
                            probability: 'Baja'
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ [BuildingAnalyzer] Error en combinación de edificios:`, error);
        }
        
        return combinations.slice(0, 5); // Limitar resultados
    }

    /**
     * Calcular posibles niveles de muralla basándose en puntos ganados
     * @deprecated - Usar calculatePossibleBuildingUpgrades en su lugar
     */
    calculatePossibleWallUpgrades(pointsGained) {
        const wallPoints = this.buildingPoints.buildings.wall.points;
        const possibleUpgrades = [];
        
        // Buscar combinaciones de upgrades que sumen los puntos ganados
        for (let fromLevel = 0; fromLevel < wallPoints.length - 1; fromLevel++) {
            for (let toLevel = fromLevel + 1; toLevel < wallPoints.length; toLevel++) {
                const upgradeCost = wallPoints[toLevel] - wallPoints[fromLevel];
                
                if (upgradeCost === pointsGained) {
                    possibleUpgrades.push({
                        fromLevel: fromLevel,
                        toLevel: toLevel,
                        pointsUsed: upgradeCost,
                        levelsGained: toLevel - fromLevel
                    });
                }
            }
        }
        
        // También buscar múltiples upgrades que sumen el total
        if (possibleUpgrades.length === 0) {
            const multiUpgrades = this.findMultipleWallUpgrades(pointsGained);
            possibleUpgrades.push(...multiUpgrades);
        }
        
        return possibleUpgrades;
    }

    /**
     * Buscar múltiples upgrades de muralla que sumen los puntos dados
     */
    findMultipleWallUpgrades(targetPoints) {
        const wallPoints = this.buildingPoints.buildings.wall.points;
        const singleUpgradeCosts = [];
        
        // Calcular costos de upgrades individuales
        for (let i = 0; i < wallPoints.length - 1; i++) {
            singleUpgradeCosts.push({
                fromLevel: i,
                toLevel: i + 1,
                cost: wallPoints[i + 1] - wallPoints[i]
            });
        }
        
        // Buscar combinaciones que sumen el objetivo (máximo 5 upgrades para evitar explosión combinatoria)
        const combinations = [];
        this.findUpgradeCombinations(singleUpgradeCosts, targetPoints, [], 0, 5, combinations);
        
        return combinations.map(combo => ({
            isMultipleUpgrade: true,
            upgrades: combo.upgrades,
            totalPointsUsed: combo.totalCost,
            upgradeCount: combo.upgrades.length
        }));
    }

    /**
     * Buscar combinaciones recursivamente
     */
    findUpgradeCombinations(upgradeCosts, target, current, startIndex, maxUpgrades, results) {
        if (current.length > maxUpgrades) return;
        
        const currentSum = current.reduce((sum, upgrade) => sum + upgrade.cost, 0);
        
        if (currentSum === target) {
            results.push({
                upgrades: [...current],
                totalCost: currentSum
            });
            return;
        }
        
        if (currentSum > target) return;
        
        for (let i = startIndex; i < upgradeCosts.length; i++) {
            current.push(upgradeCosts[i]);
            this.findUpgradeCombinations(upgradeCosts, target, current, i, maxUpgrades, results);
            current.pop();
        }
    }

    /**
     * Generar resumen de mejoras
     */
    /**
     * Generar resumen de mejoras detectadas
     */
    generateUpgradeSummary(analysis, buildingType = 'all') {
        if (analysis.length === 0) {
            return {
                totalUpgradePeriods: 0,
                totalPointsFromBuildings: 0,
                buildingStats: {},
                mostLikelyUpgrades: [],
                confidenceLevel: 'low'
            };
        }
        
        let totalPointsFromBuildings = 0;
        const buildingStats = {};
        const allUpgrades = [];
        
        // Procesar cada período de análisis
        analysis.forEach(period => {
            totalPointsFromBuildings += period.pointsGained;
            
            if (period.possibleUpgrades) {
                period.possibleUpgrades.forEach(upgrade => {
                    allUpgrades.push(upgrade);
                    
                    // Estadísticas por edificio
                    if (upgrade.type === 'single' || upgrade.type === 'multiple') {
                        const buildingName = upgrade.building;
                        if (!buildingStats[buildingName]) {
                            buildingStats[buildingName] = {
                                count: 0,
                                totalLevels: 0,
                                totalPoints: 0
                            };
                        }
                        buildingStats[buildingName].count++;
                        buildingStats[buildingName].totalPoints += upgrade.pointsCost;
                        buildingStats[buildingName].totalLevels += (upgrade.toLevel - upgrade.fromLevel);
                    } else if (upgrade.type === 'combination') {
                        upgrade.buildings.forEach(building => {
                            const buildingName = building.building;
                            if (!buildingStats[buildingName]) {
                                buildingStats[buildingName] = {
                                    count: 0,
                                    totalLevels: 0,
                                    totalPoints: 0
                                };
                            }
                            buildingStats[buildingName].count++;
                            buildingStats[buildingName].totalPoints += building.pointsCost;
                            buildingStats[buildingName].totalLevels += (building.toLevel - building.fromLevel);
                        });
                    }
                });
            }
        });
        
        // Contar frecuencia de tipos de mejoras
        const upgradeFrequency = {};
        allUpgrades.forEach(upgrade => {
            let key;
            if (upgrade.type === 'single') {
                key = `${upgrade.building}_${upgrade.fromLevel}_to_${upgrade.toLevel}`;
            } else if (upgrade.type === 'multiple') {
                key = `${upgrade.building}_multiple_${upgrade.levelsUpgraded}`;
            } else if (upgrade.type === 'combination') {
                key = `combination_${upgrade.buildings.length}_buildings`;
            }
            
            if (key) {
                upgradeFrequency[key] = (upgradeFrequency[key] || 0) + 1;
            }
        });
        
        const mostLikelyUpgrades = Object.entries(upgradeFrequency)
            .map(([key, count]) => ({ upgrade: key, frequency: count }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
        
        const confidenceLevel = analysis.length >= 5 ? 'high' : 
                               analysis.length >= 2 ? 'medium' : 'low';
        
        return {
            totalUpgradePeriods: analysis.length,
            totalPointsFromBuildings: totalPointsFromBuildings,
            buildingStats: buildingStats,
            mostLikelyUpgrades: mostLikelyUpgrades,
            confidenceLevel: confidenceLevel,
            buildingType: buildingType
        };
    }

    /**
     * Formatear duración entre timestamps
     */
    formatTimeSpan(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}

module.exports = BuildingUpgradeAnalyzer;