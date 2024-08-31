const fs = require('fs');
const path = require('path');

const cardsFilePath = path.join(__dirname, '../data/cards.json');
const userCollectionsFilePath = path.join(__dirname, '../data/userCollections.json');

let cardTotals = {
    Legendaire: 0,
    Rare: 0,
    Commune: 0
};

function readCards() {
    if (!fs.existsSync(cardsFilePath)) {
        return [];
    }
    const data = fs.readFileSync(cardsFilePath);
    return JSON.parse(data);
}

function writeCards(cards) {
    fs.writeFileSync(cardsFilePath, JSON.stringify(cards, null, 2));
}

function addCardToCollection(card) {
    const cards = readCards();

    if (card.rarity === 'Legendaire') {
        const cardExists = cards.some(c => c.url === card.url);
        if (cardExists) {
            throw new Error('Une carte légendaire avec cette URL existe déjà.');
        }
    }

    cards.push(card);
    writeCards(cards);
}

function removeCardFromCollection(cardName) {
    const cards = readCards();
    const updatedCards = cards.filter(card => card.name.toLowerCase() !== cardName.toLowerCase());

    if (updatedCards.length === cards.length) {
        return false; // La carte n'existait pas
    }

    writeCards(updatedCards);
    return true; // Carte supprimée
}

function loadUserCollections() {
    if (!fs.existsSync(userCollectionsFilePath)) {
        return {};
    }
    const data = fs.readFileSync(userCollectionsFilePath, 'utf8');
    return JSON.parse(data);
}

function saveUserCollections(collections) {
    fs.writeFileSync(userCollectionsFilePath, JSON.stringify(collections, null, 2));
}

function addCardToUser(userId, card) {
    const collections = loadUserCollections();

    if (!collections[userId]) {
        collections[userId] = { cards: [] };
    }

    collections[userId].cards.push({
        ...card,
        date: new Date().toISOString()
    });

    saveUserCollections(collections);
}

function getUserCards(userId) {
    const collections = loadUserCollections();
    return collections[userId]?.cards || [];
}

function isNewCard(userId, cardName) {
    const collections = loadUserCollections();
    const userCollection = collections[userId];

    if (!userCollection) return true;

    const cardsList = userCollection.cards;

    for (let card of cardsList) {
        if (card.name === cardName) {
            return false;
        }
    }

    return true;
}

function removeCardFromUser(userId, cardName) {
    const collections = loadUserCollections();

    if (!collections[userId]) {
        throw new Error(`L'utilisateur avec l'ID ${userId} n'existe pas.`);
    }

    const userCards = collections[userId].cards;
    const cardIndex = userCards.findIndex(card => card.name === cardName);

    if (cardIndex === -1) {
        throw new Error(`La carte avec le nom ${cardName} n'existe pas pour l'utilisateur ${userId}.`);
    }

    userCards.splice(cardIndex, 1);
    saveUserCollections(collections);
}

function removeCardFromAllUsers(cardName) {
    const collections = loadUserCollections();

    for (const userId in collections) {
        const userCards = collections[userId].cards;
        collections[userId].cards = userCards.filter(card => card.name.toLowerCase() !== cardName.toLowerCase());
    }

    saveUserCollections(collections);
}

function getUserCardCounts(userId) {
    const collections = loadUserCollections();
    const userCollection = collections[userId];

    if (!userCollection || !userCollection.cards) {
        return {
            Commune: 0,
            Rare: 0,
            Legendaire: 0
        };
    }

    const cardsList = userCollection.cards;
    const uniqueCards = new Set();
    const values = {
        Commune: 0,
        Rare: 0,
        Legendaire: 0
    };

    for (let card of cardsList) {
        if (!uniqueCards.has(card.name)) {
            uniqueCards.add(card.name);
            if (card.rarity === 'Commune') {
                values.Commune += 1;
            } else if (card.rarity === 'Rare') {
                values.Rare += 1;
            } else if (card.rarity === 'Legendaire') {
                values.Legendaire += 1;
            }
        }
    }

    return values;
}

function filterUserCards(userId, { name, rarity }) {
    const collections = loadUserCollections();
    const userCards = collections[userId]?.cards || [];

    return userCards.filter(card => {
        return (!name || card.name.toLowerCase().includes(name.toLowerCase())) &&
            (!rarity || card.rarity.toLowerCase() === rarity.toLowerCase());
    });
}

function loadCardTotals() {
    if (fs.existsSync(cardsFilePath)) {
        const allCards = JSON.parse(fs.readFileSync(cardsFilePath, 'utf8'));

        cardTotals = {
            Legendaire: new Set(),
            Rare: new Set(),
            Commune: new Set()
        };

        allCards.forEach(card => {
            if (cardTotals[card.rarity]) {
                cardTotals[card.rarity].add(card.name);
            }
        });

        // Convertir les ensembles en tailles
        cardTotals = {
            Legendaire: cardTotals.Legendaire.size,
            Rare: cardTotals.Rare.size,
            Commune: cardTotals.Commune.size
        };
    }
}

function getCardTotals() {
    return cardTotals;
}

function updateCardTotals(rarity) {
    if (cardTotals[rarity] !== undefined) {
        cardTotals[rarity] = cardTotals[rarity] + 1;
    }
}

module.exports = {
    addCardToCollection,
    addCardToUser,
    isNewCard,
    getUserCards,
    getUserCardCounts,
    filterUserCards,
    updateCardTotals,
    getCardTotals,
    loadCardTotals,
    removeCardFromUser,
    removeCardFromCollection,    // Nouvelle fonction
    removeCardFromAllUsers       // Nouvelle fonction
};
