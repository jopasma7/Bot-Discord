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

        // Iniciar monitoreo con el intervalo configurado
        this.monitoringInterval = setInterval(async () => {
            await this.checkConquests();
        }, config.interval);

        this.isRunning = true;
        console.log('✅ Sistema de monitoreo de conquistas iniciado correctamente');

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
                return;
            }

            console.log(`📊 ✅ TWStats: Descargadas ${conquests.length} conquistas`);
            console.log('📊 Usando fuente: TWStats');

            // Filtrar conquistas desde el último check
            const lastCheck = config.lastCheck || 0;
            console.log(`⏰ LastCheck: ${lastCheck} (${new Date(lastCheck)})`);
            console.log(`🔍 Buscando conquistas más recientes que timestamp: ${Math.floor(lastCheck / 1000)}`);

            // Analizar conquistas relevantes
            const relevantConquests = await this.analyzer.analyzeConquests(
                conquests,
                config.tribeId,
                Math.floor(lastCheck / 1000),
                false, // No mostrar todas
                null   // Sin filtro específico
            );

            console.log(`🎯 Análisis completado: ${relevantConquests.length} conquistas relevantes encontradas`);

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
            }

            // Actualizar timestamp del último check
            config.lastCheck = Date.now();
            await this.saveConfig(config);

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
        const isGain = conquest.type === 'GAIN';
        const channel = isGain ? channels.gainsChannel : channels.lossesChannel;
        
        console.log(`🔍 Tipo de conquista: ${conquest.type}`);
        console.log(`📤 [SendAlert] Preparando notificación para canal ${channel.name}`);
        console.log(`📊 [SendAlert] Tipo: ${conquest.type}, Incluir @everyone: ${!isGain}`);

        // Crear embed según el tipo de conquista
        const embed = this.createConquestEmbed(conquest, isGain);
        
        console.log('📝 [SendAlert] Embed preparado, enviando al canal...');

        const message = {
            embeds: [embed]
        };

        // Agregar @everyone para pérdidas
        if (!isGain) {
            message.content = '@everyone';
        }

        await channel.send(message);
        console.log(`📢 Alerta enviada: ${embed.data.title}`);
    }

    /**
     * Crea el embed de notificación de conquista
     */
    createConquestEmbed(conquest, isGain) {
        const title = isGain ? '🟢 ¡ALDEA CONQUISTADA!' : '🔴 ¡ALDEA PERDIDA!';
        const color = isGain ? '#00ff00' : '#ff0000';
        
        const coordinates = `${conquest.coordinates.x}|${conquest.coordinates.y}`;
        const playerName = isGain ? conquest.newOwner.name : conquest.oldOwner.name;
        const tribeName = isGain ? conquest.newOwner.tribe : conquest.oldOwner.tribe;
        
        const description = isGain 
            ? `⚔️ ${playerName} de [${tribeName}] ha conquistado una aldea`
            : `💔 ${playerName} de [${tribeName}] ha perdido una aldea`;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .addFields(
                {
                    name: '🏘️ Aldea',
                    value: `${conquest.villageName} (${coordinates})`,
                    inline: true
                },
                {
                    name: isGain ? '🎯 Conquistada por' : '💔 Perdida por',
                    value: playerName,
                    inline: true
                },
                {
                    name: isGain ? '👤 Perdida por' : '🎯 Conquistada por',
                    value: isGain ? conquest.oldOwner.name : conquest.newOwner.name,
                    inline: true
                },
                {
                    name: '📊 Puntos de la aldea',
                    value: conquest.points.toString(),
                    inline: true
                },
                {
                    name: '⏰ Tiempo',
                    value: conquest.date.toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'GT ES95 • Sistema de Alertas de Conquistas' });

        return embed;
    }
}

module.exports = ConquestAutoMonitor;