const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('monitoreo-conquistas')
        .setDescription('Configura el monitoreo de conquistas para la tribu Bollo')
        .addSubcommand(subcommand =>
            subcommand
                .setName('activar')
                .setDescription('Activa el monitoreo de conquistas para Bollo')
                .addChannelOption(option =>
                    option.setName('canal-ganancias')
                        .setDescription('Canal para notificar conquistas de aldeas (sin @everyone)')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('canal-perdidas')
                        .setDescription('Canal para notificar pérdidas de aldeas (con @everyone)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('desactivar')
                .setDescription('Desactiva el monitoreo de conquistas'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('estado')
                .setDescription('Muestra el estado actual del monitoreo de conquistas'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Envía alertas de prueba para verificar el formato')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de alerta a probar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Aldea Perdida', value: 'loss' },
                            { name: 'Aldea Conquistada', value: 'gain' },
                            { name: 'Ambos Tipos', value: 'both' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tribus')
                .setDescription('Configura qué tribus mostrar en el canal de ganancias')
                .addStringOption(option =>
                    option.setName('filtro')
                        .setDescription('Filtro para las conquistas')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌍 Todas las tribus - Mostrar todas las conquistas', value: 'all' },
                            { name: '🏰 Tribu específica - Solo una tribu', value: 'specific' }
                        ))
                .addStringOption(option =>
                    option.setName('nombre-tribu')
                        .setDescription('Nombre de la tribu (solo si eliges "Tribu específica")')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modo')
                .setDescription('Cambia la velocidad de monitoreo')
                .addStringOption(option =>
                    option.setName('velocidad')
                        .setDescription('Velocidad de monitoreo')
                        .setRequired(true)
                        .addChoices(
                            { name: '⚡ Intensivo (15s) - Guerra activa', value: 'intensive' },
                            { name: '🔄 Normal (60s) - Uso diario', value: 'normal' },
                            { name: '💤 Ahorro (5min) - Menor consumo', value: 'economy' }
                        ))),

    async execute(interaction) {
        // Verificar permisos (solo administradores pueden configurar)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ Solo los administradores pueden configurar el monitoreo de conquistas.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const fs = require('fs').promises;
        const path = require('path');
        
        const configPath = path.join(__dirname, '..', 'conquest-config.json');

        try {
            let config = {};
            try {
                const configData = await fs.readFile(configPath, 'utf8');
                config = JSON.parse(configData);
            } catch (error) {
                // Archivo no existe, crear configuración por defecto
                config = {
                    enabled: false,
                    gainsChannelId: null,
                    lossesChannelId: null,
                    tribeId: 47, // ID de la tribu Bollo
                    lastCheck: 0,
                    mode: 'normal', // Modo por defecto
                    interval: 60000 // 60 segundos en milisegundos
                };
            }

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🏰 Monitoreo de Conquistas - Tribu Bollo')
                .setTimestamp()
                .setFooter({ text: 'GT ES95 • Sistema de Alertas' });

            switch (subcommand) {
                case 'activar':
                    const gainsChannel = interaction.options.getChannel('canal-ganancias');
                    const lossesChannel = interaction.options.getChannel('canal-perdidas');
                    
                    config.enabled = true;
                    config.gainsChannelId = gainsChannel.id;
                    config.lossesChannelId = lossesChannel.id;
                    config.lastCheck = Date.now();
                    
                    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    embed.setDescription([
                        '✅ **Monitoreo de conquistas activado**',
                        '',
                        `🟢 **Canal de conquistas:** <#${gainsChannel.id}>`,
                        `🔴 **Canal de pérdidas:** <#${lossesChannel.id}>`,
                        `🏛️ **Tribu monitoreada:** Bollo (ID: 47)`,
                        '',
                        '📊 **Configuración de alertas:**',
                        '• 🟢 **Conquistas**: Solo embed (sin @everyone)',
                        '• 🔴 **Pérdidas**: Embed + @everyone',
                        '',
                        `⏱️ **Frecuencia:** Cada ${config.mode === 'intensive' ? '15' : config.mode === 'economy' ? '300' : '60'} segundos`,
                        '📊 **Fuente:** GT ES95 conquer.txt'
                    ].join('\n'));
                    break;

                case 'desactivar':
                    config.enabled = false;
                    
                    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    embed.setColor('#ff0000')
                        .setDescription([
                            '❌ **Monitoreo de conquistas desactivado**',
                            '',
                            '⚠️ No se enviarán más alertas de conquistas.',
                            '',
                            'Para reactivar, usa `/monitoreo-conquistas activar`'
                        ].join('\n'));
                    break;

                case 'estado':
                    const statusEmoji = config.enabled ? '🟢' : '🔴';
                    const statusText = config.enabled ? 'ACTIVO' : 'INACTIVO';
                    
                    // Información del modo actual
                    const currentModes = {
                        intensive: { name: 'Intensivo', emoji: '⚡', interval: '15s' },
                        normal: { name: 'Normal', emoji: '🔄', interval: '60s' },
                        economy: { name: 'Ahorro', emoji: '💤', interval: '5min' }
                    };
                    
                    const currentMode = currentModes[config.mode || 'normal'];
                    
                    // Información del filtro de tribus
                    let tribeFilterInfo = '🌍 **Filtro:** Todas las tribus';
                    if (config.tribeFilter) {
                        if (config.tribeFilter.type === 'all') {
                            tribeFilterInfo = '🌍 **Filtro:** Todas las tribus';
                        } else if (config.tribeFilter.type === 'specific' && config.tribeFilter.specificTribe) {
                            tribeFilterInfo = `🏰 **Filtro:** Solo "${config.tribeFilter.specificTribe}"`;
                        }
                    }
                    
                    embed.setDescription([
                        `${statusEmoji} **Estado:** ${statusText}`,
                        '',
                        `🟢 **Canal de ganancias:** ${config.gainsChannelId ? `<#${config.gainsChannelId}>` : 'No configurado'}`,
                        `🔴 **Canal de pérdidas:** ${config.lossesChannelId ? `<#${config.lossesChannelId}>` : 'No configurado'}`,
                        `🏛️ **Tribu monitoreada:** Bollo (ID: 47)`,
                        `⏱️ **Último check:** ${config.lastCheck ? `<t:${Math.floor(config.lastCheck / 1000)}:R>` : 'Nunca'}`,
                        '',
                        `${currentMode.emoji} **Modo actual:** ${currentMode.name} (${currentMode.interval})`,
                        tribeFilterInfo,
                        config.enabled ? `✅ Monitoreando conquistas cada ${currentMode.interval}` : '❌ Monitoreo desactivado',
                        '',
                        '📊 **Configuración de alertas:**',
                        '• 🟢 **Conquistas**: Solo embed (sin @everyone)',
                        '• 🔴 **Pérdidas**: Embed + @everyone',
                        '',
                        '🎯 **Modos disponibles:**',
                        '• ⚡ **Intensivo (15s)** - Guerra activa',
                        '• 🔄 **Normal (60s)** - Uso diario',
                        '• 💤 **Ahorro (5min)** - Menor consumo'
                    ].join('\n'));
                    break;

                case 'test':
                    const testType = interaction.options.getString('tipo');
                    
                    // Verificar si hay configuración de canales
                    if (!config.enabled || !config.gainsChannelId || !config.lossesChannelId) {
                        embed.setColor('#ff0000')
                            .setDescription([
                                '❌ **No se puede hacer el test**',
                                '',
                                'El monitoreo debe estar activado con canales configurados para poder hacer pruebas.',
                                '',
                                'Usa `/monitoreo-conquistas activar` primero para configurar los canales.'
                            ].join('\n'));
                        
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                        return;
                    }
                    
                    embed.setColor('#ffaa00')
                        .setDescription([
                            '🧪 **Enviando alertas de prueba...**',
                            '',
                            `🟢 **Canal de ganancias:** <#${config.gainsChannelId}>`,
                            `🔴 **Canal de pérdidas:** <#${config.lossesChannelId}>`,
                            `🎯 **Tipo:** ${testType === 'loss' ? 'Solo pérdidas' : testType === 'gain' ? 'Solo ganancias' : 'Ambos tipos'}`,
                            '',
                            '⚠️ **Nota:** Las alertas se enviarán a los canales configurados con datos ficticios',
                            '',
                            '📊 **Diferencias:**',
                            '• 🟢 **Conquistas**: Solo embed (sin @everyone)',
                            '• 🔴 **Pérdidas**: Embed + @everyone'
                        ].join('\n'));

                    await interaction.reply({ embeds: [embed] });

                    // Obtener los canales configurados para el test con fallback
                    let testGainsChannel = interaction.client.channels.cache.get(config.gainsChannelId);
                    let testLossesChannel = interaction.client.channels.cache.get(config.lossesChannelId);
                    
                    // Si no están en caché, intentar fetchearlos
                    if (!testGainsChannel) {
                        try {
                            testGainsChannel = await interaction.client.channels.fetch(config.gainsChannelId);
                        } catch (error) {
                            console.error('❌ Error obteniendo canal de ganancias:', error.message);
                        }
                    }
                    
                    if (!testLossesChannel) {
                        try {
                            testLossesChannel = await interaction.client.channels.fetch(config.lossesChannelId);
                        } catch (error) {
                            console.error('❌ Error obteniendo canal de pérdidas:', error.message);
                        }
                    }
                    
                    if (!testGainsChannel || !testLossesChannel) {
                        await interaction.followUp({
                            content: `❌ Error: No se pudieron encontrar los canales configurados.\n- Canal ganancias: ${testGainsChannel ? '✅' : '❌'} (${config.gainsChannelId})\n- Canal pérdidas: ${testLossesChannel ? '✅' : '❌'} (${config.lossesChannelId})`,
                            ephemeral: true
                        });
                        return;
                    }

                    // Enviar alertas de prueba a los canales configurados
                    setTimeout(async () => {
                        if (testType === 'loss' || testType === 'both') {
                            await sendTestAlert(testLossesChannel, 'loss');
                        }
                        if (testType === 'gain' || testType === 'both') {
                            await sendTestAlert(testGainsChannel, 'gain');
                        }
                    }, 2000);
                    
                    return; // Salir aquí para evitar el reply al final
                    
                case 'tribus':
                    const filtroTipo = interaction.options.getString('filtro');
                    const nombreTribu = interaction.options.getString('nombre-tribu');
                    
                    // Validar que si eligió específica, debe proporcionar nombre
                    if (filtroTipo === 'specific' && !nombreTribu) {
                        return interaction.reply({
                            content: '❌ Debes proporcionar un nombre de tribu cuando eliges "Tribu específica".',
                            ephemeral: true
                        });
                    }
                    
                    // Validar que si eligió todas, no debe proporcionar nombre
                    if (filtroTipo === 'all' && nombreTribu) {
                        return interaction.reply({
                            content: '❌ No debes proporcionar un nombre de tribu cuando eliges "Todas las tribus".',
                            ephemeral: true
                        });
                    }
                    
                    // Actualizar configuración
                    config.tribeFilter = {
                        type: filtroTipo,
                        specificTribe: nombreTribu || null
                    };
                    
                    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    // Reiniciar el monitor para aplicar nuevo filtro
                    if (config.enabled && interaction.client.conquestMonitor) {
                        console.log(`🔄 Reiniciando monitor con filtro: ${filtroTipo} ${nombreTribu || ''}`);
                        try {
                            await interaction.client.conquestMonitor.restart();
                        } catch (error) {
                            console.error('❌ Error reiniciando monitor:', error);
                        }
                    }
                    
                    // Preparar respuesta
                    const filtroDescripcion = filtroTipo === 'all' 
                        ? '🌍 **Todas las tribus** - Se mostrarán conquistas de todas las tribus'
                        : `🏰 **Tribu específica**: ${nombreTribu} - Solo se mostrarán conquistas de esta tribu`;
                    
                    embed.setColor('#9966ff')
                        .setDescription([
                            '🎯 **Filtro de tribus actualizado**',
                            '',
                            filtroDescripcion,
                            '',
                            `🟢 **Canal de ganancias:** ${config.gainsChannelId ? `<#${config.gainsChannelId}>` : 'No configurado'}`,
                            `🔴 **Canal de pérdidas:** ${config.lossesChannelId ? `<#${config.lossesChannelId}>` : 'No configurado'}`,
                            '',
                            config.enabled ? '✅ **Estado:** Monitoreo reiniciado con nuevo filtro' : '❌ **Estado:** Monitoreo desactivado',
                            '',
                            '📋 **Explicación:**',
                            '• 🌍 **Todas las tribus**: Muestra conquistas de cualquier tribu',
                            '• 🏰 **Tribu específica**: Solo muestra conquistas de la tribu elegida',
                            '',
                            '⚠️ **Nota:** El filtro solo afecta al canal de ganancias. Las pérdidas siempre se muestran para "Bollo"'
                        ].join('\n'));
                    break;
                    
                case 'modo':
                    const newMode = interaction.options.getString('velocidad');
                    
                    // Configuración de modos
                    const modes = {
                        intensive: {
                            name: 'Intensivo',
                            interval: 15000, // 15 segundos
                            description: 'Guerra activa - máxima velocidad',
                            emoji: '⚡'
                        },
                        normal: {
                            name: 'Normal',
                            interval: 60000, // 60 segundos 
                            description: 'Uso diario - balance perfecto',
                            emoji: '🔄'
                        },
                        economy: {
                            name: 'Ahorro',
                            interval: 300000, // 5 minutos
                            description: 'Menor consumo - modo tranquilo',
                            emoji: '💤'
                        }
                    };
                    
                    const modeConfig = modes[newMode];
                    if (!modeConfig) {
                        await interaction.reply({
                            content: '❌ Modo no válido.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Actualizar configuración
                    config.mode = newMode;
                    config.interval = modeConfig.interval;
                    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    // Reiniciar el monitor si está activo
                    if (config.enabled && interaction.client.conquestMonitor) {
                        console.log(`🔄 Reiniciando monitor con modo ${newMode} (${modeConfig.interval/1000}s)`);
                        try {
                            await interaction.client.conquestMonitor.restart();
                        } catch (error) {
                            console.error('❌ Error reiniciando monitor:', error);
                        }
                    }
                    
                    embed.setColor('#00aaff')
                        .setDescription([
                            `${modeConfig.emoji} **Modo cambiado a: ${modeConfig.name}**`,
                            '',
                            `⏱️ **Nuevo intervalo:** ${modeConfig.interval / 1000} segundos`,
                            `📋 **Descripción:** ${modeConfig.description}`,
                            '',
                            `🟢 **Canal de ganancias:** ${config.gainsChannelId ? `<#${config.gainsChannelId}>` : 'No configurado'}`,
                            `🔴 **Canal de pérdidas:** ${config.lossesChannelId ? `<#${config.lossesChannelId}>` : 'No configurado'}`,
                            '',
                            config.enabled ? '✅ **Estado:** Monitoreo reiniciado con nuevo intervalo' : '❌ **Estado:** Monitoreo desactivado',
                            '',
                            '🎯 **Modos disponibles:**',
                            '• ⚡ **Intensivo (15s)** - Para guerra activa',
                            '• 🔄 **Normal (60s)** - Uso diario recomendado',
                            '• 💤 **Ahorro (5min)** - Menor consumo de recursos',
                            '',
                            '⚠️ **Nota:** El cambio se aplica inmediatamente'
                        ].join('\n'));
                    break;
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando monitoreo-conquistas:', error);
            await interaction.reply({
                content: '❌ Error al configurar el monitoreo de conquistas.',
                ephemeral: true
            });
        }
    },
};

// Función para enviar alertas de prueba
async function sendTestAlert(channel, type) {
    try {
        const { EmbedBuilder } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'GT ES95 • Sistema de Alertas de Conquistas [PRUEBA]' });

        if (type === 'loss') {
            // Alerta de prueba para pérdida de aldea (con @everyone)
            embed
                .setColor('#ff0000')
                .setTitle('🔴 ¡ALDEA PERDIDA! [PRUEBA]')
                .setDescription([
                    '⚔️ **rabagalan73** de **Bollo** ha perdido una aldea',
                    '',
                    '🏘️ **Aldea:** Villa Ejemplo (500|500)',
                    '👤 **Perdida por:** rabagalan73',
                    '🎯 **Conquistada por:** EnemyPlayer123',
                    '📊 **Puntos de la aldea:** 12.345',
                    '',
                    '⏰ **Tiempo:** <t:' + Math.floor(Date.now() / 1000) + ':F>',
                    '',
                    '🚨 **Esto es una alerta de prueba con datos ficticios**'
                ].join('\n'));

            // Enviar con @everyone para pérdidas
            await channel.send({
                content: '@everyone - **🔴 PÉRDIDA DE ALDEA - BOLLO**',
                embeds: [embed]
            });
            
        } else if (type === 'gain') {
            // Alerta de prueba para ganancia de aldea (sin @everyone)
            embed
                .setColor('#00ff00')
                .setTitle('🟢 ¡ALDEA CONQUISTADA! [PRUEBA]')
                .setDescription([
                    '⚔️ **bejerano** de **Bollo** ha conquistado una aldea',
                    '',
                    '🏘️ **Aldea:** Aldea Conquistada (450|550)',
                    '🎯 **Conquistada por:** bejerano',
                    '👤 **Perdida por:** VictimPlayer456',
                    '📊 **Puntos de la aldea:** 8.976',
                    '',
                    '⏰ **Tiempo:** <t:' + Math.floor(Date.now() / 1000) + ':F>',
                    '',
                    '🚨 **Esto es una alerta de prueba con datos ficticios**'
                ].join('\n'));

            // Enviar SIN @everyone para conquistas
            await channel.send({
                embeds: [embed]
            });
        }
        
        console.log(`📢 Alerta de prueba enviada: ${type}`);
        
    } catch (error) {
        console.error('❌ Error enviando alerta de prueba:', error);
    }
}