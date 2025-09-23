const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Cargar configuración de servidores permitidos
const serverConfig = JSON.parse(fs.readFileSync('server-config.json', 'utf8'));

// Importar sistemas automáticos
const KillsNotificationScheduler = require('./utils/killsNotificationScheduler');
const ConquestAutoMonitor = require('./conquest-auto-monitor');

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

// Función para inicializar sistemas automáticos
async function initializeAutomaticSystems(client) {
    console.log('🚀 Inicializando sistemas automáticos...');
    
    try {
        // Sistema de notificaciones de adversarios (kills)
        console.log('🏆 Iniciando sistema de notificaciones de adversarios...');
        const killsScheduler = new KillsNotificationScheduler(client);
        await killsScheduler.start();
        console.log('✅ Sistema de notificaciones de adversarios iniciado correctamente');
        
        // Sistema de monitoreo de conquistas
        console.log('🏰 Iniciando sistema de monitoreo de conquistas...');
        const conquestMonitor = new ConquestAutoMonitor(client);
        
        // Hacer el monitor accesible globalmente para comandos
        client.conquestMonitor = conquestMonitor;
        
        await conquestMonitor.start();
        console.log('✅ Sistema de monitoreo de conquistas iniciado correctamente');
        
        console.log('✅ Sistemas automáticos iniciados correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistemas automáticos:', error);
    }
}

