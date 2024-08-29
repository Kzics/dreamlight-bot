const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { getUserCards, removeCardFromUser, addCardToUser, getUserCardCounts } = require("../manager/cardsManager");
const { createCardEmbed } = require("../manager/embedsManager");


module.exports = {
    data: new SlashCommandBuilder()
        .setName('echange')
        .setDescription('Propose un échange de carte à un autre utilisateur.')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur avec qui vous voulez échanger.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('carte')
                .setDescription('La carte que vous proposez.')
                .setRequired(true)),
    async execute(interaction) {
        const sender = interaction.user;
        const recipient = interaction.options.getUser('utilisateur');
        const offeredCardName = interaction.options.getString('carte');
        const channel = interaction.channel;

        const senderCards = getUserCards(sender.id);
        const offeredCard = senderCards.find(card => card.name === offeredCardName);

        if (!offeredCard) {
            await interaction.reply({content: 'Vous ne possédez pas cette carte.', ephemeral: true});
            return;
        }

        const recipientCards = getUserCards(recipient.id);

        if (recipientCards.length === 0) {
            await interaction.reply({
                content: `${recipient.username} ne possède aucune carte à échanger.`,
                ephemeral: true
            });
            return;
        }

        const maxCardsPerPage = 25;
        let currentPage = 0;
        const totalPages = Math.ceil(recipientCards.length / maxCardsPerPage);

        const generateSelectMenu = (page) => {
            const start = page * maxCardsPerPage;
            const end = start + maxCardsPerPage;
            const options = recipientCards.slice(start, end).map((card, index) => ({
                label: card.name,
                value: `${start + index}`,
            }));

            return new StringSelectMenuBuilder()
                .setCustomId('choose_trade_card')
                .setPlaceholder('Choisissez une carte à échanger')
                .addOptions(options);
        };

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
                        .setDisabled(currentPage === totalPages - 1),
                    new ButtonBuilder()
                        .setCustomId('refuse_trade')
                        .setLabel('Refuser')
                        .setStyle(ButtonStyle.Danger)
                );
        };

        const userCardCounts = getUserCardCounts(sender.id);
        const offeredCardEmbed = createCardEmbed(offeredCard, userCardCounts, interaction);

        await interaction.reply({content: `Vous avez envoyé une demande d'échange à ${recipient}.`, ephemeral: true});

        const selectMenu = generateSelectMenu(currentPage);
        const buttons = generateButtons();

        await interaction.channel.send({
            content: recipient.toString(),
            embeds: [offeredCardEmbed],
            components: [
                new ActionRowBuilder().addComponents(selectMenu),
                buttons
            ],
        });

        interaction.client.tradeData.set(sender.id, {
            offer: offeredCard,
            recipient: recipient.id,
            receiving: undefined
        })
    }
};
