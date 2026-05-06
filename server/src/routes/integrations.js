const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roles');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

// Flujo de OAuth de Mercado Libre (Mock) - Debe ser público o con token temporal
router.get('/ml/auth', (req, res) => {
  // En la realidad, esto redirige a auth.mercadolibre.com.ar con el CLIENT_ID y redirect_uri
  const redirectUri = process.env.FRONTEND_URL || 'http://localhost:5173';
  // Redirigimos simulando la autorización
  res.redirect(`${redirectUri}/dashboard/integrations?ml_auth_success=true&code=MOCK_AUTH_CODE_123`);
});

// Endpoint que recibe el code de ML y lo canjea por un token real
router.post('/ml/callback', auth, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { code, storeName } = req.body;
    if (!code) return res.status(400).json({ error: 'Falta el código de autorización' });

    // Mock: Canjeamos el code por un token a la API de ML
    // const response = await axios.post('https://api.mercadolibre.com/oauth/token', { ... })
    const mockAccessToken = 'APP_USR-' + Math.random().toString(36).substring(7);

    const integration = await prisma.integration.create({
      data: { 
        platform: 'MERCADO_LIBRE', 
        storeName: storeName || 'Mercado Libre Oficial', 
        accessToken: encrypt(mockAccessToken), 
        syncStock: true 
      }
    });

    res.json({ message: 'Mercado Libre conectado exitosamente', id: integration.id });
  } catch (error) {
    next(error);
  }
});

// Solo Administradores pueden gestionar integraciones
router.use(auth);
router.use(authorize('ADMIN'));

// GET /api/integrations - Ver integraciones activas
router.get('/', async (req, res, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      include: {
        _count: {
          select: { productMappings: true, sales: true }
        }
      }
    });
    
    // Enmascarar tokens para el frontend
    const safeIntegrations = integrations.map(int => {
      return {
        ...int,
        accessToken: '********' // No exponer el token encriptado al frontend
      };
    });

    res.json(safeIntegrations);
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations - Conectar nueva tienda (ej. Tienda Nube manual)
router.post('/', async (req, res, next) => {
  try {
    const { platform, storeName, accessToken, syncStock } = req.body;
    
    if (!['MERCADO_LIBRE', 'TIENDA_NUBE'].includes(platform)) {
      return res.status(400).json({ error: 'Plataforma no soportada.' });
    }

    const integration = await prisma.integration.create({
      data: { 
        platform, 
        storeName, 
        accessToken: encrypt(accessToken), 
        syncStock: Boolean(syncStock) 
      }
    });

    res.status(201).json({ ...integration, accessToken: '********' });
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/:id/sync - Sincronizar stock (Mock avanzado)
router.post('/:id/sync', async (req, res, next) => {
  try {
    const integrationId = Number(req.params.id);
    const integration = await prisma.integration.findUnique({ 
      where: { id: integrationId },
      include: { productMappings: true }
    });

    if (!integration) return res.status(404).json({ error: 'Integración no encontrada.' });

    // Desencriptar el token para usarlo
    const realToken = decrypt(integration.accessToken);
    if (!realToken) return res.status(500).json({ error: 'Error al desencriptar credenciales.' });

    // Acá iteraríamos sobre integration.productMappings y buscaríamos el stock
    // Para luego enviarlo a la API de la plataforma:
    // await axios.put(`https://api.mercadolibre.com/items/${mapping.externalId}`, { available_quantity: qty }, { headers: { Authorization: `Bearer ${realToken}` }})

    res.json({ message: `Sincronizados ${integration.productMappings.length} productos con ${integration.storeName}` });
  } catch (error) {
    next(error);
  }
});

// GET /api/integrations/:id/mappings - Obtener mapeos de productos
router.get('/:id/mappings', async (req, res, next) => {
  try {
    const integrationId = Number(req.params.id);
    const mappings = await prisma.productIntegration.findMany({
      where: { integrationId },
      include: { product: { select: { name: true, sku: true } } }
    });
    res.json(mappings);
  } catch (error) {
    next(error);
  }
});

// POST /api/integrations/:id/mappings - Actualizar mapeos en bloque
router.post('/:id/mappings', async (req, res, next) => {
  try {
    const integrationId = Number(req.params.id);
    const { mappings } = req.body; // array de { productId, externalId }

    if (!Array.isArray(mappings)) return res.status(400).json({ error: 'Faltan mappings' });

    await prisma.$transaction(async (tx) => {
      // Eliminar mapeos anteriores
      await tx.productIntegration.deleteMany({ where: { integrationId } });
      
      // Crear nuevos mapeos
      if (mappings.length > 0) {
        await tx.productIntegration.createMany({
          data: mappings
            .filter(m => m.externalId && m.externalId.trim() !== '')
            .map(m => ({
              integrationId,
              productId: Number(m.productId),
              externalId: m.externalId
            }))
        });
      }
    });

    res.json({ message: 'Mapeos actualizados exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
