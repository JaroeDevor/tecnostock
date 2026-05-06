const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el usuario aún existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, active: true, companyId: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'El usuario asociado al token ya no existe.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicie sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;
