const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
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
        const generateButtons = () => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous_page')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === Math.ceil(userCards.length / cardsPerPage) - 1)
                );
        };

        // Envoyer l'embed et le menu déroulant avec les boutons
        const message = await interaction.reply({
            embeds: [createCardEmbed(userCards[0], userCardCounts, interaction)], // Affiche la première carte par défaut
            components: [
                new ActionRowBuilder().addComponents(generateSelectMenu(currentPage)),
                generateButtons()
            ],
            ephemeral: true,
            fetchReply: true // Récupérer l'objet message pour suppression ultérieure
        });

        // Gestion de l'interaction du menu déroulant
        const filter = i => i.customId === 'select_card' && i.user.id === userId;
        const collector = message.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const selectedCardIndex = parseInt(i.values[0], 10);
            const selectedCard = userCards[selectedCardIndex];
            const selectedCardEmbed = createCardEmbed(selectedCard, userCardCounts, interaction);

            await i.reply({
                embeds: [selectedCardEmbed],
                components: [], // Optionnel : supprime le menu déroulant après sélection
            });

            // Supprimer le message d'origine
            //await message.delete();
        });

    }
};
