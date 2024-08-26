const { readdirSync } = require('fs');

function loadCommands(client) {
    const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        console.log(`Loaded command : ${command.data.name}`)
        client.commands.set(command.data.name, command);
    }
}

module.exports = { loadCommands };
