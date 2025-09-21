const https = require('https');
const http = require('http');

class GTDataManager {
    constructor() {
        this.world = 95;
        this.server = 'es';
        this.baseUrl = `https://${this.server}${this.world}.guerrastribales.es`;
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutos
        
        // Cargar tribus conocidas desde archivo
        this.loadKnownTribes();
    }

    /**
     * Cargar tribus conocidas desde archivo JSON
     */
    loadKnownTribes() {
        const fs = require('fs');
        const path = require('path');
        
        this.knownTribes = new Map();
        
        try {
            const tribesFilePath = path.join(__dirname, '..', 'data', 'known-tribes.json');
            
            if (fs.existsSync(tribesFilePath)) {
                const fileContent = fs.readFileSync(tribesFilePath, 'utf8');
                const tribesData = JSON.parse(fileContent);
                
                // Convertir objeto a Map
                Object.entries(tribesData).forEach(([id, data]) => {
                    this.knownTribes.set(parseInt(id), {
                        name: data.name,
                        tag: data.tag
                    });
                });
                
                console.log(`📚 ${this.knownTribes.size} tribus conocidas cargadas desde archivo`);
            } else {
                console.log('📝 No se encontró archivo de tribus conocidas, usando valores por defecto');
                // Valores por defecto
                this.knownTribes.set(47, { name: "Los Guerreros", tag: "LG" });
            }
        } catch (error) {
            console.error('❌ Error cargando tribus conocidas:', error);
            this.knownTribes = new Map();
        }
    }

    /**
     * Inicializar el manager (método para compatibilidad)
     */
    async initialize() {
        return true; // GTDataManager no necesita inicialización especial
    }

