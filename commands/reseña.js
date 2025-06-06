import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  crearReseña,
  editarReseña,
  borrarReseña,
  obtenerReseñaPorId,
  listarReseñas
} from '../services/database.js';
import {
  buscarUrlRestaurante,
  buscarImagenRestaurante
} from '../services/duckduckgo.js';
import { buildReseñaEmbed } from '../services/embeds.js';
import { validateAddInputs, validateEditInputs } from '../utils/validation.js';
import { configCanales } from './config-set-canal.js';

export const data = new SlashCommandBuilder()
  // — (Aquí va exactamente la definición que mostramos arriba) —
  .setName('reseña')
  .setDescription('Gestiona reseñas de restaurantes')
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Agrega una nueva reseña')
      .addStringOption((opt) =>
        opt.setName('restaurante')
          .setDescription('Nombre del restaurante')
          .setRequired(true)
      )
      .addNumberOption((opt) =>
        opt.setName('calificacion')
          .setDescription('Calificación (entre 0.5 y 5.0)')
          .setRequired(true)
          .setMinValue(0.5)
          .setMaxValue(5.0)
      )
      .addStringOption((opt) =>
        opt.setName('comidas')
          .setDescription('Lista de hasta 12 comidas/bebidas, separadas por comas')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('reseña')
          .setDescription('Descripción de la experiencia')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('comuna')
          .setDescription('Comuna donde se ubica el restaurante')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('ver')
      .setDescription('Muestra el detalle de una reseña por ID')
      .addStringOption((opt) =>
        opt.setName('id')
          .setDescription('ID de la reseña (Mongo ObjectId)')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('listar')
      .setDescription('Lista reseñas con filtros y paginación')
      .addStringOption((opt) =>
        opt.setName('filtro')
          .setDescription('Filtrar reseñas: propias, comuna o todas')
          .setRequired(true)
          .addChoices(
            { name: 'propias', value: 'propias' },
            { name: 'comuna',  value: 'comuna'  },
            { name: 'todas',   value: 'todas'   }
          )
      )
      .addStringOption((opt) =>
        opt.setName('comuna')
          .setDescription('Comuna (solo si filtro=comuna)')
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('pagina')
          .setDescription('Número de página (por defecto 1)')
          .setMinValue(1)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('editar')
      .setDescription('Edita los campos de una reseña existente')
      .addStringOption((opt) =>
        opt.setName('id')
          .setDescription('ID de la reseña a editar')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('restaurante')
          .setDescription('Nuevo nombre del restaurante')
          .setRequired(false)
      )
      .addNumberOption((opt) =>
        opt.setName('calificacion')
          .setDescription('Nueva calificación (entre 0.5 y 5.0)')
          .setRequired(false)
          .setMinValue(0.5)
          .setMaxValue(5.0)
      )
      .addStringOption((opt) =>
        opt.setName('comidas')
          .setDescription('Nueva lista de comidas (separadas por comas)')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt.setName('reseña')
          .setDescription('Nuevo texto de la reseña')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt.setName('comuna')
          .setDescription('Nueva comuna')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt.setName('url')
          .setDescription('Nueva URL del restaurante')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('eliminar')
      .setDescription('Elimina (borrado lógico) una reseña por ID')
      .addStringOption((opt) =>
        opt.setName('id')
          .setDescription('ID de la reseña a eliminar')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('help')
      .setDescription('Muestra ayuda sobre todos los subcomandos de /reseña')
  );

export async function execute(interaction, client) {
  const sub = interaction.options.getSubcommand();
  const autorDiscordId = interaction.user.id;
  const authorTag = interaction.user.tag;
  const avatarURL = interaction.user.displayAvatarURL({ extension: 'png', size: 512 });

  switch (sub) {
    // ===========================
    // SUBCOMANDO “add” → Crear nueva reseña
    // ===========================
    case 'add': {
      const restaurante = interaction.options.getString('restaurante');
      const calificacion = interaction.options.getNumber('calificacion');
      const comidasRaw = interaction.options.getString('comidas');
      const resenaTexto = interaction.options.getString('reseña');
      const comuna = interaction.options.getString('comuna');

      // Validación extra: calificación múltiplo de 0.5
      if (Math.round(calificacion * 100) % 50 !== 0) {
        return interaction.reply({
          content:
            '❌ La calificación debe ser un número múltiplo de 0.5 (ej: 0.5, 1.0, 1.5, …, 5.0).',
          ephemeral: true
        });
      }

      // Validar resto de inputs
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

      await interaction.deferReply({ flags: 64 });

      // 1) Crear en BD sin URL
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
        return interaction.editReply({
          content: '❌ Error al guardar la reseña en la base de datos.'
        });
      }

      // 2) Intentar scrapear URL
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

      // 3) Obtener reseña completa (con URL si hay)
      const reseñaObj = await obtenerReseñaPorId(nuevoId);
      if (!reseñaObj) {
        return interaction.editReply({
          content: '❌ No se encontró la reseña recién creada.'
        });
      }

      // 4) Scrappear la imagen si hay URL
      let imagenUrl = '';
      if (reseñaObj.urlRestaurante) {
        try {
          imagenUrl = await buscarImagenRestaurante(reseñaObj.urlRestaurante);
        } catch (err) {
          console.error('Error buscando imagen del restaurante:', err);
          imagenUrl = '';
        }
      }

      // 5) Construir embed
      const embedAdd = buildReseñaEmbed(reseñaObj, authorTag, avatarURL, imagenUrl);

      // 6) Publicar en canal configurado
      const canalId = configCanales.get(interaction.guildId);
      if (canalId) {
        try {
          const canal = await client.channels.fetch(canalId);
          await canal.send({ embeds: [embedAdd] });
        } catch (err) {
          console.error('Error enviando embed al canal de reseñas:', err);
        }
      } else {
        // Avisamos que no hay canal configurado
        await interaction.editReply({
          content:
            '❌ No se ha configurado un canal para publicar las reseñas. Usa `/config set-canal_reseñas canal:#tu-canal`.'
        });
        return;
      }

      // 7) Responder al usuario en privado
      if (urlEncontrada) {
        return interaction.editReply({
          content: `✅ Tu reseña fue creada con éxito. Se encontró URL automáticamente: <${urlEncontrada}>.\nID de reseña: ${nuevoId}`
        });
      } else {
        return interaction.editReply({
          content: `✅ Tu reseña fue creada con éxito. No se encontró URL automáticamente.\nID de reseña: ${nuevoId}\nPuedes agregar la URL luego con \`/reseña editar id:${nuevoId} url:<link>\`.`
        });
      }
    }

    // ===========================
    // SUBCOMANDO “ver” → Mostrar una sola reseña
    // ===========================
    case 'ver': {
      const id = interaction.options.getString('id');
      await interaction.deferReply({ flags: 64 });

      // Buscar en BD
      const reseñaObj = await obtenerReseñaPorId(id);
      if (!reseñaObj) {
        return interaction.editReply({ content: '❌ No se encontró ninguna reseña con ese ID.' });
      }

      // Intentar extraer imagen (ya debería estar en reseñaObj.urlRestaurante)
      let imagenUrl = '';
      if (reseñaObj.urlRestaurante) {
        try {
          imagenUrl = await buscarImagenRestaurante(reseñaObj.urlRestaurante);
        } catch {
          imagenUrl = '';
        }
      }

      // Construir embed (usamos “Unknown#0000” si surge error obteniendo tag)
      let authorTagFromDb = 'Usuario desconocido';
      try {
        const user = await client.users.fetch(reseñaObj.autorDiscord);
        authorTagFromDb = user.tag;
      } catch {
        authorTagFromDb = `ID:${reseñaObj.autorDiscord}`;
      }

      const avatarURLFromDb = authorTagFromDb.includes('#')
        ? (await client.users.fetch(reseñaObj.autorDiscord)).displayAvatarURL({ extension: 'png', size: 128 })
        : '';

      const embedVer = buildReseñaEmbed(reseñaObj, authorTagFromDb, avatarURLFromDb, imagenUrl);
      return interaction.editReply({ embeds: [embedVer] });
    }

    // ===========================
    // SUBCOMANDO “listar” → Paginación y filtros
    // ===========================
    case 'listar': {
      const filtro = interaction.options.getString('filtro'); // 'propias' | 'comuna' | 'todas'
      const pagina = interaction.options.getInteger('pagina') || 1;
      const comunaFiltro = interaction.options.getString('comuna') || '';

      if (filtro === 'comuna' && comunaFiltro.trim().length === 0) {
        return interaction.reply({
          content: '❌ Para el filtro “comuna” debes especificar una comuna válida.',
          ephemeral: true
        });
      }

      await interaction.deferReply({ flags: 64 });

      // Llamamos a listarReseñas de database.js
      let resultados;
      if (filtro === 'propias') {
        resultados = await listarReseñas({
          filtro: 'propias',
          autorDiscord: autorDiscordId,
          comuna: '',
          pagina,
          limit: 10
        });
      } else if (filtro === 'comuna') {
        resultados = await listarReseñas({
          filtro: 'comuna',
          autorDiscord: '',
          comuna: comunaFiltro,
          pagina,
          limit: 10
        });
      } else {
        // 'todas'
        resultados = await listarReseñas({
          filtro: 'todas',
          autorDiscord: '',
          comuna: '',
          pagina,
          limit: 10
        });
      }

      if (!resultados.length) {
        return interaction.editReply({
          content: `❌ No hay reseñas que mostrar para esos criterios (filtro: ${filtro}).`,
        });
      }

      // Construir un embed con la lista (hasta 10 filas)
      const embedList = new EmbedBuilder()
        .setColor('#FF9900')
        .setTitle('📑 Listado de reseñas')
        .setDescription(`Filtro: **${filtro}**` +
          (filtro === 'comuna' ? ` • Comuna: **${comunaFiltro}**` : '') +
          `\nPágina: **${pagina}**`);

      // Por cada resultado, agregamos un field pequeño
      // Mostramos: Restaurante (ID), Calificación, Autor (mención) y Fecha
      for (const r of resultados) {
        const date = new Date(r.createdAt).toLocaleString('es-CL', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        embedList.addFields({
          name: `${r.restaurante}  (ID: ${r.id})`,
          value: `⭐️ ${r.calificacion}/5  •  Comuna: ${r.comuna}\nAutor: <@${r.autorDiscord}> • ${date}`
        });
      }

      return interaction.editReply({ embeds: [embedList] });
    }

    // ===========================
    // SUBCOMANDO “editar” → Editar campos
    // ===========================
    case 'editar': {
      const id = interaction.options.getString('id');
      const nuevasOpciones = {
        restaurante: interaction.options.getString('restaurante') || undefined,
        calificacion: interaction.options.getNumber('calificacion') || undefined,
        comidasArr: undefined,
        resenaTexto: interaction.options.getString('reseña') || undefined,
        comuna: interaction.options.getString('comuna') || undefined,
        urlRestaurante: interaction.options.getString('url') || undefined
      };

      const comidasRawEdit = interaction.options.getString('comidas');
      if (comidasRawEdit !== null) {
        // parseamos y validamos (hasta 12 items)
        const arr = comidasRawEdit
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (!arr.length) {
          return interaction.reply({
            content: '❌ Si indicas “comidas” en editar, debes poner al menos un plato o bebida.',
            ephemeral: true
          });
        }
        if (arr.length > 12) {
          return interaction.reply({
            content: '❌ Solo puedes listar hasta 12 platos o bebidas.',
            ephemeral: true
          });
        }
        nuevasOpciones.comidasArr = arr;
      }

      // Validar inputs con validateEditInputs
      const { isValid: editOk, error: editError } = validateEditInputs({
        id,
        calificacion: nuevasOpciones.calificacion,
        comidasRaw: comidasRawEdit,
        resenaTexto: nuevasOpciones.resenaTexto,
        url: nuevasOpciones.urlRestaurante
      });
      if (!editOk) {
        return interaction.reply({ content: `❌ ${editError}`, ephemeral: true });
      }

      await interaction.deferReply({ flags: 64 });

      // Llamar a editarReseña
      const fueEditado = await editarReseña(id, nuevasOpciones);
      if (!fueEditado) {
        return interaction.editReply({ content: '❌ No se pudo editar la reseña (quizá no existe o ya fue eliminada).' });
      }

      // Obtener la reseña actualizada
      const reseñaAct = await obtenerReseñaPorId(id);
      if (!reseñaAct) {
        return interaction.editReply({ content: '❌ Error obteniendo los datos actualizados.' });
      }

      // Volver a scrapear la imagen si cambió la URL
      let imagenUrlEdit = '';
      if (nuevasOpciones.urlRestaurante) {
        try {
          imagenUrlEdit = await buscarImagenRestaurante(nuevasOpciones.urlRestaurante);
        } catch {
          imagenUrlEdit = '';
        }
      }

      // Obtener authorTag y avatar (similar a “ver”)
      let authorTagFromDb = 'Usuario desconocido';
      let avatarURLFromDb = '';
      try {
        const user = await client.users.fetch(reseñaAct.autorDiscord);
        authorTagFromDb = user.tag;
        avatarURLFromDb = user.displayAvatarURL({ extension: 'png', size: 128 });
      } catch {
        // dejamos “desconocido”
      }

      // Construir un nuevo embed y enviarlo ephemeral
      const embedEdit = buildReseñaEmbed(reseñaAct, authorTagFromDb, avatarURLFromDb, imagenUrlEdit);
      return interaction.editReply({ embeds: [embedEdit] });
    }

    // ===========================
    // SUBCOMANDO “eliminar” → Borrado lógico
    // ===========================
    case 'eliminar': {
      const id = interaction.options.getString('id');
      await interaction.deferReply({ flags: 64 });

      const fueBorrado = await borrarReseña(id);
      if (!fueBorrado) {
        return interaction.editReply({ content: '❌ No se pudo eliminar la reseña (quizá no existe o ya fue borrada).' });
      }

      return interaction.editReply({ content: `🗑️ La reseña con ID \`${id}\` ha sido eliminada correctamente.` });
    }

    // ===========================
    // SUBCOMANDO “help” → Mostrar uso
    // ===========================
    case 'help': {
      const textoHelp = `
**/reseña help** — Muestra esta ayuda.

**/reseña add**  
> **restaurante** (string, obligatorio)  
> **calificacion** (number: 0.5–5.0, obligatorio)  
> **comidas** (string, obligatorio: “plato1, plato2, …”)  
> **reseña** (string, obligatorio)  
> **comuna** (string, obligatorio)  

**/reseña ver**  
> **id** (string, obligatorio) — Ver detalle completo de una reseña.

**/reseña listar**  
> **filtro** (propias | comuna | todas) (obligatorio)  
> **comuna** (string, opcional si filtro=comuna)  
> **pagina** (integer ≥1, opcional)  

**/reseña editar**  
> **id** (string, obligatorio) — ID de la reseña.  
> **restaurante** (string, opcional)  
> **calificacion** (number: 0.5–5.0, opcional)  
> **comidas** (string: “plato1, plato2, …”, opcional)  
> **reseña** (string, opcional)  
> **comuna** (string, opcional)  
> **url** (string: http://… | https://…, opcional)  

**/reseña eliminar**  
> **id** (string, obligatorio) — ID de la reseña a eliminar.  
      `;
      return interaction.reply({ content: textoHelp, ephemeral: true });
    }

    // ===========================
    // POR DEFECTO (no debería ocurrir)
    // ===========================
    default:
      return interaction.reply({
        content: '❌ Subcomando no reconocido. Usa `/reseña help` para ver la lista de comandos.',
        ephemeral: true
      });
  }
}
