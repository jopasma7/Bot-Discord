const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GTDataManager = require('../utils/gtData');
const KillsDataManager = require('../utils/killsData');

const gtData = new GTDataManager();
const killsData = new KillsDataManager();

// Cache para datos de navegación
const navigationCache = new Map();

// Limpiar cache periódicamente (cada 10 minutos)
setInterval(() => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    for (const [key, value] of navigationCache.entries()) {
        if (now - value.timestamp > tenMinutes) {
            navigationCache.delete(key);
        }
    }
}, 5 * 60 * 1000); // Revisar cada 5 minutos

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kills')
        .setDescription('Información sobre adversarios vencidos en GT ES95')
        .addSubcommand(subcommand =>
            subcommand
                .setName('jugador')
                .setDescription('Ver estadísticas de kills de un jugador')
                .addStringOption(option =>
                    option.setName('nombre')
                        .setDescription('Nombre del jugador')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('tribu')
                .setDescription('Ver estadísticas de kills de una tribu')
                .addStringOption(option =>
                    option.setName('nombre')
                        .setDescription('Nombre de la tribu')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Número de miembros a mostrar (por defecto 10)')
                        .setMinValue(5)
                        .setMaxValue(50)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ranking')
                .setDescription('Ver el ranking de kills')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de ranking a mostrar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Kills Totales', value: 'kill_all' },
                            { name: 'Kills Atacando', value: 'kill_att' },
                            { name: 'Kills Defendiendo', value: 'kill_def' },
                            { name: 'Kills Apoyando', value: 'kill_sup' }
                        ))
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Número de jugadores a mostrar (por defecto 10)')
                        .setMinValue(5)
                        .setMaxValue(50)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('comparar')
                .setDescription('Comparar kills entre jugadores (máximo 5)')
                .addStringOption(option =>
                    option.setName('jugador1')
                        .setDescription('Primer jugador')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('jugador2')
                        .setDescription('Segundo jugador')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('jugador3')
                        .setDescription('Tercer jugador')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('jugador4')
                        .setDescription('Cuarto jugador')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('jugador5')
                        .setDescription('Quinto jugador')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('analisis')
                .setDescription('Análisis detallado de kills de un jugador')
                .addStringOption(option =>
                    option.setName('nombre')
                        .setDescription('Nombre del jugador')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'jugador':
                    return await this.handlePlayerKills(interaction);
                case 'tribu':
                    return await this.handleTribeKills(interaction);
                case 'ranking':
                    return await this.handleRanking(interaction);
                case 'comparar':
                    return await this.handleCompare(interaction);
                case 'analisis':
                    return await this.handleAnalysis(interaction);
                default:
                    await interaction.reply({ content: '❌ Subcomando no reconocido.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error en comando kills:', error);
            await interaction.reply({ 
                content: '❌ Error al procesar el comando. Por favor intenta nuevamente.', 
                ephemeral: true 
            });
        }
    },

    async handlePlayerKills(interaction) {
        await interaction.deferReply();
        
        const playerName = interaction.options.getString('nombre');
        const players = await gtData.getPlayers();
        
        // Buscar jugador
        const player = players.find(p => 
            p.name.toLowerCase().includes(playerName.toLowerCase())
        );
        
        if (!player) {
            return await interaction.editReply({
                content: `❌ No se encontró ningún jugador con el nombre "${playerName}".`
            });
        }

        // Obtener datos de kills
        const kills = await killsData.getPlayerKills(player.id);
        
        // Obtener información de tribu
        let tribeInfo = 'Sin tribu';
        if (player.tribeId && player.tribeId !== 0) {
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === player.tribeId);
            tribeInfo = tribe ? tribe.name : `Tribu ID: ${player.tribeId}`;
        }

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`🗡️ Estadísticas de Kills - ${player.name}`)
            .setDescription(`**Tribu:** ${tribeInfo}\n**Puntos:** ${player.points.toLocaleString()}`)
            .addFields(
                {
                    name: '⚔️ Kills Totales',
                    value: `**${kills.all.kills.toLocaleString()}** kills\n**Ranking:** #${kills.all.ranking || 'N/A'}`,
                    inline: true
                },
                {
                    name: '⚡ Kills Atacando',
                    value: `**${kills.attack.kills.toLocaleString()}** kills\n**Ranking:** #${kills.attack.ranking || 'N/A'}`,
                    inline: true
                },
                {
                    name: '🛡️ Kills Defendiendo',
                    value: `**${kills.defense.kills.toLocaleString()}** kills\n**Ranking:** #${kills.defense.ranking || 'N/A'}`,
                    inline: true
                },
                {
                    name: '🤝 Kills Apoyando',
                    value: `**${kills.support.kills.toLocaleString()}** kills\n**Ranking:** #${kills.support.ranking || 'N/A'}`,
                    inline: true
                }
            )
            .setFooter({ 
                text: `GT ES95 • Jugador ID: ${player.id}`,
                iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
            })
            .setTimestamp();

        // Calcular ratios si hay datos suficientes
        if (kills.all.kills > 0) {
            const attackRatio = ((kills.attack.kills / kills.all.kills) * 100).toFixed(1);
            const defenseRatio = ((kills.defense.kills / kills.all.kills) * 100).toFixed(1);
            const supportRatio = ((kills.support.kills / kills.all.kills) * 100).toFixed(1);
            
            embed.addFields({
                name: '📊 Análisis',
                value: `**Ataque:** ${attackRatio}% de sus kills\n**Defensa:** ${defenseRatio}% de sus kills\n**Apoyo:** ${supportRatio}% de sus kills`,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    async handleTribeKills(interaction) {
        await interaction.deferReply();
        
        const tribeName = interaction.options.getString('nombre');
        const limit = interaction.options.getInteger('limite') || 10;
        
        const tribes = await gtData.getTribes();
        const tribe = tribes.find(t => 
            t.name.toLowerCase().includes(tribeName.toLowerCase())
        );
        
        if (!tribe) {
            return await interaction.editReply({
                content: `❌ No se encontró ninguna tribu con el nombre "${tribeName}".`
            });
        }

        const tribeKills = await killsData.getTribeKillsAnalysis(tribe.id, gtData);
        
        if (!tribeKills || tribeKills.members.length === 0) {
            return await interaction.editReply({
                content: `❌ No se encontraron datos de kills para la tribu "${tribe.name}".`
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle(`🏆 Estadísticas de Kills - ${tribeKills.tribeName}`)
            .setDescription(`**Miembros analizados:** ${tribeKills.members.length}`)
            .addFields(
                {
                    name: '🏅 Totales de la Tribu',
                    value: `⚔️ **Total:** ${tribeKills.totals.all.toLocaleString()}\n⚡ **Atacando:** ${tribeKills.totals.attack.toLocaleString()}\n🛡️ **Defendiendo:** ${tribeKills.totals.defense.toLocaleString()}\n🤝 **Apoyando:** ${tribeKills.totals.support.toLocaleString()}`,
                    inline: false
                }
            );

        // Mostrar top miembros
        const topMembers = tribeKills.members.slice(0, limit);
        let memberList = '';
        
        for (let i = 0; i < topMembers.length; i++) {
            const member = topMembers[i];
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
            memberList += `${medal} **${member.name}**\n`;
            memberList += `⚔️ ${member.kills.all.kills.toLocaleString()} ⚡ ${member.kills.attack.kills.toLocaleString()} 🛡️ ${member.kills.defense.kills.toLocaleString()} 🤝 ${member.kills.support.kills.toLocaleString()}\n\n`;
        }

        if (memberList.length > 1024) {
            memberList = memberList.substring(0, 1021) + '...';
        }

        embed.addFields({
            name: `👥 Top ${topMembers.length} Miembros`,
            value: memberList || 'Sin datos disponibles',
            inline: false
        });

        embed.setFooter({ 
            text: `GT ES95 • Tribu ID: ${tribe.id}`,
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
        })
        .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleRanking(interaction) {
        await interaction.deferReply();
        
        const type = interaction.options.getString('tipo');
        const limit = interaction.options.getInteger('limite') || 10;
        
        const topKillers = await killsData.getTopKillers(type, limit);
        const players = await gtData.getPlayers();
        
        if (topKillers.length === 0) {
            return await interaction.editReply({
                content: '❌ No se pudieron obtener los datos de ranking.'
            });
        }

        const typeNames = {
            'kill_all': '⚔️ Kills Totales',
            'kill_att': '⚡ Kills Atacando', 
            'kill_def': '🛡️ Kills Defendiendo',
            'kill_sup': '🤝 Kills Apoyando'
        };

        const embed = new EmbedBuilder()
            .setColor(0xF39C12)
            .setTitle(`🏆 Ranking - ${typeNames[type]}`)
            .setDescription(`Top ${limit} jugadores con más kills`)
            .setTimestamp();

        let rankingList = '';
        
        for (let i = 0; i < topKillers.length; i++) {
            const killer = topKillers[i];
            const player = players.find(p => p.id === killer.playerId);
            
            if (player) {
                const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
                rankingList += `${medal} **${player.name}** - ${killer.kills.toLocaleString()} kills\n`;
                
                // Agregar info de tribu si existe
                if (player.tribeId && player.tribeId !== 0) {
                    const tribes = await gtData.getTribes();
                    const tribe = tribes.find(t => t.id === player.tribeId);
                    if (tribe) {
                        rankingList += `└ ${tribe.name}\n`;
                    }
                }
                rankingList += '\n';
            }
        }

        if (rankingList.length > 1024) {
            rankingList = rankingList.substring(0, 1021) + '...';
        }

        embed.addFields({
            name: `📊 Ranking`,
            value: rankingList || 'Sin datos disponibles',
            inline: false
        });

        // Botones de navegación para diferentes tipos de kills
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('kills_ranking_all')
                    .setLabel('Totales')
                    .setStyle(type === 'kill_all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('kills_ranking_att')
                    .setLabel('Ataque')
                    .setStyle(type === 'kill_att' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji('⚡')
            );
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('kills_ranking_def')
                    .setLabel('Defensa')
                    .setStyle(type === 'kill_def' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji('🛡️'),
                new ButtonBuilder()
                    .setCustomId('kills_ranking_sup')
                    .setLabel('Apoyo')
                    .setStyle(type === 'kill_sup' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji('🤝')
            );

        // Guardar configuración en cache para navegación
        const cacheKey = `kills_ranking_${interaction.user.id}_${Date.now()}`;
        navigationCache.set(cacheKey, {
            limit: limit,
            userId: interaction.user.id,
            timestamp: Date.now()
        });

        embed.setFooter({ 
            text: `GT ES95 • Página 1 • Cache: ${cacheKey.split('_').pop()}`,
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
        });

        await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    },

    async handleCompare(interaction) {
        await interaction.deferReply();
        
        const playerNames = [
            interaction.options.getString('jugador1'),
            interaction.options.getString('jugador2'),
            interaction.options.getString('jugador3'),
            interaction.options.getString('jugador4'),
            interaction.options.getString('jugador5')
        ].filter(Boolean);

        const players = await gtData.getPlayers();
        const foundPlayers = [];
        
        // Buscar todos los jugadores
        for (const name of playerNames) {
            const player = players.find(p => 
                p.name.toLowerCase().includes(name.toLowerCase())
            );
            
            if (player) {
                foundPlayers.push(player);
            } else {
                return await interaction.editReply({
                    content: `❌ No se encontró el jugador "${name}".`
                });
            }
        }

        // Obtener datos de kills para todos
        const playerIds = foundPlayers.map(p => p.id);
        const comparisons = await killsData.getKillsComparison(playerIds);
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`⚖️ Comparación de Kills`)
            .setDescription(`Comparando ${foundPlayers.length} jugadores`)
            .setTimestamp();

        let comparisonText = '';
        
        for (let i = 0; i < foundPlayers.length; i++) {
            const player = foundPlayers[i];
            const kills = comparisons[i].kills;
            
            comparisonText += `**${i + 1}. ${player.name}**\n`;
            comparisonText += `⚔️ Total: ${kills.all.kills.toLocaleString()} (#${kills.all.ranking || 'N/A'})\n`;
            comparisonText += `⚡ Ataque: ${kills.attack.kills.toLocaleString()} (#${kills.attack.ranking || 'N/A'})\n`;
            comparisonText += `🛡️ Defensa: ${kills.defense.kills.toLocaleString()} (#${kills.defense.ranking || 'N/A'})\n`;
            comparisonText += `🤝 Apoyo: ${kills.support.kills.toLocaleString()} (#${kills.support.ranking || 'N/A'})\n\n`;
        }

        if (comparisonText.length > 1024) {
            comparisonText = comparisonText.substring(0, 1021) + '...';
        }

        embed.addFields({
            name: '📊 Estadísticas',
            value: comparisonText || 'Sin datos disponibles',
            inline: false
        });

        // Encontrar el mejor en cada categoría
        const bestTotal = comparisons.reduce((best, current) => 
            current.kills.all.kills > best.kills.all.kills ? current : best
        );
        const bestAttack = comparisons.reduce((best, current) => 
            current.kills.attack.kills > best.kills.attack.kills ? current : best
        );
        const bestDefense = comparisons.reduce((best, current) => 
            current.kills.defense.kills > best.kills.defense.kills ? current : best
        );
        const bestSupport = comparisons.reduce((best, current) => 
            current.kills.support.kills > best.kills.support.kills ? current : best
        );

        const bestPlayerTotal = foundPlayers.find(p => p.id === bestTotal.playerId);
        const bestPlayerAttack = foundPlayers.find(p => p.id === bestAttack.playerId);
        const bestPlayerDefense = foundPlayers.find(p => p.id === bestDefense.playerId);
        const bestPlayerSupport = foundPlayers.find(p => p.id === bestSupport.playerId);

        embed.addFields({
            name: '🏆 Mejores en cada categoría',
            value: `⚔️ **Total:** ${bestPlayerTotal.name}\n⚡ **Ataque:** ${bestPlayerAttack.name}\n🛡️ **Defensa:** ${bestPlayerDefense.name}\n🤝 **Apoyo:** ${bestPlayerSupport.name}`,
            inline: false
        });

        embed.setFooter({ 
            text: 'GT ES95 • Comparación de Kills',
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
        });

        await interaction.editReply({ embeds: [embed] });
    },

    async handleAnalysis(interaction) {
        await interaction.deferReply();
        
        const playerName = interaction.options.getString('nombre');
        const players = await gtData.getPlayers();
        
        // Buscar jugador
        const player = players.find(p => 
            p.name.toLowerCase().includes(playerName.toLowerCase())
        );
        
        if (!player) {
            return await interaction.editReply({
                content: `❌ No se encontró ningún jugador con el nombre "${playerName}".`
            });
        }

        // Obtener datos completos
        const kills = await killsData.getPlayerKills(player.id);
        const [allKills, attackKills, defenseKills] = await Promise.all([
            killsData.getAllKills(),
            killsData.getAttackKills(),
            killsData.getDefenseKills()
        ]);

        // Análisis de posición
        const totalPlayers = allKills.length;
        const percentile = totalPlayers > 0 ? ((totalPlayers - (kills.all.ranking || totalPlayers)) / totalPlayers * 100).toFixed(1) : 0;

        let tribeInfo = 'Sin tribu';
        let tribeRanking = '';
        
        if (player.tribeId && player.tribeId !== 0) {
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === player.tribeId);
            if (tribe) {
                tribeInfo = tribe.name;
                const tribeAnalysis = await killsData.getTribeKillsAnalysis(player.tribeId, gtData);
                if (tribeAnalysis) {
                    const memberIndex = tribeAnalysis.members.findIndex(m => m.id === player.id);
                    if (memberIndex >= 0) {
                        tribeRanking = `\n**Posición en tribu:** #${memberIndex + 1} de ${tribeAnalysis.members.length}`;
                    }
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle(`🔍 Análisis Detallado - ${player.name}`)
            .setDescription(`**Tribu:** ${tribeInfo}${tribeRanking}\n**Puntos:** ${player.points.toLocaleString()}`)
            .addFields(
                {
                    name: '⚔️ Kills Totales',
                    value: `**${kills.all.kills.toLocaleString()}** kills\n**Ranking:** #${kills.all.ranking || 'N/A'} de ${totalPlayers.toLocaleString()}\n**Percentil:** ${percentile}%`,
                    inline: true
                },
                {
                    name: '⚡ Kills Atacando',
                    value: `**${kills.attack.kills.toLocaleString()}** kills\n**Ranking:** #${kills.attack.ranking || 'N/A'}\n**% del total:** ${kills.all.kills > 0 ? ((kills.attack.kills / kills.all.kills) * 100).toFixed(1) : 0}%`,
                    inline: true
                },
                {
                    name: '🛡️ Kills Defendiendo',
                    value: `**${kills.defense.kills.toLocaleString()}** kills\n**Ranking:** #${kills.defense.ranking || 'N/A'}\n**% del total:** ${kills.all.kills > 0 ? ((kills.defense.kills / kills.all.kills) * 100).toFixed(1) : 0}%`,
                    inline: true
                },
                {
                    name: '🤝 Kills Apoyando',
                    value: `**${kills.support.kills.toLocaleString()}** kills\n**Ranking:** #${kills.support.ranking || 'N/A'}\n**% del total:** ${kills.all.kills > 0 ? ((kills.support.kills / kills.all.kills) * 100).toFixed(1) : 0}%`,
                    inline: true
                }
            );

        // Análisis de eficiencia (kills por punto)
        if (player.points > 0) {
            const efficiency = (kills.all.kills / player.points * 1000).toFixed(3);
            embed.addFields({
                name: '📈 Eficiencia',
                value: `**${efficiency}** kills por cada 1000 puntos\n*Mide qué tan agresivo es el jugador*`,
                inline: false
            });
        }

        // Perfil de combate
        let combatProfile = '';
        const attackPercentage = kills.all.kills > 0 ? (kills.attack.kills / kills.all.kills) * 100 : 0;
        const defensePercentage = kills.all.kills > 0 ? (kills.defense.kills / kills.all.kills) * 100 : 0;
        const supportPercentage = kills.all.kills > 0 ? (kills.support.kills / kills.all.kills) * 100 : 0;
        
        // Determinar perfil basado en el tipo dominante
        if (attackPercentage >= 50) {
            combatProfile = '⚡ **Agresor** - Especializado en ataques';
        } else if (defensePercentage >= 50) {
            combatProfile = '🛡️ **Defensor** - Especializado en defensa';
        } else if (supportPercentage >= 30) {
            combatProfile = '🤝 **Apoyo** - Especializado en soporte';
        } else if (attackPercentage >= 30 && defensePercentage >= 30) {
            combatProfile = '⚖️ **Equilibrado** - Balance ataque/defensa';
        } else if (attackPercentage + supportPercentage >= 50) {
            combatProfile = '🎯 **Ofensivo** - Balance ataque/apoyo';
        } else {
            combatProfile = '🏰 **Táctico** - Estilo mixto balanceado';
        }

        embed.addFields({
            name: '🎯 Perfil de Combate',
            value: `${combatProfile}\n📊 **Distribución:** ${attackPercentage.toFixed(1)}% Ataque | ${defensePercentage.toFixed(1)}% Defensa | ${supportPercentage.toFixed(1)}% Apoyo`,
            inline: false
        });

        embed.setFooter({ 
            text: `GT ES95 • Análisis completo • ID: ${player.id}`,
            iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
        })
        .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    // Exportar navigationCache para uso en index.js
    navigationCache
};
