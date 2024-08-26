const {EmbedBuilder} = require("discord.js");
const {addCardToCollection, updateCardTotals, getUserCardCounts} = require("../manager/cardsManager")
const {createCardEmbed} = require("../manager/embedsManager")

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if(interaction.isCommand()) {

            const {commandName, options} = interaction;
            const client = interaction.client;

            const command = client.commands.get(commandName)

            if (!command) return;

            command.execute(interaction)
        }else if(interaction.isModalSubmit()){
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

                addCardToCollection(newCard)
                const userCardCounts = getUserCardCounts(interaction.user.id);

                const embedPreview = createCardEmbed(newCard, userCardCounts, interaction )

                updateCardTotals(newCard.rarity)

                await interaction.reply({content: "Apercu de la carte créee", embeds: [embedPreview], ephemeral: true})
            } else {
                await interaction.reply({ content: 'Modal inconnu.', ephemeral: true });
            }
        }
    }
}
