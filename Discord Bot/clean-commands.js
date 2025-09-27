// Script para borrar todos los comandos slash antiguos de un servidor de Discord
// Úsalo antes de registrar los nuevos comandos para evitar duplicados

const { REST, Routes } = require('discord.js');
require('dotenv').config();

const GUILD_ID = '1412768836955930668'; // Cambia por tu ID de servidor si es necesario

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🧹 Borrando todos los comandos slash antiguos del servidor...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: [] },
    );
    console.log('✅ Comandos antiguos eliminados. Ahora puedes registrar los nuevos sin duplicados.');
  } catch (error) {
    console.error('❌ Error al borrar comandos antiguos:', error);
  }
})();
