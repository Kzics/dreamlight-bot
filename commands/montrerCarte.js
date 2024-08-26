const { SlashCommandBuilder } = require("discord.js");
const { createCardEmbed } = require("../manager/embedsManager");
const { filterUserCards, getUserCardCounts} = require("../manager/cardsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('montrer')
        .setDescription('Permet de montrer une carte que vous possédez')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Nom de la carte à montrer')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const cardName = interaction.options.getString('nom');

        const filteredCards = filterUserCards(userId, { name: cardName });

        if (filteredCards.length === 0) {
            await interaction.reply({ content: 'Vous ne possédez aucune carte avec ce nom.', ephemeral: true });
            return;
        }

        const card = filteredCards[0];
        const userCardCounts = getUserCardCounts(userId);

        const cardEmbed = createCardEmbed(card,userCardCounts, interaction);

        await interaction.reply({ embeds: [cardEmbed] });
    }
}
