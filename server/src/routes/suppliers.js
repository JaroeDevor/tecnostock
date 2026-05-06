const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// Solo Admin y Manager manejan proveedores
router.use(auth);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, taxId, whatsapp, email, address, leadTimeDays } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, taxId, whatsapp, email, address, leadTimeDays: Number(leadTimeDays || 7) }
    });
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, taxId, whatsapp, email, address, leadTimeDays } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, taxId, whatsapp, email, address, leadTimeDays: Number(leadTimeDays || 7) }
    });
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { active: false }
    });
    res.json({ message: 'Proveedor desactivado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