// Evento cuando el bot se conecta
client.once('clientReady', async () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}!`);
    console.log(`📊 Sirviendo en ${client.guilds.cache.size} servidores`);
    
    // Verificar servidores no autorizados
    const unauthorizedGuilds = [];
    client.guilds.cache.forEach(guild => {
        if (!serverConfig.allowedGuilds.includes(guild.id)) {
            console.log(`⚠️ Bot detectado en servidor NO AUTORIZADO: ${guild.name} (${guild.id})`);
            if (serverConfig.autoLeaveUnauthorized) {
                unauthorizedGuilds.push(guild);
            }
        } else {
            console.log(`✅ Servidor autorizado: ${guild.name} (${guild.id})`);
        }
    });
    
    // Salir de servidores no autorizados de forma asíncrona
    for (const guild of unauthorizedGuilds) {
        try {
            await guild.leave();
            console.log(`🚪 Saliendo automáticamente del servidor: ${guild.name}`);
        } catch (error) {
            console.error(`❌ Error saliendo del servidor ${guild.name}:`, error);
        }
    }
    
    console.log(`🎯 Verificación de servidores completada. Continuando inicialización...`);
    
    // Inicializar sistemas automáticos
    await initializeAutomaticSystems(client);
    
    // Estado del bot
    client.user.setActivity('Guerras Tribales 🏰', { type: 3 }); // 3 = WATCHING
    
    console.log(`✅ Bot completamente inicializado y listo para funcionar`);
});

// Manejar comandos slash y botones
client.on('interactionCreate', async interaction => {
    // Manejar botones de coordenadas
    if (interaction.isButton() && interaction.customId.startsWith('analyze_')) {
        const [_, x, y] = interaction.customId.split('_');
        console.log(`🔍 [Button] Análisis solicitado para ${x}|${y} por ${interaction.user.username}`);
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            console.log(`[ActivityAnalysis] Analizando coordenadas ${x}|${y}`);
            
            // Importar y usar el VillageActivityAnalyzer
            const VillageActivityAnalyzer = require('./utils/villageActivityAnalyzer');
            const analyzer = new VillageActivityAnalyzer();
            
            // Obtener ID de la aldea
            const villageId = await analyzer.getVillageIdFromCoordinates(parseInt(x), parseInt(y));
            
            if (!villageId) {
                await interaction.editReply({
                    content: `❌ **No se encontró aldea en ${x}|${y}**\n\nLa coordenada podría estar vacía o no estar registrada en el sistema.`
                });
                return;
            }
            
            console.log(`[ActivityAnalysis] Village ID encontrado: ${villageId}`);
            
            // Obtener historial de actividad
            const data = await analyzer.getVillageHistory(villageId);
            console.log(`[ActivityAnalysis] Datos obtenidos:`, {
                name: data.name,
                owner: data.owner,
                historyLength: data.history?.length || 0
            });
            
            // Analizar patrones
            const analysis = analyzer.analyzeActivityPatterns(data.history, data.points);
            
            // Crear embed de respuesta detallado
            const { EmbedBuilder } = require('discord.js');
            // Determinar el estado
            let estado = 'Análisis completado';
            if (analysis.totalEntries === 0) {
                estado = 'Sin datos suficientes para análisis';
            } else if (analysis.totalEntries < 10) {
                estado = 'Pocos datos disponibles';
            }
            // Puedes agregar más condiciones si lo deseas

            const analysisEmbed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle(`📊 Análisis de Actividad: ${data.name}`)
                .setDescription(`**Coordenadas:** ${x}|${y}\n**Propietario:** ${data.owner}${data.tribe ? `\n**Tribu:** ${data.tribe}` : ''}\n**Puntos:** ${data.points.toLocaleString()}`)
                .addFields([
                    {
                        name: '🔍 Estado',
                        value: estado,
                        inline: false
                    },
                    {
                        name: '� Zona Horaria Estimada',
                        value: `**${analysis.timezone}**\n${analysis.pattern}\n*Confianza: ${analysis.confidence}*`,
                        inline: false
                    },
                    {
                        name: '📈 Datos del Análisis',
                        value: `**Total registros:** ${analysis.totalEntries}\n**Registros confiables:** ${analysis.reliableEntries} (${analysis.reliabilityPercentage}%)\n**Nivel:** ${analysis.playerLevel === 'early_game' ? 'Jugador inicial' : 'Jugador avanzado'}`,
                        inline: true
                    },
                    {
                        name: '📅 Período Analizado',
                        value: `**Desde:** ${(analysis.analysisRange?.from && typeof analysis.analysisRange.from === 'string') ? analysis.analysisRange.from.split(' ')[0] : 'N/A'}\n**Hasta:** ${(analysis.analysisRange?.to && typeof analysis.analysisRange.to === 'string') ? analysis.analysisRange.to.split(' ')[0] : 'N/A'}`,
                        inline: true
                    }
                ])
                .setTimestamp()
                .setFooter({ text: 'Análisis basado en datos de TWStats' });
            
            // Agregar insights si existen
            if (analysis.insights && analysis.insights.length > 0) {
                const insightsText = analysis.insights.slice(0, 5).join('\n'); // Máximo 5 insights
                analysisEmbed.addFields([
                    {
                        name: '💡 Insights',
                        value: insightsText,
                        inline: false
                    }
                ]);
            }
            
            // Agregar actividad por horas si hay datos suficientes
            if (analysis.hourlyActivity && analysis.totalEntries >= 10) {
                const topHours = analysis.hourlyActivity
                    .filter(h => h.percentage > 5) // Solo mostrar horas con >5% actividad
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 8); // Top 8 horas
                
                if (topHours.length > 0) {
                    const hoursText = topHours
                        .map(h => `${h.hour}: ${h.percentage}% (${h.count})`)
                        .join('\n');
                    
                    analysisEmbed.addFields([
                        {
                            name: '⏰ Horarios de Mayor Actividad',
                            value: hoursText,
                            inline: false
                        }
                    ]);
                }
            }
            
            // Advertencia si pocos datos
            if (analysis.totalEntries < 10) {
                analysisEmbed.setDescription(
                    analysisEmbed.data.description + 
                    '\n\n⚠️ **Pocos datos disponibles** - El análisis puede ser impreciso'
                );
            }
            
            await interaction.editReply({ 
                embeds: [analysisEmbed] 
            });
            
        } catch (error) {
            console.error('[ActivityAnalysis] Error:', error);
            
            let errorMessage = '❌ **Error en el análisis**\n\n';
            let errorEmbed = null;
            
            if (error.message.includes('Timeout') && error.message.includes('TWStats')) {
                // Error específico de timeout con TWStats
                errorEmbed = new EmbedBuilder()
                    .setColor('#FF6B35')
                    .setTitle('⏳ Timeout de Análisis')
                    .setDescription(`**Coordenadas:** ${x}|${y}`)
                    .addFields([
                        {
                            name: '🔴 Problema',
                            value: 'TWStats tardó demasiado en responder (>30 segundos)',
                            inline: false
                        },
                        {
                            name: '🔄 Reintentos',
                            value: 'Se intentó 3 veces automáticamente',
                            inline: true
                        },
                        {
                            name: '💡 Solución',
                            value: 'Inténtalo de nuevo en unos minutos',
                            inline: true
                        }
                    ])
                    .setFooter({ text: 'TWStats puede estar sobrecargado' })
                    .setTimestamp();
                    
            } else if (error.message.includes('TWStats') || error.message.includes('no disponible')) {
                // Error de conectividad con TWStats
                errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚫 Servidor No Disponible')
                    .setDescription(`**Coordenadas:** ${x}|${y}`)
                    .addFields([
                        {
                            name: '🔴 Problema',
                            value: 'No se puede conectar con TWStats',
                            inline: false
                        },
                        {
                            name: '🕒 Estado',
                            value: 'Servidor temporalmente no disponible',
                            inline: true
                        },
                        {
                            name: '💡 Solución',
                            value: 'Inténtalo más tarde',
                            inline: true
                        }
                    ])
                    .setFooter({ text: 'Problema temporal del servidor TWStats' })
                    .setTimestamp();
                    
            } else if (error.message.includes('No se encontró')) {
                // Aldea no encontrada
                errorMessage += error.message;
            } else {
                // Error genérico
                errorMessage += `Error interno del sistema.\n\n**Detalles técnicos:**\n\`\`\`${error.message}\`\`\`\n\n💡 Inténtalo de nuevo en unos minutos.`;
                console.error('[ActivityAnalysis] Error completo:', error);
            }
            
            await interaction.editReply(
                errorEmbed ? { embeds: [errorEmbed] } : { content: errorMessage }
            );
        }
        
        return;
    }
    
    // Manejar comandos slash
    if (!interaction.isChatInputCommand()) return;

    // Verificar si el servidor está autorizado
    if (!serverConfig.allowedGuilds.includes(interaction.guild.id)) {
        if (serverConfig.logUnauthorizedAccess) {
            console.log(`🚫 Intento de comando desde servidor NO AUTORIZADO: ${interaction.guild.name} (${interaction.guild.id})`);
            console.log(`👤 Usuario: ${interaction.user.tag} (${interaction.user.id})`);
            console.log(`⚡ Comando: ${interaction.commandName}`);
        }
        await interaction.reply({ 
            content: '❌ Este bot no está autorizado para funcionar en este servidor.', 
            ephemeral: true 
        });
        return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('❌ Error ejecutando comando:', error);
        await interaction.reply({ 
            content: '❌ Hubo un error ejecutando este comando.', 
            ephemeral: true 
        });
    }
});

