const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('muralla')
    .setDescription('Muestra los puntos que otorga cada nivel de muralla o analiza el cambio de puntos')
    .addIntegerOption(option =>
      option.setName('antes')
        .setDescription('Puntos antes del cambio (opcional)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('despues')
        .setDescription('Puntos después del cambio (opcional)')
        .setRequired(false)
    ),
  async execute(interaction) {
    // Leer archivo de puntos de edificios
    const filePath = path.join(__dirname, '../data/building-points/building-points.json');
    let buildingData;
    try {
      buildingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      await interaction.reply({ content: '❌ No se pudo leer la información de la muralla.', ephemeral: true });
      return;
    }
    const wall = buildingData.buildings.wall;
    if (!wall) {
      await interaction.reply({ content: '❌ No se encontró la información de la muralla.', ephemeral: true });
      return;
    }
    // Construir la lista de niveles
    const puntosPorNivel = wall.points.slice(1); // El primer valor es 0, ignorar
    let lista = puntosPorNivel.map((pts, i) => `🧱 **Nivel ${i+1}** ➡️ ${pts} puntos`).join('\n');

    // Descripción detallada
    const descripcion =
      'La muralla es un edificio defensivo fundamental en tu aldea. Cada nivel incrementa significativamente la defensa contra ataques enemigos.\n\n' +
      'A continuación se muestra la cantidad de puntos que otorga cada nivel de muralla:';

    const embed = new EmbedBuilder()
      .setColor('#8B4513')
      .setTitle('🏰 Muralla — Puntos por Nivel')
      .setDescription(`${descripcion}\n\n${lista}`)
      .setFooter({ text: 'GT ES95 • Sistema de Edificios' });

    // Subcomando: análisis de diferencia de puntos
    const antes = interaction.options.getInteger('antes');
    const despues = interaction.options.getInteger('despues');
    if (antes !== null && despues !== null) {
      const diff = despues - antes;
      // Calcular los niveles subidos
      const incr = wall.incrementalPoints.slice(1); // El primer valor es 0, ignorar
      let suma = 0;
      let niveles = [];
      for (let i = 0; i < incr.length; i++) {
        suma = 0;
        let tempNiveles = [];
        for (let j = i; j < incr.length; j++) {
          suma += incr[j];
          tempNiveles.push(j+1);
          if (suma === diff) {
            niveles = tempNiveles.slice();
            break;
          }
          if (suma > diff) break;
        }
        if (niveles.length > 0) break;
      }
      let analisis = '';
      if (niveles.length > 0) {
        analisis = `🔎 **Análisis de puntos:**\nLa diferencia de puntos es **${diff}**.\nSe subieron los niveles de muralla: ${niveles.map(n => `Nivel ${n}`).join(', ')}.`;
      } else {
        analisis = `🔎 **Análisis de puntos:**\nLa diferencia de puntos es **${diff}**.\nNo se encontró una combinación exacta de niveles de muralla para esa diferencia.`;
      }
      embed.addFields({ name: 'Análisis de subida de muralla', value: analisis });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
