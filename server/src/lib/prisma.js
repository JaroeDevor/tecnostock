const { PrismaClient } = require('@prisma/client');

// Instancia única de PrismaClient compartida por toda la aplicación.
// Evita crear múltiples conexiones a la base de datos.
const prisma = new PrismaClient();

module.exports = prisma;
