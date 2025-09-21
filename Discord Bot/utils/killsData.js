const fetch = require('node-fetch');
const zlib = require('zlib');
const fs = require('fs').promises;
const path = require('path');

class KillsDataManager {
    constructor() {
        this.cache = {
            kill_all: { data: null, lastFetch: 0 },
            kill_att: { data: null, lastFetch: 0 },
            kill_def: { data: null, lastFetch: 0 },
            kill_sup: { data: null, lastFetch: 0 }
        };
        this.cacheTime = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.baseUrl = 'https://es95.guerrastribales.es/map/';
        this.dataPath = path.join(__dirname, '..', 'data', 'kills');
        this.initializeDataDirectory();
    }

    /**
     * Inicializa el directorio de datos si no existe
     */
    async initializeDataDirectory() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            console.log('[KillsData] Directorio de datos inicializado');
        } catch (error) {
            console.error('[KillsData] Error creando directorio:', error);
        }
    }

    /**
     * Obtiene la ruta del archivo local para un tipo de kill
     */
    getLocalFilePath(type) {
        return path.join(this.dataPath, `${type}.txt.gz`);
    }

    /**
     * Carga datos desde archivo local si existe
     */
    async loadFromLocalFile(type) {
        try {
            const filePath = this.getLocalFilePath(type);
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
            
            if (!fileExists) {
                console.log(`[KillsData] Archivo local ${type}.txt.gz no existe`);
                return null;
            }

            const compressedData = await fs.readFile(filePath);
            const text = zlib.gunzipSync(compressedData).toString();
            const parsedData = this.parseKillData(text);
            
            console.log(`[KillsData] Cargados ${parsedData.length} registros desde ${type}.txt.gz local`);
            return parsedData;
        } catch (error) {
            console.error(`[KillsData] Error cargando archivo local ${type}:`, error);
            return null;
        }
    }

    /**
     * Guarda datos comprimidos en archivo local
     */
    async saveToLocalFile(type, text) {
        try {
            const filePath = this.getLocalFilePath(type);
            const compressedData = zlib.gzipSync(text);
            await fs.writeFile(filePath, compressedData);
            console.log(`[KillsData] Archivo ${type}.txt.gz guardado localmente`);
        } catch (error) {
            console.error(`[KillsData] Error guardando archivo local ${type}:`, error);
        }
    }

    /**
     * Descarga y guarda archivo .txt.gz desde la web
     */
    async downloadAndSave(type) {
        try {
            const url = `${this.baseUrl}${type}.txt.gz`;
            console.log(`[KillsData] Descargando ${type} desde ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const buffer = await response.buffer();
            const text = zlib.gunzipSync(buffer).toString();
            
            // Guardar archivo comprimido localmente
            await this.saveToLocalFile(type, text);
            
            return this.parseKillData(text);
        } catch (error) {
            console.error(`[KillsData] Error descargando ${type}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene datos con la nueva lógica: prioriza archivos locales en startup
     */
    async getData(type, forceDownload = false) {
        const now = Date.now();
        const cached = this.cache[type];
        
        // Si hay datos en cache y no son muy antiguos, usarlos
        if (cached.data && (now - cached.lastFetch) < this.cacheTime && !forceDownload) {
            return cached.data;
        }

        try {
            let parsedData = null;

            if (forceDownload) {
                // Forzar descarga para actualizaciones programadas
                parsedData = await this.downloadAndSave(type);
                console.log(`[KillsData] Descarga forzada completada para ${type}: ${parsedData.length} registros`);
            } else {
                // Intentar cargar desde archivo local primero
                parsedData = await this.loadFromLocalFile(type);
                
                if (!parsedData) {
                    // Si no existe archivo local, descargar por primera vez
                    console.log(`[KillsData] Primera descarga de ${type}...`);
                    parsedData = await this.downloadAndSave(type);
                }
            }

            // Actualizar cache
            cached.data = parsedData;
            cached.lastFetch = now;

            return parsedData;
        } catch (error) {
            console.error(`[KillsData] Error obteniendo ${type}:`, error);
            
            // Fallback: intentar cargar archivo local aunque haya error
            if (forceDownload) {
                const localData = await this.loadFromLocalFile(type);
                if (localData) {
                    console.log(`[KillsData] Usando datos locales como fallback para ${type}`);
                    return localData;
                }
            }
            
            // Último fallback: cache vencido
            return cached.data || [];
        }
    }

    parseKillData(text) {
        // ARREGLO: El servidor sirve archivos sin separadores de línea
        // Necesitamos agregar \n después de cada patrón: número,número,número
        let fixedText = text.trim();
        
        // Si el texto no tiene saltos de línea, agregarlos después de cada entrada
        if (fixedText.split('\n').length === 1 && fixedText.includes(',')) {
            // Usar regex para encontrar patrones: dígitos,dígitos,dígitos
            // Y reemplazarlos añadiendo \n al final (excepto el último)
            fixedText = fixedText.replace(/(\d+,\d+,\d+)(?=\d+,)/g, '$1\n');
        }
        
        return fixedText.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [ranking, playerId, kills] = line.split(',').map(item => parseInt(item.trim()));
                return {
                    ranking: ranking,
                    playerId: playerId,
                    kills: kills
                };
            })
            .sort((a, b) => a.ranking - b.ranking);
    }

    // Métodos públicos con nuevas opciones
    async getAllKills(forceDownload = false) {
        return await this.getData('kill_all', forceDownload);
    }

    async getAttackKills(forceDownload = false) {
        return await this.getData('kill_att', forceDownload);
    }

    async getDefenseKills(forceDownload = false) {
        return await this.getData('kill_def', forceDownload);
    }

    async getSupportKills(forceDownload = false) {
        return await this.getData('kill_sup', forceDownload);
    }

    /**
     * Fuerza la descarga de todos los archivos (para actualizaciones programadas)
     */
    async forceUpdateAll() {
        console.log('[KillsData] Forzando actualización de todos los archivos...');
        const [allKills, attackKills, defenseKills, supportKills] = await Promise.all([
            this.getAllKills(true),
            this.getAttackKills(true),
            this.getDefenseKills(true),
            this.getSupportKills(true)
        ]);

        return {
            all: allKills,
            attack: attackKills,
            defense: defenseKills,
            support: supportKills
        };
    }

    async getPlayerKills(playerId, forceDownload = false) {
        const [allKills, attackKills, defenseKills, supportKills] = await Promise.all([
            this.getAllKills(forceDownload),
            this.getAttackKills(forceDownload),
            this.getDefenseKills(forceDownload),
            this.getSupportKills(forceDownload)
        ]);

        const playerAll = allKills.find(p => p.playerId === playerId) || { ranking: 0, kills: 0 };
        const playerAtt = attackKills.find(p => p.playerId === playerId) || { ranking: 0, kills: 0 };
        const playerDef = defenseKills.find(p => p.playerId === playerId) || { ranking: 0, kills: 0 };
        const playerSup = supportKills.find(p => p.playerId === playerId) || { ranking: 0, kills: 0 };

        return {
            all: playerAll,
            attack: playerAtt,
            defense: playerDef,
            support: playerSup
        };
    }

    async getTopKillers(type = 'kill_all', limit = 10, forceDownload = false) {
        const data = await this.getData(type, forceDownload);
        return data.slice(0, limit);
    }

    async getTribeKillsAnalysis(tribeId, gtData) {
        // Obtener tribu por ID
        const tribes = await gtData.getTribes();
        const tribeData = tribes.find(t => t.id === tribeId);
        
        if (!tribeData) {
            return null;
        }

        const allPlayers = await gtData.getPlayers();
        const tribeMembers = allPlayers.filter(player => player.tribeId === tribeId);

        if (tribeMembers.length === 0) {
            return { 
                tribeName: tribeData.name,
                members: [],
                totals: { all: 0, attack: 0, defense: 0, support: 0 }
            };
        }

        // Obtener datos de kills para todos los miembros
        const [allKills, attackKills, defenseKills, supportKills] = await Promise.all([
            this.getAllKills(),
            this.getAttackKills(),
            this.getDefenseKills(),
            this.getSupportKills()
        ]);

        const memberKills = tribeMembers.map(member => {
            const playerAll = allKills.find(p => p.playerId === member.id) || { ranking: 0, kills: 0 };
            const playerAtt = attackKills.find(p => p.playerId === member.id) || { ranking: 0, kills: 0 };
            const playerDef = defenseKills.find(p => p.playerId === member.id) || { ranking: 0, kills: 0 };
            const playerSup = supportKills.find(p => p.playerId === member.id) || { ranking: 0, kills: 0 };

            return {
                name: member.name,
                id: member.id,
                kills: {
                    all: playerAll,
                    attack: playerAtt,
                    defense: playerDef,
                    support: playerSup
                }
            };
        });

        // Calcular totales de la tribu
        const totals = {
            all: memberKills.reduce((sum, member) => sum + member.kills.all.kills, 0),
            attack: memberKills.reduce((sum, member) => sum + member.kills.attack.kills, 0),
            defense: memberKills.reduce((sum, member) => sum + member.kills.defense.kills, 0),
            support: memberKills.reduce((sum, member) => sum + member.kills.support.kills, 0)
        };

        // Ordenar por kills totales
        memberKills.sort((a, b) => b.kills.all.kills - a.kills.all.kills);

        return {
            tribeName: tribeData.name,
            members: memberKills,
            totals: totals
        };
    }

    async getKillsComparison(playerIds) {
        const comparisons = [];
        
        for (const playerId of playerIds) {
            const kills = await this.getPlayerKills(playerId);
            comparisons.push({
                playerId: playerId,
                kills: kills
            });
        }

        return comparisons;
    }

    clearCache() {
        this.cache = {
            kill_all: { data: null, lastFetch: 0 },
            kill_att: { data: null, lastFetch: 0 },
            kill_def: { data: null, lastFetch: 0 },
            kill_sup: { data: null, lastFetch: 0 }
        };
        console.log('[KillsData] Cache cleared');
    }
}

module.exports = KillsDataManager;