const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lista-tribus')
        .setDescription('Ver lista de todas las tribus disponibles para búsqueda')
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de tribus a mostrar (por defecto 14, máximo 25)')
                .setRequired(false)),
    
    async execute(interaction) {
        const cantidad = interaction.options.getInteger('cantidad') || 14;
        const maxCantidad = Math.min(cantidad, 25); // Limitar a 25 para evitar embeds muy largos
        
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            const tribes = await gtData.getTribes();
            
            if (!tribes || tribes.length === 0) {
                await interaction.editReply({
                    content: '❌ No se pudieron obtener los datos de las tribus. Inténtalo más tarde.',
                    embeds: []
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle(`📋 Lista de Tribus - Mundo ES95`)
                .setDescription(`Mostrando las primeras ${maxCantidad} tribus de ${tribes.length} totales\n*Incluye puntos, miembros y aldeas • Usa estos datos en /tribu*`)
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });

            // Dividir en dos columnas para mostrar más información
            const halfPoint = Math.ceil(maxCantidad / 2);
            const firstHalf = tribes.slice(0, halfPoint);
            const secondHalf = tribes.slice(halfPoint, maxCantidad);

            const firstColumn = firstHalf.map(tribe => 
                `**${tribe.rank}.** [${tribe.tag}] ${tribe.name.length > 20 ? tribe.name.substring(0, 20) + '...' : tribe.name}\n💎 ${tribe.points.toLocaleString()} pts • 👥 ${tribe.members} • 🏘️ ${tribe.villages}`
            ).join('\n\n');

            const secondColumn = secondHalf.map(tribe => 
                `**${tribe.rank}.** [${tribe.tag}] ${tribe.name.length > 20 ? tribe.name.substring(0, 20) + '...' : tribe.name}\n💎 ${tribe.points.toLocaleString()} pts • 👥 ${tribe.members} • 🏘️ ${tribe.villages}`
            ).join('\n\n');

            embed.addFields(
                {
                    name: `🏆 Rankings 1-${halfPoint}`,
                    value: firstColumn,
                    inline: true
                },
                {
                    name: `🏆 Rankings ${halfPoint + 1}-${maxCantidad}`,
                    value: secondColumn || 'N/A',
                    inline: true
                },
                {
                    name: '💡 Información mostrada',
                    value: '💎 **Puntos** - Puntos totales de la tribu\n👥 **Miembros** - Número de jugadores\n🏘️ **Aldeas** - Total de pueblos controlados\n\n**Usar con:** `/tribu [tag]` o `/tribu [nombre]`',
                    inline: false
                }
            );

            await interaction.editReply({
                content: '',
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('Error obteniendo lista de tribus:', error);
            await interaction.editReply({
                content: '❌ Error al obtener la información. Puede que el servidor esté temporalmente no disponible.',
                embeds: []
            });
        }
    }
};