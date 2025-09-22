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
        
        await interaction.reply({
            content: `📊 **Análisis detallado de ${x}|${y}**\n\n🚧 **En desarrollo** - Esta función estará disponible pronto.\n\nIncluirá:\n• 📈 Historial de actividad\n• 🏗️ Edificios y niveles\n• ⚔️ Actividad militar\n• 📊 Estadísticas del jugador`,
            ephemeral: true
        });
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