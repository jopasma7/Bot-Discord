const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const GTDataManager = require('./utils/gtData');
const ConquestMonitor = require('./conquest-monitor');
const HybridConquestAnalyzer = require('./utils/hybridConquestAnalyzer');
const KillsNotificationScheduler = require('./utils/killsNotificationScheduler');
const VillageInfoHandler = require('./utils/villageInfoHandler');
require('dotenv').config();

// Crear el cliente del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Colección para comandos
client.commands = new Collection();

// Inicializar el sistema de datos y monitoreo de conquistas
// Sistema optimizado para Railway deployment
const dataManager = new GTDataManager();
const conquestMonitor = new ConquestMonitor(dataManager);
const hybridAnalyzer = new HybridConquestAnalyzer();
const TWStatsConquestMonitor = require('./utils/twstatsConquestMonitor');
const twstatsMonitor = new TWStatsConquestMonitor();

// Sistema de notificaciones de adversarios
let killsNotificationScheduler = null;

// Sistema de información de pueblos por coordenadas
const villageInfoHandler = new VillageInfoHandler();

// Cargar comandos slash desde la carpeta commands
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`📝 Comando cargado: ${command.data.name}`);
    } else {
        console.log(`⚠️ El comando en ${filePath} no tiene "data" o "execute"`);
    }
}

