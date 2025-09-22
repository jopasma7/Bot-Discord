const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const KillsTracker = require('./killsTracker');
const fs = require('fs').promises;
const path = require('path');

class KillsNotificationScheduler {
    constructor(client) {
        this.client = client;
        this.tracker = new KillsTracker();
        this.configFile = path.join(__dirname, '..', 'data', 'kills-notifications.json');
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * Inicia el sistema de notificaciones programadas
     */
    async start() {
        if (this.isRunning) {
            console.log('[NotificationScheduler] Ya está en funcionamiento');
            return;
        }

        console.log('[NotificationScheduler] Iniciando sistema de notificaciones...');

        // Programar verificación cada 2 horas en punto (horas pares)
        this.mainJob = cron.schedule('0 */2 * * *', async () => {
            await this.checkAndSendNotifications();
        }, {
            scheduled: false,
            timezone: "Europe/Madrid"
        });

        this.mainJob.start();
        this.isRunning = true;

        console.log('[NotificationScheduler] ✅ Sistema de notificaciones iniciado');
        console.log('[NotificationScheduler] ⏰ Verificaciones programadas cada 2 horas en punto');

        // Ejecutar una verificación inicial después de 1 minuto (sin forzar descarga)
        setTimeout(async () => {
            console.log('[NotificationScheduler] 🔄 Ejecutando verificación inicial (carga desde archivos locales si existen)...');
            
            const config = await this.loadConfig();
            for (const [guildId, guildConfig] of Object.entries(config)) {
                if (guildConfig.enabled) {
                    await this.sendNotificationToGuild(guildId, guildConfig, false); // Sin forzar descarga
                }
            }
        }, 60000);
    }

    /**
     * Detiene el sistema de notificaciones
     */
    stop() {
        if (this.mainJob) {
            this.mainJob.stop();
            this.mainJob = null;
        }
        
        this.jobs.forEach(job => job.stop());
        this.jobs.clear();
        this.isRunning = false;

        console.log('[NotificationScheduler] 🛑 Sistema de notificaciones detenido');
    }

    /**
     * Verifica configuraciones y envía notificaciones si corresponde
     */
    async checkAndSendNotifications() {
        try {
            console.log('[NotificationScheduler] 🔍 Verificando notificaciones programadas...');

            const config = await this.loadConfig();
            const currentHour = new Date().getHours();

            for (const [guildId, guildConfig] of Object.entries(config)) {
                if (!guildConfig.enabled) continue;

                // Verificar si es hora de enviar notificación según el intervalo
                if (this.shouldSendNotification(currentHour, guildConfig.interval)) {
                    await this.sendNotificationToGuild(guildId, guildConfig, true); // Forzar descarga
                }
            }

        } catch (error) {
            console.error('[NotificationScheduler] Error en verificación:', error);
        }
    }

    /**
     * Determina si debe enviar notificación según la hora actual y el intervalo
     */
    shouldSendNotification(currentHour, interval) {
        const hours = parseInt(interval.replace('h', ''));
        // Para intervalos de 2h, verificar horas pares
        if (hours === 2) {
            return currentHour % 2 === 0;
        }
        // Para otros intervalos, mantener lógica original
        return currentHour % hours === 0;
    }

    /**
     * Envía notificación a un servidor específico
     */
    async sendNotificationToGuild(guildId, guildConfig, forceDownload = false) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(`[NotificationScheduler] Guild ${guildId} no encontrado`);
                return;
            }

            const channel = guild.channels.cache.get(guildConfig.channelId);
            if (!channel) {
                console.log(`[NotificationScheduler] Canal ${guildConfig.channelId} no encontrado en ${guild.name}`);
                return;
            }

            const downloadType = forceDownload ? 'descarga forzada' : 'archivos locales/cache';
            console.log(`[NotificationScheduler] 📊 Ejecutando tracking para ${guild.name} (${downloadType})...`);

            // Ejecutar tracking de kills
            const result = await this.tracker.trackKills(true, forceDownload);

            // SIEMPRE enviar notificación (con o sin cambios)
            const embeds = await this.createNotificationEmbeds(result);
            
