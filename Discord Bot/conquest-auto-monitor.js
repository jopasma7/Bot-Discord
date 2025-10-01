const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const TWStatsConquestMonitor = require('./utils/twstatsConquestMonitor');
const HybridConquestAnalyzer = require('./utils/hybridConquestAnalyzer');

/**
 * Sistema automático de monitoreo de conquistas
 * Polling cada X segundos según configuración
 */
class ConquestAutoMonitor {
    constructor(client) {
        this.client = client;
        this.configPath = path.join(__dirname, 'conquest-config.json');
        this.twstatsMonitor = new TWStatsConquestMonitor();
        this.analyzer = new HybridConquestAnalyzer();
        this.monitoringInterval = null;
        this.isRunning = false;
    }

    /**
     * Inicia el sistema de monitoreo automático
     */
    async start() {
        if (this.isRunning) {
            console.log('[ConquestMonitor] Ya está en funcionamiento');
            return;
        }

        console.log('🚨 Iniciando sistema de monitoreo de conquistas...');
        
        const config = await this.loadConfig();
        if (!config.enabled) {
            console.log('[ConquestMonitor] Sistema deshabilitado en configuración');
            return;
        }

        console.log(`📊 Modo detectado: ${config.mode} (${config.interval/1000}s)`);
        console.log(`⏱️ Monitoreo configurado cada ${config.interval/1000} segundos`);

        // ⚠️ IMPORTANTE: Evitar envío de conquistas históricas al iniciar
        const now = Date.now();
        const timeSinceLastCheck = now - (config.lastCheck || 0);
        const ONE_HOUR = 60 * 60 * 1000; // 1 hora en ms

        // Si es primera vez o ha pasado más de 1 hora, establecer lastCheck al momento actual
        if (!config.lastCheck || timeSinceLastCheck > ONE_HOUR) {
            console.log(`⏰ Actualizando lastCheck para evitar conquistas históricas`);
            console.log(`   - Último check: ${config.lastCheck ? new Date(config.lastCheck) : 'Nunca'}`);
            console.log(`   - Tiempo transcurrido: ${Math.round(timeSinceLastCheck / 1000 / 60)} minutos`);
            
            config.lastCheck = now;
            await this.saveConfig(config);
            console.log(`✅ LastCheck actualizado a: ${new Date(now)}`);
        } else {
            console.log(`⏰ LastCheck válido: ${new Date(config.lastCheck)}`);
        }

        // Iniciar monitoreo con el intervalo configurado
        this.monitoringInterval = setInterval(async () => {
            await this.checkConquests();
        }, config.interval);

        this.isRunning = true;
        console.log('✅ Sistema de monitoreo de conquistas iniciado correctamente');

        // Enviar notificación de inicio
        await this.sendStartupNotification(config);

        // Ejecutar verificación inicial después de 10 segundos
        setTimeout(() => {
            this.checkConquests();
        }, 10000);
    }

    /**
     * Detiene el sistema de monitoreo
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isRunning = false;
        console.log('[ConquestMonitor] 🛑 Sistema de monitoreo detenido');
    }

    /**
     * Reinicia el sistema con nueva configuración
     */
    async restart() {
        console.log('[ConquestMonitor] 🔄 Reiniciando sistema con nueva configuración...');
        this.stop();
        await this.start();
    }

