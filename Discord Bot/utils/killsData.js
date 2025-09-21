const fetch = require('node-fetch');

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
    }

    async getData(type) {
        const now = Date.now();
        const cached = this.cache[type];
        
        if (cached.data && (now - cached.lastFetch) < this.cacheTime) {
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}${type}.txt`;
            console.log(`[KillsData] Fetching ${type} from ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const parsedData = this.parseKillData(text);
            
            cached.data = parsedData;
            cached.lastFetch = now;
            
            console.log(`[KillsData] Successfully cached ${parsedData.length} ${type} entries`);
            return parsedData;
        } catch (error) {
            console.error(`[KillsData] Error fetching ${type}:`, error);
            // Si hay error, devolver cache aunque esté vencido si existe
            return cached.data || [];
        }
    }

    parseKillData(text) {
        return text.trim().split('\n')
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

    async getAllKills() {
        return await this.getData('kill_all');
    }

    async getAttackKills() {
        return await this.getData('kill_att');
    }

    async getDefenseKills() {
        return await this.getData('kill_def');
    }

    async getSupportKills() {
        return await this.getData('kill_sup');
    }

    async getPlayerKills(playerId) {
        const [allKills, attackKills, defenseKills, supportKills] = await Promise.all([
            this.getAllKills(),
            this.getAttackKills(),
            this.getDefenseKills(),
            this.getSupportKills()
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

    async getTopKillers(type = 'kill_all', limit = 10) {
        const data = await this.getData(type);
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