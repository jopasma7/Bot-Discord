const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const KillsNotificationScheduler = require('../utils/killsNotificationScheduler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kills-test')
        .setDescription('🧪 Prueba el formato de adversarios con datos realistas de 11 jugadores')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Crear datos de prueba realistas con 11 jugadores
            const mockResult = {
                changes: {},
                summary: {
                    summary: `11 jugadores ganaron adversarios en la última hora`,
                    totals: {
                        all: 2847,
                        attack: 1205,
                        defense: 832,
                        support: 810
                    },
                    totalPlayers: 11,
                    timeText: '1 hora',
                    timeDiff: 3600000,
                    topGainers: [
                        {
                            playerId: '1031',
                            playerData: {
                                name: 'SANT0',
                                tribe: { tag: 'GT' }
                            },
                            totalGained: 485,
                            categories: {
                                attack: { gained: 200 },
                                defense: { gained: 185 },
                                support: { gained: 100 }
                            }
                        },
                        {
                            playerId: '2063206',
                            playerData: {
                                name: 'ignacio17',
                                tribe: { tag: 'ES95' }
                            },
                            totalGained: 412,
                            categories: {
                                attack: { gained: 180 },
                                defense: { gained: 132 },
                                support: { gained: 100 }
                            }
                        },
                        {
                            playerId: '967045',
                            playerData: {
                                name: 'APU BADULAQUE',
                                tribe: { tag: 'WOLF' }
                            },
                            totalGained: 389,
                            categories: {
                                attack: { gained: 245 },
                                defense: { gained: 89 },
                                support: { gained: 55 }
                            }
                        },
                        {
                            playerId: '1234567',
                            playerData: {
                                name: 'WarriorKing',
                                tribe: { tag: 'FIRE' }
                            },
                            totalGained: 356,
                            categories: {
                                attack: { gained: 220 },
                                defense: { gained: 76 },
                                support: { gained: 60 }
                            }
                        },
                        {
                            playerId: '2345678',
                            playerData: {
                                name: 'DefenseWall',
                                tribe: null
                            },
                            totalGained: 298,
                            categories: {
                                attack: { gained: 45 },
                                defense: { gained: 203 },
                                support: { gained: 50 }
                            }
                        },
                        {
                            playerId: '3456789',
                            playerData: {
                                name: 'QuickStrike',
                                tribe: { tag: 'ICE' }
                            },
                            totalGained: 275,
                            categories: {
                                attack: { gained: 165 },
                                defense: { gained: 67 },
                                support: { gained: 43 }
                            }
                        },
                        {
                            playerId: '4567890',
                            playerData: {
                                name: 'SupportMaster',
                                tribe: { tag: 'GT' }
                            },
                            totalGained: 251,
                            categories: {
                                attack: { gained: 40 },
                                defense: { gained: 35 },
                                support: { gained: 176 }
                            }
                        },
                        {
                            playerId: '5678901',
                            playerData: {
                                name: 'BlazeFighter',
                                tribe: { tag: 'FIRE' }
                            },
                            totalGained: 198,
                            categories: {
                                attack: { gained: 89 },
                                defense: { gained: 54 },
                                support: { gained: 55 }
                            }
                        },
                        {
                            playerId: '6789012',
                            playerData: {
                                name: 'IceGuardian',
                                tribe: { tag: 'ES95' }
                            },
                            totalGained: 167,
                            categories: {
                                attack: { gained: 21 },
                                defense: { gained: 91 },
                                support: { gained: 55 }
                            }
                        },
                        {
                            playerId: '7890123',
                            playerData: {
                                name: 'NoobDestroyer',
                                tribe: null
                            },
                            totalGained: 134,
                            categories: {
                                attack: { gained: 78 },
                                defense: { gained: 34 },
                                support: { gained: 22 }
                            }
                        },
                        {
                            playerId: '8901234',
                            playerData: {
                                name: 'LastWarrior',
                                tribe: { tag: 'WOLF' }
                            },
                            totalGained: 82,
                            categories: {
                                attack: { gained: 22 },
                                defense: { gained: 35 },
                                support: { gained: 25 }
                            }
                        }
                    ]
                }
            };

            // Usar el scheduler para crear los embeds con el formato real
            const scheduler = new KillsNotificationScheduler(interaction.client);
            const embeds = await scheduler.createNotificationEmbeds(mockResult);

            // Enviar el embed principal
            await interaction.editReply({ embeds: [embeds[0]] });

            // Si hay embeds adicionales (estadísticas), enviarlos también
            if (embeds.length > 1) {
                for (let i = 1; i < embeds.length; i++) {
                    await interaction.followUp({ embeds: [embeds[i]] });
                }
            }

            // Enviar información adicional
            const infoEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Prueba de Formato Completada')
                .setDescription('Este es el formato real que verás en las notificaciones automáticas.')
                .addFields(
                    { name: '📊 Datos Mostrados', value: '11 jugadores con diferentes estadísticas', inline: true },
                    { name: '🏆 Tribus Incluidas', value: 'GT, ES95, WOLF, FIRE, ICE', inline: true },
                    { name: '⚔️ Total Simulado', value: '2,847 adversarios ganados', inline: true }
                )
                .setFooter({ text: 'Este comando es solo para pruebas - datos ficticios' })
                .setTimestamp();

            await interaction.followUp({ embeds: [infoEmbed] });

        } catch (error) {
            console.error('Error en kills-test:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('❌ Error en Prueba')
                        .setDescription(`Error: ${error.message}`)
                ]
            });
        }
    },
};