    /**
     * Realiza una petición HTTP y devuelve los datos
     */
    async fetchData(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            protocol.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Obtiene datos con cache
     */
    async getCachedData(key, fetchFunction) {
        const now = Date.now();
        const cached = this.cache.get(key);
        
        if (cached && (now - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const data = await fetchFunction();
            this.cache.set(key, {
                data: data,
                timestamp: now
            });
            return data;
        } catch (error) {
            console.error(`Error fetching ${key}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene la lista de jugadores
     */
    async getPlayers() {
        return this.getCachedData('players', async () => {
            const url = `${this.baseUrl}/map/player.txt`;
            const rawData = await this.fetchData(url);
            return this.parsePlayersData(rawData);
        });
    }

    /**
     * Alias para compatibilidad - obtiene todos los jugadores
     */
    async getAllPlayers() {
        return this.getPlayers();
    }

    /**
     * Obtiene la lista de tribus desde ally.txt
     */
    async getTribes() {
        return this.getCachedData('tribes', async () => {
            const url = `${this.baseUrl}/map/ally.txt`;
            const rawData = await this.fetchData(url);
            return this.parseTribesData(rawData);
        });
    }

    /**
     * Parsea los datos de tribus desde ally.txt
     * Formato: id,name,tag,members,villages,points,all_points,rank
     */
    parseTribesData(rawData) {
        const lines = rawData.split('\n').filter(line => line.trim());
        return lines.map(line => {
            const parts = line.split(',');
            if (parts.length >= 8) {
                return {
                    id: parseInt(parts[0]),
                    name: this.decodeGameText(parts[1]),
                    tag: this.decodeGameText(parts[2]),
                    members: parseInt(parts[3]) || 0,
                    villages: parseInt(parts[4]) || 0,
                    points: parseInt(parts[5]) || 0,
                    allPoints: parseInt(parts[6]) || 0,
                    rank: parseInt(parts[7]) || 0
                };
            }
            return null;
        }).filter(tribe => tribe !== null);
    }

    /**
     * Obtiene la lista de aldeas
     */
    async getVillages() {
        return this.getCachedData('villages', async () => {
            const url = `${this.baseUrl}/map/village.txt`;
            const rawData = await this.fetchData(url);
            return this.parseVillagesData(rawData);
        });
    }

    /**
     * Obtiene las aldeas de un jugador específico
     */
    async getPlayerVillages(playerId) {
        const villages = await this.getVillages();
        return villages.filter(village => village.player_id === playerId);
    }

    /**
     * Obtiene una aldea por sus coordenadas
     */
    async getVillageByCoordinates(x, y) {
        const villages = await this.getVillages();
        return villages.find(village => village.x === x && village.y === y);
    }

    /**
     * Parsea los datos de jugadores
     * Formato: id,name,tribe_id,villages,points,rank
     */
    parsePlayersData(rawData) {
        const lines = rawData.trim().split('\n');
        const players = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 6) {
                players.push({
                    id: parseInt(parts[0]),
                    name: this.decodeGameText(parts[1]), // Decodificar nombre
                    ally: parts[2] === '0' ? null : parts[2], // ID de tribu (ally)
                    tribeId: parseInt(parts[2]) || null, // Mantener compatibilidad
                    villages: parseInt(parts[3]),
                    points: parseInt(parts[4]),
                    rank: parseInt(parts[5])
                });
            }
        }
        
        return players;
    }

    /**
     * Parsea los datos de tribus
     * Formato: id,name,tag,members,villages,points,all_points,rank
     */
    parseTribesData(rawData) {
        const lines = rawData.trim().split('\n');
        const tribes = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            // Verificar que tenga al menos 6 campos (algunos pueden tener menos)
            if (parts.length >= 6) {
                const tribe = {
                    id: parseInt(parts[0]),
                    name: this.decodeGameText(parts[1]), // Usar decodificación completa
                    tag: this.decodeGameText(parts[2]) || 'Sin tag', // Decodificar tag también
                    members: parseInt(parts[3]) || 1,
                    villages: parseInt(parts[4]) || 0,
                    points: parseInt(parts[5]) || 0,
                    allPoints: parts.length >= 7 ? parseInt(parts[6]) : parseInt(parts[5]),
                    rank: parts.length >= 8 ? parseInt(parts[7]) : parseInt(parts[5])
                };
                
                // Solo agregar si tiene datos válidos
                if (tribe.id && tribe.name) {
                    tribes.push(tribe);
                }
            }
        }
        
        // Ordenar por ranking
        return tribes.sort((a, b) => a.rank - b.rank);
    }

    /**
     * Parsea los datos de aldeas
     * Formato: id,name,x,y,player_id,points
     */
    parseVillagesData(rawData) {
        const lines = rawData.trim().split('\n');
        const villages = [];
        
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 6) {
                villages.push({
                    id: parseInt(parts[0]),
                    name: this.decodeGameText(parts[1]), // Decodificar nombre
                    x: parseInt(parts[2]),
                    y: parseInt(parts[3]),
                    playerId: parseInt(parts[4]),
                    points: parseInt(parts[5])
                });
            }
        }
        
        return villages;
    }

    /**
     * Decodifica texto del juego (URL encoding y caracteres especiales)
     */
    decodeGameText(text) {
        if (!text) return text;
        
        try {
            // Primero intentar decodificación URI completa
            let decoded = decodeURIComponent(text);
            
            // Reemplazar + por espacios (formato específico de GT)
            decoded = decoded.replace(/\+/g, ' ');
            
            return decoded;
        } catch (error) {
            // Si falla la decodificación URI, usar reemplazos manuales más completos
            let decoded = text
                .replace(/%7C/g, '|')      // Pipes
                .replace(/%7E/g, '~')      // Tildes
                .replace(/%5B/g, '[')      // Corchete izquierdo
                .replace(/%5D/g, ']')      // Corchete derecho
                .replace(/%20/g, ' ')      // Espacios
                .replace(/%2B/g, '+')      // Plus
                .replace(/%3A/g, ':')      // Dos puntos
                .replace(/%2C/g, ',')      // Comas
                .replace(/%2F/g, '/')      // Slash
                .replace(/%3F/g, '?')      // Interrogación
                .replace(/%23/g, '#')      // Hash
                .replace(/%26/g, '&')      // Ampersand
                .replace(/%3D/g, '=')      // Igual
                .replace(/%21/g, '!')      // Exclamación
                // Caracteres acentuados españoles
                .replace(/%C3%A1/g, 'á')   // á
                .replace(/%C3%A9/g, 'é')   // é
                .replace(/%C3%AD/g, 'í')   // í
                .replace(/%C3%B3/g, 'ó')   // ó
                .replace(/%C3%BA/g, 'ú')   // ú
                .replace(/%C3%B1/g, 'ñ')   // ñ
                .replace(/%C3%A0/g, 'à')   // à
                .replace(/%C3%A8/g, 'è')   // è
                .replace(/%C3%AC/g, 'ì')   // ì
                .replace(/%C3%B2/g, 'ò')   // ò
                .replace(/%C3%B9/g, 'ù')   // ù
                .replace(/%C3%A7/g, 'ç')   // ç
                .replace(/\+/g, ' ');      // Plus como espacio
            
            return decoded;
        }
    }

    /**
     * Busca un jugador por nombre
     */
    async findPlayer(playerName) {
        const players = await this.getPlayers();
        const normalizedName = playerName.toLowerCase();
        
        return players.find(player => 
            player.name.toLowerCase().includes(normalizedName)
        );
    }

    /**
     * Busca una tribu por tag o nombre
     */
    async findTribe(search) {
        const tribes = await this.getTribes();
        const normalizedSearch = search.toLowerCase();
        
        return tribes.find(tribe => 
            tribe.tag.toLowerCase().includes(normalizedSearch) ||
            tribe.name.toLowerCase().includes(normalizedSearch)
        );
    }

    /**
     * Obtiene información completa de un jugador
     */
    async getPlayerInfo(playerName) {
        const player = await this.findPlayer(playerName);
        if (!player) return null;

        const villages = await this.getVillages();
        const playerVillages = villages.filter(v => v.playerId === player.id);

        let tribe = null;
        if (player.ally && player.ally !== '0') {
            const tribes = await this.getTribes();
            tribe = tribes.find(t => t.id === parseInt(player.ally));
        }

        return {
            ...player,
            tribe: tribe,
            allyId: player.ally,
            villagesList: playerVillages,
            avgVillagePoints: Math.round(player.points / player.villages)
        };
    }

    /**
     * Obtiene información completa de una tribu
     */
    async getTribeInfo(search) {
        const tribe = await this.findTribe(search);
        if (!tribe) return null;

        const players = await this.getPlayers();
        const tribeMembers = players.filter(p => p.tribeId === tribe.id);

        return {
            ...tribe,
            membersList: tribeMembers,
            avgPlayerPoints: Math.round(tribe.points / tribe.members)
        };
    }
}

module.exports = GTDataManager;