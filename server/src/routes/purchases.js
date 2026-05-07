const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const authorize = require('../middleware/roles');
const { validateOwnership } = require('../utils/validateOwnership');

const router = express.Router();

// Las compras solo las manejan Admins y Managers
router.use(auth);
router.use(tenant);
router.use(authorize('ADMIN', 'MANAGER'));

// GET /api/purchases - Ver órdenes de compra
router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: { companyId: req.companyId },
      include: { 
        supplier: true, 
        items: { include: { product: true } },
        location: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// POST /api/purchases - Crear orden de compra
router.post('/', async (req, res, next) => {
  try {
    const { supplierId, items, notes } = req.body;
    // items: [{ productId, qtyOrdered, unitCostUsd }]

    // Validar pertenencia al tenant
    await validateOwnership('supplier', supplierId, req.companyId, 'Proveedor');
    for (const item of items) {
      await validateOwnership('product', item.productId, req.companyId, 'Producto');
    }
    
    let totalUsd = 0;
    items.forEach(i => totalUsd += (i.qtyOrdered * i.unitCostUsd));

    const order = await prisma.purchaseOrder.create({
      data: {
        companyId: req.companyId,
        supplierId: Number(supplierId),
        status: 'DRAFT',
        totalUsd,
        notes,
        createdBy: req.user.id,
        items: {
          create: items.map(i => ({
            productId: i.productId,
            qtyOrdered: i.qtyOrdered,
            unitCostUsd: i.unitCostUsd
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/purchases/:id/receive - Recibir mercadería y SUMAR stock (soporta recepción parcial)
router.post('/:id/receive', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { locationId, receivedBy, arrivalDate, notes, items } = req.body; 

    // Validar pertenencia de la ubicación al tenant
    await validateOwnership('location', locationId, req.companyId, 'Ubicación');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe especificar los ítems y cantidades a recibir' });
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order || order.companyId !== req.companyId) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status === 'COMPLETE') return res.status(400).json({ error: 'La orden ya fue recibida completamente' });

    // Transacción: Procesamos la recepción parcial o total
    await prisma.$transaction(async (tx) => {
      // 1. Procesar cada ítem recibido
      for (const receivedItem of items) {
        if (receivedItem.qtyToReceive <= 0) continue;

        // Buscar el ítem original de la orden
        const orderItem = order.items.find(i => i.id === receivedItem.itemId);
        if (!orderItem) throw new Error(`Ítem ID ${receivedItem.itemId} no pertenece a esta orden`);

        const pendingQty = orderItem.qtyOrdered - orderItem.qtyReceived;
        if (receivedItem.qtyToReceive > pendingQty) {
          throw new Error(`La cantidad a recibir de ${orderItem.productId} supera la cantidad pendiente (${pendingQty})`);
        }

        // Actualizar qtyReceived en el ítem de la orden
        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: { qtyReceived: orderItem.qtyReceived + receivedItem.qtyToReceive }
        });

        // Buscar stock existente para calcular costo promedio ponderado
        const existingStock = await tx.stockByLocation.findUnique({
          where: { productId_locationId: { productId: orderItem.productId, locationId: Number(locationId) } }
        });

        if (existingStock) {
          // Costo Promedio Ponderado = ((stockActual * costoActual) + (nuevaCant * nuevoCosto)) / (stockActual + nuevaCant)
          const totalQty = existingStock.quantity + receivedItem.qtyToReceive;
          const weightedCost = totalQty > 0 
            ? ((existingStock.quantity * existingStock.avgCostUsd) + (receivedItem.qtyToReceive * orderItem.unitCostUsd)) / totalQty
            : orderItem.unitCostUsd;

          await tx.stockByLocation.update({
            where: { id: existingStock.id },
            data: { 
              quantity: totalQty,
              avgCostUsd: Math.round(weightedCost * 100) / 100
            }
          });
        } else {
          await tx.stockByLocation.create({
            data: {
              companyId: req.companyId,
              productId: orderItem.productId,
              locationId: Number(locationId),
              quantity: receivedItem.qtyToReceive,
              avgCostUsd: orderItem.unitCostUsd
            }
          });
        }

        // Actualizar el último costo conocido en el Producto base
        await tx.product.update({
          where: { id: orderItem.productId },
          data: { costUsd: orderItem.unitCostUsd }
        });
      }

      // 2. Verificar el estado final de la orden
      // Volvemos a consultar los ítems actualizados dentro de la tx
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { orderId: orderId } });
      const isComplete = updatedItems.every(i => i.qtyReceived >= i.qtyOrdered);
      const newStatus = isComplete ? 'COMPLETE' : 'PARTIAL';

      // 3. Marcar orden con el nuevo estado
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          receivedBy: receivedBy || 'Sistema',
          receivedAt: arrivalDate ? new Date(arrivalDate) : new Date(),
          locationId: Number(locationId),
          notes: notes ? `${order.notes || ''} | RECIBIDO (${newStatus}): ${notes}` : order.notes
        }
      });

      // 4. Auditoría
      await tx.auditLog.create({
        data: {
          companyId: req.companyId,
          userId: req.user.id,
          action: 'PURCHASE_RECEIVE',
          entity: 'PurchaseOrder',
          entityId: order.id,
          details: `Recepción ${newStatus} por ${receivedBy || 'Sistema'} en depósito ID ${locationId}.`
        }
      });
    });

    res.json({ message: 'Recepción procesada y stock actualizado correctamente.' });
  } catch (error) {
    if (error.message.includes('supera la cantidad pendiente') || error.message.includes('no pertenece')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// PUT /api/purchases/:id - Editar orden de compra (Solo si es DRAFT)
router.put('/:id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { supplierId, items, notes } = req.body;

    const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
    if (!existingOrder || existingOrder.companyId !== req.companyId) return res.status(404).json({ error: 'Orden no encontrada' });
    if (existingOrder.status !== 'DRAFT') return res.status(400).json({ error: 'Solo se pueden editar órdenes en estado DRAFT' });

    let totalUsd = 0;
    items.forEach(i => totalUsd += (i.qtyOrdered * i.unitCostUsd));

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        supplierId: Number(supplierId),
        totalUsd,
        notes,
        items: {
          deleteMany: {}, // Borrar items anteriores
          create: items.map(i => ({ // Recrear items
            productId: i.productId,
            qtyOrdered: i.qtyOrdered,
            unitCostUsd: i.unitCostUsd
          }))
        }
      },
      include: { items: true }
    });

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/purchases/:id - Eliminar orden de compra (Solo si es DRAFT)
router.delete('/:id', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    
    const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id: orderId } });
    if (!existingOrder || existingOrder.companyId !== req.companyId) return res.status(404).json({ error: 'Orden no encontrada' });
    if (existingOrder.status !== 'DRAFT') return res.status(400).json({ error: 'No se puede eliminar una orden que ya fue recibida' });

    await prisma.purchaseOrder.delete({ where: { id: orderId } });
    
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
