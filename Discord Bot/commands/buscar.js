const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GTDataManager = require('../utils/gtData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buscar')
        .setDescription('Buscar jugadores, tribus o aldeas en el Mundo 95')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo de búsqueda')
                .setRequired(true)
                .addChoices(
                    { name: '👤 Jugador', value: 'jugador' },
                    { name: '⚔️ Tribu', value: 'tribu' },
                    { name: '🏘️ Aldea', value: 'aldea' }
                ))
        .addStringOption(option =>
            option.setName('busqueda')
                .setDescription('Término a buscar (nombre, tag, coordenadas)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('limite')
                .setDescription('Máximo de resultados (por defecto 5)')
                .setMinValue(1)
                .setMaxValue(15)),
    
    async execute(interaction) {
        const tipo = interaction.options.getString('tipo');
        const busqueda = interaction.options.getString('busqueda');
        const limite = interaction.options.getInteger('limite') || 5;
        
        await interaction.deferReply();
        
        try {
            const gtData = new GTDataManager();
            let embed;

            switch (tipo) {
                case 'jugador':
                    embed = await this.searchPlayers(gtData, busqueda, limite);
                    break;
                case 'tribu':
                    embed = await this.searchTribes(gtData, busqueda, limite);
                    break;
                case 'aldea':
                    embed = await this.searchVillages(gtData, busqueda, limite);
                    break;
                default:
                    throw new Error('Tipo de búsqueda no válido');
            }

            await interaction.editReply({
                content: '',
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('Error en búsqueda:', error);
            await interaction.editReply({
                content: '❌ Error al realizar la búsqueda. Verifica el término e inténtalo de nuevo.',
                embeds: []
            });
        }
    },

    async searchPlayers(gtData, searchTerm, limite) {
        const players = await gtData.getPlayers();
        const normalizedSearch = searchTerm.toLowerCase();
        
        const matches = players.filter(player => 
            player.name.toLowerCase().includes(normalizedSearch)
        ).slice(0, limite);

        if (matches.length === 0) {
            return new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🔍 Búsqueda de Jugadores')
                .setDescription(`❌ No se encontraron jugadores que contengan "${searchTerm}"`)
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
        }

        const results = matches.map((player, index) => {
            const tribe = player.tribeId ? `(Tribu: ID ${player.tribeId})` : '(Sin tribu)';
            return `${index + 1}. **${player.name}**\n   📊 ${player.points.toLocaleString()} pts • 🏆 #${player.rank} • 🏘️ ${player.villages} aldeas\n   ${tribe}`;
        }).join('\n\n');

        return new EmbedBuilder()
            .setColor(0x4ECDC4)
            .setTitle(`👤 Jugadores encontrados: "${searchTerm}"`)
            .setDescription(results)
            .addFields({
                name: '📋 Resultados',
                value: `Mostrando ${matches.length} de ${players.filter(p => p.name.toLowerCase().includes(normalizedSearch)).length} coincidencias`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    },

    async searchTribes(gtData, searchTerm, limite) {
        const tribes = await gtData.getTribes();
        const normalizedSearch = searchTerm.toLowerCase();
        
        const matches = tribes.filter(tribe => 
            tribe.name.toLowerCase().includes(normalizedSearch) ||
            tribe.tag.toLowerCase().includes(normalizedSearch)
        ).slice(0, limite);

        if (matches.length === 0) {
            return new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🔍 Búsqueda de Tribus')
                .setDescription(`❌ No se encontraron tribus que contengan "${searchTerm}"`)
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
        }

        const results = matches.map((tribe, index) => {
            return `${index + 1}. **[${tribe.tag}] ${tribe.name}**\n   📊 ${tribe.points.toLocaleString()} pts • 🏆 #${tribe.rank} • 👥 ${tribe.members} miembros • 🏘️ ${tribe.villages} aldeas`;
        }).join('\n\n');

        return new EmbedBuilder()
            .setColor(0xE17055)
            .setTitle(`⚔️ Tribus encontradas: "${searchTerm}"`)
            .setDescription(results)
            .addFields({
                name: '📋 Resultados',
                value: `Mostrando ${matches.length} de ${tribes.filter(t => t.name.toLowerCase().includes(normalizedSearch) || t.tag.toLowerCase().includes(normalizedSearch)).length} coincidencias`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    },

    async searchVillages(gtData, searchTerm, limite) {
        const villages = await gtData.getVillages();
        const players = await gtData.getPlayers();
        
        let matches = [];
        
        // Buscar por nombre de aldea
        if (isNaN(searchTerm)) {
            const normalizedSearch = searchTerm.toLowerCase();
            matches = villages.filter(village => 
                village.name.toLowerCase().includes(normalizedSearch)
            );
        } 
        // Buscar por coordenadas (formato: x|y o x,y o x y)
        else if (searchTerm.includes('|') || searchTerm.includes(',') || searchTerm.includes(' ')) {
            const coords = searchTerm.replace(/[|,]/g, ' ').split(/\s+/).map(c => parseInt(c.trim()));
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const [targetX, targetY] = coords;
                matches = villages.filter(village => 
                    Math.abs(village.x - targetX) <= 2 && Math.abs(village.y - targetY) <= 2
                );
            }
        }
        
        matches = matches.slice(0, limite);

        if (matches.length === 0) {
            return new EmbedBuilder()
                .setColor(0xFF6B6B)
                .setTitle('🔍 Búsqueda de Aldeas')
                .setDescription(`❌ No se encontraron aldeas que coincidan con "${searchTerm}"\n\n💡 **Formatos de búsqueda:**\n• Por nombre: \`Aldea Central\`\n• Por coordenadas: \`500|500\` o \`500,500\``)
                .setTimestamp()
                .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
        }

        const results = await Promise.all(matches.map(async (village, index) => {
            const owner = players.find(p => p.id === village.playerId);
            const ownerName = owner ? owner.name : 'Jugador desconocido';
            return `${index + 1}. **${village.name}** (${village.x}|${village.y})\n   📊 ${village.points.toLocaleString()} pts • 👤 ${ownerName}`;
        }));

        return new EmbedBuilder()
            .setColor(0x6C5CE7)
            .setTitle(`🏘️ Aldeas encontradas: "${searchTerm}"`)
            .setDescription(results.join('\n\n'))
            .addFields({
                name: '📋 Resultados',
                value: `Mostrando ${matches.length} aldeas`,
                inline: true
            })
            .setTimestamp()
            .setFooter({ text: 'Guerras Tribales ES95 • Bot por Raba' });
    }
};