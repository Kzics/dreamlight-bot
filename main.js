require('dotenv').config();
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { loadCommands } = require('./manager/commandsManager');
const { loadEvents } = require('./manager/eventsManager');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection()
client.cooldowns = new Map()
client.tradeData = new Map()

const rest = new REST({ version: '10' }).setToken("MTI3NzM1NTY2NjI3MjQxOTg3MA.GId5-3.u5lVzySy0VSNLEcilhY_GxWfcWo8zUQECNsP0w");

(async () => {
    await loadCommands(client);
    await loadEvents(client);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands("1277355666272419870"),
            { body: Array.from(client.commands.map(m => m.data).values()) }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error reloading application (/) commands:', error);
    }
})();





client.login("MTI3NzM1NTY2NjI3MjQxOTg3MA.GId5-3.u5lVzySy0VSNLEcilhY_GxWfcWo8zUQECNsP0w").then(r => console.log("Successfully connected"));
