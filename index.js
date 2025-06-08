import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { conectarDB } from './services/database.js';
import { handleReaction } from './handlers/buttonHandler.js';

await conectarDB();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(`file://${filePath}`);
  client.commands.set(commandModule.data.name, commandModule);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const commandsArray = client.commands.map((cmd) => cmd.data.toJSON());
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commandsArray }
    );
    console.log('✅ Comandos registrados correctamente.');
  } catch (err) {
    console.error(err);
  }
})();

client.once('ready', () => {
  console.log(`🤖 Bot en línea: ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const [action, reviewId] = interaction.customId.split('_');
    if (action === 'like' || action === 'dislike') {
      return handleReaction(interaction, action, reviewId);
    }
  }
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error('Error ejecutando comando:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: '❌ Ocurrió un error al ejecutar el comando.'
      });
    } else {
      await interaction.reply({
        content: '❌ Ocurrió un error al ejecutar el comando.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
