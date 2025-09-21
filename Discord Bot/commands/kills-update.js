const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KillsTracker = require('../utils/killsTracker');
const KillsNotificationScheduler = require('../utils/killsNotificationScheduler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kills-update')
        .setDescription('Muestra el reporte actual de adversarios con formato corregido')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const initialEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔄 Generando Reporte de Adversarios')
                .setDescription('Obteniendo datos actuales con formato corregido...')
                .setTimestamp();

            await interaction.editReply({ embeds: [initialEmbed] });

            const tracker = new KillsTracker();
            const result = await tracker.trackKills();
            
            const tempScheduler = new KillsNotificationScheduler(interaction.client);
            const notificationEmbeds = await tempScheduler.createNotificationEmbeds(result);
            
            const mainEmbed = notificationEmbeds[0];
            mainEmbed.setTitle('✅ Reporte Actual - Formato Corregido');
            mainEmbed.setDescription(
                mainEmbed.data.description + 
                '\n\n🎯 **Formato actualizado aplicado:**\n' +
                '✅ TOP 10 jugadores (era 5)\n' +
                '✅ Espaciado uniforme mejorado\n' +
                '✅ Porcentajes correctos calculados\n' +
                '✅ Sin separadores "|" en las estadísticas'
            );
            
            await interaction.editReply({ embeds: [mainEmbed] });
            
            if (notificationEmbeds.length > 1) {
                for (let i = 1; i < notificationEmbeds.length; i++) {
                    await interaction.followUp({ embeds: [notificationEmbeds[i]] });
                }
            }

        } catch (error) {
            console.error('[KillsUpdate] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error Generando Reporte')
                .setDescription(
                    'No se pudo generar el reporte de adversarios.\n\n' +
                    `**Error:** ${error.message}\n\n` +
                    'Intenta de nuevo en unos momentos.'
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