// Evento cuando el bot se conecta
client.once('clientReady', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}!`);
    console.log(`📊 Sirviendo en ${client.guilds.cache.size} servidores`);
    
    // Estado del bot
    client.user.setActivity('Guerras Tribales 🏰', { type: 3 }); // 3 = WATCHING
    
    // Iniciar el monitoreo de conquistas
    startConquestMonitoring();
    
    // Iniciar el sistema de notificaciones de adversarios
    startKillsNotificationSystem();
});

// Sistema de monitoreo de conquistas
let conquestCheckInterval = null;

async function startConquestMonitoring() {
    console.log('🚨 Iniciando sistema de monitoreo de conquistas...');
    
    // Función para verificar conquistas
    async function checkConquests() {
        try {
            const configPath = path.join(__dirname, 'conquest-config.json');
            
            // Verificar si existe configuración
            if (!fs.existsSync(configPath)) {
                return; // No hay configuración, no hacer nada
            }
            
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Verificar si el monitoreo está activado
            if (!config.enabled || !config.gainsChannelId || !config.lossesChannelId) {
                return; // Monitoreo desactivado o canales no configurados
            }
            
            console.log(`🔍 Verificando conquistas (modo: ${config.mode || 'normal'})...`);
            
            // Sistema híbrido: usar TWStats como fuente principal, GT como respaldo
            let conquests = [];
            let dataSource = 'unknown';
            
            try {
                console.log('🔄 Intentando obtener conquistas desde TWStats...');
                conquests = await twstatsMonitor.fetchConquests();
                dataSource = 'TWStats';
                console.log(`📊 ✅ TWStats: Descargadas ${conquests.length} conquistas`);
            } catch (twstatsError) {
                console.warn(`⚠️ TWStats falló: ${twstatsError.message}`);
                console.log('🔄 Usando GT oficial como respaldo...');
                try {
                    conquests = await conquestMonitor.fetchRecentConquests();
                    dataSource = 'GT Oficial';
                    console.log(`📊 ✅ GT Oficial: Descargadas ${conquests.length} conquistas`);
                } catch (gtError) {
                    console.error(`❌ Ambas fuentes fallaron - TWStats: ${twstatsError.message}, GT: ${gtError.message}`);
                    return;
                }
            }
            
            console.log(`📊 Usando fuente: ${dataSource}`);
            if (conquests.length === 0) {
                console.log('📭 No hay conquistas recientes');
                return;
            }
            
            // Debug: mostrar timestamp de lastCheck
            console.log(`⏰ LastCheck: ${config.lastCheck} (${new Date(config.lastCheck * 1000)})`);
            console.log(`🔍 Buscando conquistas más recientes que timestamp: ${config.lastCheck}`);
            
            // Si lastCheck es 0 o muy antiguo (más de 6 horas), inicializar con timestamp de hace 2 horas
            const currentTimestampSeconds = Math.floor(Date.now() / 1000);
            const sixHoursAgoSeconds = currentTimestampSeconds - (6 * 60 * 60); // 6 horas en segundos
            const twoHoursAgoSeconds = currentTimestampSeconds - (2 * 60 * 60); // 2 horas en segundos
            const isInitializing = config.lastCheck === 0 || config.lastCheck < sixHoursAgoSeconds;
            
            if (isInitializing) {
                console.log('🔄 Inicialización detectada - configurando timestamp de hace 2 horas para empezar monitoreo');
                config.lastCheck = twoHoursAgoSeconds; // Empezar monitoreando desde hace 2 horas (en segundos)
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`🔍 Configurado para buscar conquistas desde: ${new Date(twoHoursAgoSeconds * 1000)}`);
            }
            
            // Analizar conquistas relevantes usando el analizador híbrido
            // Compatible con datos de TWStats y GT oficial
            const showAllConquests = !config.tribeFilter || config.tribeFilter.type === 'all';
            const relevantConquests = await hybridAnalyzer.analyzeConquests(
                conquests, 
                config.tribeId, 
                config.lastCheck, // Ya está en segundos, no dividir por 1000
                showAllConquests,  // Mostrar todas o filtrar según configuración
                config.tribeFilter || null  // Pasar el filtro de tribus
            );
            
            console.log(`🎯 Análisis completado: ${relevantConquests.length} conquistas relevantes encontradas`);
            
            if (relevantConquests.length > 0) {
                console.log(`🎯 Encontradas ${relevantConquests.length} conquistas relevantes`);
                
                // Obtener los canales configurados con fallback
                let gainsChannel = client.channels.cache.get(config.gainsChannelId);
                let lossesChannel = client.channels.cache.get(config.lossesChannelId);
                
                // Si no están en caché, intentar fetchearlos
                if (!gainsChannel) {
                    try {
                        gainsChannel = await client.channels.fetch(config.gainsChannelId);
                        console.log('📋 Canal de ganancias obtenido mediante fetch');
                    } catch (error) {
                        console.error('❌ Error obteniendo canal de ganancias:', error.message);
                    }
                }
                
                if (!lossesChannel) {
                    try {
                        lossesChannel = await client.channels.fetch(config.lossesChannelId);
                        console.log('📋 Canal de pérdidas obtenido mediante fetch');
                    } catch (error) {
                        console.error('❌ Error obteniendo canal de pérdidas:', error.message);
                    }
                }
                
                if (gainsChannel && lossesChannel) {
                    console.log('✅ Ambos canales obtenidos correctamente');
                    
                    // Enviar alertas para cada conquista al canal correspondiente
                    console.log(`📢 Enviando ${relevantConquests.length} notificaciones...`);
                    
                    for (let i = 0; i < relevantConquests.length; i++) {
                        const conquest = relevantConquests[i];
                        try {
                            console.log(`📤 Enviando notificación ${i+1}/${relevantConquests.length}: ${conquest.villageName || conquest.village?.name || 'Aldea desconocida'}`);
                            console.log(`🔍 Tipo de conquista: ${conquest.type}`);
                            
                            if (conquest.type === 'GAIN') {
                                await sendConquestAlert(gainsChannel, conquest, false); // Sin @everyone
                            } else if (conquest.type === 'LOSS') {
                                await sendConquestAlert(lossesChannel, conquest, true); // Con @everyone
                            } else if (conquest.type === 'NEUTRAL') {
                                // Conquistas neutrales van al canal de ganancias sin @everyone
                                await sendConquestAlert(gainsChannel, conquest, false);
                            }
                            
                            console.log(`✅ Notificación ${i+1} enviada exitosamente`);
                        } catch (error) {
                            console.error(`❌ Error enviando notificación ${i+1}:`, error);
                            console.error(`📊 Datos problemáticos:`, JSON.stringify(conquest, null, 2));
                        }
                    }
                    
                    console.log(`📢 Proceso de notificaciones completado`);
                } else {
                    console.log('❌ No se pudieron obtener los canales configurados');
                    console.log(`- Canal ganancias: ${gainsChannel ? '✅' : '❌'} (${config.gainsChannelId})`);
                    console.log(`- Canal pérdidas: ${lossesChannel ? '✅' : '❌'} (${config.lossesChannelId})`);
                }
            }
            
            // Actualizar el timestamp del último check (en segundos para consistencia con GT)
            config.lastCheck = Math.floor(Date.now() / 1000);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Limpiar conquistas procesadas antiguas en el analizador híbrido
            hybridAnalyzer.cleanOldProcessedConquests();
            
        } catch (error) {
            console.error('❌ Error verificando conquistas:', error);
        }
    }
    
    // Función para reiniciar el intervalo con la nueva configuración
    function restartConquestInterval() {
        try {
            const configPath = path.join(__dirname, 'conquest-config.json');
            
            if (!fs.existsSync(configPath)) {
                return 30000; // Valor por defecto - modo normal (30 segundos)
            }
            
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const mode = config.mode || 'normal';
            
            // Configuración de intervalos por modo
            const modeIntervals = {
                intensive: 15000,   // 15 segundos - guerra activa
                normal: 30000,      // 30 segundos - uso diario (mejorado)
                economy: 300000     // 5 minutos - menor consumo
            };
            
            const interval = modeIntervals[mode] || modeIntervals.normal;
            console.log(`📊 Modo detectado: ${mode} (${interval/1000}s)`);
            
            return interval;
            
        } catch (error) {
            console.error('❌ Error leyendo configuración:', error);
            return 30000; // Valor por defecto en caso de error (30 segundos)
        }
    }
    
    // Función para configurar el intervalo dinámico
    function setupDynamicInterval() {
        const currentInterval = restartConquestInterval();
        
        // Limpiar intervalo anterior si existe
        if (conquestCheckInterval) {
            clearInterval(conquestCheckInterval);
        }
        
        // Configurar nuevo intervalo
        conquestCheckInterval = setInterval(() => {
            checkConquests();
            
            // Verificar si el intervalo ha cambiado
            const newInterval = restartConquestInterval();
            if (newInterval !== currentInterval) {
                console.log(`⚡ Intervalo cambiado: ${currentInterval}ms → ${newInterval}ms`);
                setupDynamicInterval(); // Reconfigurar con nuevo intervalo
            }
        }, currentInterval);
        
        console.log(`⏱️ Monitoreo configurado cada ${currentInterval / 1000} segundos`);
    }
    
    // Iniciar monitoreo dinámico
    setupDynamicInterval();
    
    // Primera verificación después de 10 segundos
    setTimeout(checkConquests, 10000);
}

// Función para enviar alertas de conquista
async function sendConquestAlert(channel, conquest, includeEveryone = false) {
    try {
        console.log(`📤 [SendAlert] Preparando notificación para canal ${channel.name}`);
        console.log(`📊 [SendAlert] Tipo: ${conquest.type}, Incluir @everyone: ${includeEveryone}`);
        
        const embed = new EmbedBuilder()
            .setTimestamp(conquest.date || new Date(conquest.timestamp * 1000))
            .setFooter({ text: 'GT ES95 • Sistema de Alertas de Conquistas' });
        
        let content = '';
        
        if (conquest.type === 'LOSS') {
            // Miembro de Bollo pierde una aldea
            embed
                .setColor('#ff0000')
                .setTitle('🔴 ¡ALDEA PERDIDA!')
                .setDescription([
                    `⚔️ **${conquest.player?.name || 'Jugador desconocido'}** de **Bollo** ha perdido una aldea`,
                    '',
                    `🏘️ **Aldea:** ${conquest.village?.name || 'Aldea desconocida'} (${conquest.village?.x || '?'}|${conquest.village?.y || '?'})`,
                    `👤 **Perdida por:** ${conquest.oldOwner?.name || 'Jugador desconocido'}`,
                    `🎯 **Conquistada por:** ${conquest.newOwner?.name || 'Jugador desconocido'}`,
                    `📊 **Puntos de la aldea:** ${conquest.village?.points?.toLocaleString() || 'N/A'}`,
                    '',
                    `⏰ **Tiempo:** <t:${conquest.timestamp}:F>`
                ].join('\n'));
                
            // Solo incluir @everyone para pérdidas si se especifica
            if (includeEveryone) {
                content = '@everyone';
            }
            
        } else if (conquest.type === 'GAIN' || conquest.type === 'NEUTRAL') {
            // Obtener información de la tribu del conquistador
            let tribeInfo = '';
            const tribeName = conquest.newOwner?.tribe || conquest.newOwnerTribe;
            if (tribeName && tribeName !== 'Sin tribu') {
                tribeInfo = ` de **[${tribeName}]**`;
            } else {
                tribeInfo = ' (Sin tribu)';
            }
            
            // Cualquier conquista (no solo de Bollo)
            embed
                .setColor('#00ff00')
                .setTitle('🟢 ¡ALDEA CONQUISTADA!')
                .setDescription([
                    `⚔️ **${conquest.newOwner?.name || conquest.newOwnerName || 'Jugador desconocido'}**${tribeInfo} ha conquistado una aldea`,
                    '',
                    `🏘️ **Aldea:** ${conquest.village?.name || conquest.villageName || 'Aldea desconocida'} (${conquest.village?.x || conquest.coordinates?.x || '?'}|${conquest.village?.y || conquest.coordinates?.y || '?'})`,
                    `🎯 **Conquistada por:** ${conquest.newOwner?.name || conquest.newOwnerName || 'Jugador desconocido'}`,
                    `👤 **Perdida por:** ${conquest.oldOwner?.name || conquest.oldOwnerName || 'Aldea bárbara'}`,
                    `📊 **Puntos de la aldea:** ${conquest.village?.points?.toLocaleString() || conquest.points?.toLocaleString() || 'N/A'}`,
                    '',
                    `⏰ **Tiempo:** <t:${conquest.timestamp}:F>`
                ].join('\n'));
                
            // No incluir @everyone para conquistas
            content = '';
        }
        
        console.log(`📝 [SendAlert] Embed preparado, enviando al canal...`);
        
        // Enviar el mensaje
        await channel.send({
            content: content,
            embeds: [embed]
        });
        
        const alertType = conquest.type === 'LOSS' ? '🔴 PÉRDIDA' : '� CONQUISTA';
        const everyoneText = includeEveryone ? ' (con @everyone)' : '';
        console.log(`📢 Alerta enviada: ${alertType} - ${conquest.village?.name || 'Aldea desconocida'}${everyoneText}`);
        
    } catch (error) {
        console.error('❌ Error enviando alerta de conquista:', error);
        console.error('📊 Datos de conquista problemáticos:', JSON.stringify(conquest, null, 2));
        // NO re-lanzar el error para evitar que el bot se crashee
    }
}

// Manejar comandos slash
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        console.log(`🎯 Comando recibido: /${interaction.commandName} por ${interaction.user.tag}`);

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`❌ Comando no encontrado: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
            console.log(`✅ Comando ejecutado exitosamente: /${interaction.commandName}`);
        } catch (error) {
            console.error(`❌ Error ejecutando comando /${interaction.commandName}:`, error);
            
            const errorReply = { 
                content: '❌ Hubo un error ejecutando este comando.', 
                ephemeral: true 
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorReply);
            } else {
                await interaction.reply(errorReply);
            }
        }
    }
    
    // Manejar interacciones de botones
    if (interaction.isButton()) {
        console.log(`🔘 Botón presionado: ${interaction.customId} por ${interaction.user.tag}`);
        await handleButtonInteraction(interaction);
    }
});

