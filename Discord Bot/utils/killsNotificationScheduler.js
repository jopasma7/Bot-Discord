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

        // Programar verificación cada hora en punto
        this.mainJob = cron.schedule('0 * * * *', async () => {
            await this.checkAndSendNotifications();
        }, {
            scheduled: false,
            timezone: "Europe/Madrid"
        });

        this.mainJob.start();
        this.isRunning = true;

        console.log('[NotificationScheduler] ✅ Sistema de notificaciones iniciado');
        console.log('[NotificationScheduler] ⏰ Verificaciones programadas cada hora en punto');

        // Ejecutar una verificación inicial después de 1 minuto
        setTimeout(async () => {
            await this.checkAndSendNotifications();
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
                    await this.sendNotificationToGuild(guildId, guildConfig);
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
        return currentHour % hours === 0;
    }

    /**
     * Envía notificación a un servidor específico
     */
    async sendNotificationToGuild(guildId, guildConfig) {
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

            console.log(`[NotificationScheduler] 📊 Ejecutando tracking para ${guild.name}...`);

            // Ejecutar tracking de kills
            const result = await this.tracker.trackKills();

            // SIEMPRE enviar notificación (con o sin cambios)
            const embeds = await this.createNotificationEmbeds(result);
            
            // Enviar embeds al canal
            for (const embed of embeds) {
                await channel.send({ embeds: [embed] });
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

        // Calcular porcentajes para las barras (evitar división por 0)
        const total = summary.totals?.all || 0;
        const attackTotal = summary.totals?.attack || 0;
        const defenseTotal = summary.totals?.defense || 0;
        const supportTotal = summary.totals?.support || 0;
        
        // CORREGIDO: Calcular porcentajes basados en el total real, no en 0
        const attackPct = total > 0 ? Math.round((attackTotal / total) * 100) : 0;
        const defensePct = total > 0 ? Math.round((defenseTotal / total) * 100) : 0;
        const supportPct = total > 0 ? Math.round((supportTotal / total) * 100) : 0;

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
        let description = `🏆 Adversarios - ${shortTime} | ${summary.totalPlayers} jugadores | ${total.toLocaleString()} total\n\n`;
        
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
                
                // Obtener tribu (máximo 4 caracteres para el tag)
                const tribeTag = player.playerData?.tribe?.tag || null;
                const tribe = tribeTag ? `[${tribeTag.substring(0, 4)}]` : '';
                
                // Obtener nombre del jugador con mejor fallback
                let playerName;
                if (player.playerData?.name && player.playerData.name.trim() !== '') {
                    playerName = player.playerData.name;
                } else {
                    playerName = `${player.playerId}`;
                }
                
                // Formatear nombre completo con tribu (máximo 15 caracteres total)
                let fullName = tribe ? `${tribe} ${playerName}` : playerName;
                fullName = fullName.substring(0, 15).padEnd(15);
                
                // Formatear totales ganados con padding
                const totalGained = `+${player.totalGained}`.padStart(6);
                
                // Obtener kills por categoría con padding mejorado
                const attack = (player.categories.attack?.gained || 0).toString().padStart(4);
                const defense = (player.categories.defense?.gained || 0).toString().padStart(4);
                const support = (player.categories.support?.gained || 0).toString().padStart(3);
                
                // Formato mejorado con espaciado uniforme
                description += `${emoji} ${fullName} ${totalGained} (⚡${attack} 🛡️${defense} 🤝${support})\n`;
            });
        }

        const mainEmbed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('📊 Reporte de Adversarios Ganados')
            .setDescription(description)
            .setFooter({ 
                text: `Sistema GT ES95 • Próxima verificación en ~1h` 
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