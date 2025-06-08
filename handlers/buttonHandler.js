import { ReseñaModel } from '../services/database.js';
import { buildReseñaEmbed } from '../services/embeds.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

export async function handleReaction(interaction, action, reviewId) {
  const userId = interaction.user.id;
  const review = await ReseñaModel.findById(reviewId);
  if (!review) {
    return interaction.reply({ content: '❌ Reseña no encontrada.', ephemeral: true });
  }

  const addTo  = action === 'like' ? 'likedBy'    : 'dislikedBy';
  const removeFrom = action === 'like' ? 'dislikedBy' : 'likedBy';
  review[removeFrom] = review[removeFrom].filter((u) => u !== userId);
  if (review[addTo].includes(userId)) {
    review[addTo] = review[addTo].filter((u) => u !== userId);
  } else {
    review[addTo].push(userId);
  }

  await review.save();

  // Reconstruir embed + fila de botones con los contadores actualizados
  const embed = buildReseñaEmbed(review, /*authorTag*/ '…', /*avatar*/ '', /*imagenUrl*/ '');
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`like_${review.id}`)
      .setEmoji('👍')
      .setLabel(`${review.likedBy.length}`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`dislike_${review.id}`)
      .setEmoji('👎')
      .setLabel(`${review.dislikedBy.length}`)
      .setStyle(ButtonStyle.Secondary),
    // enlace al menú si existe
    ...(review.menuLink
      ? [
          new ButtonBuilder()
            .setLabel('📖 Ver Menú')
            .setURL(review.menuLink)
            .setStyle(ButtonStyle.Link)
        ]
      : [])
  );

  await interaction.message.edit({ embeds: [embed], components: [row] });
  return interaction.reply({ content: '✅ Tu reacción fue registrada.', ephemeral: true });
}