    /**
     * Carga la configuración desde el archivo
     */
    async loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[ConquestMonitor] Error cargando configuración:', error);
            return { enabled: false };
        }
    }

    /**
     * Guarda la configuración actualizada
     */
    async saveConfig(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('[ConquestMonitor] Error guardando configuración:', error);
        }
    }

    /**
     * Envía notificación de inicio del sistema
     */
    async sendStartupNotification(config) {
        try {
            const channels = await this.getChannels(config);
            if (!channels.gainsChannel) {
                console.log('[ConquestMonitor] No se pudo obtener canal para notificación de inicio');
                return;
            }

            const startupEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🚨 Sistema de Monitoreo Iniciado')
                .setDescription('El sistema de monitoreo de conquistas se ha iniciado correctamente')
                .addFields([
                    {
                        name: '⏱️ Intervalo de verificación',
                        value: `${config.interval / 1000} segundos`,
                        inline: true
                    },
                    {
                        name: '🎯 Filtro de tribus',
                        value: config.tribeFilter?.type === 'all' ? 'Todas las tribus' : `Tribu específica: ${config.tribeFilter?.specificTribe || 'No definida'}`,
                        inline: true
                    },
                    {
                        name: '📊 Estado',
                        value: 'Activo y monitoreando',
                        inline: true
                    }
                ])
                .setTimestamp()
                .setFooter({ text: 'Monitoreo de Conquistas - GT Bot' });

            await channels.gainsChannel.send({ embeds: [startupEmbed] });
            console.log('✅ Notificación de inicio enviada al canal de conquistas');

        } catch (error) {
            console.error('[ConquestMonitor] Error enviando notificación de inicio:', error);
        }
    }

    /**
     * Verifica conquistas y envía notificaciones
     */
    async checkConquests() {
        try {
            console.log('🔍 Verificando conquistas (modo: economy)...');
            
            const config = await this.loadConfig();
            if (!config.enabled) return;

            // Obtener conquistas desde TWStats
            console.log('🔄 Intentando obtener conquistas desde TWStats...');
            const conquests = await this.twstatsMonitor.fetchConquests();
            if (!conquests || conquests.length === 0) {
                console.log('⚠️ No se obtuvieron conquistas de TWStats');
                // Intentar obtener conquistas desde GT oficial como respaldo
                try {
                    const ConquestMonitor = require('./conquest-monitor');
                    const dataManager = this.client.dataManager || {};
                    const gtMonitor = new ConquestMonitor(dataManager);
                    const gtConquests = await gtMonitor.fetchRecentConquests();
                    console.log(`🔄 Intentando obtener conquistas desde GT oficial...`);
                    if (gtConquests && gtConquests.length > 0) {
                        console.log(`📊 ✅ GT oficial: Descargadas ${gtConquests.length} conquistas`);
                        // Usar el analizador híbrido para procesar conquistas de GT
                        const relevantConquests = await this.analyzer.analyzeConquests(
                            gtConquests,
                            config.tribeId,
                            Math.floor(config.lastCheck / 1000),
                            !config.tribeFilter || config.tribeFilter.type === 'all',
                            config.tribeFilter?.type === 'specific' ? config.tribeFilter.specificTribe : null
                        );
                        console.log(`🎯 Análisis GT oficial: ${relevantConquests.length} conquistas relevantes encontradas`);
                        if (relevantConquests.length > 0) {
                            const channels = await this.getChannels(config);
                            if (channels.gainsChannel && channels.lossesChannel) {
                                await this.sendNotifications(relevantConquests, channels);
                            }
                        } else {
                            console.log('📋 No hay conquistas nuevas que procesar desde GT oficial');
                        }
                    } else {
                        console.log('⚠️ No se obtuvieron conquistas de GT oficial');
                    }
                } catch (err) {
                    console.error('❌ Error obteniendo conquistas desde GT oficial:', err);
                }
                return;
            }
            
            console.log(`📊 ✅ TWStats: Descargadas ${conquests.length} conquistas`);
            console.log('📊 Usando fuente: TWStats');

            // Filtrar conquistas desde el último check
            const lastCheck = config.lastCheck || 0;
            const lastCheckDate = new Date(lastCheck);
            const currentTime = new Date();
            // Permitir margen de 5 minutos para conquistas recientes
            const marginSeconds = 5 * 60;
            const effectiveLastCheck = Math.floor(lastCheck / 1000) - marginSeconds;
            console.log(`⏰ LastCheck: ${lastCheck} (${lastCheckDate.toLocaleString()})`);
            console.log(`🕒 Hora actual: ${currentTime.toLocaleString()}`);
            console.log(`🔍 Buscando conquistas posteriores a: ${new Date((effectiveLastCheck) * 1000).toLocaleString()}`);

            // Leer configuración de filtros de tribu
            const showAllTribes = !config.tribeFilter || config.tribeFilter.type === 'all';
            const specificTribe = config.tribeFilter?.type === 'specific' ? config.tribeFilter.specificTribe : null;
            console.log(`🎯 Filtro configurado: ${showAllTribes ? 'TODAS las tribus' : `Solo tribu "${specificTribe}"`}`);

            // Analizar conquistas relevantes
            const relevantConquests = await this.analyzer.analyzeConquests(
                conquests,
                config.tribeId,
                effectiveLastCheck, // Usar margen para no perder conquistas recientes
                showAllTribes,
                specificTribe
            );

            console.log(`🎯 Análisis completado: ${relevantConquests.length} conquistas relevantes encontradas`);

            // Log detallado de las conquistas encontradas
            if (relevantConquests.length > 0) {
                console.log('📋 Lista de conquistas relevantes:');
                relevantConquests.slice(0, 5).forEach((conquest, index) => {
                    const conquestDate = new Date(conquest.timestamp * 1000);
                    console.log(`   ${index + 1}. ${conquest.villageName} - ${conquestDate.toLocaleString()}`);
                });
                if (relevantConquests.length > 5) {
                    console.log(`   ... y ${relevantConquests.length - 5} más`);
                }
            } else {
                console.log('📋 No hay conquistas nuevas que procesar');
            }

            if (relevantConquests.length > 0) {
                console.log(`🎯 Encontradas ${relevantConquests.length} conquistas relevantes`);
                
                // Obtener canales
                const channels = await this.getChannels(config);
                if (channels.gainsChannel && channels.lossesChannel) {
                    console.log('✅ Ambos canales obtenidos correctamente');
                    await this.sendNotifications(relevantConquests, channels);
                } else {
                    console.log('❌ Error obteniendo canales de Discord');
                }
            } else {
                console.log('ℹ️  No hay conquistas nuevas para enviar');
            }

            // Actualizar timestamp del último check al momento actual
            const newLastCheck = Date.now();
            config.lastCheck = newLastCheck;
            await this.saveConfig(config);
            console.log(`⏰ LastCheck actualizado a: ${new Date(newLastCheck).toLocaleString()}`);

            // Limpiar conquistas procesadas antiguas
            this.analyzer.cleanOldProcessedConquests();

        } catch (error) {
            console.error('❌ Error en verificación de conquistas:', error);
        }
    }

    /**
     * Obtiene los canales de Discord configurados
     */
    async getChannels(config) {
        try {
            const gainsChannel = await this.client.channels.fetch(config.gainsChannelId);
            const lossesChannel = await this.client.channels.fetch(config.lossesChannelId);
            
            return { gainsChannel, lossesChannel };
        } catch (error) {
            console.error('Error obteniendo canales:', error);
            return { gainsChannel: null, lossesChannel: null };
        }
    }

    /**
     * Envía las notificaciones de conquistas
     */
    async sendNotifications(conquests, channels) {
        console.log(`📢 Enviando ${conquests.length} notificaciones...`);
        
        for (let i = 0; i < conquests.length; i++) {
            const conquest = conquests[i];
            console.log(`📤 Enviando notificación ${i + 1}/${conquests.length}: ${conquest.villageName}`);
            
            try {
                await this.sendConquestAlert(conquest, channels);
                console.log(`✅ Notificación ${i + 1} enviada exitosamente`);
            } catch (error) {
                console.error(`❌ Error enviando notificación ${i + 1}:`, error);
            }
        }
        
        console.log('📢 Proceso de notificaciones completado');
    }

    /**
     * Envía una alerta de conquista específica
     */
    async sendConquestAlert(conquest, channels) {
        // Determinar canal según tipo de conquista
        let channel = null;
        let isGain = false;
        let includeEveryone = false;
        
        switch(conquest.type) {
            case 'GAIN':
            case 'GAIN_INFO':
                channel = channels.gainsChannel;
                isGain = true;
                includeEveryone = false;
                break;
                
            case 'LOSS':
            case 'LOSS_SPECIFIC':
                channel = channels.lossesChannel;
                isGain = false;
                includeEveryone = true;
                break;
                
            default:
                console.log(`⚠️ [SendAlert] Tipo de conquista no reconocido: ${conquest.type}`);
                return;
        }
        
        if (!channel) {
            console.log(`❌ [SendAlert] Canal no disponible para tipo: ${conquest.type}`);
            return;
        }
        
        console.log(`🔍 Tipo de conquista: ${conquest.type}`);
        console.log(`📤 [SendAlert] Preparando notificación para canal ${channel.name}`);
        console.log(`📊 [SendAlert] Tipo: ${conquest.type}, Incluir @everyone: ${includeEveryone}`);

        // Crear embed según el tipo de conquista
        const embed = this.createConquestEmbed(conquest, isGain);

        // Crear botón de acción para ver la conquista en el mapa
        const { x, y } = conquest.coordinates;
        const mapUrl = `https://es95.guerrastribales.es/game.php?&screen=map&x=${x}&y=${y}&beacon#${x};${y}`;
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Ver Conquista')
                .setStyle(ButtonStyle.Link)
                .setURL(mapUrl)
        );

        console.log('📝 [SendAlert] Embed preparado, enviando al canal...');

        const message = {
            embeds: [embed],
            components: [row]
        };

        // Agregar @everyone según configuración
        if (includeEveryone) {
            message.content = '@everyone';
        }

        await channel.send(message);
        console.log(`📢 Alerta enviada: ${embed.data.title}`);
    }

    /**
     * Crea el embed de notificación de conquista
     */
    createConquestEmbed(conquest, isGain) {
        // --- NUEVA LÓGICA DE FORMATO ---
        const conqueringTribe = conquest.newOwner.tribe ? conquest.newOwner.tribe.trim() : '';
        const lostBy = conquest.oldOwner.name ? conquest.oldOwner.name.trim().toLowerCase() : '';
        const isBollo = conqueringTribe.toLowerCase() === 'bollo';
        const isBarbarian = lostBy === 'bárbaro' || lostBy === 'barbaro';
        const isPlayer = !isBarbarian;

        const coordinates = `${conquest.coordinates.x}|${conquest.coordinates.y}`;
        const playerName = conquest.newOwner.name;
        const tribeName = conquest.newOwner.tribe;
        const villageName = conquest.villageName;
        const points = conquest.points.toString();
        const timeStr = new Date(conquest.timestamp * 1000).toLocaleString('es-ES', {
            timeZone: 'Europe/Madrid',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Mostrar tribu del jugador conquistado entre paréntesis si existe
        let lostPlayerName = conquest.oldOwner.name;
        if (isGain && conquest.oldOwner.tribe && conquest.oldOwner.tribe.trim() && conquest.oldOwner.tribe.trim().toLowerCase() !== 'sin tribu') {
            lostPlayerName += ` (${conquest.oldOwner.tribe})`;
        }

        let title = '';
        let color = '';
        let description = '';
        let fields = [];

        if (isGain && isBollo && isPlayer) {
            // 1. Conquista de Bollo a jugador real (verde, ejemplo 4)
            title = '🟢 ¡ALDEA CONQUISTADA!';
            color = '#00ff00';
            description = undefined;
            fields = [
                { name: '🏘️ Aldea', value: `${villageName} (${coordinates})`, inline: false },
                { name: '⚔️ Conquistador', value: `${playerName} [${tribeName}]`, inline: false },
                { name: '👤 Defensor', value: lostPlayerName, inline: false },
                { name: '📊 Puntos', value: points, inline: true },
                { name: '⏰ Tiempo', value: timeStr, inline: true }
            ];
        } else if (isGain && !isBollo && isBarbarian) {
            // 2. Conquista de bárbaro por enemigo (gris, formato especial)
            title = '⚪ ¡BÁRBARO CONQUISTADO!';
            color = '#7f8c8d';
            description = `⚔️ ${playerName} de [${tribeName}] ha conquistado un pueblo de bárbaros (${coordinates})\n� Puntos: ${points} ⏰ ${timeStr}`;
            fields = [];
        } else if (isGain && isBollo && isBarbarian) {
            // 3. Conquista de bárbaro por Bollo (azul, formato especial)
            title = '🟦 ¡BÁRBARO CONQUISTADO!';
            color = '#3498db';
            description = `⚔️ ${playerName} de [${tribeName}] ha conquistado un pueblo de bárbaros (${coordinates})\n📊 Puntos: ${points} ⏰ ${timeStr}`;
            fields = [];
        } else if (isGain && !isBollo && isPlayer) {
            // 4. Conquista de otra tribu a jugador real (marrón, formato actual pero emoji 🟫)
            title = '🟫 ¡ALDEA CONQUISTADA!';
            color = '#a0522d';
            description = `⚔️ ${playerName} de [${tribeName}] ha conquistado una aldea`;
            fields = [
                { name: '🏘️ Aldea', value: `${villageName} (${coordinates})`, inline: true },
                { name: '🎯 Conquistada por', value: playerName, inline: true },
                { name: '👤 Perdida por', value: lostPlayerName, inline: true },
                { name: '📊 Puntos de la aldea', value: points, inline: true },
                { name: '⏰ Tiempo', value: timeStr, inline: false }
            ];
        } else {
            // Pérdidas y otros casos
            if (isGain) {
                // Ganancia genérica
                title = '🟢 ¡ALDEA CONQUISTADA!';
                color = '#00ff00';
                description = `⚔️ ${playerName} de [${tribeName}] ha conquistado una aldea`;
                fields = [
                    { name: '🏘️ Aldea', value: `${villageName} (${coordinates})`, inline: true },
                    { name: '🎯 Conquistada por', value: playerName, inline: true },
                    { name: '👤 Perdida por', value: lostPlayerName, inline: true },
                    { name: '📊 Puntos de la aldea', value: points, inline: true },
                    { name: '⏰ Tiempo', value: timeStr, inline: false }
                ];
            } else {
                // Pérdida - aquí está el problema
                // conquest.oldOwner = jugador de Bollo que perdió la aldea
                // conquest.newOwner = jugador enemigo que conquistó la aldea
                const lostByPlayer = conquest.oldOwner.name; // Jugador de Bollo que perdió
                const lostByTribe = conquest.oldOwner.tribe || 'Bollo'; // Tribu del que perdió
                const conqueredByPlayer = conquest.newOwner.name; // Jugador enemigo que conquistó
                const conqueredByTribe = conquest.newOwner.tribe ? ` (${conquest.newOwner.tribe})` : '';
                
                title = '🔴 ¡ALDEA PERDIDA!';
                color = '#ff0000';
                description = `💔 ${lostByPlayer} de [${lostByTribe}] ha perdido una aldea`;
                fields = [
                    { name: '🏘️ Aldea', value: `${villageName} (${coordinates})`, inline: true },
                    { name: '💔 Perdida por', value: `${lostByPlayer} [${lostByTribe}]`, inline: true },
                    { name: '🎯 Conquistada por', value: `${conqueredByPlayer}${conqueredByTribe}`, inline: true },
                    { name: '📊 Puntos de la aldea', value: points, inline: true },
                    { name: '⏰ Tiempo', value: timeStr, inline: false }
                ];
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'GT ES95 • Sistema de Alertas de Conquistas' });

        if (description) embed.setDescription(description);
        if (fields.length > 0) embed.addFields(...fields);

        return embed;
    }
}

module.exports = ConquestAutoMonitor;