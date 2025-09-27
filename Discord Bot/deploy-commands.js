const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

// Cargar comandos
for (const file of commandFiles) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`⚠️ El comando en ${filePath} no tiene "data" o "execute"`);
    }
}

// Crear instancia REST
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Registrar comandos
(async () => {
    try {
        console.log(`🔄 Registrando ${commands.length} comandos slash...`);

        // Registrar comandos SOLO en el servidor especificado para que aparezcan al instante
        const GUILD_ID = '1412768836955930668';
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`✅ ${data.length} comandos registrados correctamente en el servidor ${GUILD_ID}!`);
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
})();