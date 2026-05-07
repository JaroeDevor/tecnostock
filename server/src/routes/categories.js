const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(tenant);

// Obtener todas las categorías y sus subcategorías
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { companyId: req.companyId },
      include: { subCategories: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Crear categoría (Solo Admin y Manager)
router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.create({
      data: { name, description, companyId: req.companyId }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Crear subcategoría dentro de una categoría
router.post('/:id/subcategories', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name } = req.body;
    const categoryId = Number(req.params.id);

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.companyId !== req.companyId) return res.status(404).json({ error: 'Categoría no encontrada' });

    const subCategory = await prisma.subCategory.create({
      data: { name, categoryId }
    });
    
    res.status(201).json(subCategory);
  } catch (error) {
    next(error);
  }
});

// Eliminar categoría (Solo Admin y Manager)
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id },
      include: { subCategories: { include: { _count: { select: { products: true } } } } }
    });

    if (!category || category.companyId !== req.companyId) return res.status(404).json({ error: 'Categoría no encontrada' });

    // Verificar si tiene productos asociados
    const hasProducts = category.subCategories.some(sub => sub._count.products > 0);
    if (hasProducts) return res.status(400).json({ error: 'No se puede eliminar una categoría que contiene productos' });

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
