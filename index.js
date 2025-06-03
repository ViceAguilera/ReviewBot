// src/index.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { conectarDB } from './services/database.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// 1) Conectar a MongoDB Atlas
await conectarDB();

// 2) Crear el cliente de Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // solo necesitamos "Guilds" para Slash Commands
});

// 3) Cargar comandos
client.commands = new Collection();
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(`file://${filePath}`);
  // Cada módulo debe exportar "data" y "execute"
  client.commands.set(commandModule.data.name, commandModule);
}

// 4) Registrar Slash Commands en el servidor de prueba
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🚀 Registrando comandos Slash en GUILD...');
    const commandsArray = client.commands.map(cmd => cmd.data.toJSON());
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandsArray });
    console.log('✅ Comandos registrados correctamente.');
  } catch (err) {
    console.error(err);
  }
})();

// 5) Evento "ready"
client.once('ready', () => {
  console.log(`🤖 Bot en línea como ${client.user.tag}`);
});

// 6) Evento "interactionCreate" para despachar comandos
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error('Error ejecutando comando:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: '❌ Ocurrió un error al ejecutar el comando.' });
    } else {
      await interaction.reply({ content: '❌ Ocurrió un error al ejecutar el comando.', ephemeral: true });
    }
  }
});

// 7) Login
client.login(TOKEN);
