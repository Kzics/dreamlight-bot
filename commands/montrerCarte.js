const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { createCardEmbed } = require("../manager/embedsManager");
const { getUserCards, getUserCardCounts } = require("../manager/cardsManager");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('montrer')
        .setDescription('Permet de montrer une carte que vous possédez'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const userCards = getUserCards(userId);

        if (userCards.length === 0) {
            await interaction.reply({ content: 'Vous ne possédez aucune carte.', ephemeral: true });
            return;
        }

        const userCardCounts = getUserCardCounts(userId);
        const cardsPerPage = 25; // Nombre maximum de cartes à afficher
        let currentPage = 0;

        // Fonction pour générer les options du menu déroulant
        const generateSelectMenu = (page) => {
            const startIndex = page * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, userCards.length);
            const pageCards = userCards.slice(startIndex, endIndex);

            const options = pageCards.map((card, index) => ({
                label: card.name,
                value: `${startIndex + index}`, // Utilise l'index pour identifier la carte
            }));

            return new StringSelectMenuBuilder()
                .setCustomId('select_card')
                .setPlaceholder('Sélectionnez une carte')
                .addOptions(options);
        };

        // Fonction pour générer les boutons de navigation
        const generateActionRow = (page) => {
            const row = new ActionRowBuilder();
            const totalPages = Math.ceil(userCards.length / cardsPerPage);

            if (page > 0) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous_page')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            if (page < totalPages - 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                );
            }

            return row;
        };

        // Envoyer l'embed et le menu déroulant avec les boutons
        await interaction.reply({
            embeds: [createCardEmbed(userCards[0], userCardCounts, interaction)], // Affiche la première carte par défaut
            components: [
                generateActionRow(currentPage),
                new ActionRowBuilder().addComponents(generateSelectMenu(currentPage))
            ],
            ephemeral: true
        });
    }
};
