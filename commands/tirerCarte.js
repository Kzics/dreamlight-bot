const { SlashCommandBuilder } = require('discord.js');
const { createCardEmbed } = require('../manager/embedsManager');
const cards = require('../data/cards.json');
const { addCardToUser, getUserCardCounts } = require('../manager/cardsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tirer')
        .setDescription('Permet de tirer une nouvelle carte'),
    async execute(interaction) {
        const rates = {
            'Legendaire': 0.33,
            'Rare': 0.33,
            'Commune': 0.33
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

        const availableCards = cards.filter(card => card.rarity === rarity);
        const drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        drawnCard.date = new Date().toISOString();


        const userCardCounts = getUserCardCounts(interaction.user.id);

        const cardEmbed = createCardEmbed(drawnCard, userCardCounts, interaction);
        addCardToUser(interaction.user.id, drawnCard);


        await interaction.reply({ embeds: [cardEmbed] });
    },
};
