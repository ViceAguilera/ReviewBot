// src/commands/config-set-canal.js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// Aquí definimos el Map que guardará { guildId → canalId }
const configCanales = new Map();

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configura parámetros del bot')
  .addSubcommand(sub =>
    sub
      .setName('set-canal_reseñas')
      .setDescription('Define el canal donde se publican las reseñas')
      .addChannelOption(opt =>
        opt
          .setName('canal')
          .setDescription('Canal de texto para publicar reseñas')
          .addChannelTypes(0) // GUILD_TEXT
          .setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (interaction.options.getSubcommand() !== 'set-canal_reseñas') return;

  const canal = interaction.options.getChannel('canal');
  // Guardamos en el Map
  configCanales.set(interaction.guildId, canal.id);

  await interaction.reply({
    content: `🔧 Canal para reseñas configurado correctamente a ${canal}.`,
    ephemeral: true
  });
}

// Exportamos el Map para que otros módulos lo lean
export { configCanales };
