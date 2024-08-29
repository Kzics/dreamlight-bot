const { ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const { getUserCards, getUserCardCounts, removeCardFromUser, addCardToUser, addCardToCollection, updateCardTotals} = require("../manager/cardsManager");
const { createCardEmbed } = require("../manager/embedsManager");


module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.isCommand()) {
            const { commandName } = interaction;
            const client = interaction.client;
            const command = client.commands.get(commandName);

            if (!command) return;

            await command.execute(interaction);
        } else if (interaction.isModalSubmit()) {
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
                    content: "Aperçu de la carte créée",
                    embeds: [embedPreview],
                    ephemeral: true // Visible uniquement par l'utilisateur
                });
            } else {
                await interaction.reply({
                    content: 'Modal inconnu.',
                    ephemeral: true
                });
            }
        } else if (interaction.isStringSelectMenu()) {
            const userId = interaction.user.id;
            const userCards = getUserCards(userId);
            const userCardCounts = getUserCardCounts(userId);
            if(!(interaction.customId === "choose_trade_card")) {
                return
            }

            const selectedCardIndex = parseInt(interaction.values[0], 10);
            const selectedCard = userCards[selectedCardIndex];
            if(!updateTradeByRecipient(interaction.client.tradeData, userId, selectedCard)){
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor('#FF0000').setTitle("Ce n'est pas votre échange !")],
                    ephemeral: true
                })
                return
            }


            if (selectedCard) {
                const selectedCardEmbed = createCardEmbed(selectedCard, userCardCounts, interaction);

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
                })


                console.log(interaction.client.tradeData)
            } else {
                await interaction.update({
                    content: 'Carte invalide sélectionnée.',
                    components: [],
                    ephemeral: false
                });
            }
        } else if (interaction.isButton()) {
            if(interaction.customId === "next" || interaction.customId === "previous") return
            const tradeInfo = interaction.client.tradeData.get(interaction.user.id);
            console.log(tradeInfo)


            //TODO AUCUNE DEMANDE

            if (!tradeInfo) {
                await interaction.reply({
                    content: 'Aucune demande de trade trouvée.',
                    ephemeral: true
                });
                return;
            }

            const senderId = interaction.user.id;
            const recipientId = tradeInfo.recipient;

            if (interaction.customId === 'accept_trade') {
                removeCardFromUser(senderId, tradeInfo.offer.name);
                removeCardFromUser(recipientId, tradeInfo.receiving.name);

                addCardToUser(senderId, tradeInfo.receiving);
                addCardToUser(recipientId, tradeInfo.offer);

                await interaction.update({
                    content: 'Échange accepté ! Les cartes ont été échangées.',
                    components: [],
                    ephemeral: true
                });

                await interaction.channel.send({
                    content: `L'échange entre <@${senderId}> et <@${recipientId}> a été accepté et les cartes ont été échangées.`
                });

            } else if (interaction.customId === 'refuse_trade') {
                await interaction.update({
                    content: 'Vous avez refusé l\'échange.',
                    components: [],
                    ephemeral: true
                });
                await interaction.channel.send({
                    content: `L'échange entre <@${senderId}> et <@${recipientId}> a été refusé.`
                });
            }

            interaction.client.tradeData.delete(senderId);
        }
    }
};
function updateTradeByRecipient(tradeData, targetId, receivingCard) {
    for (let [initiatorId, trade] of tradeData.entries()) {
        if (trade.recipient === targetId) {
            tradeData.set(initiatorId, { offer: trade.offer, recipient: trade.recipient, receiving: receivingCard });
            console.log(`Trade modifié pour initiatorId: ${initiatorId}`);
            return true
        }
    }
    return false
}
