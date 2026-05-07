const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos (valor duplicado)',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado'
    });
  }

  // En producción, nunca exponer detalles internos al cliente
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: isProduction ? 'Error interno del servidor' : (err.message || 'Error interno del servidor')
  });
};

module.exports = errorHandler;
