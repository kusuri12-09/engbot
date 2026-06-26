const { REST, Routes } = require('discord.js');
const {
  discordToken,
  discordClientId
} = require('./config');
const { commands } = require('./commands');

async function main() {
  const rest = new REST({ version: '10' }).setToken(discordToken);
  const body = commands.map((command) => command.toJSON());

  await rest.put(Routes.applicationCommands(discordClientId), { body });
  console.log(`Registered ${body.length} global command(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
