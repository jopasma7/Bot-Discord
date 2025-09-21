const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class VillageInfoHandler {
    constructor() {
        this.coordinateRegex = /(\d{1,3})\|(\d{1,3})/g;
        this.gameUrl = 'https://es95.guerrastribales.es/game.php';
    }

    /**
     * Detecta coordenadas en un mensaje
     * @param {string} content - Contenido del mensaje
     * @returns {Array} Array de coordenadas encontradas [{x, y, original}]
     */
    detectCoordinates(content) {
        const coordinates = [];
        let match;
        
        // Reset regex
        this.coordinateRegex.lastIndex = 0;
        
        while ((match = this.coordinateRegex.exec(content)) !== null) {
            const x = parseInt(match[1]);
            const y = parseInt(match[2]);
            
            // Validar que las coordenadas están en rango válido (1-999)
            if (x >= 1 && x <= 999 && y >= 1 && y <= 999) {
                coordinates.push({
                    x: x,
                    y: y,
                    original: match[0]
                });
            }
        }
        
        return coordinates;
    }

    /**
     * Procesa un mensaje y responde con información de pueblos si encuentra coordenadas
     * @param {Message} message - Mensaje de Discord
     */
    async handleMessage(message) {
        // No responder a bots
        if (message.author.bot) return;

        const coordinates = this.detectCoordinates(message.content);
        
        if (coordinates.length === 0) return;

        console.log(`[VillageInfo] Detectadas ${coordinates.length} coordenadas en mensaje de ${message.author.username}`);

        // Limitar a las primeras 3 coordenadas para evitar spam
        const coordsToProcess = coordinates.slice(0, 3);

        for (const coord of coordsToProcess) {
            try {
                // Crear embed básico con información de coordenadas
                const continent = Math.floor(coord.y / 100) * 10 + Math.floor(coord.x / 100);
                
                const embed = new EmbedBuilder()
                    .setColor('#4A90E2')
                    .setTitle(`🏘️ Pueblo en ${coord.x}|${coord.y}`)
                    .setDescription(`**Continente:** K${continent}`)
                    .addFields(
                        { name: '📍 Coordenadas', value: `${coord.x}|${coord.y}`, inline: true },
                        { name: '🌍 Continente', value: `K${continent}`, inline: true },
                        { name: '🎯 Acción', value: 'Ver en el juego', inline: true }
                    )
                    .setFooter({ text: `ES95 • Click para ver en el mapa` })
                    .setTimestamp();

                // Usar enlace con screen=map para ir directamente a las coordenadas
                const mapUrl = `${this.gameUrl}?screen=map#${coord.x};${coord.y}`;
                const mapButton = new ButtonBuilder()
                    .setLabel('🎯 Ver en Mapa')
                    .setStyle(ButtonStyle.Link)
                    .setURL(mapUrl);
                const components = [new ActionRowBuilder().addComponents(mapButton)];

                await message.reply({
                    embeds: [embed],
                    components: components
                });

                // Pequeña pausa entre respuestas múltiples
                if (coordsToProcess.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`[VillageInfo] Error procesando ${coord.x}|${coord.y}:`, error);
            }
        }
    }
}

module.exports = VillageInfoHandler;