            // Enviar embeds al canal
            const sentMessages = [];
            for (const embed of embeds) {
                const message = await channel.send({ embeds: [embed] });
                sentMessages.push(message);
            }

            // Si no hay cambios, programar eliminación automática después de 1 hora
            if (!result.summary.hasChanges || result.summary.totalPlayers === 0) {
                setTimeout(async () => {
                    try {
                        for (const message of sentMessages) {
                            await message.delete();
                            console.log(`[NotificationScheduler] 🗑️ Mensaje "sin cambios" eliminado automáticamente`);
                        }
                    } catch (error) {
                        console.error(`[NotificationScheduler] Error eliminando mensaje automáticamente:`, error);
                    }
                }, 60 * 60 * 1000); // 1 hora
            }

            if (result.summary.hasChanges) {
                console.log(`[NotificationScheduler] ✅ Notificación enviada a ${guild.name} (${result.summary.totalPlayers} jugadores con cambios)`);
            } else {
                console.log(`[NotificationScheduler] ✅ Notificación de estado enviada a ${guild.name} (sin cambios detectados)`);
            }

        } catch (error) {
            console.error(`[NotificationScheduler] Error enviando notificación a guild ${guildId}:`, error);
        }
    }

    /**
     * Crea embeds con formato 4D: Barras Compactas con Detalles
     */
    async createNotificationEmbeds(result) {
        const embeds = [];
        const { changes, summary } = result;

        // Si no hay cambios, crear embed elegante especial
        if (!summary.hasChanges || summary.totalPlayers === 0) {
            return this.createNoChangesEmbed();
        }

        // Calcular porcentajes para las barras (evitar división por 0)
        const total = summary.totals?.all || 0;
        const attackTotal = summary.totals?.attack || 0;
        const defenseTotal = summary.totals?.defense || 0;
        const supportTotal = summary.totals?.support || 0;
        
        // DEBUG: Log para verificar consistencia
        console.log(`[NotificationScheduler] DEBUG: total=${total}, atk=${attackTotal}, def=${defenseTotal}, sup=${supportTotal}, suma=${attackTotal + defenseTotal + supportTotal}`);
        
        // ARREGLADO: Calcular porcentajes correctos
        let attackPct = 0, defensePct = 0, supportPct = 0;
        if (total > 0) {
            // Calcular porcentajes exactos
            const attackExact = (attackTotal / total) * 100;
            const defenseExact = (defenseTotal / total) * 100;
            const supportExact = (supportTotal / total) * 100;
            
            // Redondear individualmente
            attackPct = Math.round(attackExact);
            defensePct = Math.round(defenseExact);
            supportPct = Math.round(supportExact);
            
            // Ajustar para que sume exactamente 100%
            const sum = attackPct + defensePct + supportPct;
            const diff = 100 - sum;
            
            if (diff !== 0) {
                // Encontrar cuál categoría tiene el mayor valor para ajustar
                const values = [
                    { type: 'attack', value: attackTotal, exact: attackExact },
                    { type: 'defense', value: defenseTotal, exact: defenseExact },
                    { type: 'support', value: supportTotal, exact: supportExact }
                ];
                
                // Ordenar por valor total descendente para ajustar el más grande
                values.sort((a, b) => b.value - a.value);
                
                // Ajustar el porcentaje de la categoría más grande
                if (values[0].type === 'attack') {
                    attackPct += diff;
                } else if (values[0].type === 'defense') {
                    defensePct += diff;
                } else {
                    supportPct += diff;
                }
            }
        }
        // Cuando total = 0, todos los porcentajes permanecen en 0%

        // Crear barras de progreso (10 caracteres)
        const createBar = (value, max) => {
            if (max === 0) return '▱▱▱▱▱▱▱▱▱▱';
            const filled = Math.max(0, Math.min(10, Math.round((value / max) * 10)));
            return '▰'.repeat(filled) + '▱'.repeat(10 - filled);
        };

        // Usar el total real para las barras de progreso (no el máximo de categorías)
        const maxCategoryValue = Math.max(attackTotal, defenseTotal, supportTotal, 1);

        // Formatear tiempo
        const timeText = summary.timeText || 'Última verificación';
        const shortTime = timeText.includes('hora') ? timeText.replace(' horas', 'h').replace(' hora', 'h') : timeText;

        // Descripción principal con barras compactas
        const playersWithChanges = summary.topGainers ? summary.topGainers.length : 0;
        let description = `🏆 Adversarios - ${shortTime} | ${playersWithChanges} jugadores | ${total.toLocaleString()} total\n\n`;
        
        description += `⚡ ATK ${attackTotal.toLocaleString().padStart(5)} ${createBar(attackTotal, maxCategoryValue)} ${attackPct}%\n`;
        description += `🛡️ DEF ${defenseTotal.toLocaleString().padStart(5)} ${createBar(defenseTotal, maxCategoryValue)} ${defensePct}%\n`;
        description += `🤝 SUP ${supportTotal.toLocaleString().padStart(5)} ${createBar(supportTotal, maxCategoryValue)} ${supportPct}%\n\n`;

        // Top jugadores - CAMBIADO A 10 JUGADORES
        if (summary.topGainers && summary.topGainers.length > 0) {
            description += `🏅 TOP ADVERSARIOS (${Math.min(summary.topGainers.length, 10)}):\n`;
            
            const playersToShow = summary.topGainers.slice(0, 10);
            const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            playersToShow.forEach((player, index) => {
                const emoji = emojis[index] || '▫️';
                
                // Obtener tribu
                const tribeTag = player.playerData?.tribe?.tag || null;
                const tribe = tribeTag ? `[${tribeTag}]` : '';
                
                // Obtener nombre del jugador
                let playerName;
                if (player.playerData?.name && player.playerData.name.trim() !== '') {
                    playerName = player.playerData.name;
                } else {
                    playerName = `${player.playerId}`;
                }
                
                // Formatear nombre completo
                const fullName = tribe ? `${tribe} ${playerName}` : playerName;
                
                // Obtener kills por categoría
                const attack = player.categories.attack?.gained || 0;
                const defense = player.categories.defense?.gained || 0;
                const support = player.categories.support?.gained || 0;
                
                // Formato original limpio con espacios mejorados
                description += `${emoji} ${fullName} +${player.totalGained} (⚡ ${attack} 🛡️ ${defense} 🤝 ${support})\n`;
            });
        }

        const mainEmbed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('📊 Reporte de Adversarios Ganados')
            .setDescription(description)
            .setFooter({ 
                text: `Sistema GT ES95 • Próxima verificación en ~2h` 
            })
            .setTimestamp();

        embeds.push(mainEmbed);

        // Si hay más de 10 jugadores, agregar embed con estadísticas adicionales
        if (summary.totalPlayers > 10) {
            const statsEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('� Estadísticas Adicionales')
                .addFields(
                    { 
                        name: '🎯 Promedio por Jugador', 
                        value: `${Math.round(total / summary.totalPlayers)} adversarios/jugador`, 
                        inline: true 
                    },
                    { 
                        name: '� Categoría Más Activa', 
                        value: this.getMostActiveCategory(summary.totals || {}), 
                        inline: true 
                    },
                    { 
                        name: '⚡ Ritmo', 
                        value: this.calculateRate(total, summary.timeDiff), 
                        inline: true 
                    }
                );

            // Si hay muchos jugadores, mostrar distribución por tribus
            if (summary.totalPlayers > 15 && summary.topGainers) {
                const tribeStats = this.getTribeStats(summary.topGainers);
                if (tribeStats) {
                    statsEmbed.addFields({
                        name: '🏛️ Top Tribus Activas',
                        value: tribeStats,
                        inline: false
                    });
                }
            }

            embeds.push(statsEmbed);
        }

        return embeds;
    }

    /**
     * Crea un embed elegante cuando no hay cambios
     */
    createNoChangesEmbed() {
        const currentTime = new Date();
        const nextCheckTime = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // +2 horas
        const timeString = nextCheckTime.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // Mensajes aleatorios para variedad
        const calmMessages = [
            '✨ **Todo tranquilo en el frente**',
            '🌟 **Momento de calma en el campo de batalla**',
            '🕊️ **Paz temporal en el mundo**',
            '🌙 **Los guerreros descansan**'
        ];
        
        const randomMessage = calmMessages[Math.floor(Math.random() * calmMessages.length)];

        const embed = new EmbedBuilder()
            .setColor('#2E8B57') // Verde elegante
            .setTitle('🌙 Período de Calma')
            .setDescription(
                randomMessage + '\n\n' +
                '🛡️ **Los miembros de la tribu están descansando**\n' +
                '⚔️ **Sin actividad de combate detectada**\n' +
                '📊 **Sistema de monitoreo activo**'
            )
            .addFields(
                {
                    name: '🎯 Estado Actual',
                    value: '🟢 **Sistema Operativo** • Vigilancia continua',
                    inline: true
                },
                {
                    name: '⏰ Próxima Verificación',
                    value: `🔄 **${timeString}** (en ~2h)`,
                    inline: true
                },
                {
                    name: '� Actividad Reciente',
                    value: '� Sin nuevos adversarios ganados',
                    inline: false
                }
            )
            .setFooter({ 
                text: 'GT ES95 • Este mensaje se eliminará automáticamente en 1 hora',
            })
            .setTimestamp();

        return [embed];
    }

    /**
     * Determina la categoría más activa
     */
    getMostActiveCategory(totals) {
        const categories = [
            { name: '⚡ Ataque', value: totals.attack || 0 },
            { name: '🛡️ Defensa', value: totals.defense || 0 },
            { name: '🤝 Apoyo', value: totals.support || 0 }
        ];
        
        const max = categories.reduce((prev, curr) => prev.value > curr.value ? prev : curr);
        return `${max.name} (${max.value})`;
    }

    /**
     * Calcula el ritmo de adversarios por hora
     */
    calculateRate(total, timeDiff) {
        if (!timeDiff) return 'N/A';
        const hours = timeDiff / (1000 * 60 * 60);
        const rate = Math.round(total / hours);
        return `${rate}/hora`;
    }

    /**
     * Obtiene estadísticas de tribus
     */
    getTribeStats(topGainers) {
        const tribeMap = new Map();
        
        topGainers.slice(0, 15).forEach(player => {
            if (player.playerData?.tribe?.tag) {
                const tribeTag = player.playerData.tribe.tag;
                const current = tribeMap.get(tribeTag) || { count: 0, total: 0 };
                tribeMap.set(tribeTag, {
                    count: current.count + 1,
                    total: current.total + player.totalGained
                });
            }
        });

        if (tribeMap.size === 0) return null;

        const sortedTribes = Array.from(tribeMap.entries())
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 5);

        return sortedTribes.map(([tribe, stats], i) => {
            const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || '▫️';
            return `${emoji} [${tribe}] ${stats.count} jugadores (+${stats.total})`;
        }).join('\n');
    }

    /**
     * Obtiene top 3 jugadores por categoría específica (función legacy - mantenida por compatibilidad)
     */
    getTopByCategory(players, category) {
        const sorted = players
            .filter(p => p.categories[category]?.gained > 0)
            .sort((a, b) => (b.categories[category]?.gained || 0) - (a.categories[category]?.gained || 0))
            .slice(0, 3);

        if (sorted.length === 0) return 'Sin actividad';

        return sorted.map((player, i) => {
            const emoji = ['🥇', '🥈', '🥉'][i];
            const name = (player.playerData?.name || `ID:${player.playerId}`).substring(0, 12);
            const gained = player.categories[category]?.gained || 0;
            return `${emoji} ${name} (+${gained})`;
        }).join('\n');
    }

    /**
     * Obtiene el tiempo para la próxima verificación
     */
    getNextCheckTime(interval) {
        const hours = parseInt(interval.replace('h', ''));
        const now = new Date();
        const next = new Date(now.getTime() + (hours * 60 * 60 * 1000));
        next.setMinutes(0, 0, 0);
        
        return `<t:${Math.floor(next.getTime() / 1000)}:R>`;
    }

    /**
     * Carga la configuración de notificaciones
     */
    async loadConfig() {
        try {
            const data = await fs.readFile(this.configFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {};
            }
            throw error;
        }
    }

    /**
     * Obtiene el estado del scheduler
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: this.jobs.size,
            nextExecution: this.mainJob ? 'Cada hora en punto' : 'No programado'
        };
    }
}

module.exports = KillsNotificationScheduler;