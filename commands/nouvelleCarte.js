const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('creer')
        .setDescription('Permet de créer une nouvelle carte'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('createCard')
            .setTitle("Création d'une nouvelle carte");

        const cardUrlInput = new TextInputBuilder()
            .setCustomId('cardUrl')
            .setLabel("URL de l'image")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const rarityInput = new TextInputBuilder()
            .setCustomId('cardRarity')
            .setLabel("Rareté de la carte")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('cardName')
            .setLabel("Nom de la carte")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('cardDescription')
            .setLabel("Description de la carte")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(cardUrlInput);
        const secondActionRow = new ActionRowBuilder().addComponents(rarityInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(nameInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        await interaction.showModal(modal);
    },
};
