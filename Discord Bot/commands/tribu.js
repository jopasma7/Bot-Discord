const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tribu')
        .setDescription('Obtener información detallada de una tribu del Mundo 95')
        .addStringOption(option =>
            option.setName('tribu')
                .setDescription('Tag o nombre de la tribu (ej: GyC, Bollo, SINTM)')
                .setRequired(true)),
    
    async execute(interaction) {
        const tribeQuery = interaction.options.getString('tribu');
        
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            const tribeInfo = await gtData.getTribeInfo(tribeQuery);
            
            if (!tribeInfo) {
                // Buscar sugerencias similares
                const gtData = new GTDataManager();
                const allTribes = await gtData.getTribes();
                const normalizedSearch = tribeQuery.toLowerCase();
                
                // Buscar tribus que contengan parte del término de búsqueda
                const suggestions = allTribes.filter(tribe => 
                    tribe.tag.toLowerCase().includes(normalizedSearch) ||
                    tribe.name.toLowerCase().includes(normalizedSearch) ||
                    normalizedSearch.includes(tribe.tag.toLowerCase())
                ).slice(0, 5);
                
                let message = `❌ No se encontró la tribu **${tribeQuery}** en el Mundo 95.`;
                
                if (suggestions.length > 0) {
                    message += `\n\n💡 **¿Quizás buscabas alguna de estas?**\n`;
                    message += suggestions.map(tribe => 
                        `• **[${tribe.tag}]** ${tribe.name} (#${tribe.rank})`
                    ).join('\n');
                } else {
                    // Mostrar algunas tribus top como referencia
                    const topTribes = allTribes.slice(0, 5);
                    message += `\n\n🏆 **Top 5 tribus del momento:**\n`;
                    message += topTribes.map(tribe => 
                        `${tribe.rank}. **[${tribe.tag}]** ${tribe.name}`
                    ).join('\n');
                }
                
                await interaction.editReply({
                    content: message,
                    embeds: []
                });
                return;
            }

            // Calcular estadísticas territoriales avanzadas
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeInfo.id);
            const allVillages = tribeMembers.flatMap(p => p.villagesList || []);
            
            let territoryAnalysis = '';
            if (allVillages.length > 0) {
                // Calcular territorio ocupado
                const corners = allVillages.reduce((acc, v) => ({
                    minX: Math.min(acc.minX, v.x),
                    maxX: Math.max(acc.maxX, v.x),
                    minY: Math.min(acc.minY, v.y),
                    maxY: Math.max(acc.maxY, v.y)
                }), { minX: 999, maxX: 0, minY: 999, maxY: 0 });
                
                const territoryWidth = corners.maxX - corners.minX + 1;
                const territoryHeight = corners.maxY - corners.minY + 1;
                const territoryArea = territoryWidth * territoryHeight;
                const density = (allVillages.length / territoryArea * 100).toFixed(1);
                
                // Encontrar cuadrante principal
                const centerX = Math.round((corners.minX + corners.maxX) / 2);
                const centerY = Math.round((corners.minY + corners.maxY) / 2);
                const quadrant = `K${Math.floor(centerY / 100)}${Math.floor(centerX / 100)}`;
                
                territoryAnalysis = `\n🗺️ **Análisis Territorial:**\n` +
                    `📏 Área: ${territoryWidth}x${territoryHeight} (${territoryArea} campos)\n` +
                    `📊 Densidad: ${density}% ocupación\n` +
                    `🎯 Centro: ${centerX}|${centerY} (${quadrant})\n` +
                    `🏰 Total aldeas: ${allVillages.length}`;
            }

            const embed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle(`⚔️ [${tribeInfo.tag}] ${tribeInfo.name}`)
                .setDescription(`🏛️ **Tribu del Mundo ES95**${territoryAnalysis}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
                .addFields(
                    { 
                        name: '📊 Estadísticas Principales', 
                        value: `🏆 **Ranking:** #${tribeInfo.rank}\n💎 **Puntos:** ${tribeInfo.points.toLocaleString()}\n👥 **Miembros:** ${tribeInfo.members}\n📈 **Promedio:** ${tribeInfo.avgPlayerPoints.toLocaleString()} pts/jugador`, 
                        inline: true 
                    },
                    { 
                        name: '🎯 Información Detallada', 
                        value: `🆔 **ID:** ${tribeInfo.id}\n🏘️ **Total Aldeas:** ${tribeInfo.villages}\n📍 **Aldeas/Jugador:** ${Math.round(tribeInfo.villages / tribeInfo.members)}\n💪 **Fuerza:** ${(tribeInfo.points / 1000000).toFixed(1)}M pts`, 
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });

            // Mostrar miembros de la tribu
            if (tribeInfo.membersList && tribeInfo.membersList.length > 0) {
                const membersList = tribeInfo.membersList
                    .sort((a, b) => b.points - a.points) // Ordenar por puntos desc
                    .slice(0, 15) // Mostrar solo los top 15
                    .map((member, index) => 
                        `${index + 1}. **${member.name}** - ${member.points.toLocaleString()} pts (#${member.rank})`
                    ).join('\n');
                
                embed.addFields({
                    name: `👑 Top ${Math.min(15, tribeInfo.membersList.length)} Miembros`,
                    value: membersList,
                    inline: false
                });
            }

            // Crear botones interactivos
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tribe_ranking_${tribeInfo.id}`)
                        .setLabel('🏆 Ver en Ranking')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_top_players_${tribeInfo.id}`)
                        .setLabel('👑 Top Jugadores')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_territory_${tribeInfo.id}`)
                        .setLabel('🗺️ Mapa Territorio')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(allVillages.length === 0)
                );

            await interaction.editReply({
                content: '',
                embeds: [embed],
                components: [row]
            });
            
        } catch (error) {
            console.error('Error obteniendo información de la tribu:', error);
            await interaction.editReply({
                content: '❌ Error al obtener la información. Puede que el servidor esté temporalmente no disponible.',
                embeds: []
            });
        }
    }
};