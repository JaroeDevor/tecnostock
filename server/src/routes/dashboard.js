const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/dashboard - Resumen de métricas para el Dashboard
router.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Productos y Alertas de Stock Bajo
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { stockByLocation: true }
    });

    let lowStockCount = 0;
    const lowStockAlerts = [];

    products.forEach(p => {
      const totalStock = p.stockByLocation.reduce((acc, loc) => acc + loc.quantity, 0);
      if (totalStock <= p.minStock) {
        lowStockCount++;
        if (lowStockAlerts.length < 5) {
          lowStockAlerts.push({
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: totalStock,
            minStock: p.minStock
          });
        }
      }
    });

    // 2. Ventas del Mes y Hoy
    const salesThisMonth = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'COMPLETED'
      }
    });

    const revenueMonth = salesThisMonth.reduce((acc, sale) => acc + sale.total, 0);
    
    const salesToday = salesThisMonth.filter(sale => sale.createdAt >= today);
    const revenueToday = salesToday.reduce((acc, sale) => acc + sale.total, 0);

    // 3. Últimas 5 ventas (para la tabla de Actividad Reciente)
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
        user: { select: { name: true } }
      }
    });

    // 4. Inversión vs Recupero (Análisis Financiero Histórico)
    const allCompletedPurchases = await prisma.purchaseOrder.findMany({
      where: { status: 'COMPLETE' },
      select: { totalUsd: true }
    });

    const allCompletedSales = await prisma.sale.findMany({
      where: { status: 'COMPLETED' },
      select: { total: true }
    });

    const totalInvestment = allCompletedPurchases.reduce((acc, p) => acc + p.totalUsd, 0);
    const totalRecovery = allCompletedSales.reduce((acc, s) => acc + s.total, 0);

    // 5. Últimas Compras en Tránsito
    const pendingPurchases = await prisma.purchaseOrder.count({
      where: { status: 'DRAFT' }
    });

    res.json({
      metrics: {
        totalProducts: products.length,
        lowStockCount,
        revenueMonth,
        revenueToday,
        salesCountMonth: salesThisMonth.length,
        salesCountToday: salesToday.length,
        pendingPurchases,
        totalInvestment,
        totalRecovery
      },
      lowStockAlerts,
      recentSales
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
