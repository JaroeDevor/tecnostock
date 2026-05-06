const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(tenant);

// Obtener clientes
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { companyId: req.companyId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// Crear cliente
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const customer = await prisma.customer.create({
      data: { name, phone, email, address, notes, companyId: req.companyId }
    });
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// Editar cliente
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    const existing = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing || existing.companyId !== req.companyId) return res.status(404).json({ error: 'Cliente no encontrado' });

    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { name, phone, email, address, notes }
    });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// Borrar cliente
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing || existing.companyId !== req.companyId) return res.status(404).json({ error: 'Cliente no encontrado' });

    await prisma.customer.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
