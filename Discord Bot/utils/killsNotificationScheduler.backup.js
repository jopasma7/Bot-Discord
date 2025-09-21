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

            if (result.summary.hasChanges) {
                const embeds = await this.createNotificationEmbeds(result);
                
                // Enviar embeds al canal
                for (const embed of embeds) {
                    await channel.send({ embeds: [embed] });
                }

                console.log(`[NotificationScheduler] ✅ Notificación enviada a ${guild.name} (${result.summary.totalPlayers} jugadores)`);
            } else {
                // Enviar mensaje informativo de que no hay cambios
                const noChangesEmbed = new EmbedBuilder()
                    .setColor('Blue')
                    .setTitle('📊 Reporte de Adversarios')
                    .setDescription('No se detectaron nuevos adversarios ganados en la última hora.')
                    .addFields(
                        { name: '⏰ Próxima verificación', value: this.getNextCheckTime(guildConfig.interval) }
                    )
                    .setFooter({ text: 'Sistema de Notificaciones GT ES95' })
                    .setTimestamp();

                await channel.send({ embeds: [noChangesEmbed] });
                console.log(`[NotificationScheduler] 📝 Mensaje informativo enviado a ${guild.name} (sin cambios)`);
            }

        } catch (error) {
            console.error(`[NotificationScheduler] Error enviando notificación a guild ${guildId}:`, error);
        }
    }

    /**
     * Crea embeds para las notificaciones con formato mejorado de 4 columnas
     */
    async createNotificationEmbeds(result) {
        const embeds = [];
        const { changes, summary } = result;

        // Embed principal con resumen en formato de tabla
        const mainEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🏆 Adversarios Ganados - Reporte Automático')
            .setDescription(`${summary.summary}\n\`\`\`
┌──────────────┬─────────┬─────────┬─────────┬─────────┐
│   CATEGORÍA  │ TOTALES │ ATAQUE  │ DEFENSA │  APOYO  │
├──────────────┼─────────┼─────────┼─────────┼─────────┤
│ Adversarios  │  ${summary.totals.all.toString().padStart(5)} │  ${summary.totals.attack.toString().padStart(5)} │  ${summary.totals.defense.toString().padStart(5)} │  ${summary.totals.support.toString().padStart(5)} │
└──────────────┴─────────┴─────────┴─────────┴─────────┘
\`\`\``)
            .addFields(
                { name: '� Jugadores Activos', value: summary.totalPlayers.toString(), inline: true },
                { name: '⏰ Período', value: summary.timeText || 'Última verificación', inline: true },
                { name: '� Próxima Check', value: '<t:' + Math.floor((Date.now() + 3600000) / 1000) + ':R>', inline: true }
            )
            .setFooter({ text: 'Sistema de Notificaciones GT ES95' })
            .setTimestamp();

        embeds.push(mainEmbed);

        // Si hay jugadores con cambios, crear embed detallado
        if (summary.topGainers.length > 0) {
            const detailedEmbed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle('📋 Detalle de Adversarios Ganados')
                .setDescription('**Formato: Totales │ Ataque │ Defensa │ Apoyo**');

            // Agrupar jugadores en chunks de 10 para no exceder límites de Discord
            const playersArray = summary.topGainers.slice(0, 10);
            
            let playersText = '```\n';
            playersArray.forEach((player, index) => {
                const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || '▫️';
                const playerName = (player.playerName || `ID:${player.playerId}`).substring(0, 15);
                const tribe = player.tribe ? `[${player.tribe}] ` : '';
                const name = `${tribe}${playerName}`.substring(0, 20).padEnd(20);
                
                // Obtener kills por categoría
                const totals = player.categories.all?.gained || 0;
                const attack = player.categories.attack?.gained || 0;
                const defense = player.categories.defense?.gained || 0;
                const support = player.categories.support?.gained || 0;
                
                playersText += `${emoji} ${name} │ ${totals.toString().padStart(3)} │ ${attack.toString().padStart(3)} │ ${defense.toString().padStart(3)} │ ${support.toString().padStart(3)}\n`;
            });
            playersText += '```';

            detailedEmbed.setDescription(playersText);
            embeds.push(detailedEmbed);
        }

        // Si hay muchos jugadores, crear embed adicional con estadísticas
        if (summary.totalPlayers > 10) {
            const statsEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('📊 Estadísticas Adicionales')
                .addFields(
                    { name: '🎯 Más Activos en Ataque', value: this.getTopByCategory(summary.topGainers, 'attack'), inline: true },
                    { name: '🛡️ Más Activos en Defensa', value: this.getTopByCategory(summary.topGainers, 'defense'), inline: true },
                    { name: '🤝 Más Activos en Apoyo', value: this.getTopByCategory(summary.topGainers, 'support'), inline: true }
                )
                .setFooter({ text: `Total: ${summary.totalPlayers} jugadores activos` });

            embeds.push(statsEmbed);
        }

        return embeds;
    }

    /**
     * Obtiene top 3 jugadores por categoría específica
     */
    getTopByCategory(players, category) {
        const sorted = players
            .filter(p => p.categories[category]?.gained > 0)
            .sort((a, b) => (b.categories[category]?.gained || 0) - (a.categories[category]?.gained || 0))
            .slice(0, 3);

        if (sorted.length === 0) return 'Sin actividad';

        return sorted.map((player, i) => {
            const emoji = ['🥇', '🥈', '🥉'][i];
            const name = (player.playerName || `ID:${player.playerId}`).substring(0, 12);
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