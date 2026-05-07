const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { validateOwnership } = require('../utils/validateOwnership');

const router = express.Router();

router.use(auth);
router.use(tenant);

// POST /api/sales - Registrar una nueva venta (Local o Externa)
router.post('/', async (req, res, next) => {
  try {
    const { customerId, locationId, items, paymentMethod, source, integrationId, externalOrderId, notes } = req.body;
    
    // Validar pertenencia de entidades al tenant
    await validateOwnership('location', locationId, req.companyId, 'Ubicación');
    if (customerId) await validateOwnership('customer', customerId, req.companyId, 'Cliente');
    for (const item of items) {
      await validateOwnership('product', item.productId, req.companyId, 'Producto');
    }
    
    // items es un array: [{ productId, quantity, unitPrice }]

    // Usamos una Transacción para asegurar que si falla la resta de stock, no se registre la venta (Atomicidad)
    const saleResult = await prisma.$transaction(async (tx) => {
      let total = 0;
      let costAtSaleTotal = 0;
      const stockRecords = new Map(); // Guardar los registros de stock para usar el costo real

      // 1. Validar y restar stock de cada ítem
      for (const item of items) {
        // Buscar stock actual en la ubicación desde donde se despacha
        const stockRecord = await tx.stockByLocation.findUnique({
          where: { productId_locationId: { productId: item.productId, locationId: Number(locationId) } }
        });

        if (!stockRecord || stockRecord.quantity < item.quantity) {
          // Si es venta de mostrador, bloqueamos. Si es de ML, podríamos permitir stock negativo y lanzar alerta.
          // Por ahora, asumimos regla estricta: No se puede vender si no hay stock físico registrado.
          throw new Error(`Stock insuficiente para el producto ID ${item.productId}`);
        }

        // Guardar referencia al stock para usarla al crear los items de venta
        stockRecords.set(item.productId, stockRecord);

        // Restar stock
        await tx.stockByLocation.update({
          where: { id: stockRecord.id },
          data: { quantity: stockRecord.quantity - item.quantity }
        });

        total += (item.quantity * item.unitPrice);
        costAtSaleTotal += (stockRecord.avgCostUsd * item.quantity);
      }

      // 2. Crear la venta
      const sale = await tx.sale.create({
        data: {
          companyId: req.companyId,
          customerId: customerId ? Number(customerId) : null,
          locationId: Number(locationId),
          userId: req.user.id,
          subtotal: total,
          total: total,
          paymentMethod: paymentMethod || 'CASH',
          source: source || 'LOCAL', // LOCAL, MERCADO_LIBRE, TIENDA_NUBE
          integrationId: integrationId ? Number(integrationId) : null,
          externalOrderId: externalOrderId || null,
          notes: notes,
          items: {
            create: items.map(i => {
              // Buscar el costo promedio del stock para este producto
              const itemStock = stockRecords.get(i.productId);
              return {
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                // Guardamos el costo en el momento exacto de la venta para reportes financieros
                costAtSale: itemStock?.avgCostUsd || 0
              };
            })
          }
        },
        include: { items: true }
      });

      // 3. Registrar auditoría
      await tx.auditLog.create({
        data: {
          companyId: req.companyId,
          userId: req.user.id,
          action: 'SALE',
          entity: 'Sale',
          entityId: sale.id,
          details: `Venta registrada por $${total}. Origen: ${source || 'LOCAL'}`
        }
      });

      return sale;
    });

    res.status(201).json(saleResult);
  } catch (error) {
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/sales - Ver historial de ventas con filtros y paginación
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, locationId, from, to } = req.query;

    const where = { companyId: req.companyId };
    if (locationId) where.locationId = Number(locationId);
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: true, user: { select: { name: true } }, location: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.sale.count({ where });

    res.json({
      data: sales,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
