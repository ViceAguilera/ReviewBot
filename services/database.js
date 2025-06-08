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
    type: [String],
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
  },
  menuLink: {
    type: String,
    default: ''
  },
  likedBy: {
    type: [String],
    default: []
  },
  dislikedBy: {
    type: [String],
    default: []
  },
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
  urlRestaurante = '',
  menuLink = ''
}) {
  const nueva = new ReseñaModel({
    autorDiscord,
    restaurante,
    calificacion,
    comidas: comidasArr,
    resenaTexto,
    comuna,
    urlRestaurante,
    menuLink
  });
  const saved = await nueva.save();
  return saved._id.toString();
}

// Obtener reseña por ID (que no esté marcada como eliminada)
export async function obtenerReseñaPorId(id) {
  const doc = await ReseñaModel.findOne({ _id: id, isDeleted: false }).lean();
  if (!doc) return null;
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
    'urlRestaurante',
    'menuLink'
  ];
  const payload = {};
  for (const key of Object.keys(updates)) {
    if (camposPermitidos.includes(key) && updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }
  if (Object.keys(payload).length === 0) {
    return false;
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
  } else {
    return [];
  }
  const skip = (pagina - 1) * limit;
  const docs = await ReseñaModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return docs.map(doc => {
    const { _id, __v, isDeleted, ...resto } = doc;
    return { id: _id.toString(), ...resto };
  });
}
