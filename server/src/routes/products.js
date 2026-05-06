const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const authorize = require('../middleware/roles');

const router = express.Router();

// Todas las rutas de productos requieren autenticación
router.use(auth);
router.use(tenant);

// GET /api/products - Obtener todos los productos (con filtros y paginación)
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    
    // Filtros de búsqueda
    const where = {
      active: true,
      companyId: req.companyId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { ean: { contains: search } }
        ]
      }),
      ...(category && { subCategoryId: Number(category) })
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        subCategory: { include: { category: true } },
        productLocation: true,
        stockByLocation: { include: { location: true } }
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { name: 'asc' }
    });

    const total = await prisma.product.count({ where });

    // Filtrar la información confidencial (costo) si el usuario es Vendedor
    const result = products.map(product => {
      if (req.user.role === 'SELLER') {
        const { costUsd, ...safeProduct } = product;
        return safeProduct;
      }
      return product;
    });

    res.json({ data: result, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Crear un nuevo producto (Solo Admin y Manager)
router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, sku, ean, costUsd, salePrice, minStock, subCategoryId, locationId, currentStock } = req.body;

    // 1. Crear el producto
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        ean,
        costUsd: Number(costUsd),
        salePrice: Number(salePrice),
        minStock: Number(minStock),
        subCategoryId: Number(subCategoryId)
      }
    });

    // 2. Si hay stock inicial y locationId, lo asignamos al depósito seleccionado
    if (currentStock !== undefined && locationId) {
      await prisma.stockByLocation.create({
        data: {
          productId: product.id,
          locationId: Number(locationId),
          quantity: Number(currentStock),
          avgCostUsd: Number(costUsd),
          companyId: req.companyId
        }
      });
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        details: `Producto creado con stock ${currentStock || 0}: ${product.name}`
      }
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Obtener un producto por ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        subCategory: { include: { category: true } },
        productLocation: true,
        productSuppliers: { include: { supplier: true } },
        stockByLocation: { include: { location: true } }
      }
    });

    if (!product || product.companyId !== req.companyId) return res.status(404).json({ error: 'Producto no encontrado' });

    if (req.user.role === 'SELLER') {
      delete product.costUsd;
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Actualizar un producto (Solo Admin y Manager)
router.put('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, sku, ean, costUsd, salePrice, minStock, subCategoryId, locationId, currentStock } = req.body;
    const productId = Number(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.companyId !== req.companyId) return res.status(404).json({ error: 'Producto no encontrado' });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        sku,
        ean,
        costUsd: Number(costUsd),
        salePrice: Number(salePrice),
        minStock: Number(minStock),
        subCategoryId: Number(subCategoryId)
      }
    });

    // Si se envía stock actual y locationId, actualizamos ese depósito
    if (currentStock !== undefined && locationId) {
      await prisma.stockByLocation.upsert({
        where: { productId_locationId: { productId, locationId: Number(locationId) } },
        update: { quantity: Number(currentStock) },
        create: { productId, locationId: Number(locationId), quantity: Number(currentStock), avgCostUsd: Number(costUsd), companyId: req.companyId }
      });
    }

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Product',
        entityId: product.id,
        details: `Producto y stock actualizados: ${product.name}`
      }
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Eliminar (o desactivar) un producto
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.companyId !== req.companyId) return res.status(404).json({ error: 'Producto no encontrado' });
    
    // Soft delete: lo marcamos como inactivo para no romper el historial de ventas
    const product = await prisma.product.update({
      where: { id: productId },
      data: { active: false }
    });

    await prisma.auditLog.create({
      data: {
        companyId: req.companyId,
        userId: req.user.id,
        action: 'DELETE (SOFT)',
        entity: 'Product',
        entityId: product.id,
        details: `Producto desactivado: ${product.name}`
      }
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
