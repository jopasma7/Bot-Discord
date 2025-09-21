const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jugador')
        .setDescription('Obtener información detallada de un jugador del Mundo 95')
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre del jugador (ej: rabagalan73, Stranfford)')
                .setRequired(true)),
    
    async execute(interaction) {
        const playerName = interaction.options.getString('nombre');
        
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            const playerInfo = await gtData.getPlayerInfo(playerName);
            
            if (!playerInfo) {
                // Buscar jugadores similares para dar sugerencias
                const allPlayers = await gtData.getPlayers();
                const normalizedSearch = playerName.toLowerCase();
                
                // Buscar jugadores que contengan parte del nombre buscado
                const suggestions = allPlayers.filter(player => 
                    player.name.toLowerCase().includes(normalizedSearch) ||
                    normalizedSearch.includes(player.name.toLowerCase())
                ).slice(0, 5);
                
                let message = `❌ No se encontró el jugador **${playerName}** en el Mundo 95.`;
                
                if (suggestions.length > 0) {
                    message += `\n\n💡 **¿Quizás buscabas alguno de estos?**\n`;
                    message += suggestions.map(player => 
                        `• **${player.name}** (#${player.rank}) - ${player.points.toLocaleString()} pts`
                    ).join('\n');
                } else {
                    // Mostrar algunos jugadores top como referencia
                    const topPlayers = allPlayers.slice(0, 5);
                    message += `\n\n🏆 **Top 5 jugadores del momento:**\n`;
                    message += topPlayers.map(player => 
                        `${player.rank}. **${player.name}** - ${player.points.toLocaleString()} pts`
                    ).join('\n');
                }
                
                await interaction.editReply({
                    content: message,
                    embeds: []
                });
                return;
            }

            // Calcular estadísticas avanzadas
            const totalVillagePoints = playerInfo.villagesList.reduce((sum, v) => sum + v.points, 0);
            const avgCalculated = playerInfo.villagesList.length > 0 ? Math.round(totalVillagePoints / playerInfo.villagesList.length) : 0;
            
            const bestVillage = playerInfo.villagesList.length > 0 
                ? playerInfo.villagesList.reduce((best, current) => 
                    current.points > best.points ? current : best, playerInfo.villagesList[0])
                : null;

            // Calcular área de influencia (distancia entre aldea más lejana)
            let territoryInfo = '';
            if (playerInfo.villagesList.length >= 2) {
                let maxDistance = 0;
                let corners = { minX: 999, maxX: 0, minY: 999, maxY: 0 };
                
                playerInfo.villagesList.forEach(v => {
                    corners.minX = Math.min(corners.minX, v.x);
                    corners.maxX = Math.max(corners.maxX, v.x);
                    corners.minY = Math.min(corners.minY, v.y);
                    corners.maxY = Math.max(corners.maxY, v.y);
                });
                
                const width = corners.maxX - corners.minX;
                const height = corners.maxY - corners.minY;
                maxDistance = Math.sqrt(width * width + height * height);
                
                territoryInfo = `📏 **Territorio:** ${width + 1}x${height + 1} campos\n🎯 **Centro aprox:** ${Math.round((corners.minX + corners.maxX) / 2)}|${Math.round((corners.minY + corners.maxY) / 2)}\n`;
            }

            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle(`🏰 ${playerInfo.name}`)
                .setDescription(`${playerInfo.tribe ? `🏛️ **[${playerInfo.tribe.tag}] ${playerInfo.tribe.name}**\n` : '🏃‍♂️ **Sin tribu**\n'}${territoryInfo}━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
                .addFields(
                    { 
                        name: '� Estadísticas Generales', 
                        value: `🏆 **Ranking:** #${playerInfo.rank}\n💎 **Puntos:** ${playerInfo.points.toLocaleString()}\n🏘️ **Aldeas:** ${playerInfo.villages}\n📈 **Promedio:** ${avgCalculated.toLocaleString()} pts/aldea`, 
                        inline: true 
                    },
                    { 
                        name: '🎯 Información Técnica', 
                        value: `🆔 **ID:** ${playerInfo.id}\n${bestVillage ? `🏆 **Mejor aldea:** ${bestVillage.name}\n📍 **Ubicación:** ${bestVillage.x}|${bestVillage.y}\n💪 **Puntos:** ${bestVillage.points.toLocaleString()}` : '📍 **Sin aldeas registradas**'}`, 
                        inline: true 
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });

            // Si tiene pocas aldeas, mostrar la lista
            if (playerInfo.villagesList.length <= 10) {
                const villagesList = playerInfo.villagesList
                    .sort((a, b) => b.points - a.points) // Ordenar por puntos desc
                    .map((v, index) => 
                        `${index + 1}. **${v.name}** (${v.x}|${v.y}) - ${v.points.toLocaleString()} pts`
                    ).join('\n');
                
                if (villagesList) {
                    embed.addFields({
                        name: `🏘️ Aldeas (${playerInfo.villagesList.length})`,
                        value: villagesList.length > 1024 ? villagesList.substring(0, 1020) + '...' : villagesList,
                        inline: false
                    });
                }
            } else {
                embed.addFields({
                    name: `🏘️ Aldeas (${playerInfo.villagesList.length})`,
                    value: `Demasiadas aldeas para mostrar. Las 3 mejores:\n${playerInfo.villagesList
                        .sort((a, b) => b.points - a.points)
                        .slice(0, 3)
                        .map((v, i) => `${i + 1}. **${v.name}** (${v.x}|${v.y}) - ${v.points.toLocaleString()} pts`)
                        .join('\n')}`,
                    inline: false
                });
            }

            // Crear botones interactivos
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tribe_from_player_${playerInfo.tribeId || 'none'}_${playerName}`)
                        .setLabel('🏛️ Ver Tribu')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(!playerInfo.tribeId),
                    new ButtonBuilder()
                        .setCustomId(`ranking_player_${playerName}`)
                        .setLabel('🏆 Ver Ranking')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`villages_${playerName}`)
                        .setLabel('🏘️ Todas las Aldeas')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(playerInfo.villagesList.length <= 5)
                );

            await interaction.editReply({
                content: '',
                embeds: [embed],
                components: [row]
            });
            
        } catch (error) {
            console.error('Error obteniendo información del jugador:', error);
            await interaction.editReply({
                content: '❌ Error al obtener la información. Puede que el servidor esté temporalmente no disponible.',
                embeds: []
            });
        }
    },
};