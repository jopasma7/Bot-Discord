const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Ver rankings del Mundo 95')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de ranking a mostrar')
                .setRequired(true)
                .addChoices(
                    { name: '🏆 Jugadores (Top)', value: 'jugadores' },
                    { name: '⚔️ Tribus (Top)', value: 'tribus' },
                    { name: '🏘️ Jugadores por Aldeas', value: 'aldeas' },
                    { name: '📈 Jugadores por Puntos', value: 'puntos' }
                ))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de resultados a mostrar (máximo 20)')
                .setMinValue(5)
                .setMaxValue(20)),
    
    async execute(interaction) {
        const tipo = interaction.options.getString('tipo');
        const cantidad = interaction.options.getInteger('cantidad') || 10;
        
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            let embed;

            switch (tipo) {
                case 'jugadores':
                    embed = await this.createPlayersRanking(gtData, cantidad);
                    break;
                case 'tribus':
                    embed = await this.createTribesRanking(gtData, cantidad);
                    break;
                case 'aldeas':
                    embed = await this.createVillagesRanking(gtData, cantidad);
                    break;
                case 'puntos':
                    embed = await this.createPointsRanking(gtData, cantidad);
                    break;
                default:
                    embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Error')
                        .setDescription('Tipo de ranking no válido');
            }

            await interaction.editReply({
                content: '',
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('Error obteniendo ranking:', error);
            await interaction.editReply({
                content: '❌ Error al obtener el ranking. Puede que el servidor esté temporalmente no disponible.',
                embeds: []
            });
        }
    },

    async createPlayersRanking(gtData, cantidad) {
        const players = await gtData.getPlayers();
        const topPlayers = players
            .sort((a, b) => a.rank - b.rank)
            .slice(0, cantidad);

        const ranking = topPlayers
            .map((player, index) => 
                `${index + 1}. **${player.name}** - ${player.points.toLocaleString()} pts (${player.villages} aldeas)`
            ).join('\n');

        return new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 Top ${cantidad} Jugadores - Mundo 95`)
            .setDescription(ranking)
            .addFields({
                name: '📊 Estadísticas',
                value: `Total jugadores: ${players.length.toLocaleString()}`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    },

    async createTribesRanking(gtData, cantidad) {
        const tribes = await gtData.getTribes();
        const topTribes = tribes
            .sort((a, b) => a.rank - b.rank)
            .slice(0, cantidad);

        const ranking = topTribes
            .map((tribe, index) => 
                `${index + 1}. **[${tribe.tag}] ${tribe.name}** - ${tribe.points.toLocaleString()} pts (${tribe.members} miembros)`
            ).join('\n');

        return new EmbedBuilder()
            .setColor(0x8B0000)
            .setTitle(`⚔️ Top ${cantidad} Tribus - Mundo 95`)
            .setDescription(ranking)
            .addFields({
                name: '📊 Estadísticas',
                value: `Total tribus: ${tribes.length.toLocaleString()}`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    },

    async createVillagesRanking(gtData, cantidad) {
        const players = await gtData.getPlayers();
        const topByVillages = players
            .sort((a, b) => b.villages - a.villages)
            .slice(0, cantidad);

        const ranking = topByVillages
            .map((player, index) => 
                `${index + 1}. **${player.name}** - ${player.villages} aldeas (${player.points.toLocaleString()} pts, #${player.rank})`
            ).join('\n');

        return new EmbedBuilder()
            .setColor(0x228B22)
            .setTitle(`🏘️ Top ${cantidad} Jugadores por Aldeas - Mundo 95`)
            .setDescription(ranking)
            .addFields({
                name: '📊 Estadísticas',
                value: `Mayor cantidad de aldeas: ${topByVillages[0]?.villages || 0}`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    },

    async createPointsRanking(gtData, cantidad) {
        const players = await gtData.getPlayers();
        const topByPoints = players
            .sort((a, b) => b.points - a.points)
            .slice(0, cantidad);

        const ranking = topByPoints
            .map((player, index) => 
                `${index + 1}. **${player.name}** - ${player.points.toLocaleString()} pts (#${player.rank}, ${player.villages} aldeas)`
            ).join('\n');

        return new EmbedBuilder()
            .setColor(0x4169E1)
            .setTitle(`📈 Top ${cantidad} Jugadores por Puntos - Mundo 95`)
            .setDescription(ranking)
            .addFields({
                name: '📊 Estadísticas',
                value: `Mayor puntuación: ${topByPoints[0]?.points.toLocaleString() || 0} pts`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    }
};