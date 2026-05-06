const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/reports/sales-by-product - Ventas agrupadas por producto y locación
router.get('/sales-by-product', async (req, res, next) => {
  try {
    const { productId, from, to } = req.query;

    const where = { sale: { status: 'COMPLETED' } };

    if (productId) {
      where.productId = Number(productId);
    }
    if (from || to) {
      where.sale.createdAt = {};
      if (from) where.sale.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.sale.createdAt.lte = toDate;
      }
    }

    const saleItems = await prisma.saleItem.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        sale: { 
          select: { 
            locationId: true, 
            location: { select: { id: true, name: true } },
            createdAt: true
          } 
        }
      }
    });

    // Agrupar por producto → locación
    const grouped = {};

    saleItems.forEach(item => {
      const pId = item.productId;
      const locId = item.sale.locationId;

      if (!grouped[pId]) {
        grouped[pId] = {
          product: item.product,
          totalQty: 0,
          totalRevenue: 0,
          byLocation: {}
        };
      }

      grouped[pId].totalQty += item.quantity;
      grouped[pId].totalRevenue += item.quantity * item.unitPrice;

      if (!grouped[pId].byLocation[locId]) {
        grouped[pId].byLocation[locId] = {
          location: item.sale.location,
          qty: 0,
          revenue: 0
        };
      }

      grouped[pId].byLocation[locId].qty += item.quantity;
      grouped[pId].byLocation[locId].revenue += item.quantity * item.unitPrice;
    });

    // Convertir a array ordenado por totalRevenue desc
    const result = Object.values(grouped)
      .map(g => ({
        ...g,
        byLocation: Object.values(g.byLocation)
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
