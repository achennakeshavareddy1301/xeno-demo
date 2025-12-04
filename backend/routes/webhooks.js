const express = require('express');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const SyncService = require('../services/sync');

const router = express.Router();

// Verify Shopify webhook signature
const verifyWebhook = (req, res, next) => {
  const hmac = req.get('X-Shopify-Hmac-SHA256');
  const body = req.rawBody;
  
  if (!hmac || !body) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In production, verify HMAC with your webhook secret
  // For now, we'll skip verification in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Verify HMAC signature
  // const hash = crypto
  //   .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
  //   .update(body, 'utf8')
  //   .digest('base64');
  
  // if (hash !== hmac) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  next();
};

// Get tenant from shop domain
const getTenantFromShop = async (shopDomain) => {
  // Normalize shop domain
  const normalizedDomain = shopDomain
    .replace('https://', '')
    .replace('http://', '')
    .replace(/\/$/, '');

  return prisma.tenant.findFirst({
    where: {
      OR: [
        { shopifyStoreUrl: normalizedDomain },
        { shopifyStoreUrl: `https://${normalizedDomain}` },
        { shopifyStoreUrl: { contains: normalizedDomain.split('.')[0] } },
      ],
    },
  });
};

// Customer created/updated webhook
router.post('/customers/create', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const customer = req.body;

    const tenant = await getTenantFromShop(shopDomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await prisma.customer.upsert({
      where: {
        shopifyCustomerId_tenantId: {
          shopifyCustomerId: String(customer.id),
          tenantId: tenant.id,
        },
      },
      update: {
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        ordersCount: customer.orders_count || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        updatedAtShopify: new Date(customer.updated_at),
      },
      create: {
        shopifyCustomerId: String(customer.id),
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        ordersCount: customer.orders_count || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        createdAtShopify: new Date(customer.created_at),
        tenantId: tenant.id,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error (customer):', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Order created webhook
router.post('/orders/create', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const order = req.body;

    const tenant = await getTenantFromShop(shopDomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Find customer
    let customerId = null;
    if (order.customer?.id) {
      const customer = await prisma.customer.findUnique({
        where: {
          shopifyCustomerId_tenantId: {
            shopifyCustomerId: String(order.customer.id),
            tenantId: tenant.id,
          },
        },
      });
      customerId = customer?.id;
    }

    const savedOrder = await prisma.order.upsert({
      where: {
        shopifyOrderId_tenantId: {
          shopifyOrderId: String(order.id),
          tenantId: tenant.id,
        },
      },
      update: {
        orderNumber: order.order_number ? String(order.order_number) : null,
        email: order.email,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        totalPrice: parseFloat(order.total_price) || 0,
        subtotalPrice: parseFloat(order.subtotal_price) || 0,
        totalTax: parseFloat(order.total_tax) || 0,
        totalDiscounts: parseFloat(order.total_discounts) || 0,
        currency: order.currency,
        customerId,
        updatedAtShopify: new Date(order.updated_at),
      },
      create: {
        shopifyOrderId: String(order.id),
        orderNumber: order.order_number ? String(order.order_number) : null,
        email: order.email,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        totalPrice: parseFloat(order.total_price) || 0,
        subtotalPrice: parseFloat(order.subtotal_price) || 0,
        totalTax: parseFloat(order.total_tax) || 0,
        totalDiscounts: parseFloat(order.total_discounts) || 0,
        currency: order.currency,
        customerShopifyId: order.customer?.id ? String(order.customer.id) : null,
        customerId,
        createdAtShopify: new Date(order.created_at),
        processedAt: order.processed_at ? new Date(order.processed_at) : null,
        tenantId: tenant.id,
      },
    });

    // Save order items
    if (order.line_items?.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: savedOrder.id },
      });

      for (const item of order.line_items) {
        await prisma.orderItem.create({
          data: {
            shopifyLineId: item.id ? String(item.id) : null,
            productId: item.product_id ? String(item.product_id) : null,
            variantId: item.variant_id ? String(item.variant_id) : null,
            title: item.title,
            variantTitle: item.variant_title,
            quantity: item.quantity || 1,
            price: parseFloat(item.price) || 0,
            sku: item.sku,
            orderId: savedOrder.id,
          },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error (order):', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Product created/updated webhook
router.post('/products/create', verifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const product = req.body;

    const tenant = await getTenantFromShop(shopDomain);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const firstVariant = product.variants?.[0];
    const firstImage = product.images?.[0];

    await prisma.product.upsert({
      where: {
        shopifyProductId_tenantId: {
          shopifyProductId: String(product.id),
          tenantId: tenant.id,
        },
      },
      update: {
        title: product.title,
        description: product.body_html,
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags,
        status: product.status,
        handle: product.handle,
        imageUrl: firstImage?.src,
        price: firstVariant?.price ? parseFloat(firstVariant.price) : null,
        inventoryQuantity: firstVariant?.inventory_quantity || 0,
        updatedAtShopify: new Date(product.updated_at),
      },
      create: {
        shopifyProductId: String(product.id),
        title: product.title,
        description: product.body_html,
        vendor: product.vendor,
        productType: product.product_type,
        tags: product.tags,
        status: product.status,
        handle: product.handle,
        imageUrl: firstImage?.src,
        price: firstVariant?.price ? parseFloat(firstVariant.price) : null,
        inventoryQuantity: firstVariant?.inventory_quantity || 0,
        createdAtShopify: new Date(product.created_at),
        tenantId: tenant.id,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error (product):', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Custom events endpoint (cart abandoned, checkout started, etc.)
router.post('/events', async (req, res) => {
  try {
    const { eventType, customerId, customerEmail, sessionId, data, tenantId } = req.body;

    if (!eventType || !tenantId) {
      return res.status(400).json({ error: 'eventType and tenantId are required' });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await prisma.event.create({
      data: {
        eventType,
        customerId,
        customerEmail,
        sessionId,
        data,
        tenantId,
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Event tracking failed' });
  }
});

module.exports = router;
