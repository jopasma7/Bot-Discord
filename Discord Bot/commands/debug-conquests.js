const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const GTDataManager = require('../utils/gtData');
const ConquestMonitor = require('../conquest-monitor');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-conquests')
        .setDescription('🔍 Debug del sistema de conquistas - muestra información detallada')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const dataManager = new GTDataManager();
            const conquestMonitor = new ConquestMonitor(dataManager);
            
            // Leer configuración actual
            const configPath = path.join(__dirname, '..', 'conquest-config.json');
            let config = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
            
            console.log('🔍 Iniciando debug de conquistas...');
            
            // 1. Obtener conquistas recientes
            const conquests = await conquestMonitor.fetchRecentConquests();
            console.log(`📊 Total conquistas descargadas: ${conquests.length}`);
            
            // 2. Mostrar información de configuración
            const embed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('🔍 Debug del Sistema de Conquistas')
                .setTimestamp();
            
            // Información de configuración
            embed.addFields({
                name: '⚙️ Configuración',
                value: [
                    `🟢 Habilitado: ${config.enabled ? 'Sí' : 'No'}`,
                    `🎯 Tribu ID: ${config.tribeId || 'No configurado'}`,
                    `📅 Último check: ${config.lastCheck ? new Date(config.lastCheck).toLocaleString() : 'Nunca'}`,
                    `⏱️ Modo: ${config.mode || 'normal'}`,
                    `🔄 Intervalo: ${config.interval ? (config.interval / 1000) + 's' : 'default'}`
                ].join('\n')
            });
            
            // Información de conquistas
            if (conquests.length > 0) {
                const recentConquests = conquests.slice(0, 5);
                const conquestInfo = recentConquests.map((c, i) => {
                    const date = new Date(c.timestamp * 1000);
                    const isNew = c.timestamp > Math.floor((config.lastCheck || 0) / 1000);
                    return `${i+1}. ${isNew ? '🆕' : '⏳'} Aldea ${c.villageId} - ${date.toLocaleString()}`;
                }).join('\n');
                
                embed.addFields({
                    name: '📊 Conquistas Recientes (Top 5)',
                    value: conquestInfo || 'Sin conquistas'
                });
                
                // Contador de conquistas nuevas
                const newConquestsCount = conquests.filter(c => 
                    c.timestamp > Math.floor((config.lastCheck || 0) / 1000)
                ).length;
                
                embed.addFields({
                    name: '🆕 Conquistas Nuevas',
                    value: `${newConquestsCount} conquistas más recientes que el último check`
                });
                
                // Test de análisis
                const relevantConquests = await conquestMonitor.analyzeConquests(
                    conquests, 
                    config.tribeId || 47, 
                    Math.floor((config.lastCheck || 0) / 1000),
                    true, // showAllConquests
                    config.tribeFilter || null // Incluir filtro de tribus si está configurado
                );
                
                embed.addFields({
                    name: '🎯 Resultado del Análisis',
                    value: `${relevantConquests.length} conquistas relevantes encontradas`
                });
                
                // Mostrar detalle de las primeras 3 conquistas relevantes
                if (relevantConquests.length > 0) {
                    const details = relevantConquests.slice(0, 3).map((c, i) => {
                        const date = new Date(c.timestamp * 1000);
                        return `${i+1}. ${c.type} - Aldea ${c.villageId} (${date.toLocaleString()})`;
                    }).join('\n');
                    
                    embed.addFields({
                        name: '📋 Detalles de Conquistas Relevantes (Top 3)',
                        value: details
                    });
                }
            } else {
                embed.addFields({
                    name: '❌ Sin Conquistas',
                    value: 'No se pudieron obtener conquistas del servidor GT'
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('❌ Error en debug de conquistas:', error);
            await interaction.editReply(`❌ Error ejecutando debug: ${error.message}`);
        }
    }
};