const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const VillagePointsTracker = require('../utils/villagePointsTracker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edificios')
        .setDescription('Analiza mejoras de edificios basándose en incremento de puntos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('analizar')
                .setDescription('Analiza mejoras de edificios de una aldea específica')
                .addStringOption(option =>
                    option.setName('coordenadas')
                        .setDescription('Coordenadas de la aldea (ej: 500|500)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de edificio a analizar')
                        .addChoices(
                            { name: '�️ Todos los edificios', value: 'all' },
                            { name: '🏛️ Cuartel general', value: 'main' },
                            { name: '⚔️ Cuartel', value: 'barracks' },
                            { name: '🐎 Establo', value: 'stable' },
                            { name: '🏹 Taller', value: 'garage' },
                            { name: '⛪ Iglesia', value: 'church' },
                            { name: '🗼 Torre de vigilancia', value: 'watchtower' },
                            { name: '🎓 Academia', value: 'snob' },
                            { name: '⚒️ Herrería', value: 'smith' },
                            { name: '� Mercado', value: 'market' },
                            { name: '🪓 Leñador', value: 'wood' },
                            { name: '🧱 Pozo de arcilla', value: 'stone' },
                            { name: '⛏️ Mina de hierro', value: 'iron' },
                            { name: '� Granja', value: 'farm' },
                            { name: '📦 Almacén', value: 'storage' },
                            { name: '🕳️ Escondite', value: 'hide' },
                            { name: '🏰 Muralla', value: 'wall' }
                        )
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('horas')
                        .setDescription('Horas hacia atrás para analizar (por defecto: 24)')
                        .setMinValue(1)
                        .setMaxValue(168) // máximo 1 semana
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('monitorear')
                .setDescription('Agregar o quitar aldea del monitoreo automático')
                .addStringOption(option =>
                    option.setName('coordenadas')
                        .setDescription('Coordenadas de la aldea (ej: 500|500)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('accion')
                        .setDescription('Agregar o quitar del monitoreo')
                        .addChoices(
                            { name: 'Agregar', value: 'add' },
                            { name: 'Quitar', value: 'remove' }
                        )
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('estado')
                .setDescription('Ver estado del sistema de monitoreo de edificios')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            const tracker = new VillagePointsTracker();
            await tracker.initialize();

            switch (subcommand) {
                case 'analizar':
                    await this.handleAnalyze(interaction, tracker);
                    break;
                case 'monitorear':
                    await this.handleMonitor(interaction, tracker);
                    break;
                case 'estado':
                    await this.handleStatus(interaction, tracker);
                    break;
            }
        } catch (error) {
            console.error('❌ [BuildingCommand] Error:', error);
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Error interno del sistema de análisis de edificios',
                    ephemeral: true
                });
            }
        }
    },

    async handleAnalyze(interaction, tracker) {
        await interaction.deferReply();
        
        const coordinates = interaction.options.getString('coordenadas');
        const buildingType = interaction.options.getString('tipo') || 'all';
        const hours = interaction.options.getInteger('horas') || 24;
        
        // Validar formato de coordenadas
        const coordMatch = coordinates.match(/^(\d+)\|(\d+)$/);
        if (!coordMatch) {
            await interaction.editReply({
                content: '❌ Formato de coordenadas inválido. Usa el formato: 500|500'
            });
            return;
        }
        
        const [, x, y] = coordMatch;
        
        try {
            // Obtener información de la aldea
            const villageInfo = await tracker.gtDataManager.getVillageByCoordinates(parseInt(x), parseInt(y));
            
            if (!villageInfo) {
                await interaction.editReply({
                    content: `❌ No se encontró información de la aldea en ${coordinates}`
                });
                return;
            }
            
            // Realizar análisis de mejoras de edificios
            const analysis = await tracker.analyzeBuildingUpgrades(villageInfo.id, buildingType, hours);
            
            if (!analysis.success) {
                await interaction.editReply({
                    content: `⚠️ ${analysis.message || 'No se pudo realizar el análisis'}`
                });
                return;
            }
            
            // Crear embed con los resultados
            const embed = await this.createAnalysisEmbed(villageInfo, analysis, hours, buildingType);
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ [BuildingCommand] Error en análisis:', error);
            await interaction.editReply({
                content: '❌ Error obteniendo información de la aldea'
            });
        }
    },

    async handleMonitor(interaction, tracker) {
        const coordinates = interaction.options.getString('coordenadas');
        const action = interaction.options.getString('accion');
        
        // Validar formato de coordenadas
        const coordMatch = coordinates.match(/^(\d+)\|(\d+)$/);
        if (!coordMatch) {
            await interaction.reply({
                content: '❌ Formato de coordenadas inválido. Usa el formato: 500|500',
                ephemeral: true
            });
            return;
        }
        
        const [, x, y] = coordMatch;
        
        try {
            const villageInfo = await tracker.gtDataManager.getVillageByCoordinates(parseInt(x), parseInt(y));
            
            if (!villageInfo) {
                await interaction.reply({
                    content: `❌ No se encontró información de la aldea en ${coordinates}`,
                    ephemeral: true
                });
                return;
            }
            
            if (action === 'add') {
                tracker.addVillageToMonitoring(villageInfo.id);
                await interaction.reply({
                    content: `✅ Aldea **${villageInfo.name}** (${coordinates}) agregada al monitoreo de edificios`,
                    ephemeral: true
                });
            } else {
                tracker.removeVillageFromMonitoring(villageInfo.id);
                await interaction.reply({
                    content: `🚫 Aldea **${villageInfo.name}** (${coordinates}) removida del monitoreo de edificios`,
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error('❌ [BuildingCommand] Error en monitoreo:', error);
            await interaction.reply({
                content: '❌ Error gestionando el monitoreo de la aldea',
                ephemeral: true
            });
        }
    },

    async handleStatus(interaction, tracker) {
        const stats = tracker.getTrackerStats();
        
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('�️ Estado del Sistema de Monitoreo de Edificios')
            .setDescription('Información actual del tracker de puntos y análisis de edificios')
            .addFields(
                {
                    name: '📊 Estado del Tracking',
                    value: stats.isTracking ? '🟢 Activo' : '🔴 Inactivo',
                    inline: true
                },
                {
                    name: '🎯 Aldeas Monitoreadas',
                    value: stats.monitoredVillages.toString(),
                    inline: true
                },
                {
                    name: '⏱️ Intervalo',
                    value: `${stats.interval} minutos`,
                    inline: true
                }
            )
            .setTimestamp();
            
        if (stats.nextRun) {
            embed.addFields({
                name: '🔄 Próxima Ejecución',
                value: `<t:${Math.floor(new Date(stats.nextRun).getTime() / 1000)}:R>`,
                inline: false
            });
        }
        
        const monitoredVillages = tracker.getMonitoredVillages();
        if (monitoredVillages.length > 0) {
            const villageList = monitoredVillages.slice(0, 10).join(', ');
            const remaining = monitoredVillages.length > 10 ? `\n... y ${monitoredVillages.length - 10} más` : '';
            
            embed.addFields({
                name: '🏘️ Lista de Aldeas Monitoreadas',
                value: villageList + remaining,
                inline: false
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    },

    async createAnalysisEmbed(villageInfo, analysis, hours, buildingType = 'all') {
        const buildingEmojis = {
            'all': '🏗️',
            'main': '🏛️',
            'barracks': '⚔️',
            'stable': '🐎',
            'garage': '🏹',
            'church': '⛪',
            'church_f': '⛪',
            'watchtower': '🗼',
            'snob': '🎓',
            'smith': '⚒️',
            'place': '�️',
            'statue': '🗿',
            'market': '�',
            'wood': '🪓',
            'stone': '🧱',
            'iron': '⛏️',
            'farm': '�',
            'storage': '📦',
            'hide': '🕳️',
            'wall': '🏰'
        };

        const buildingNames = {
            'all': 'Todos los Edificios',
            'main': 'Cuartel General',
            'barracks': 'Cuartel',
            'stable': 'Establo',
            'garage': 'Taller',
            'church': 'Iglesia',
            'church_f': 'Primera Iglesia',
            'watchtower': 'Torre de Vigilancia',
            'snob': 'Academia',
            'smith': 'Herrería',
            'place': 'Plaza',
            'statue': 'Estatua',
            'market': 'Mercado',
            'wood': 'Leñador',
            'stone': 'Pozo de Arcilla',
            'iron': 'Mina de Hierro',
            'farm': 'Granja',
            'storage': 'Almacén',
            'hide': 'Escondite',
            'wall': 'Muralla'
        };

        const emoji = buildingEmojis[buildingType] || '🏗️';
        const buildingName = buildingNames[buildingType] || 'Edificios';

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`${emoji} Análisis de Mejoras de ${buildingName}`)
            .setDescription(`**Aldea:** ${villageInfo.name} (${villageInfo.x}|${villageInfo.y})`)
            .addFields(
                {
                    name: '📊 Resumen del Análisis',
                    value: [
                        `**Tipo:** ${buildingName}`,
                        `**Período:** Últimas ${hours} horas`,
                        `**Snapshots analizados:** ${analysis.totalSnapshots}`,
                        `**Períodos con mejoras:** ${analysis.analysisCount}`,
                        `**Confianza:** ${this.getConfidenceIcon(analysis.summary.confidenceLevel)} ${analysis.summary.confidenceLevel.toUpperCase()}`
                    ].join('\n'),
                    inline: false
                }
            );

        // Mostrar estadísticas por edificio si hay múltiples tipos
        if (buildingType === 'all' && analysis.summary.buildingStats) {
            let buildingStatsText = '';
            const stats = Object.entries(analysis.summary.buildingStats)
                .sort(([,a], [,b]) => b.totalPoints - a.totalPoints)
                .slice(0, 5);

            for (const [building, stat] of stats) {
                const emoji = buildingEmojis[building] || '🏗️';
                const name = buildingNames[building] || building;
                buildingStatsText += `${emoji} **${name}:** ${stat.count} mejoras (${stat.totalPoints} pts)\n`;
            }

            if (buildingStatsText) {
                embed.addFields({
                    name: '🏗️ Estadísticas por Edificio',
                    value: buildingStatsText,
                    inline: false
                });
            }
        }

        if (analysis.upgrades && analysis.upgrades.length > 0) {
            // Mostrar hasta 3 períodos de mejoras más recientes
            const recentUpgrades = analysis.upgrades.slice(-3);
            
            for (let i = 0; i < recentUpgrades.length; i++) {
                const upgrade = recentUpgrades[i];
                const possibleUpgrades = upgrade.possibleUpgrades.slice(0, 3);
                
                let upgradeText = `**Puntos ganados:** ${upgrade.pointsGained}\n`;
                upgradeText += `**Duración:** ${upgrade.timeSpan}\n\n`;
                
                if (possibleUpgrades.length > 0) {
                    upgradeText += '**Posibles mejoras:**\n';
                    possibleUpgrades.forEach((pUpgrade, idx) => {
                        if (pUpgrade.type === 'single') {
                            const emoji = buildingEmojis[pUpgrade.building] || '🏗️';
                            upgradeText += `${idx + 1}. ${emoji} ${pUpgrade.building} ${pUpgrade.fromLevel}→${pUpgrade.toLevel} (${pUpgrade.pointsCost} pts)\n`;
                        } else if (pUpgrade.type === 'multiple') {
                            const emoji = buildingEmojis[pUpgrade.building] || '🏗️';
                            upgradeText += `${idx + 1}. ${emoji} ${pUpgrade.building} ${pUpgrade.fromLevel}→${pUpgrade.toLevel} (+${pUpgrade.levelsUpgraded} niveles, ${pUpgrade.pointsCost} pts)\n`;
                        } else if (pUpgrade.type === 'combination') {
                            upgradeText += `${idx + 1}. Combinación:\n`;
                            pUpgrade.buildings.forEach(b => {
                                const emoji = buildingEmojis[b.building] || '🏗️';
                                upgradeText += `   • ${emoji} ${b.building} ${b.fromLevel}→${b.toLevel} (${b.pointsCost} pts)\n`;
                            });
                        }
                    });
                } else {
                    upgradeText += `*No se detectaron mejoras específicas de ${buildingName.toLowerCase()}*\n`;
                    upgradeText += '*(Los puntos pueden ser de otros edificios)*';
                }
                
                embed.addFields({
                    name: `🔨 Período ${i + 1} - <t:${Math.floor(new Date(upgrade.to).getTime() / 1000)}:R>`,
                    value: upgradeText,
                    inline: false
                });
            }
            
            // Resumen general
            if (analysis.summary.mostLikelyUpgrades.length > 0) {
                const summaryText = analysis.summary.mostLikelyUpgrades
                    .map(item => `• ${item.upgrade}: ${item.frequency}x`)
                    .join('\n');
                
                embed.addFields({
                    name: '🎯 Patrones Más Comunes',
                    value: summaryText,
                    inline: false
                });
            }
        } else {
            embed.addFields({
                name: '📝 Resultado',
                value: 'No se detectaron mejoras de muralla en el período especificado.\n\n*Esto puede significar que:*\n• No se mejoraron murallas\n• Los puntos ganados son de otros edificios\n• Necesitas más datos históricos',
                inline: false
            });
        }
        
        embed.setFooter({ 
            text: 'Los análisis se basan en incrementos de puntos y pueden incluir mejoras de otros edificios' 
        });
        embed.setTimestamp();
        
        return embed;
    },

    getConfidenceIcon(level) {
        switch (level) {
            case 'high': return '🟢';
            case 'medium': return '🟡';
            case 'low': return '🔴';
            default: return '⚪';
        }
    }
};