// src/commands/reseña-add.js
import { SlashCommandBuilder } from 'discord.js';
import {
  crearReseña,
  editarReseña,
  obtenerReseñaPorId
} from '../services/database.js';
import {
  buscarUrlRestaurante,
  buscarImagenRestaurante
} from '../services/duckduckgo.js';
import { buildReseñaEmbed } from '../services/embeds.js';
import { validateAddInputs } from '../utils/validation.js';
import { configCanales } from './config-set-canal.js';

export const data = new SlashCommandBuilder()
  .setName('reseña')
  .setDescription('Gestiona reseñas de restaurantes')
  .addSubcommand(sub =>
    sub
      .setName('add')
      .setDescription('Agrega una nueva reseña')
      .addStringOption(opt =>
        opt
          .setName('restaurante')
          .setDescription('Nombre del restaurante')
          .setRequired(true)
      )
      .addNumberOption(opt =>
        opt
          .setName('calificacion')
          .setDescription('Calificación (entre 0.5 y 5.0)')
          .setRequired(true)
          .setMinValue(0.5)
          .setMaxValue(5.0)
          // removimos .setStep(0.5) porque ya no existe en v14
      )
      .addStringOption(opt =>
        opt
          .setName('comidas')
          .setDescription('Lista de hasta 12 comidas/bebidas, separadas por comas')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('reseña')
          .setDescription('Descripción de la experiencia')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('comuna')
          .setDescription('Comuna donde se ubica el restaurante')
          .setRequired(true)
      )
  );

export async function execute(interaction, client) {
  if (interaction.options.getSubcommand() !== 'add') return;

  const restaurante = interaction.options.getString('restaurante');
  const calificacion = interaction.options.getNumber('calificacion');
  const comidasRaw = interaction.options.getString('comidas');
  const resenaTexto = interaction.options.getString('reseña');
  const comuna = interaction.options.getString('comuna');
  const autorDiscordId = interaction.user.id;
  const authorTag = interaction.user.tag;
  const avatarURL = interaction.user.displayAvatarURL({ extension: 'png', size: 512 });

  // Validación extra: la calificación debe ser múltiplo de 0.5
  if (Math.round(calificacion * 100) % 50 !== 0) {
    return interaction.reply({
      content:
        '❌ La calificación debe ser un número múltiplo de 0.5 (ej: 0.5, 1.0, 1.5, …, 5.0).',
      ephemeral: true
    });
  }

  // Validar resto de inputs (resenaTexto, comidasRaw, etc.)
  const { isValid, error, comidasArr } = validateAddInputs({
    restaurante,
    calificacion,
    comidasRaw,
    resenaTexto,
    comuna
  });
  if (!isValid) {
    return interaction.reply({ content: `❌ ${error}`, ephemeral: true });
  }

  // Defer reply para darnos tiempo de scraping + BD
  await interaction.deferReply({ flags: 64 });

  // Crear reseña en BD con urlRestaurante = ""
  let nuevoId;
  try {
    nuevoId = await crearReseña({
      autorDiscord: autorDiscordId,
      restaurante,
      calificacion,
      comidasArr,
      resenaTexto,
      comuna,
      urlRestaurante: ''
    });
  } catch (err) {
    console.error('Error creando reseña en BD:', err);
    return interaction.editReply({ content: '❌ Error al guardar la reseña en la base de datos.' });
  }

  // Intentar buscar URL del restaurante con DuckDuckGo
  const query = `${restaurante} ${comuna}`;
  let urlEncontrada = '';
  try {
    urlEncontrada = await buscarUrlRestaurante(query);
    if (urlEncontrada) {
      await editarReseña(nuevoId, { urlRestaurante: urlEncontrada });
    }
  } catch (err) {
    console.error('Error buscando URL o editando reseña:', err);
    urlEncontrada = '';
  }

  // Obtener el objeto completo de la reseña (ahora con URL si se encontró)
  const reseñaObj = await obtenerReseñaPorId(nuevoId);
  if (!reseñaObj) {
    return interaction.editReply({ content: '❌ No se encontró la reseña recién creada.' });
  }

  // Buscar imagen del restaurante (og:image) si hay URL
  let imagenUrl = '';
  if (reseñaObj.urlRestaurante) {
    try {
      imagenUrl = await buscarImagenRestaurante(reseñaObj.urlRestaurante);
    } catch (err) {
      console.error('Error buscando imagen del restaurante:', err);
      imagenUrl = '';
    }
  }

  // Construir embed, pasando authorTag, avatarURL e imagenUrl
  const embed = buildReseñaEmbed(reseñaObj, authorTag, avatarURL, imagenUrl);

  // Enviar embed al canal configurado
  const canalId = configCanales.get(interaction.guildId);
  if (!canalId) {
    return interaction.editReply({
      content:
        '❌ No se ha configurado un canal para publicar las reseñas. Usa `/config set-canal_reseñas canal:#tu-canal`.'
    });
  }

  try {
    const canal = await client.channels.fetch(canalId);
    await canal.send({ embeds: [embed] });
  } catch (err) {
    console.error('Error enviando embed al canal de reseñas:', err);
    // No detenemos la respuesta al usuario (ya guardamos en BD)
  }

  // Finalmente, respondemos al usuario en privado
  if (urlEncontrada) {
    return interaction.editReply({
      content: `✅ Tu reseña fue creada con éxito. Se encontró URL automáticamente: <${urlEncontrada}>.\nID de reseña: ${nuevoId}`
    });
  } else {
    return interaction.editReply({
      content: `✅ Tu reseña fue creada con éxito. No se encontró URL automáticamente.\nID de reseña: ${nuevoId}\nPuedes agregar la URL más tarde con \`/reseña editar id:${nuevoId} url:<link>\`.`
    });
  }
}
