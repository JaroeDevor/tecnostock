const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.companyId) {
    return res.status(403).json({ error: 'Acceso denegado. El usuario no tiene una empresa asignada.' });
  }

  // Inyectar el companyId en la request para uso rápido en las rutas
  req.companyId = req.user.companyId;
  next();
};

module.exports = tenantMiddleware;
