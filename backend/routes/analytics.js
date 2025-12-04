const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);

// Get dashboard overview stats
router.get('/overview', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // Get counts
    const [customersCount, ordersCount, productsCount] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId } }),
    ]);

    // Get total revenue
    const revenueResult = await prisma.order.aggregate({
      where: { tenantId },
      _sum: { totalPrice: true },
    });

    // Get average order value
    const avgOrderResult = await prisma.order.aggregate({
      where: { tenantId },
      _avg: { totalPrice: true },
    });

    // Get recent orders count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrdersCount = await prisma.order.count({
      where: {
        tenantId,
        createdAtShopify: { gte: thirtyDaysAgo },
      },
    });

    // Get recent revenue (last 30 days)
    const recentRevenueResult = await prisma.order.aggregate({
      where: {
        tenantId,
        createdAtShopify: { gte: thirtyDaysAgo },
      },
      _sum: { totalPrice: true },
    });

    res.json({
      totalCustomers: customersCount,
      totalOrders: ordersCount,
      totalProducts: productsCount,
      totalRevenue: revenueResult._sum.totalPrice || 0,
      averageOrderValue: avgOrderResult._avg.totalPrice || 0,
      recentOrders: recentOrdersCount,
      recentRevenue: recentRevenueResult._sum.totalPrice || 0,
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Get orders by date (for chart)
router.get('/orders-by-date', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAtShopify = {};
      if (startDate) dateFilter.createdAtShopify.gte = new Date(startDate);
      if (endDate) dateFilter.createdAtShopify.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where: { tenantId, ...dateFilter },
      select: {
        createdAtShopify: true,
        totalPrice: true,
      },
      orderBy: { createdAtShopify: 'asc' },
    });

    // Group by date
    const ordersByDate = {};
    orders.forEach((order) => {
      if (order.createdAtShopify) {
        const date = order.createdAtShopify.toISOString().split('T')[0];
        if (!ordersByDate[date]) {
          ordersByDate[date] = { date, orders: 0, revenue: 0 };
        }
        ordersByDate[date].orders++;
        ordersByDate[date].revenue += parseFloat(order.totalPrice) || 0;
      }
    });

    res.json({
      data: Object.values(ordersByDate),
    });
  } catch (error) {
    console.error('Error fetching orders by date:', error);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
});

// Get top customers by spend
router.get('/top-customers', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 5;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totalSpent: true,
        ordersCount: true,
      },
    });

    res.json({ customers });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

// Get revenue by financial status
router.get('/revenue-by-status', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const result = await prisma.order.groupBy({
      by: ['financialStatus'],
      where: { tenantId },
      _sum: { totalPrice: true },
      _count: true,
    });

    res.json({
      data: result.map((item) => ({
        status: item.financialStatus || 'unknown',
        revenue: item._sum.totalPrice || 0,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching revenue by status:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by status' });
  }
});

// Get products by status
router.get('/products-by-status', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const result = await prisma.product.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    res.json({
      data: result.map((item) => ({
        status: item.status || 'unknown',
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching products by status:', error);
    res.status(500).json({ error: 'Failed to fetch products by status' });
  }
});

// Get fulfillment stats
router.get('/fulfillment-stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const result = await prisma.order.groupBy({
      by: ['fulfillmentStatus'],
      where: { tenantId },
      _count: true,
    });

    res.json({
      data: result.map((item) => ({
        status: item.fulfillmentStatus || 'unfulfilled',
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching fulfillment stats:', error);
    res.status(500).json({ error: 'Failed to fetch fulfillment stats' });
  }
});

// Get monthly trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const orders = await prisma.order.findMany({
      where: { tenantId },
      select: {
        createdAtShopify: true,
        totalPrice: true,
      },
      orderBy: { createdAtShopify: 'asc' },
    });

    // Group by month
    const monthlyData = {};
    orders.forEach((order) => {
      if (order.createdAtShopify) {
        const month = order.createdAtShopify.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { month, orders: 0, revenue: 0 };
        }
        monthlyData[month].orders++;
        monthlyData[month].revenue += parseFloat(order.totalPrice) || 0;
      }
    });

    res.json({
      data: Object.values(monthlyData),
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
});

module.exports = router;
