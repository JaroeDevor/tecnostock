const prisma = require('../lib/prisma');

/**
 * Valida que un registro pertenezca al companyId del request.
 * Lanza un error si no pertenece o no existe.
 * 
 * @param {string} model - Nombre del modelo Prisma (ej: 'product', 'location', 'customer', 'supplier')
 * @param {number} id - ID del registro a validar
 * @param {number} companyId - companyId del tenant actual
 * @param {string} [label] - Nombre legible para el mensaje de error (ej: 'Producto')
 */
async function validateOwnership(model, id, companyId, label) {
  const record = await prisma[model].findUnique({ where: { id: Number(id) } });
  
  if (!record || record.companyId !== companyId) {
    const err = new Error(`${label || model} no encontrado o no pertenece a tu empresa`);
    err.statusCode = 404;
    throw err;
  }
  
  return record;
}

module.exports = { validateOwnership };
