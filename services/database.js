import mongoose from 'mongoose';
import dayjs from 'dayjs';

const { Schema, model } = mongoose;

/**
 * 1) Definimos el esquema de "Reseña"
 */
const reseñaSchema = new Schema({
  autorDiscord: {
    type: String,
    required: true
  },
  restaurante: {
    type: String,
    required: true,
    trim: true
  },
  calificacion: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5.0
  },
  comidas: {
    type: [String],          // arreglo de strings
    validate: [arrayLimit, '{PATH} excede el número máximo de 12 comidas'],
    required: true
  },
  resenaTexto: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  comuna: {
    type: String,
    required: true,
    trim: true
  },
  urlRestaurante: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: () => dayjs().toDate()
  },
  updatedAt: {
    type: Date,
    default: () => dayjs().toDate()
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Validador para que "comidas" tenga máximo 12 ítems
function arrayLimit(val) {
  return val.length <= 12;
}

// Middleware para actualizar "updatedAt" en cada save/update
reseñaSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: dayjs().toDate() });
  next();
});

reseñaSchema.pre('save', function(next) {
  this.updatedAt = dayjs().toDate();
  next();
});

export const ReseñaModel = model('Reseña', reseñaSchema);

/**
 * 2) Función para conectar a MongoDB Atlas
 */
export async function conectarDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI no está definido en .env');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  }
}

/**
 * 3) Funciones CRUD (exportadas para usar en comandos)
 */

// Crear una reseña
export async function crearReseña({
  autorDiscord,
  restaurante,
  calificacion,
  comidasArr,
  resenaTexto,
  comuna,
  urlRestaurante = ''
}) {
  const nueva = new ReseñaModel({
    autorDiscord,
    restaurante,
    calificacion,
    comidas: comidasArr,
    resenaTexto,
    comuna,
    urlRestaurante
  });
  const saved = await nueva.save();
  return saved._id.toString(); // retornamos el ObjectId como string
}

// Obtener reseña por ID (que no esté marcada como eliminada)
export async function obtenerReseñaPorId(id) {
  const doc = await ReseñaModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) return null;
  // Mongoose devuelve _id, no id; convertimos a id y borramos isDeleted
  const { _id, __v, isDeleted, ...resto } = doc;
  return { id: _id.toString(), ...resto };
}

// Editar reseña (solo campos permitidos)
export async function editarReseña(id, updates = {}) {
  // Filtrar updates para no permitir campos arbitrarios
  const camposPermitidos = [
    'restaurante',
    'calificacion',
    'comidas',
    'resenaTexto',
    'comuna',
    'urlRestaurante'
  ];
  const payload = {};
  for (const key of Object.keys(updates)) {
    if (camposPermitidos.includes(key) && updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }
  if (Object.keys(payload).length === 0) {
    return false; // nada que actualizar
  }
  const result = await ReseñaModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true }
  );
  return result != null;
}

// Borrar (lógico) la reseña
export async function borrarReseña(id) {
  const result = await ReseñaModel.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  return result != null;
}

// Listar reseñas con paginación y filtros
export async function listarReseñas({ filtro, autorDiscord, comuna, pagina = 1, limit = 10 }) {
  const query = { isDeleted: false };
  if (filtro === 'propias') {
    query.autorDiscord = autorDiscord;
  } else if (filtro === 'comuna') {
    query.comuna = comuna;
  } else if (filtro === 'todas') {
    // Sin añadir filtro extra
  } else {
    return [];
  }
  const skip = (pagina - 1) * limit;
  const docs = await ReseñaModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  // Convertir cada doc para incluir "id" en lugar de "_id"
  return docs.map(doc => {
    const { _id, __v, isDeleted, ...resto } = doc;
    return { id: _id.toString(), ...resto };
  });
}
