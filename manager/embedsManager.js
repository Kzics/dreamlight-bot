const { EmbedBuilder } = require('discord.js');
const { isNewCard, getCardTotals } = require('../manager/cardsManager');
const {getUserCards} = require("./cardsManager");

function createCardEmbed(card, userCardCounts, interaction) {
    let color;

    switch (card.rarity) {
        case 'Commune':
            color = '#00FF00';
            break;
        case 'Rare':
            color = '#0000FF';
            break;
        case 'Legendaire':
            color = '#FFFF00';
            break;
        default:
            color = '#FFFFFF';
    }

    const isNew = isNewCard(interaction.user.id, card.name);
    const title =  `${card.name} ${isNew ? "- NOUVEAU" : ""}`;

    const total = getCardTotals();

    // Calculer le nombre de doublons pour cette carte spécifique
    const allUserCards = getUserCards(interaction.user.id);
    const duplicateCount = allUserCards.filter(c => c.name === card.name).length;
    const duplicateText = duplicateCount > 1 ? `**${duplicateCount} doublon(s)**` : '';
    const fields = [
        {
            name: "Commune",
            value: `${userCardCounts.Commune} ${(card.rarity === 'Commune' && isNew ? "(+1)" : "")}/${total.Commune}`,
            inline: true
        },
        {
            name: "Rare",
            value: `${userCardCounts.Rare} ${(card.rarity === 'Rare' && isNew ? "(+1)" : "")}/${total.Rare}`,
            inline: true
        },
        {
            name: "Legendaire",
            value: `${userCardCounts.Legendaire + (card.rarity === 'Legendaire' && isNew ? "(+1)" : 0)}/${total.Legendaire}`,
            inline: true
        }
    ];

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setImage(card.url)
        .addFields(
            { name: `Obtention`, value: `${toTimeStamp(card.date)}`, inline: false },
            { name: "Propriétaire", value: `${interaction.user.toString()}`, inline: false },
            ...fields
        )
        .setDescription(`${card.description || 'Pas de description disponible.'}\n${duplicateText}`)
        .setFooter({ text: `Type: ${card.rarity}` })
        .setTimestamp();
}

function toTimeStamp(date) {
    const timestamp = Math.floor(Date.parse(date) / 1000);
    return `<t:${timestamp}:F>`;
}

module.exports = { createCardEmbed };
