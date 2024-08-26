const {loadCardTotals, getCardTotals} = require("../manager/cardsManager")

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot is online as ${client.user.tag}!`);

        loadCardTotals()

        console.log(getCardTotals())
    }
};
