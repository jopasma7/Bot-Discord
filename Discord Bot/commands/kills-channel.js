const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const configFile = path.join(__dirname, '..', 'data', 'kills-notifications.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kills-channel')
        .setDescription('Configura el canal de notificaciones de adversarios ganados')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Establece el canal para notificaciones de adversarios')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal donde enviar las notificaciones')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option
                        .setName('intervalo')
                        .setDescription('Intervalo de notificaciones')
                        .setRequired(false)
                        .addChoices(
                            { name: '1 hora', value: '1h' },
                            { name: '2 horas', value: '2h' },
                            { name: '4 horas', value: '4h' },
                            { name: '6 horas', value: '6h' },
                            { name: '12 horas', value: '12h' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Muestra la configuración actual de notificaciones')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Desactiva las notificaciones de adversarios')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'set':
                    await handleSetChannel(interaction);
                    break;
                case 'status':
                    await handleStatus(interaction);
                    break;
                case 'disable':
                    await handleDisable(interaction);
                    break;
            }
        } catch (error) {
            console.error('[KillsChannel] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Error')
                .setDescription('Ocurrió un error al procesar el comando.')
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};

async function handleSetChannel(interaction) {
    const channel = interaction.options.getChannel('canal');
    const interval = interaction.options.getString('intervalo') || '1h';
    const guildId = interaction.guild.id;

    // Verificar permisos del bot en el canal
    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Sin Permisos')
            .setDescription(`No tengo permisos para enviar mensajes o embeds en ${channel}.`)
            .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Cargar configuración actual
    const config = await loadConfig();

    // Actualizar configuración
    config[guildId] = {
        channelId: channel.id,
        channelName: channel.name,
        interval: interval,
        enabled: true,
        configuredBy: interaction.user.id,
        configuredAt: new Date().toISOString()
    };

    // Guardar configuración
    await saveConfig(config);

    const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Canal Configurado')
        .setDescription(`Las notificaciones de adversarios ganados se enviarán a ${channel}`)
        .addFields(
            { name: '📅 Intervalo', value: getIntervalDisplay(interval), inline: true },
            { name: '⏰ Próxima notificación', value: getNextNotificationTime(interval), inline: true },
            { name: '👤 Configurado por', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Enviar mensaje de prueba al canal configurado
    const testEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🔔 Canal de Notificaciones Configurado')
        .setDescription('Este canal ha sido configurado para recibir notificaciones automáticas de adversarios ganados.')
        .addFields(
            { name: '⏰ Frecuencia', value: getIntervalDisplay(interval) },
            { name: '📊 Contenido', value: 'Rankings de adversarios ganados por jugador y tribu' }
        )
        .setFooter({ text: 'Sistema de Notificaciones GT ES95' })
        .setTimestamp();

    await channel.send({ embeds: [testEmbed] });
}

async function handleStatus(interaction) {
    const guildId = interaction.guild.id;
    const config = await loadConfig();
    const guildConfig = config[guildId];

    if (!guildConfig || !guildConfig.enabled) {
        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('📋 Estado de Notificaciones')
            .setDescription('Las notificaciones de adversarios no están configuradas en este servidor.')
            .addFields(
                { name: '💡 Consejo', value: 'Usa `/kills-channel set` para configurar un canal de notificaciones.' }
            )
            .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const channel = interaction.guild.channels.cache.get(guildConfig.channelId);
    const channelStatus = channel ? `${channel} ✅` : `#${guildConfig.channelName} ❌ (canal eliminado)`;

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('📋 Estado de Notificaciones')
        .setDescription('Configuración actual del sistema de notificaciones de adversarios:')
        .addFields(
            { name: '📺 Canal', value: channelStatus, inline: true },
            { name: '⏰ Intervalo', value: getIntervalDisplay(guildConfig.interval), inline: true },
            { name: '🔄 Estado', value: guildConfig.enabled ? '🟢 Activo' : '🔴 Inactivo', inline: true },
            { name: '👤 Configurado por', value: `<@${guildConfig.configuredBy}>`, inline: true },
            { name: '📅 Fecha de configuración', value: `<t:${Math.floor(new Date(guildConfig.configuredAt).getTime() / 1000)}:F>`, inline: true },
            { name: '🕐 Próxima notificación', value: getNextNotificationTime(guildConfig.interval), inline: true }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleDisable(interaction) {
    const guildId = interaction.guild.id;
    const config = await loadConfig();

    if (!config[guildId] || !config[guildId].enabled) {
        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('⚠️ Sin Configuración')
            .setDescription('Las notificaciones de adversarios ya están desactivadas o no han sido configuradas.')
            .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    config[guildId].enabled = false;
    config[guildId].disabledBy = interaction.user.id;
    config[guildId].disabledAt = new Date().toISOString();

    await saveConfig(config);

    const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🔕 Notificaciones Desactivadas')
        .setDescription('Las notificaciones automáticas de adversarios han sido desactivadas.')
        .addFields(
            { name: '👤 Desactivado por', value: `<@${interaction.user.id}>`, inline: true },
            { name: '💡 Reactivar', value: 'Usa `/kills-channel set` para reactivar las notificaciones', inline: false }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function loadConfig() {
    try {
        // Crear directorio si no existe
        await fs.mkdir(path.dirname(configFile), { recursive: true });
        
        const data = await fs.readFile(configFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {}; // Archivo no existe, devolver configuración vacía
        }
        throw error;
    }
}

async function saveConfig(config) {
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
}

function getIntervalDisplay(interval) {
    const intervals = {
        '1h': 'Cada hora',
        '2h': 'Cada 2 horas',
        '4h': 'Cada 4 horas',
        '6h': 'Cada 6 horas',
        '12h': 'Cada 12 horas'
    };
    return intervals[interval] || 'Cada hora';
}

function getNextNotificationTime(interval) {
    const now = new Date();
    const hours = parseInt(interval.replace('h', ''));
    const nextTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    // Redondear a la hora más cercana
    nextTime.setMinutes(0, 0, 0);
    
    return `<t:${Math.floor(nextTime.getTime() / 1000)}:R>`;
}