// Función para manejar interacciones de botones
async function handleButtonInteraction(interaction) {
    const GTDataManager = require('./utils/gtData');
    const gtData = new GTDataManager();
    const { EmbedBuilder } = require('discord.js');

    const customId = interaction.customId;
    
    try {
        // Manejar botones de análisis de actividad de aldea primero (usan deferReply)
        if (customId.startsWith('village_activity_')) {
            // Usar el handler de actividad desde villageInfoHandler
            await villageInfoHandler.handleActivityAnalysis(interaction);
            return; // El handler maneja la respuesta completa
        }
        
        // Para todos los otros botones, usar deferUpdate
        await interaction.deferUpdate();
        
        // Manejar botones específicos de tribu
        if (customId.startsWith('tribe_ranking_')) {
            const tribeId = parseInt(customId.split('_')[2]);
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            if (!tribe) {
                await interaction.editReply({
                    content: '❌ Tribu no encontrada en el ranking.',
                    components: []
                });
                return;
            }
            
            // Ordenar tribus por puntos (descendente) para obtener el ranking correcto
            const sortedTribes = tribes.sort((a, b) => b.points - a.points);
            
            // Mostrar ranking de tribus alrededor de la tribu seleccionada
            const tribeIndex = sortedTribes.findIndex(t => t.id === tribeId);
            const start = Math.max(0, tribeIndex - 5);
            const end = Math.min(sortedTribes.length, tribeIndex + 6);
            const rankingSection = sortedTribes.slice(start, end);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle('🏆 Ranking de Tribus')
                .setDescription(`Posición de **[${tribe.tag}] ${tribe.name}** en el ranking`)
                .setTimestamp();
            
            const rankingText = rankingSection.map((t, index) => {
                const actualRank = start + index + 1; // Posición real en el ranking
                const icon = t.id === tribeId ? '👑' : (actualRank <= 3 ? ['🥇', '🥈', '🥉'][actualRank - 1] : '▫️');
                const highlight = t.id === tribeId ? '**' : '';
                return `${icon} ${highlight}${actualRank}. [${t.tag}] ${t.name}${highlight}\n   💎 ${t.points.toLocaleString()} pts • 👥 ${t.members} miembros`;
            }).join('\n');
            
            embed.addFields({
                name: `Tribus ${start + 1}-${end}`,
                value: rankingText,
                inline: false
            });

            // Botón para volver a la información de la tribu
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_tribe_${tribeId}`)
                        .setLabel('⬅️ Volver a la Tribu')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        else if (customId.startsWith('tribe_top_players_')) {
            const tribeId = parseInt(customId.split('_')[3]);
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeId);
            
            if (tribeMembers.length === 0) {
                await interaction.editReply({
                    content: '❌ No se encontraron miembros para esta tribu.',
                    components: []
                });
                return;
            }
            
            const topMembers = tribeMembers
                .sort((a, b) => b.points - a.points)
                .slice(0, 15);
                
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle(`👑 Top Jugadores de [${tribe?.tag || 'N/A'}] ${tribe?.name || 'Desconocida'}`)
                .setDescription(`Los mejores ${Math.min(15, tribeMembers.length)} jugadores de ${tribeMembers.length} miembros totales`)
                .setTimestamp();
            
            const membersText = topMembers.map((member, i) => {
                const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
                return `${medal} **${member.name}** (#${member.rank})\n   💎 ${member.points.toLocaleString()} pts • 🏘️ ${member.villages} aldeas`;
            }).join('\n');
            
            embed.addFields({
                name: 'Ranking Interno',
                value: membersText,
                inline: false
            });

            // Botón para volver a la información de la tribu
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_tribe_${tribeId}`)
                        .setLabel('⬅️ Volver a la Tribu')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        else if (customId.startsWith('tribe_territory_')) {
            const tribeId = parseInt(customId.split('_')[2]);
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeId);
            
            if (tribeMembers.length === 0) {
                await interaction.editReply({
                    content: '❌ No se encontraron miembros para esta tribu.',
                    components: []
                });
                return;
            }
            
            // Obtener aldeas de todos los miembros
            const villages = await gtData.getVillages();
            const allVillages = villages.filter(v => 
                tribeMembers.some(member => member.id === v.playerId)
            );
            
            if (allVillages.length === 0) {
                await interaction.editReply({
                    content: '❌ No se encontraron aldeas para generar el mapa territorial.',
                    components: []
                });
                return;
            }
            
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            // Analizar distribución territorial
            const corners = allVillages.reduce((acc, v) => ({
                minX: Math.min(acc.minX, v.x),
                maxX: Math.max(acc.maxX, v.x),
                minY: Math.min(acc.minY, v.y),
                maxY: Math.max(acc.maxY, v.y)
            }), { minX: 999, maxX: 0, minY: 999, maxY: 0 });
            
            // Crear mapa simplificado (dividir en cuadrículas)
            const gridSize = 50; // Campos de 50x50
            const territoryMap = {};
            
            allVillages.forEach(v => {
                const gridX = Math.floor(v.x / gridSize);
                const gridY = Math.floor(v.y / gridSize);
                const key = `${gridX},${gridY}`;
                territoryMap[key] = (territoryMap[key] || 0) + 1;
            });
            
            // Encontrar las 5 zonas con más densidad
            const densityZones = Object.entries(territoryMap)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([key, count]) => {
                    const [gX, gY] = key.split(',').map(Number);
                    const centerX = gX * gridSize + gridSize / 2;
                    const centerY = gY * gridSize + gridSize / 2;
                    const quadrant = `K${Math.floor(centerY / 100)}${Math.floor(centerX / 100)}`;
                    return {
                        zone: `${Math.floor(centerX)}|${Math.floor(centerY)}`,
                        quadrant,
                        villages: count,
                        density: ((count / allVillages.length) * 100).toFixed(1)
                    };
                });
            
            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle(`🗺️ Mapa Territorial: [${tribe?.tag}] ${tribe?.name}`)
                .setDescription(`Análisis de distribución de ${allVillages.length} aldeas`)
                .setTimestamp();
                
            const territoryInfo = `📏 **Extensión Total:**\n` +
                `${corners.maxX - corners.minX + 1} × ${corners.maxY - corners.minY + 1} campos\n` +
                `Desde ${corners.minX}|${corners.minY} hasta ${corners.maxX}|${corners.maxY}\n\n` +
                `🎯 **Centro Geográfico:**\n` +
                `${Math.round((corners.minX + corners.maxX) / 2)}|${Math.round((corners.minY + corners.maxY) / 2)}`;
                
            const zonesText = densityZones.map((zone, i) => 
                `${i + 1}. **${zone.zone}** (${zone.quadrant})\n   🏘️ ${zone.villages} aldeas (${zone.density}% del total)`
            ).join('\n');
            
            embed.addFields(
                {
                    name: '📍 Información Territorial',
                    value: territoryInfo,
                    inline: true
                },
                {
                    name: '🔥 Zonas de Mayor Densidad',
                    value: zonesText || 'No hay concentraciones significativas',
                    inline: true
                }
            );

            // Botón para volver a la información de la tribu
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_tribe_${tribeId}`)
                        .setLabel('⬅️ Volver a la Tribu')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        // Botón de Ver Tribu desde jugador (con información del jugador original)
        else if (customId.startsWith('tribe_from_player_')) {
            const parts = customId.split('_');
            const tribeId = parseInt(parts[3]);
            const playerName = parts.slice(4).join('_');
            
            if (isNaN(tribeId) || parts[3] === 'none') {
                await interaction.editReply({
                    content: '❌ Este jugador no pertenece a ninguna tribu.',
                    components: []
                });
                return;
            }
            
            // Ejecutar el comando tribu
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            if (!tribe) {
                await interaction.editReply({
                    content: '❌ Tribu no encontrada.',
                    components: []
                });
                return;
            }
            
            // Crear embed de tribu (similar al comando /tribu)
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeId);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle(`🏛️ ${tribe.name} [${tribe.tag}]`)
                .setTimestamp()
                .addFields([
                    { name: '📊 Información General', value: `**Ranking:** #${tribe.rank}\n**Puntos:** ${tribe.points.toLocaleString()}\n**Miembros:** ${tribeMembers.length}\n**Promedio por miembro:** ${Math.round(tribe.points / tribeMembers.length).toLocaleString()} pts`, inline: true },
                    { name: '🏆 Top 5 Miembros', value: tribeMembers.sort((a, b) => b.points - a.points).slice(0, 5).map((member, i) => `${i + 1}. **${member.name}** - ${member.points.toLocaleString()} pts`).join('\n'), inline: true }
                ]);

            // Botones de navegación de tribu (incluyendo volver al jugador)
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_player_${playerName}`)
                        .setLabel('⬅️ Volver al Jugador')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_ranking_${tribeId}`)
                        .setLabel('🏆 Ranking')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_top_players_${tribeId}`)
                        .setLabel('👑 Top Jugadores')
                        .setStyle(ButtonStyle.Primary)
                );

            // Segunda fila para el botón de territorio
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tribe_territory_${tribeId}`)
                        .setLabel('🗺️ Territorio')
                        .setStyle(ButtonStyle.Success)
                );
                
            await interaction.editReply({
                embeds: [embed],
                components: [row, row2]
            });
        }
        
        // Botón básico de Ver Tribu (sin información del jugador original - mantener para compatibilidad)
        else if (customId.startsWith('tribe_')) {
            const tribeId = parseInt(customId.split('_')[1]);
            if (isNaN(tribeId) || customId.split('_')[1] === 'none') {
                await interaction.editReply({
                    content: '❌ Este jugador no pertenece a ninguna tribu.',
                    components: []
                });
                return;
            }
            
            // Ejecutar el comando tribu
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            if (!tribe) {
                await interaction.editReply({
                    content: '❌ Tribu no encontrada.',
                    components: []
                });
                return;
            }
            
            // Crear embed de tribu (similar al comando /tribu)
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeId);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle(`🏛️ ${tribe.name} [${tribe.tag}]`)
                .setTimestamp()
                .addFields([
                    { name: '📊 Información General', value: `**Ranking:** #${tribe.rank}\n**Puntos:** ${tribe.points.toLocaleString()}\n**Miembros:** ${tribeMembers.length}\n**Promedio por miembro:** ${Math.round(tribe.points / tribeMembers.length).toLocaleString()} pts`, inline: true },
                    { name: '🏆 Top 5 Miembros', value: tribeMembers.sort((a, b) => b.points - a.points).slice(0, 5).map((member, i) => `${i + 1}. **${member.name}** - ${member.points.toLocaleString()} pts`).join('\n'), inline: true }
                ]);

            // Botones de navegación de tribu
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tribe_ranking_${tribeId}`)
                        .setLabel('🏆 Ranking')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_top_players_${tribeId}`)
                        .setLabel('👑 Top Jugadores')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_territory_${tribeId}`)
                        .setLabel('🗺️ Territorio')
                        .setStyle(ButtonStyle.Success)
                );
                
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        else if (customId.startsWith('villages_')) {
            const playerName = customId.split('_').slice(1).join('_');
            const players = await gtData.getPlayers();
            const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
            
            if (!player || !player.villagesList || player.villagesList.length === 0) {
                await interaction.editReply({
                    content: '❌ No se encontraron aldeas para este jugador.',
                    components: []
                });
                return;
            }
            
            // Mostrar todas las aldeas
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(`🏘️ Aldeas de ${player.name}`)
                .setDescription(`**Total de aldeas:** ${player.villagesList.length}`)
                .setTimestamp();
            
            // Dividir aldeas en chunks para no exceder límites
            const villageChunks = [];
            const sortedVillages = player.villagesList.sort((a, b) => b.points - a.points);
            
            for (let i = 0; i < sortedVillages.length; i += 10) {
                const chunk = sortedVillages.slice(i, i + 10);
                const chunkText = chunk.map((v, idx) => 
                    `${i + idx + 1}. **${v.name}** (${v.x}|${v.y}) - ${v.points.toLocaleString()} pts`
                ).join('\n');
                villageChunks.push(chunkText);
            }
            
            // Agregar hasta 3 chunks como fields
            villageChunks.slice(0, 3).forEach((chunk, i) => {
                embed.addFields({
                    name: i === 0 ? '🏆 Mejores Aldeas' : `Aldeas ${i * 10 + 1}-${Math.min((i + 1) * 10, sortedVillages.length)}`,
                    value: chunk,
                    inline: false
                });
            });
            
            if (villageChunks.length > 3) {
                embed.addFields({
                    name: '📝 Nota',
                    value: `Mostrando las primeras ${Math.min(30, sortedVillages.length)} aldeas de ${sortedVillages.length} totales.`,
                    inline: false
                });
            }

            // Botón para volver a la información del jugador
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_player_${playerName}`)
                        .setLabel('⬅️ Volver al Jugador')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        else if (customId.startsWith('ranking_player_')) {
            const playerName = customId.split('_').slice(2).join('_');
            const players = await gtData.getPlayers();
            const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
            
            if (!player) {
                await interaction.editReply({
                    content: '❌ Jugador no encontrado en el ranking.',
                    components: []
                });
                return;
            }
            
            // Ordenar jugadores por puntos (descendente) para obtener el ranking correcto
            const sortedPlayers = players.sort((a, b) => b.points - a.points);
            
            // Mostrar ranking alrededor del jugador
            const playerIndex = sortedPlayers.findIndex(p => p.name === player.name);
            const start = Math.max(0, playerIndex - 5);
            const end = Math.min(sortedPlayers.length, playerIndex + 6);
            const rankingSection = sortedPlayers.slice(start, end);
            
            const embed = new EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🏆 Ranking de Jugadores')
                .setDescription(`Posición de **${player.name}** en el ranking general`)
                .setTimestamp();
            
            const rankingText = rankingSection.map((p, index) => {
                const actualRank = start + index + 1; // Posición real en el ranking
                const icon = p.name === player.name ? '👑' : (actualRank <= 3 ? ['🥇', '🥈', '🥉'][actualRank - 1] : '▫️');
                const highlight = p.name === player.name ? '**' : '';
                return `${icon} ${highlight}${actualRank}. ${p.name}${highlight} - ${p.points.toLocaleString()} pts`;
            }).join('\n');
            
            embed.addFields({
                name: `Jugadores ${start + 1}-${end}`,
                value: rankingText,
                inline: false
            });

            // Botón para volver a la información del jugador
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`back_to_player_${playerName}`)
                        .setLabel('⬅️ Volver al Jugador')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        // Manejadores para botones "Volver"
        else if (customId.startsWith('back_to_player_')) {
            const playerName = customId.split('_').slice(3).join('_');
            
            // Ejecutar el comando jugador original
            const jugadorCommand = client.commands.get('jugador');
            if (jugadorCommand) {
                // Crear una interacción simulada para reusar el comando
                const fakeInteraction = {
                    ...interaction,
                    options: {
                        getString: (name) => name === 'nombre' ? playerName : null
                    },
                    deferReply: () => Promise.resolve(),
                    editReply: (data) => interaction.editReply(data)
                };
                
                await jugadorCommand.execute(fakeInteraction);
            } else {
                await interaction.editReply({
                    content: '❌ Error al volver a la información del jugador.',
                    components: []
                });
            }
        }
        
        else if (customId.startsWith('back_to_tribe_')) {
            const tribeId = parseInt(customId.split('_')[3]);
            
            // Recrear la vista de tribu original
            const tribes = await gtData.getTribes();
            const tribe = tribes.find(t => t.id === tribeId);
            
            if (!tribe) {
                await interaction.editReply({
                    content: '❌ Tribu no encontrada.',
                    components: []
                });
                return;
            }
            
            const players = await gtData.getPlayers();
            const tribeMembers = players.filter(p => p.tribeId === tribeId);
            
            const embed = new EmbedBuilder()
                .setColor(0x8B4513)
                .setTitle(`🏛️ ${tribe.name} [${tribe.tag}]`)
                .setTimestamp()
                .addFields([
                    { name: '📊 Información General', value: `**Ranking:** #${tribe.rank}\n**Puntos:** ${tribe.points.toLocaleString()}\n**Miembros:** ${tribeMembers.length}\n**Promedio por miembro:** ${Math.round(tribe.points / tribeMembers.length).toLocaleString()} pts`, inline: true },
                    { name: '🏆 Top 5 Miembros', value: tribeMembers.sort((a, b) => b.points - a.points).slice(0, 5).map((member, i) => `${i + 1}. **${member.name}** - ${member.points.toLocaleString()} pts`).join('\n'), inline: true }
                ]);

            // Botones de navegación de tribu
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tribe_ranking_${tribeId}`)
                        .setLabel('🏆 Ranking')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_top_players_${tribeId}`)
                        .setLabel('👑 Top Jugadores')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`tribe_territory_${tribeId}`)
                        .setLabel('🗺️ Territorio')
                        .setStyle(ButtonStyle.Success)
                );
                
            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });
        }
        
        // Manejar botones de kills
        else if (customId.startsWith('kills_ranking_')) {
            const KillsDataManager = require('./utils/killsData');
            const killsData = new KillsDataManager();
            
            const type = customId.split('_')[2]; // all, att, def, sup
            const typeMapping = {
                'all': 'kill_all',
                'att': 'kill_att', 
                'def': 'kill_def',
                'sup': 'kill_sup'
            };
            
            const killType = typeMapping[type];
            if (!killType) {
                await interaction.editReply({
                    content: '❌ Tipo de kill no válido.',
                    components: []
                });
                return;
            }
            
            // Obtener configuración del cache si existe
            const embed = interaction.message.embeds[0];
            let limit = 10; // valor por defecto
            
            if (embed && embed.footer && embed.footer.text) {
                const cacheMatch = embed.footer.text.match(/Cache: (\d+)/);
                if (cacheMatch) {
                    const cacheKey = `kills_ranking_${interaction.user.id}_${cacheMatch[1]}`;
                    const navigationCache = require('./commands/kills').navigationCache;
                    if (navigationCache && navigationCache.has(cacheKey)) {
                        const cached = navigationCache.get(cacheKey);
                        limit = cached.limit;
                    }
                }
            }
            
            const topKillers = await killsData.getTopKillers(killType, limit);
            const players = await gtData.getPlayers();
            
            const typeNames = {
                'kill_all': '⚔️ Kills Totales',
                'kill_att': '⚡ Kills Atacando', 
                'kill_def': '🛡️ Kills Defendiendo',
                'kill_sup': '🤝 Kills Apoyando'
            };

            const newEmbed = new EmbedBuilder()
                .setColor(0xF39C12)
                .setTitle(`🏆 Ranking - ${typeNames[killType]}`)
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
                    if (player.tribe && player.tribe !== '0') {
                        const tribe = await gtData.getTribeData(player.tribe);
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

            newEmbed.addFields({
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
                        .setStyle(killType === 'kill_all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setEmoji('⚔️'),
                    new ButtonBuilder()
                        .setCustomId('kills_ranking_att')
                        .setLabel('Ataque')
                        .setStyle(killType === 'kill_att' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setEmoji('⚡')
                );
            
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('kills_ranking_def')
                        .setLabel('Defensa')
                        .setStyle(killType === 'kill_def' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setEmoji('🛡️'),
                    new ButtonBuilder()
                        .setCustomId('kills_ranking_sup')
                        .setLabel('Apoyo')
                        .setStyle(killType === 'kill_sup' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setEmoji('🤝')
                );

            newEmbed.setFooter({ 
                text: `GT ES95 • Página 1 • ${embed?.footer?.text?.includes('Cache:') ? embed.footer.text.split('Cache:')[1].trim() : ''}`,
                iconURL: 'https://cdn.discordapp.com/attachments/1234567890/attachment.png'
            });

            await interaction.editReply({ embeds: [newEmbed], components: [row1, row2] });
        }
        
    } catch (error) {
        console.error('Error en interacción de botón:', error);
        await interaction.editReply({
            content: '❌ Error al procesar la interacción del botón.',
            components: []
        });
    }
}

// Manejar mensajes normales (comandos con prefijo)
client.on('messageCreate', async message => {
    // Ignorar bots
    if (message.author.bot) return;
    
    // Sistema de detección de coordenadas en cualquier mensaje
    await villageInfoHandler.handleMessage(message);
    
    // Continuar con comandos con prefijo
    if (!message.content.startsWith('!gt')) return;

    const args = message.content.slice(3).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Comando simple de prueba
    if (commandName === 'ping') {
        message.reply('🏓 Pong! Bot funcionando correctamente.');
    }
    
    if (commandName === 'help') {
        message.reply(`
🤖 **Bot de Guerras Tribales ES95 - Comandos disponibles:**

**📱 Comandos básicos:**
\`!gt ping\` - Verificar que el bot funciona
\`!gt help\` - Mostrar esta ayuda

**⚔️ Comandos slash del Mundo 95:**
\`/jugador [nombre]\` - Información completa con territorio y botones interactivos
\`/tribu [tag/nombre]\` - Información con análisis territorial y navegación
\`/lista-tribus [cantidad]\` - Lista de tribus con puntos, miembros y aldeas
\`/ranking [tipo]\` - Ver rankings (jugadores, tribus, aldeas)
\`/buscar [tipo] [término]\` - Buscar jugadores, tribus o aldeas
\`/stats\` - Estadísticas generales del Mundo 95

**🎮 Funcionalidades Interactivas:**
• 🔘 **Botones de navegación** en /jugador y /tribu
• 🗺️ **Mapas territoriales** con análisis de densidad
• 🏆 **Rankings contextuales** alrededor del elemento buscado
• 📊 **Análisis avanzado** de territorio y coordenadas

**💡 Ejemplos de uso:**
\`/jugador rabagalan73\` - Ver jugador con botones para tribu y ranking
\`/tribu Bollo\` - Ver tribu con mapa territorial y top jugadores
\`/lista-tribus 20\` - Ver las primeras 20 tribus con estadísticas completas
\`/ranking jugadores 15\` - Top 15 jugadores
\`/buscar aldea 500|500\` - Buscar aldeas cerca de 500|500

¡Bot desarrollado por Raba para Guerras Tribales ES95! 🏰
**Funcionalidades avanzadas:** Botones interactivos, mapas territoriales, análisis de coordenadas
        `);
    }
});

// Sistema de notificaciones de adversarios
async function startKillsNotificationSystem() {
    try {
        console.log('🏆 Iniciando sistema de notificaciones de adversarios...');
        
        // Ejecutar reparación del sistema de kills si es necesario
        const { repairKillsSystem } = require('./utils/killsRepair');
        await repairKillsSystem();
        
        killsNotificationScheduler = new KillsNotificationScheduler(client);
        killsNotificationScheduler.start();
        
        console.log('✅ Sistema de notificaciones de adversarios iniciado correctamente');
    } catch (error) {
        console.error('❌ Error iniciando sistema de notificaciones:', error);
    }
}

// Manejo de errores
client.on('error', error => {
    console.error('❌ Error del cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Error no manejado:', error);
});

// Conectar el bot
client.login(process.env.DISCORD_TOKEN);