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
      const puntos = wall.points;
      let analisis = `🔎 **Análisis de puntos:**\nLa diferencia de puntos es **${diff}**.`;
      // 1. Verificar si la diferencia coincide con algún valor de wall.points (subida directa a un nivel)
      let nivelDirecto = puntos.findIndex(p => p === diff);
      if (nivelDirecto > 0) {
        analisis += `\nSubiste directamente al nivel **${nivelDirecto}** de muralla.`;
      } else {
        // 2. Buscar combinaciones de niveles consecutivos que sumen diff
        let encontrado = false;
        for (let inicio = 1; inicio < puntos.length; inicio++) {
          let suma = 0;
          for (let fin = inicio; fin < puntos.length; fin++) {
            suma += puntos[fin];
            if (suma === diff) {
              analisis += `\nSubiste del nivel **${inicio}** al **${fin}** de muralla.`;
              encontrado = true;
              break;
            }
            if (suma > diff) break;
          }
          if (encontrado) break;
        }
        if (!encontrado) {
          if (diff === 0) {
            analisis += `\nNo subiste de nivel de muralla.`;
          } else {
            analisis += `\n❌ No se encontró una combinación secuencial de niveles de muralla para esa diferencia.`;
          }
        }
      }
      embed.addFields({ name: 'Análisis de subida de muralla', value: analisis });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