// Manejar mensajes normales (comandos con prefijo y detección de coordenadas)
client.on('messageCreate', async message => {
    // Ignorar mensajes de bots
    if (message.author.bot) return;

    console.log(`📝 [Message] Usuario: ${message.author.username} en canal: ${message.channel.name}`);
    console.log(`📝 [Message] Contenido: "${message.content}"`);

    // Verificar detección de coordenadas PRIMERO (antes que comandos)
    const coordinateRegex = /\b(\d{1,3})[\|\-,\s](\d{1,3})\b/g;
    const matches = [...message.content.matchAll(coordinateRegex)];
    
    console.log(`🔍 [Coordinates] Regex matches:`, matches);
    
    if (matches.length > 0) {
        console.log(`✅ [Coordinates] Coordenadas detectadas: ${matches.map(m => m[0])}`);
        await handleCoordinateMessage(message, matches);
        return; // Salir después de manejar coordenadas
    } else {
        console.log(`❌ [Coordinates] No se detectaron coordenadas en: "${message.content}"`);
    }

    // Manejar comandos con prefijo !gt
    if (!message.content.startsWith('!gt')) return;

    const args = message.content.slice(3).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Comando simple de prueba
    if (commandName === 'ping') {
        message.reply('🏓 Pong! Bot funcionando correctamente.');
    }
    
    if (commandName === 'help') {
        message.reply(`
🤖 **Bot de Guerras Tribales - Comandos disponibles:**

**Comandos básicos:**
\`!gt ping\` - Verificar que el bot funciona
\`!gt help\` - Mostrar esta ayuda

**Comandos de análisis:** _(próximamente)_
\`/baneos [jugador]\` - Consultar baneos de un jugador
\`/analizar [jugador]\` - Análisis completo de un jugador
\`/coincidencias\` - Buscar patrones sospechosos

¡Bot desarrollado por Raba para Guerras Tribales! 🏰
        `);
    }
});

