const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiempos')
        .setDescription('Calcula la distancia y tiempos de viaje entre dos pueblos')
        .addStringOption(option =>
            option.setName('origen')
                .setDescription('Coordenadas del pueblo de origen (formato: X|Y)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('destino')
                .setDescription('Coordenadas del pueblo de destino (formato: X|Y)')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const origen = interaction.options.getString('origen');
            const destino = interaction.options.getString('destino');

            // Parsear coordenadas
            const coordsOrigen = parseCoordinates(origen);
            const coordsDestino = parseCoordinates(destino);

            if (!coordsOrigen || !coordsDestino) {
                return await interaction.editReply({
                    content: '❌ Formato de coordenadas inválido. Usa el formato: `X|Y` (ejemplo: `500|500`)',
                    ephemeral: true
                });
            }

            // Obtener información de los pueblos
            const gtData = new GTDataManager();
            const villageOrigen = await gtData.getVillageByCoordinates(coordsOrigen.x, coordsOrigen.y);
            const villageDestino = await gtData.getVillageByCoordinates(coordsDestino.x, coordsDestino.y);

            // Calcular distancia
            const distance = calculateDistance(coordsOrigen, coordsDestino);

            // Configuración del mundo ES95 (velocidad 1, modificador 1)
            const worldSpeed = 1;
            const unitSpeedModifier = 1;

            // Velocidades base de las unidades (minutos por campo)
            const unitSpeeds = {
                'Lancero': 18,
                'Espada': 22,
                'Soldado con Hacha': 18,
                'Espía': 9,
                'Caballería Ligera': 10,
                'Caballería Pesada': 11,
                'Catapulta / Ariete': 30,
                'Noble': 35
            };

            // Calcular tiempos de viaje
            const travelTimes = {};
            for (const [unit, baseSpeed] of Object.entries(unitSpeeds)) {
                const minutes = (baseSpeed * distance) / (worldSpeed * unitSpeedModifier);
                travelTimes[unit] = formatTime(minutes);
            }

            // Formatear información de pueblos
            const formatVillageInfo = (village, coords) => {
                if (!village) {
                    return `❓ Desconocido > Pueblo desconocido (${coords.x}|${coords.y})`;
                }
                
                const villageName = village.name || 'Pueblo sin nombre';
                
                // Verificar si es pueblo bárbaro (playerId === 0)
                const isBarbarian = village.playerId === 0;
                const playerName = isBarbarian ? 'Bárbaro' : (village.playerName || 'Jugador desconocido');
                
                // Solo mostrar tribu si existe y no está vacía y no es bárbaro
                if (!isBarbarian && village.tribeName && village.tribeName.trim() !== '') {
                    return `[${village.tribeName}] ${playerName} > ${villageName} (${coords.x}|${coords.y})`;
                } else {
                    return `${playerName} > ${villageName} (${coords.x}|${coords.y})`;
                }
            };

            const origenInfo = formatVillageInfo(villageOrigen, coordsOrigen);
            const destinoInfo = formatVillageInfo(villageDestino, coordsDestino);

            // Crear embed con la información
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('⏱️ Calculadora de Distancias y Tiempos')
                .setDescription(`Cálculo de viaje entre pueblos`)
                .addFields(
                    { name: '📍 Origen', value: origenInfo, inline: true },
                    { name: '📍 Destino', value: destinoInfo, inline: true },
                    { name: '📏 Distancia', value: `\`${distance.toFixed(2)}\` campos`, inline: false },
                    { name: '\u200B', value: '**⚔️ Tiempos de viaje por unidad:**', inline: false }
                );

            // Agregar tiempos de viaje en dos columnas
            const units = Object.keys(travelTimes);
            const halfLength = Math.ceil(units.length / 2);
            const firstColumn = units.slice(0, halfLength);
            const secondColumn = units.slice(halfLength);

            let firstColumnText = '';
            let secondColumnText = '';

            firstColumn.forEach(unit => {
                const emoji = getUnitEmoji(unit);
                firstColumnText += `${emoji} **${unit}**: \`${travelTimes[unit]}\`\n`;
            });

            secondColumn.forEach(unit => {
                const emoji = getUnitEmoji(unit);
                secondColumnText += `${emoji} **${unit}**: \`${travelTimes[unit]}\`\n`;
            });

            embed.addFields(
                { name: '\u200B', value: firstColumnText, inline: true },
                { name: '\u200B', value: secondColumnText, inline: true }
            );

            embed.setFooter({ text: 'ES95 • Velocidad del mundo: 1x • Modificador de unidades: 1x' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando /tiempos:', error);
            await interaction.editReply({
                content: '❌ Ocurrió un error al calcular los tiempos de viaje.',
                ephemeral: true
            });
        }
    }
};

/**
 * Parsea las coordenadas en formato X|Y
 */
function parseCoordinates(coordString) {
    const regex = /^(\d+)\|(\d+)$/;
    const match = coordString.trim().match(regex);
    
    if (!match) return null;
    
    return {
        x: parseInt(match[1]),
        y: parseInt(match[2])
    };
}

/**
 * Calcula la distancia euclidiana entre dos coordenadas
 */
function calculateDistance(coord1, coord2) {
    const dx = coord2.x - coord1.x;
    const dy = coord2.y - coord1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Formatea el tiempo en minutos a formato legible (días, horas, minutos, segundos)
 */
function formatTime(minutes) {
    const totalSeconds = Math.round(minutes * 60);
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    let result = '';
    
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (mins > 0) result += `${mins}m `;
    if (secs > 0 || result === '') result += `${secs}s`;
    
    return result.trim();
}

/**
 * Obtiene el emoji correspondiente a cada unidad
 */
function getUnitEmoji(unit) {
    const emojis = {
        'Lancero': '🗡️',
        'Espada': '⚔️',
        'Soldado con Hacha': '🪓',
        'Espía': '🔍',
        'Caballería Ligera': '🐎',
        'Caballería Pesada': '🏇',
        'Catapulta / Ariete': '💥',
        'Noble': '👑'
    };
    
    return emojis[unit] || '⚔️';
}
