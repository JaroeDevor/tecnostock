/**
 * Role-based access control middleware
 * Usage: authorize('ADMIN', 'MANAGER')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'No tienes los permisos necesarios para realizar esta acción.' 
      });
    }

    next();
  };
};

module.exports = authorize;
