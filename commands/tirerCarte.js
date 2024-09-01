const { SlashCommandBuilder } = require('discord.js');
const { createCardEmbed } = require('../manager/embedsManager');
const { addCardToUser, getUserCardCounts, readCards } = require('../manager/cardsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tirer')
        .setDescription('Permet de tirer une nouvelle carte'),
    async execute(interaction) {
        const rates = {
            'Legendaire': 0.05,
            'Rare': 0.25,
            'Commune': 0.70
        };

        const randomValue = Math.random();

        let rarity;
        if (randomValue < rates['Legendaire']) {
            rarity = 'Legendaire';
        } else if (randomValue < rates['Legendaire'] + rates['Rare']) {
            rarity = 'Rare';
        } else {
            rarity = 'Commune';
        }

        // Filtrer uniquement les cartes encore disponibles dans cards.json
        const cards = readCards()
        const availableCards = cards.filter(card => card.rarity === rarity);
        const drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        drawnCard.date = new Date().toISOString();

        const userCardCounts = getUserCardCounts(interaction.user.id);

        const cardEmbed = createCardEmbed(drawnCard, userCardCounts, interaction);
        addCardToUser(interaction.user.id, drawnCard);

        await interaction.reply({ embeds: [cardEmbed] });
    },
};
