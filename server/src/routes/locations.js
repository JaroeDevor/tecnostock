const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');

const router = express.Router();

router.use(auth);
router.use(tenant);

// GET /api/locations - Obtener todos los depósitos/tiendas
router.get('/', async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { active: true, companyId: req.companyId },
      orderBy: { id: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

// POST /api/locations - Crear nuevo depósito/tienda
router.post('/', async (req, res, next) => {
  try {
    const { name, type, address } = req.body;
    
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const newLocation = await prisma.location.create({
      data: {
        name,
        type: type || 'STORE',
        address,
        companyId: req.companyId
      }
    });

    res.status(201).json(newLocation);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un local con este nombre' });
    }
    next(error);
  }
});

module.exports = router;
