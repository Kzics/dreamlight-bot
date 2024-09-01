const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { createCardEmbed } = require('../manager/embedsManager');
const { addCardToUser, getUserCardCounts, readCards } = require('../manager/cardsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tirer')
        .setDescription('Permet de tirer une nouvelle carte'),
    async execute(interaction) {
        const cooldowns = interaction.client.cooldowns
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 24 * 60 * 60 * 1000;

        // Vérifier si l'utilisateur a un cooldown actif
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = expirationTime - now;

                // Conversion du temps restant en heures, minutes, secondes
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                const cooldownEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏳ Cooldown actif')
                    .setDescription(`Vous avez déjà tiré une carte récemment. Vous pouvez tirer une nouvelle carte dans **${hours}h ${minutes}m ${seconds}s**.`)
                    .setFooter({ text: 'Veuillez patienter avant de tirer à nouveau.' });

                return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
            }
        }

        // Mettre à jour le cooldown de l'utilisateur
        cooldowns.set(userId, now);

        // Logique du tirage de carte
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

        const cards = readCards();
        const availableCards = cards.filter(card => card.rarity === rarity);
        const drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        drawnCard.date = new Date().toISOString();

        const userCardCounts = getUserCardCounts(userId);

        const cardEmbed = createCardEmbed(drawnCard, userCardCounts, interaction);
        addCardToUser(userId, drawnCard);

        await interaction.reply({ embeds: [cardEmbed] });
    },
};
