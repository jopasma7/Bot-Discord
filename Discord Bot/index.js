const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Cargar configuración de servidores permitidos
const serverConfig = JSON.parse(fs.readFileSync('server-config.json', 'utf8'));

// Importar sistemas automáticos
const KillsNotificationScheduler = require('./utils/killsNotificationScheduler');

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

// Manejar comandos slash
client.on('interactionCreate', async interaction => {
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

// Manejar mensajes normales (comandos con prefijo)
client.on('messageCreate', async message => {
    // Ignorar bots y mensajes sin prefijo
    if (message.author.bot) return;
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