// Función para manejar mensajes con coordenadas
async function handleCoordinateMessage(message, matches) {
    try {
        console.log(`🎯 [Coordinates] Procesando coordenadas para: ${message.author.username}`);
        
        // Procesar la primera coordenada encontrada
        const match = matches[0];
        const x = parseInt(match[1]);
        const y = parseInt(match[2]);
        
        console.log(`📍 [Coordinates] Coordenadas procesadas: ${x}|${y}`);
        
        // Validar rango de coordenadas
        if (x < 1 || x > 1000 || y < 1 || y > 1000) {
            console.log(`⚠️ [Coordinates] Coordenadas fuera de rango: ${x}|${y}`);
            return;
        }
        
        // Crear el embed de respuesta
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const embed = new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🏘️ Información de Aldea')
            .addFields(
                { name: '📍 Coordenadas', value: `${x}|${y}`, inline: true },
                { name: '🔍 Estado', value: 'Obteniendo datos...', inline: true }
            )
            .setFooter({ text: 'GT ES95 • Sistema de Coordenadas' })
            .setTimestamp();
        
        // Crear botones
        const gameUrl = `https://es95.guerrastribales.es/game.php?village=914&screen=info_village&id=2528#${x};${y}`;
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('🌍 Ver en juego')
                    .setURL(gameUrl)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setCustomId(`analyze_${x}_${y}`)
                    .setLabel('📊 Análisis detallado')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Responder al mensaje
        await message.reply({
            embeds: [embed],
            components: [row]
        });
        
        console.log(`✅ [Coordinates] Respuesta enviada para ${x}|${y}`);
        
    } catch (error) {
        console.error('❌ [Coordinates] Error procesando coordenadas:', error);
        await message.reply('❌ Error procesando las coordenadas.');
    }
}

// Evento cuando el bot es agregado a un nuevo servidor
client.on('guildCreate', async guild => {
    console.log(`🆕 Bot agregado al servidor: ${guild.name} (${guild.id})`);
    
    if (!serverConfig.allowedGuilds.includes(guild.id)) {
        console.log(`⚠️ SERVIDOR NO AUTORIZADO: ${guild.name} (${guild.id})`);
        
        if (serverConfig.autoLeaveUnauthorized) {
            try {
                await guild.leave();
                console.log(`🚪 Saliendo automáticamente del servidor no autorizado: ${guild.name}`);
            } catch (error) {
                console.error(`❌ Error saliendo del servidor ${guild.name}:`, error);
            }
        } else {
            console.log(`🔒 Bot permanece en servidor no autorizado (autoLeaveUnauthorized = false)`);
            console.log(`💡 Para autorizar este servidor, agrega "${guild.id}" a server-config.json`);
        }
    } else {
        console.log(`✅ Servidor autorizado detectado: ${guild.name}`);
    }
});

// Manejo de errores
client.on('error', error => {
    console.error('❌ Error del cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Error no manejado:', error);
});

// Conectar el bot
client.login(process.env.DISCORD_TOKEN);