const { SlashCommandBuilder } = require("discord.js");
const { getUserCards, removeCardFromUser, getAllUsers, updateCardCollection, removeCardFromCollection,
    removeCardFromAllUsers, removeCardTotals
} = require("../manager/cardsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('retirercarte')
        .setDescription('Supprime une carte du jeu, retirant ainsi la carte de toutes les collections d\'utilisateurs.')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Le nom de la carte à supprimer du jeu.')
                .setRequired(true)),
    async execute(interaction) {
        const cardName = interaction.options.getString('nom').toLowerCase();

        const cardRemoved = removeCardFromCollection(cardName);

        if (!cardRemoved) {
            await interaction.reply({ content: `La carte \`${cardName}\` n'existe pas dans la collection globale.`, ephemeral: true });
            return;
        }

        removeCardFromAllUsers(cardName);
        removeCardTotals(cardRemoved)

        await interaction.reply({ content: `La carte \`${cardName}\` a été supprimée du jeu et de toutes les collections d'utilisateurs.`, ephemeral: true });
    }
};
