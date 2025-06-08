import { EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';

function buildStarString(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return '⭐️'.repeat(fullStars) + (halfStar ? '✨' : '') + '☆'.repeat(emptyStars);
}

/**
 * Construye un embed donde:
 * - El thumbnail es la imagen del restaurante (og:image).
 * - El autor del embed (setAuthor) muestra al usuario con su avatar.
 * - El footer muestra “Enviado por username#1234 • ID: …”.
 *
 * @param {Object} reseña      — Objeto de BD con { id, restaurante, calificacion, comidas, resenaTexto, comuna, urlRestaurante, createdAt }
 * @param {string} authorTag   — “username#discriminator” del autor
 * @param {string} avatarURL   — URL del avatar del autor (para setAuthor)
 * @param {string} imagenUrl   — URL de la imagen principal del restaurante (og:image)
 */
export function buildReseñaEmbed(reseña, authorTag, avatarURL, imagenUrl) {
  const {
    id,
    restaurante,
    calificacion,
    comidas,
    resenaTexto,
    comuna,
    urlRestaurante,
    createdAt
  } = reseña;

  const estrellas = buildStarString(calificacion);
  const comidasTexto = comidas.map(item => `• ${item}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor('#FF9900')
    // Ponemos al autor en la cabecera, con su avatar (solo si es una URL válida):
    .setAuthor({ 
      name: `Reseña hecha por ${authorTag}`,  
      iconURL: avatarURL && avatarURL.startsWith('http') ? avatarURL : undefined 
    })
    .setTitle(`🍽️ Reseña: ${restaurante}`)
    .setDescription(
      resenaTexto.length > 1024
        ? resenaTexto.slice(0, 1020) + '…'
        : resenaTexto
    )
    .addFields(
      { name: 'Calificación', value: `${estrellas} (${calificacion}/5)`, inline: true },
      { name: 'Comuna',      value: comuna,                       inline: true },
      { name: 'Comidas',     value: comidasTexto || '–',          inline: false }
    )
    .setFooter({ text: `ID: ${id} • ${dayjs(createdAt).format('DD/MM/YYYY [a las] HH:mm')}` });

  // Si existe URL válida, hacemos el título clicable
  if (urlRestaurante && (urlRestaurante.startsWith('http://') || urlRestaurante.startsWith('https://'))) {
    embed.setURL(urlRestaurante);
  }

  // Ahora ponemos la imagen del restaurante como thumbnail (pequeña) o como imagen grande
  if (imagenUrl && (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://'))) {
    embed.setThumbnail(imagenUrl);
  }

  return embed;
}
