const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);

// Obtener todas las categorías y sus subcategorías
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
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
      data: { name, description }
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

    const subCategory = await prisma.subCategory.create({
      data: { name, categoryId }
    });
    
    res.status(201).json(subCategory);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
