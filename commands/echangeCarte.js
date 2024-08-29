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

        if (interaction.client.tradeData.has(sender.id)) {
            const ongoingTradeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Échange en cours')
                .setDescription('Vous avez déjà une demande d\'échange en cours. Veuillez attendre la fin de l\'échange actuel avant de proposer un nouvel échange.')
                .setFooter({ text: 'Gestion des échanges' })
                .setTimestamp();

            await interaction.reply({ embeds: [ongoingTradeEmbed], ephemeral: true });
            return;
        }

        const recipientTrade = [...interaction.client.tradeData.values()].find(trade => trade.recipient === recipient.id);
        if (recipientTrade) {
            const recipientOngoingTradeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Échange en cours pour le destinataire')
                .setDescription(`${recipient.username} a déjà une demande d'échange en cours. Veuillez attendre que cet échange soit terminé ou choisir un autre utilisateur.`)
                .setFooter({ text: 'Gestion des échanges' })
                .setTimestamp();

            await interaction.reply({ embeds: [recipientOngoingTradeEmbed], ephemeral: true });
            return;
        }

        if (recipient.id === sender.id) {
            const selfTradeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Erreur d\'échange')
                .setDescription('Vous ne pouvez pas faire un échange avec vous-même.')
                .setFooter({ text: 'Veuillez sélectionner un autre utilisateur pour l\'échange.' })
                .setTimestamp();

            await interaction.reply({ embeds: [selfTradeEmbed], ephemeral: true });
            return;
        }

        const senderCards = getUserCards(sender.id);
        const offeredCard = senderCards.find(card => card.name === offeredCardName);

        if (!offeredCard) {
            const noCardEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Carte non trouvée')
                .setDescription('Vous ne possédez pas cette carte.')
                .setFooter({ text: 'Veuillez vérifier votre collection.' })
                .setTimestamp();

            await interaction.reply({ embeds: [noCardEmbed], ephemeral: true });
            return;
        }

        const recipientCards = getUserCards(recipient.id);

        if (recipientCards.length === 0) {
            const noRecipientCardsEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Aucune carte disponible')
                .setDescription(`${recipient.username} ne possède aucune carte à échanger.`)
                .setFooter({ text: 'Impossible de procéder à l\'échange.' })
                .setTimestamp();

            await interaction.reply({ embeds: [noRecipientCardsEmbed], ephemeral: true });
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

        const tradeRequestEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Demande d\'échange envoyée')
            .setDescription(`Vous avez envoyé une demande d'échange à ${recipient.username}.`)
            .setFooter({ text: 'En attente de la réponse.' })
            .setTimestamp();

        await interaction.reply({ embeds: [tradeRequestEmbed], ephemeral: true });

        const selectMenu = generateSelectMenu(currentPage);
        const buttons = generateButtons();

        await interaction.channel.send({
            content: `${recipient}`,
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
        });
    }
};
