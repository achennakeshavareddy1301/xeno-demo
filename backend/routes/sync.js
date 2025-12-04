const express = require('express');
const prisma = require('../lib/prisma');
const SyncService = require('../services/sync');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Sync all data from Shopify
router.post('/all', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const syncService = new SyncService(tenant);
    const result = await syncService.syncAll();

    res.json({
      message: 'Full sync completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', message: error.message });
  }
});

// Sync customers
router.post('/customers', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const syncService = new SyncService(tenant);
    const result = await syncService.syncCustomers();

    res.json({
      message: 'Customers sync completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Customers sync error:', error);
    res.status(500).json({ error: 'Customers sync failed', message: error.message });
  }
});

// Sync orders
router.post('/orders', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const syncService = new SyncService(tenant);
    const result = await syncService.syncOrders();

    res.json({
      message: 'Orders sync completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Orders sync error:', error);
    res.status(500).json({ error: 'Orders sync failed', message: error.message });
  }
});

// Sync products
router.post('/products', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const syncService = new SyncService(tenant);
    const result = await syncService.syncProducts();

    res.json({
      message: 'Products sync completed successfully',
      ...result,
    });
  } catch (error) {
    console.error('Products sync error:', error);
    res.status(500).json({ error: 'Products sync failed', message: error.message });
  }
});

// Get sync logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.syncLog.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

module.exports = router;
