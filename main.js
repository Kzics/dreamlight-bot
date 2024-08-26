require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./manager/commandHandler');
const { loadEvents } = require('./manager/eventHandler');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.cooldowns = new Map();

loadCommands(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN).then(r => console.log("Successfully connected"));
