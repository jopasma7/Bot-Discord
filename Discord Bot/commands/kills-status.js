const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kills-status')
        .setDescription('Ver el estado del sistema de tracking de adversarios'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const KillsTracker = require('../utils/killsTracker');
            const tracker = new KillsTracker();
            
            // Obtener estado del tracker
            const status = await tracker.getTrackerStatus();
            
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('📊 Estado del Sistema de Tracking')
                .setDescription('Información sobre el sistema de monitoreo de adversarios')
                .addFields(
                    { 
                        name: '💾 Datos Anteriores', 
                        value: status.hasData ? '✅ Disponibles' : '❌ No encontrados', 
                        inline: true 
                    },
                    { 
                        name: '🕐 Última Verificación', 
                        value: status.lastCheck ? `<t:${Math.floor(new Date(status.lastCheck).getTime() / 1000)}:R>` : 'Nunca', 
                        inline: true 
                    },
                    { 
                        name: '💭 Cache', 
                        value: status.cacheStatus === 'activo' ? '✅ Activo' : '⚪ Vacío', 
                        inline: true 
                    },
                    { 
                        name: '🗄️ Backups', 
                        value: `${status.backupsAvailable} archivos`, 
                        inline: true 
                    }
                )
                .setFooter({ text: 'Sistema de Notificaciones GT ES95' })
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });

        } catch (error) {
            console.error('Error en kills-status:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error')
                .setDescription('No se pudo obtener el estado del sistema de tracking.')
                .addFields(
                    { name: 'Error', value: error.message }
                )
                .setTimestamp();

            await interaction.followUp({ embeds: [errorEmbed] });
        }
    },
};