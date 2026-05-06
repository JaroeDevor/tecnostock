const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const authorize = require('../middleware/roles');

const router = express.Router();

router.use(auth);
router.use(tenant);

// POST /api/transfers - Transferir stock entre locales
router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { productId, fromLocationId, toLocationId, quantity, notes } = req.body;

    if (fromLocationId === toLocationId) {
      return res.status(400).json({ error: 'El origen y destino no pueden ser iguales' });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    await prisma.$transaction(async (tx) => {
      // Verificar stock en origen
      const sourceStock = await tx.stockByLocation.findUnique({
        where: { productId_locationId: { productId: Number(productId), locationId: Number(fromLocationId) } }
      });

      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new Error(`Stock insuficiente en el origen. Disponible: ${sourceStock?.quantity || 0}`);
      }

      // Restar del origen
      await tx.stockByLocation.update({
        where: { id: sourceStock.id },
        data: { quantity: sourceStock.quantity - quantity }
      });

      // Sumar al destino (crear si no existe)
      const destStock = await tx.stockByLocation.findUnique({
        where: { productId_locationId: { productId: Number(productId), locationId: Number(toLocationId) } }
      });

      if (destStock) {
        // Recalcular costo promedio ponderado
        const totalQty = destStock.quantity + quantity;
        const weightedCost = totalQty > 0
          ? ((destStock.quantity * destStock.avgCostUsd) + (quantity * sourceStock.avgCostUsd)) / totalQty
          : sourceStock.avgCostUsd;

        await tx.stockByLocation.update({
          where: { id: destStock.id },
          data: { quantity: totalQty, avgCostUsd: Math.round(weightedCost * 100) / 100 }
        });
      } else {
        await tx.stockByLocation.create({
          data: {
            companyId: req.companyId,
            productId: Number(productId),
            locationId: Number(toLocationId),
            quantity,
            avgCostUsd: sourceStock.avgCostUsd
          }
        });
      }

      // Registrar la transferencia
      await tx.stockTransfer.create({
        data: {
          companyId: req.companyId,
          productId: Number(productId),
          fromLocationId: Number(fromLocationId),
          toLocationId: Number(toLocationId),
          quantity,
          notes,
          createdBy: req.user.id
        }
      });

      // Auditoría
      await tx.auditLog.create({
        data: {
          companyId: req.companyId,
          userId: req.user.id,
          action: 'STOCK_TRANSFER',
          entity: 'StockTransfer',
          entityId: Number(productId),
          details: `Transferencia de ${quantity} uds. del depósito ID ${fromLocationId} al depósito ID ${toLocationId}.`
        }
      });
    });

    res.json({ message: 'Transferencia realizada exitosamente' });
  } catch (error) {
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/transfers - Historial de transferencias
router.get('/', async (req, res, next) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      where: { companyId: req.companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        product: { select: { name: true, sku: true } },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } }
      }
    });
    res.json(transfers);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
