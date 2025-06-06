/**
 * Valida los inputs de /reseña add
 * - restaurante: string
 * - calificacion: number
 * - comidasRaw: string (separadas por comas)
 * - resenaTexto: string
 * - comuna: string
 *
 * Retorna { isValid, error, comidasArr }
 */
export function validateAddInputs({ restaurante, calificacion, comidasRaw, resenaTexto, comuna }) {
    // 1) Reseña: mínimo 20 caracteres, máximo 2000
    if (resenaTexto.length < 20) {
      return { isValid: false, error: 'La reseña debe tener al menos 20 caracteres.' };
    }
    if (resenaTexto.length > 2000) {
      return { isValid: false, error: 'La reseña no puede exceder 2000 caracteres.' };
    }
  
    // 2) Calificación: permitimos decimales en pasos de 0.5
    const validSteps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
    if (!validSteps.includes(calificacion)) {
      return { isValid: false, error: 'La calificación debe ser un valor múltiplo de 0.5 entre 0.5 y 5.0.' };
    }
  
    // 3) Comidas: parsear y máximo 12 ítems
    const comidasArr = comidasRaw
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  
    if (comidasArr.length === 0) {
      return { isValid: false, error: 'Debes indicar al menos un plato o bebida en el campo “comidas”.' };
    }
    if (comidasArr.length > 12) {
      return { isValid: false, error: 'Solo puedes listar hasta 12 platos o bebidas.' };
    }
  
    // 4) Restaurante y comuna: no deben quedar vacíos
    if (!restaurante.trim()) {
      return { isValid: false, error: 'El nombre del restaurante no puede estar vacío.' };
    }
    if (!comuna.trim()) {
      return { isValid: false, error: 'La comuna no puede estar vacía.' };
    }
  
    return { isValid: true, error: null, comidasArr };
  }
  
  /**
   * Valida inputs de /reseña editar
   * - id: string (Mongo ObjectId)
   * - calificacion (opcional): número en pasos de 0.5
   * - comidasRaw (opcional): lista texto
   * - url (opcional): string que empiece con http:// o https://
   */
  export function validateEditInputs({ id, calificacion, comidasRaw, resenaTexto, url }) {
    // 1) ID: debería tener formato de ObjectId (24 caracteres hexadecimales)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return { isValid: false, error: 'El ID proporcionado no tiene un formato válido.' };
    }
  
    // 2) Si hay calificación, validar pasos de 0.5
    if (calificacion !== undefined) {
      const validSteps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
      if (!validSteps.includes(calificacion)) {
        return { isValid: false, error: 'La calificación debe ser múltiplo de 0.5 entre 0.5 y 5.0.' };
      }
    }
  
    // 3) Si hay comidasRaw, parsear y validar longitud
    let comidasArr;
    if (comidasRaw !== undefined) {
      comidasArr = comidasRaw
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      if (comidasArr.length === 0) {
        return { isValid: false, error: 'Si indicas “comidas” en editar, debes poner al menos un plato o bebida.' };
      }
      if (comidasArr.length > 12) {
        return { isValid: false, error: 'Solo puedes listar hasta 12 platos o bebidas.' };
      }
    }
  
    // 4) Si hay resenaTexto, validar longitud
    if (resenaTexto !== undefined) {
      if (resenaTexto.length < 20) {
        return { isValid: false, error: 'La reseña debe tener al menos 20 caracteres.' };
      }
      if (resenaTexto.length > 2000) {
        return { isValid: false, error: 'La reseña no puede exceder 2000 caracteres.' };
      }
    }
  
    // 5) Si hay URL, validar formato básico
    if (url !== undefined) {
      if (!/^https?:\/\/.+/.test(url)) {
        return { isValid: false, error: 'La URL debe comenzar con http:// o https://.' };
      }
    }
  
    return { isValid: true, error: null, comidasArr };
  }
  