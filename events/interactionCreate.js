const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    userMention
} = require("discord.js");
const {
    getUserCards,
    getUserCardCounts,
    removeCardFromUser,
    addCardToUser,
    addCardToCollection,
    updateCardTotals
} = require("../manager/cardsManager");
const { createCardEmbed } = require("../manager/embedsManager");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isCommand()) {
                const { commandName } = interaction;
                const client = interaction.client;
                const command = client.commands.get(commandName);

                if (!command) return;

                await command.execute(interaction);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction);
            } else if (interaction.isButton()) {
                if (interaction.customId === "next" || interaction.customId === "previous") return;
                await handleButtonInteraction(interaction);
            }
        } catch (error) {
            console.error('Error during interaction:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Une erreur est survenue')
                        .setDescription('Veuillez réessayer plus tard.')
                        .setTimestamp()
                        .setFooter({ text: 'Merci de votre patience.' })
                ],
                ephemeral: true
            });
        }
    }
};

async function handleModalSubmit(interaction) {
    try {
        const customId = interaction.customId;

        if (customId === 'createCard') {
            const cardUrl = interaction.fields.getTextInputValue('cardUrl');
            const cardRarity = interaction.fields.getTextInputValue('cardRarity');
            const cardName = interaction.fields.getTextInputValue('cardName');
            const cardDescription = interaction.fields.getTextInputValue('cardDescription');

            const newCard = {
                url: cardUrl,
                rarity: cardRarity,
                description: cardDescription,
                name: cardName
            };

            addCardToCollection(newCard);
            const userCardCounts = getUserCardCounts(interaction.user.id);

            const embedPreview = createCardEmbed(newCard, userCardCounts, interaction);

            updateCardTotals(newCard.rarity);

            await interaction.reply({
                embeds: [embedPreview],
                content: "Aperçu de la carte créée",
                ephemeral: true
            });
        } else {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Modal inconnu')
                        .setDescription('Le modal soumis n\'est pas reconnu.')
                        .setTimestamp()
                        .setFooter({ text: 'Veuillez vérifier et réessayer.' })
                ],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error in handleModalSubmit:', error);
        throw error;
    }
}

async function handleSelectMenu(interaction) {
    try {
        const userId = interaction.user.id;
        const userCards = getUserCards(userId);
        const userCardCounts = getUserCardCounts(userId);

        if (!(interaction.customId === "choose_trade_card")) return;

        const selectedCardIndex = parseInt(interaction.values[0], 10);
        const selectedCard = userCards[selectedCardIndex];

        if (!updateTradeByRecipient(interaction.client.tradeData, userId, selectedCard)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle("Ce n'est pas votre échange !")
                        .setDescription('Vous ne pouvez pas interagir avec cet échange.')
                        .setTimestamp()
                        .setFooter({ text: 'Veuillez vérifier l\'échange et réessayer.' })
                ],
                ephemeral: true
            });
            return;
        }

        if (selectedCard) {
            const selectedCardEmbed = createCardEmbed(selectedCard, userCardCounts, interaction);

            await interaction.message.delete();

            await interaction.channel.send({
                embeds: [selectedCardEmbed],
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('accept_trade')
                            .setLabel('Accepter')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('refuse_trade')
                            .setLabel('Refuser')
                            .setStyle(ButtonStyle.Danger)
                    )
                ]
            });
        } else {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Carte invalide sélectionnée')
                        .setDescription('La carte que vous avez sélectionnée est invalide.')
                        .setTimestamp()
                        .setFooter({ text: 'Veuillez choisir une carte valide.' })
                ],
                components: [],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error in handleSelectMenu:', error);
        throw error;
    }
}

async function handleButtonInteraction(interaction) {
    try {
        // Vérification si l'utilisateur est bien le destinataire de l'échange
        const tradeInfo = interaction.client.tradeData.get(interaction.user.id) || Array.from(interaction.client.tradeData.values()).find(trade => trade.recipient === interaction.user.id);

        if (!tradeInfo) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Aucune demande de trade trouvée')
                        .setDescription('Aucune demande de trade active n\'a été trouvée pour vous.')
                        .setTimestamp()
                        .setFooter({ text: 'Veuillez initier un échange avant de continuer.' })
                ],
                ephemeral: true
            });
            return;
        }

        // Vérifier que seul le destinataire peut interagir avec les boutons
        if (interaction.user.id !== tradeInfo.recipient) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle("Accès refusé")
                        .setDescription('Vous ne pouvez pas interagir avec cet échange.')
                        .setTimestamp()
                        .setFooter({ text: 'Seul le destinataire peut interagir avec cet échange.' })
                ],
                ephemeral: true
            });
            return;
        }

        const senderId = tradeInfo.recipient;
        const recipientId = tradeInfo.recipient;

        if (interaction.customId === 'accept_trade') {
            removeCardFromUser(senderId, tradeInfo.offer.name);
            removeCardFromUser(recipientId, tradeInfo.receiving.name);

            addCardToUser(senderId, tradeInfo.receiving);
            addCardToUser(recipientId, tradeInfo.offer);

            const embed = new EmbedBuilder()
                .setColor("#008000")
                .setTitle("Échange - Succès")
                .addFields(
                    { name: `${tradeInfo.offer.name} (${tradeInfo.offer.rarity})`, value: interaction.user.toString(), inline: true },
                    { name: `${tradeInfo.receiving.name} (${tradeInfo.receiving.rarity})`, value: userMention(recipientId), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Échange réussi.' });

            await interaction.message.delete();
            await interaction.channel.send({ embeds: [embed] });

        } else if (interaction.customId === 'refuse_trade') {
            await interaction.message.delete()

            await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Échange refusé')
                        .setDescription(`L'échange entre ${userMention(senderId)} et ${userMention(recipientId)} a été refusé.`)
                        .setTimestamp()
                        .setFooter({ text: 'Échange annulé.' })
                ]
            });
        }

        interaction.client.tradeData.delete(senderId);
    } catch (error) {
        console.error('Error in handleButtonInteraction:', error);
        throw error;
    }
}

function updateTradeByRecipient(tradeData, targetId, receivingCard) {
    try {
        for (let [initiatorId, trade] of tradeData.entries()) {
            if (trade.recipient === targetId) {
                tradeData.set(initiatorId, { offer: trade.offer, recipient: trade.recipient, receiving: receivingCard });
                console.log(`Trade modifié pour initiatorId: ${initiatorId}`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error in updateTradeByRecipient:', error);
        throw error;
    }
}
