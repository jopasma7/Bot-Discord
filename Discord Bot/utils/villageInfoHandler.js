const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const VillageActivityAnalyzer = require('./villageActivityAnalyzer');

class VillageInfoHandler {
    constructor() {
        this.coordinateRegex = /(\d{1,3})\|(\d{1,3})/g;
        this.gameUrl = 'https://es95.guerrastribales.es/game.php';
        this.activityAnalyzer = new VillageActivityAnalyzer();
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
                
                const activityButton = new ButtonBuilder()
                    .setCustomId(`village_activity_${coord.x}_${coord.y}`)
                    .setLabel('📊 Análisis de Actividad')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🕵️');

                const components = [new ActionRowBuilder().addComponents(mapButton, activityButton)];

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

    /**
     * Maneja la interacción del botón de análisis de actividad
     * @param {ButtonInteraction} interaction - Interacción del botón
     */
    async handleActivityAnalysis(interaction) {
        // Parsear coordenadas del customId
        const match = interaction.customId.match(/village_activity_(\d+)_(\d+)/);
        if (!match) {
            await interaction.reply({ content: '❌ Error: No se pudieron obtener las coordenadas.', ephemeral: true });
            return;
        }

        const x = parseInt(match[1]);
        const y = parseInt(match[2]);

        await interaction.deferReply();

        try {
            // Obtener Village ID desde las coordenadas
            console.log(`[VillageInfo] Iniciando análisis de actividad para ${x}|${y}`);
            const villageId = await this.activityAnalyzer.getVillageIdFromCoordinates(x, y);
            
            if (!villageId) {
                await interaction.editReply({ 
                    content: `❌ No se pudo encontrar una aldea en las coordenadas ${x}|${y}.\n\n💡 La aldea puede no existir o estar abandonada.`
                });
                return;
            }

            // Obtener información básica de la aldea desde GT Data
            const GTDataManager = require('./gtData');
            const gtData = new GTDataManager();
            const villages = await gtData.getVillages();
            const players = await gtData.getPlayers();
            const village = villages.find(v => v.id === villageId);
            const player = village ? players.find(p => p.id === village.playerId) : null;

            // Obtener historial de la aldea
            console.log(`[VillageInfo] Obteniendo historial para village ID: ${villageId}`);
            const villageData = await this.activityAnalyzer.getVillageHistory(villageId);

            if (!villageData.history || villageData.history.length === 0) {
                await interaction.editReply({
                    content: `📊 **Análisis de ${x}|${y}**\n\n❌ No hay suficiente historial de actividad disponible para esta aldea.\n\n💡 TWStats necesita tiempo para recopilar datos de actividad.`
                });
                return;
            }

            // Analizar patrones de actividad usando puntos de registros históricos
            const analysis = this.activityAnalyzer.analyzeActivityPatterns(villageData.history);

            // Crear embed con los resultados
            const embed = this.createActivityAnalysisEmbed(x, y, village, player, villageData, analysis);
            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`[VillageInfo] Error en análisis de actividad para ${x}|${y}:`, error);
            await interaction.editReply({
                content: `❌ **Error al analizar ${x}|${y}**\n\n${error.message}\n\n💡 La aldea puede no existir o TWStats puede no estar disponible temporalmente.`
            });
        }
    }

    /**
     * Crea el embed con los resultados del análisis avanzado de actividad
     */
    createActivityAnalysisEmbed(x, y, village, player, villageData, analysis) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle(`🕵️ Análisis Avanzado de Actividad - ${x}|${y}`)
            .setDescription(`**Aldea:** ${village?.name || 'Desconocida'}\n**Propietario:** ${player?.name || 'Desconocido'}${player ? `\n**Puntos:** ${player.points?.toLocaleString() || 'N/A'}` : ''}${player?.tribe ? `\n**Tribu:** ${player.tribe}` : ''}`)
            .setFooter({ text: `Análisis basado en ${analysis.totalEntries} entradas (${analysis.reliableEntries} confiables ≤2500pts) • TWStats ES95` })
            .setTimestamp();

        // Información de procedencia con nivel de jugador
        let confidenceEmoji = '🔍';
        if (analysis.confidence === 'muy alta') confidenceEmoji = '🟢';
        else if (analysis.confidence === 'alta') confidenceEmoji = '✅';
        else if (analysis.confidence === 'media') confidenceEmoji = '⚠️';
        else if (analysis.confidence === 'baja') confidenceEmoji = '🟡';
        else confidenceEmoji = '🔴';

        // Mostrar nivel de análisis
        const levelInfo = analysis.playerLevel === 'early_game' ? 
            '🌱 **Jugador Inicial** (Datos más confiables)' : 
            '⚔️ **Jugador Avanzado** (Posibles colas automáticas)';

        embed.addFields(
            {
                name: '🌍 Zona Horaria Estimada',
                value: `${confidenceEmoji} **${analysis.timezone}** (Confianza: ${analysis.confidence})\n📝 ${analysis.pattern}\n${levelInfo}`,
                inline: false
            }
        );

        // Mostrar patrón de inactividad de forma simple
        if (analysis.consistentSleepPatterns && analysis.consistentSleepPatterns.length > 0) {
            const mainPattern = analysis.consistentSleepPatterns[0];
            embed.addFields({
                name: '😴 Inactivo de',
                value: `**${mainPattern.timeRange.replace('-', ':00 a ')}:00**`,
                inline: true
            });
        }

        // Solo mostrar la zona horaria estimada de forma simple
        if (analysis.timezone) {
            embed.addFields({
                name: '🌍 Zona Estimada',
                value: `**${analysis.timezone}**`,
                inline: true
            });
        }

        return embed;
    }

    /**
     * Crea un gráfico simple de actividad por horas usando caracteres
     */
    createActivityGraph(hourlyActivity) {
        const maxPercentage = Math.max(...hourlyActivity.map(h => h.percentage));
        const maxBarLength = 15;
        
        return hourlyActivity
            .filter(h => h.percentage > 0)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10)
            .map(hour => {
                const barLength = Math.round((hour.percentage / maxPercentage) * maxBarLength);
                const bar = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
                return `\`${hour.hour} ${bar} ${hour.percentage}%\``;
            })
            .join('\n');
    }
}

module.exports = VillageInfoHandler;