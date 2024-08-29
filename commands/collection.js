const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createCardEmbed } = require("../manager/embedsManager");
const { filterUserCards, getUserCardCounts } = require("../manager/cardsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('Permet de montrer les cartes que vous possédez selon le filtrage')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Nom de la carte à rechercher'))
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription('Rareté de la carte (Commune, Rare, Légendaire)')),
    async execute(interaction) {
        const userId = interaction.user.id;
        const name = interaction.options.getString('nom');
        const rarity = interaction.options.getString('rarity');

        const filteredCards = filterUserCards(userId, { name, rarity });

        if (filteredCards.length === 0) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Aucune carte trouvée')
                        .setDescription('Aucune carte ne correspond à vos critères de recherche.')
                        .setTimestamp()
                        .setFooter({ text: 'Essayez avec d\'autres critères.' })
                ],
                ephemeral: true
            });
            return;
        }

        let currentIndex = 0;

        const userCardCounts = getUserCardCounts(userId);

        const generateCardEmbed = (index) => {
            const card = filteredCards[index];
            const cardEmbed = createCardEmbed(card, userCardCounts, interaction);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(index === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(index === filteredCards.length - 1)
                );

            return {
                embeds: [cardEmbed],
                components: [row]
            };
        };

        const message = await interaction.reply({ ...generateCardEmbed(currentIndex), ephemeral: false });

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                currentIndex = Math.max(currentIndex - 1, 0);
            } else if (i.customId === 'next') {
                currentIndex = Math.min(currentIndex + 1, filteredCards.length - 1);
            }

            await i.update(generateCardEmbed(currentIndex));
        });

        collector.on('end', () => {
            if (message) {
                message.edit({ components: [] });
            }
        });
    },
};
