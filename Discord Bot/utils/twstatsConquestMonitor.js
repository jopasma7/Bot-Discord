const axios = require('axios');
const { JSDOM } = require('jsdom');

/**
 * Monitor de conquistas de TWStats - Versión corregida y estable
 * Obtiene conquistas en tiempo casi real desde es.twstats.com
 */
class TWStatsConquestMonitor {
    constructor() {
        this.baseUrl = 'https://es.twstats.com/es95/index.php?page=ennoblements&live=live';
    }

    /**
     * Parsea una fila de la tabla de conquistas
     */
    parseConquestRow(row) {
        try {
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) return null;

            // Extraer datos de las celdas en el orden correcto
            const villageInfo = cells[0].textContent.trim();    // "Turkessa (519|523) K55"
            const pointsText = cells[1].textContent.trim();     // "667"
            const oldOwnerText = cells[2].textContent.trim();   // "ARYA10"
            const newOwnerText = cells[3].textContent.trim();   // "C1D CAMP3ADOR. [SINTM]"
            const dateText = cells[4].textContent.trim();       // "2025-09-20 - 20:06:34"

            // Parsear puntos
            const points = parseInt(pointsText.replace(/,/g, '')) || 0;

            // Parsear nombre de aldea y coordenadas
            const villageMatch = villageInfo.match(/^(.+?)\s*\((\d+)\|(\d+)\)/);
            if (!villageMatch) {
                return null;
            }

            const villageName = villageMatch[1].trim();
            const x = parseInt(villageMatch[2]);
            const y = parseInt(villageMatch[3]);

            // Parsear propietarios
            const parseOwner = (text) => {
                if (text === 'Bárbaro') return { name: 'Bárbaro', tribe: null };
                
                const tribeMatch = text.match(/\[(.+?)\]$/);
                if (tribeMatch) {
                    const name = text.replace(/\s*\[.+?\]$/, '').trim();
                    const tribe = tribeMatch[1];
                    return { name, tribe };
                }
                return { name: text.trim(), tribe: null };
            };

            const oldOwner = parseOwner(oldOwnerText);
            const newOwner = parseOwner(newOwnerText);

            // Parsear timestamp
            const timestamp = this.parseDate(dateText);
            if (timestamp === 0) {
                return null;
            }

            return {
                villageName,
                coordinates: { x, y },
                points,
                oldOwner,
                newOwner,
                timestamp,
                date: new Date(timestamp * 1000),
                source: 'twstats'
            };

        } catch (error) {
            console.error('❌ [TWStats] Error parsing row:', error);
            return null;
        }
    }

    /**
     * Convierte fecha de TWStats a timestamp Unix
     */
    parseDate(dateText) {
        try {
            // Formato: "2025-09-20 - 20:06:34"
            const match = dateText.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*-\s*(\d{1,2}):(\d{2}):(\d{2})/);
            if (!match) {
                return 0;
            }

            const [_, year, month, day, hour, minute, second] = match;
            
            // Crear fecha en formato ISO para zona horaria española (UTC+1/+2)
            const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+01:00`;
            const date = new Date(isoString);

            return Math.floor(date.getTime() / 1000);
            
        } catch (error) {
            console.error('❌ [TWStats] Error parsing date:', dateText, error);
            return 0;
        }
    }

    /**
     * Obtiene conquistas desde TWStats
     */
    async fetchConquests() {
        try {
            console.log('🌐 [TWStats] Obteniendo conquistas desde TWStats...');
            
            const response = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });
            
            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            
            // Buscar la tabla correcta de conquistas
            const tables = document.querySelectorAll('table');
            let conquestsTable = null;
            
            for (let table of tables) {
                const headerRow = table.querySelector('tr');
                if (headerRow) {
                    const headers = headerRow.querySelectorAll('th, td');
                    if (headers.length >= 5 && 
                        headers[0].textContent.trim() === 'Pueblos' &&
                        headers[4].textContent.trim() === 'Fecha/Tiempo') {
                        conquestsTable = table;
                        console.log('✅ [TWStats] Tabla de conquistas encontrada');
                        break;
                    }
                }
            }
            
            if (!conquestsTable) {
                throw new Error('No se encontró la tabla de conquistas');
            }
            
            const rows = conquestsTable.querySelectorAll('tr');
            const conquests = [];
            
            // Procesar filas de datos (saltar header)
            for (let i = 1; i < rows.length; i++) {
                const conquest = this.parseConquestRow(rows[i]);
                if (conquest) {
                    conquests.push(conquest);
                }
            }
            
            // Ordenar por timestamp descendente
            conquests.sort((a, b) => b.timestamp - a.timestamp);
            
            console.log(`🌐 [TWStats] Obtenidas ${conquests.length} conquistas válidas`);
            
            if (conquests.length > 0) {
                const latest = conquests[0];
                console.log(`🌐 [TWStats] Más reciente: ${latest.villageName} por ${latest.newOwner.name} (${latest.date.toLocaleString()})`);
            }
            
            return conquests;
            
        } catch (error) {
            console.error('❌ [TWStats] Error:', error.message);
            throw new Error(`Error fetching TWStats conquests: ${error.message}`);
        }
    }
}

module.exports = TWStatsConquestMonitor;