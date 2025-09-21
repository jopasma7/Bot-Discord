const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Ver estadísticas generales del Mundo 95'),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            
            // Obtener todos los datos
            const [players, tribes, villages] = await Promise.all([
                gtData.getPlayers(),
                gtData.getTribes(),
                gtData.getVillages()
            ]);

            // Calcular estadísticas
            const stats = this.calculateStats(players, tribes, villages);
            
            const embed = new EmbedBuilder()
                .setColor(0x74B9FF)
                .setTitle('📊 Estadísticas Mundo 95 - Guerras Tribales')
                .addFields(
                    {
                        name: '👥 Jugadores',
                        value: [
                            `📈 Total: **${stats.totalPlayers.toLocaleString()}**`,
                            `🏆 Mayor puntuación: **${stats.topPlayer.points.toLocaleString()}** (${stats.topPlayer.name})`,
                            `🏘️ Más aldeas: **${stats.mostVillages.villages}** (${stats.mostVillages.name})`,
                            `📊 Puntos promedio: **${stats.avgPlayerPoints.toLocaleString()}**`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '⚔️ Tribus',
                        value: [
                            `📈 Total: **${stats.totalTribes.toLocaleString()}**`,
                            `🏆 Mayor puntuación: **${stats.topTribe.points.toLocaleString()}** ([${stats.topTribe.tag}])`,
                            `👑 Más miembros: **${stats.biggestTribe.members}** ([${stats.biggestTribe.tag}])`,
                            `📊 Puntos promedio: **${stats.avgTribePoints.toLocaleString()}**`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🏘️ Aldeas',
                        value: [
                            `📈 Total: **${stats.totalVillages.toLocaleString()}**`,
                            `🏆 Mayor puntuación: **${stats.topVillage.points.toLocaleString()}** (${stats.topVillage.name})`,
                            `📊 Puntos promedio: **${stats.avgVillagePoints.toLocaleString()}**`,
                            `🏠 Aldeas por jugador: **${stats.villagesPerPlayer.toFixed(1)}**`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌍 Información del Mundo',
                        value: [
                            `🎯 Mundo: **ES95**`,
                            `📅 Última actualización: <t:${Math.floor(Date.now() / 1000)}:R>`,
                            `⚡ Estado: **Activo**`,
                            `🔄 Cache: **5 minutos**`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📈 Top 5 Jugadores',
                        value: stats.top5Players.map((p, i) => 
                            `${i + 1}. **${p.name}** - ${p.points.toLocaleString()} pts`
                        ).join('\n'),
                        inline: true
                    },
                    {
                        name: '🏆 Top 5 Tribus',
                        value: stats.top5Tribes.map((t, i) => 
                            `${i + 1}. **[${t.tag}]** - ${t.points.toLocaleString()} pts`
                        ).join('\n'),
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });

            await interaction.editReply({
                content: '',
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            await interaction.editReply({
                content: '❌ Error al calcular las estadísticas. Inténtalo de nuevo más tarde.',
                embeds: []
            });
        }
    },

    calculateStats(players, tribes, villages) {
        // Estadísticas de jugadores
        const totalPlayers = players.length;
        const topPlayer = players.reduce((max, player) => 
            player.points > max.points ? player : max, players[0]
        );
        const mostVillages = players.reduce((max, player) => 
            player.villages > max.villages ? player : max, players[0]
        );
        const totalPlayerPoints = players.reduce((sum, p) => sum + p.points, 0);
        const avgPlayerPoints = Math.round(totalPlayerPoints / totalPlayers);
        const top5Players = players
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        // Estadísticas de tribus
        const totalTribes = tribes.length;
        const topTribe = tribes.reduce((max, tribe) => 
            tribe.points > max.points ? tribe : max, tribes[0] || { points: 0, tag: 'N/A' }
        );
        const biggestTribe = tribes.reduce((max, tribe) => 
            tribe.members > max.members ? tribe : max, tribes[0] || { members: 0, tag: 'N/A' }
        );
        const totalTribePoints = tribes.reduce((sum, t) => sum + t.points, 0);
        const avgTribePoints = totalTribes > 0 ? Math.round(totalTribePoints / totalTribes) : 0;
        const top5Tribes = tribes
            .sort((a, b) => b.points - a.points)
            .slice(0, 5);

        // Estadísticas de aldeas
        const totalVillages = villages.length;
        const topVillage = villages.reduce((max, village) => 
            village.points > max.points ? village : max, villages[0]
        );
        const totalVillagePoints = villages.reduce((sum, v) => sum + v.points, 0);
        const avgVillagePoints = Math.round(totalVillagePoints / totalVillages);
        const villagesPerPlayer = totalVillages / totalPlayers;

        return {
            totalPlayers,
            topPlayer,
            mostVillages,
            avgPlayerPoints,
            top5Players,
            totalTribes,
            topTribe,
            biggestTribe,
            avgTribePoints,
            top5Tribes,
            totalVillages,
            topVillage,
            avgVillagePoints,
            villagesPerPlayer
        };
    }
};