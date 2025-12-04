const prisma = require('../lib/prisma');
const ShopifyService = require('./shopify');

class SyncService {
  constructor(tenant) {
    this.tenant = tenant;
    this.shopify = new ShopifyService(tenant.shopifyStoreUrl, tenant.shopifyAccessToken);
  }

  // Create a sync log entry
  async createSyncLog(syncType) {
    return prisma.syncLog.create({
      data: {
        syncType,
        status: 'started',
        tenantId: this.tenant.id,
      },
    });
  }

  // Update sync log
  async updateSyncLog(logId, status, recordsProcessed, errorMessage = null) {
    return prisma.syncLog.update({
      where: { id: logId },
      data: {
        status,
        recordsProcessed,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  // Sync Customers from Shopify
  async syncCustomers() {
    const syncLog = await this.createSyncLog('customers');
    let recordsProcessed = 0;

    try {
      const customers = await this.shopify.getCustomers();
      
      for (const customer of customers) {
        await prisma.customer.upsert({
          where: {
            shopifyCustomerId_tenantId: {
              shopifyCustomerId: String(customer.id),
              tenantId: this.tenant.id,
            },
          },
          update: {
            email: customer.email || null,
            firstName: customer.first_name || null,
            lastName: customer.last_name || null,
            phone: customer.phone || null,
            ordersCount: customer.orders_count || 0,
            totalSpent: parseFloat(customer.total_spent) || 0,
            currency: customer.currency || null,
            tags: customer.tags || null,
            acceptsMarketing: customer.accepts_marketing || false,
            updatedAtShopify: customer.updated_at ? new Date(customer.updated_at) : null,
          },
          create: {
            shopifyCustomerId: String(customer.id),
            email: customer.email || null,
            firstName: customer.first_name || null,
            lastName: customer.last_name || null,
            phone: customer.phone || null,
            ordersCount: customer.orders_count || 0,
            totalSpent: parseFloat(customer.total_spent) || 0,
            currency: customer.currency || null,
            tags: customer.tags || null,
            acceptsMarketing: customer.accepts_marketing || false,
            createdAtShopify: customer.created_at ? new Date(customer.created_at) : null,
            updatedAtShopify: customer.updated_at ? new Date(customer.updated_at) : null,
            tenantId: this.tenant.id,
          },
        });
        recordsProcessed++;
      }

      await this.updateSyncLog(syncLog.id, 'completed', recordsProcessed);
      return { success: true, recordsProcessed };
    } catch (error) {
      await this.updateSyncLog(syncLog.id, 'failed', recordsProcessed, error.message);
      throw error;
    }
  }

  // Sync Draft Orders (since there are no regular orders)
  async syncOrders() {
    const syncLog = await this.createSyncLog('orders');
    let recordsProcessed = 0;

    try {
      // Sync draft orders
      const draftOrders = await this.shopify.getDraftOrders();
      
      for (const draftOrder of draftOrders) {
        // Find or create customer from draft order if exists
        let customerId = null;
        let customerShopifyId = null;
        
        if (draftOrder.customer?.id) {
          customerShopifyId = String(draftOrder.customer.id);
          
          // Update/create customer from draft order data
          const customerData = draftOrder.customer;
          const savedCustomer = await prisma.customer.upsert({
            where: {
              shopifyCustomerId_tenantId: {
                shopifyCustomerId: customerShopifyId,
                tenantId: this.tenant.id,
              },
            },
            update: {
              email: customerData.email || null,
              firstName: customerData.first_name || null,
              lastName: customerData.last_name || null,
              phone: customerData.phone || null,
              tags: customerData.tags || null,
              currency: customerData.currency || null,
              updatedAtShopify: customerData.updated_at ? new Date(customerData.updated_at) : null,
            },
            create: {
              shopifyCustomerId: customerShopifyId,
              email: customerData.email || null,
              firstName: customerData.first_name || null,
              lastName: customerData.last_name || null,
              phone: customerData.phone || null,
              tags: customerData.tags || null,
              currency: customerData.currency || null,
              createdAtShopify: customerData.created_at ? new Date(customerData.created_at) : null,
              updatedAtShopify: customerData.updated_at ? new Date(customerData.updated_at) : null,
              tenantId: this.tenant.id,
            },
          });
          customerId = savedCustomer.id;
        }

        // Save draft order
        const savedOrder = await prisma.order.upsert({
          where: {
            shopifyOrderId_tenantId: {
              shopifyOrderId: `draft_${draftOrder.id}`,
              tenantId: this.tenant.id,
            },
          },
          update: {
            orderNumber: draftOrder.name,
            email: draftOrder.email || null,
            financialStatus: 'draft',
            fulfillmentStatus: null,
            totalPrice: parseFloat(draftOrder.total_price) || 0,
            subtotalPrice: parseFloat(draftOrder.subtotal_price) || 0,
            totalTax: parseFloat(draftOrder.total_tax) || 0,
            totalDiscounts: 0,
            currency: draftOrder.currency,
            customerShopifyId,
            customerId,
            isDraft: true,
            draftStatus: draftOrder.status,
            updatedAtShopify: draftOrder.updated_at ? new Date(draftOrder.updated_at) : null,
          },
          create: {
            shopifyOrderId: `draft_${draftOrder.id}`,
            orderNumber: draftOrder.name,
            email: draftOrder.email || null,
            financialStatus: 'draft',
            fulfillmentStatus: null,
            totalPrice: parseFloat(draftOrder.total_price) || 0,
            subtotalPrice: parseFloat(draftOrder.subtotal_price) || 0,
            totalTax: parseFloat(draftOrder.total_tax) || 0,
            totalDiscounts: 0,
            currency: draftOrder.currency,
            customerShopifyId,
            customerId,
            isDraft: true,
            draftStatus: draftOrder.status,
            createdAtShopify: draftOrder.created_at ? new Date(draftOrder.created_at) : null,
            updatedAtShopify: draftOrder.updated_at ? new Date(draftOrder.updated_at) : null,
            tenantId: this.tenant.id,
          },
        });

        // Sync order line items
        if (draftOrder.line_items?.length > 0) {
          await prisma.orderItem.deleteMany({
            where: { orderId: savedOrder.id },
          });

          for (const item of draftOrder.line_items) {
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

        recordsProcessed++;
      }

      // Update customer statistics after syncing orders
      await this.updateCustomerStatistics();

      await this.updateSyncLog(syncLog.id, 'completed', recordsProcessed);
      return { success: true, recordsProcessed };
    } catch (error) {
      await this.updateSyncLog(syncLog.id, 'failed', recordsProcessed, error.message);
      throw error;
    }
  }

  // Sync Products
  async syncProducts() {
    const syncLog = await this.createSyncLog('products');
    let recordsProcessed = 0;

    try {
      const products = await this.shopify.getProducts();

      for (const product of products) {
        const firstVariant = product.variants?.[0];
        const firstImage = product.images?.[0];

        await prisma.product.upsert({
          where: {
            shopifyProductId_tenantId: {
              shopifyProductId: String(product.id),
              tenantId: this.tenant.id,
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
            compareAtPrice: firstVariant?.compare_at_price 
              ? parseFloat(firstVariant.compare_at_price) 
              : null,
            inventoryQuantity: firstVariant?.inventory_quantity || 0,
            updatedAtShopify: product.updated_at ? new Date(product.updated_at) : null,
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
            compareAtPrice: firstVariant?.compare_at_price 
              ? parseFloat(firstVariant.compare_at_price) 
              : null,
            inventoryQuantity: firstVariant?.inventory_quantity || 0,
            createdAtShopify: product.created_at ? new Date(product.created_at) : null,
            updatedAtShopify: product.updated_at ? new Date(product.updated_at) : null,
            tenantId: this.tenant.id,
          },
        });
        recordsProcessed++;
      }

      await this.updateSyncLog(syncLog.id, 'completed', recordsProcessed);
      return { success: true, recordsProcessed };
    } catch (error) {
      await this.updateSyncLog(syncLog.id, 'failed', recordsProcessed, error.message);
      throw error;
    }
  }

  // Update customer totalSpent and ordersCount from orders in database
  async updateCustomerStatistics() {
    const customers = await prisma.customer.findMany({
      where: { tenantId: this.tenant.id },
      select: { id: true, shopifyCustomerId: true },
    });

    for (const customer of customers) {
      const orderStats = await prisma.order.aggregate({
        where: {
          tenantId: this.tenant.id,
          customerShopifyId: customer.shopifyCustomerId,
        },
        _sum: { totalPrice: true },
        _count: { id: true },
      });

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: parseFloat(orderStats._sum.totalPrice?.toString() || '0'),
          ordersCount: orderStats._count.id || 0,
        },
      });
    }
    
    console.log(`Updated statistics for ${customers.length} customers`);
  }

  // Full sync - all data types
  async syncAll() {
    const syncLog = await this.createSyncLog('full');
    let totalRecords = 0;
    const results = {
      customers: { success: false, count: 0, error: null },
      orders: { success: false, count: 0, error: null },
      products: { success: false, count: 0, error: null },
    };
    const errors = [];

    // Sync Customers
    try {
      const result = await this.syncCustomers();
      results.customers = { success: true, count: result.recordsProcessed, error: null };
      totalRecords += result.recordsProcessed;
    } catch (error) {
      console.error('Customers sync failed:', error.message);
      results.customers.error = this.getReadableError(error, 'read_customers');
      errors.push(`Customers: ${results.customers.error}`);
    }

    // Sync Orders (Draft Orders)
    try {
      const result = await this.syncOrders();
      results.orders = { success: true, count: result.recordsProcessed, error: null };
      totalRecords += result.recordsProcessed;
    } catch (error) {
      console.error('Orders sync failed:', error.message);
      results.orders.error = this.getReadableError(error, 'read_orders');
      errors.push(`Orders: ${results.orders.error}`);
    }

    // Sync Products
    try {
      const result = await this.syncProducts();
      results.products = { success: true, count: result.recordsProcessed, error: null };
      totalRecords += result.recordsProcessed;
    } catch (error) {
      console.error('Products sync failed:', error.message);
      results.products.error = this.getReadableError(error, 'read_products');
      errors.push(`Products: ${results.products.error}`);
    }

    const hasAnySuccess = results.customers.success || results.orders.success || results.products.success;
    const status = !hasAnySuccess ? 'failed' : errors.length > 0 ? 'partial' : 'completed';
    
    await this.updateSyncLog(
      syncLog.id, 
      status === 'partial' ? 'completed' : status, 
      totalRecords, 
      errors.length > 0 ? errors.join('; ') : null
    );
    
    return {
      success: hasAnySuccess,
      partial: hasAnySuccess && errors.length > 0,
      customers: results.customers.count,
      orders: results.orders.count,
      products: results.products.count,
      total: totalRecords,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Get readable error message
  getReadableError(error, scope) {
    if (error.response?.status === 403) {
      return `Access denied - enable '${scope}' scope in your Shopify app`;
    }
    if (error.response?.status === 401) {
      return 'Invalid API access token';
    }
    return error.message || 'Unknown error';
  }
}

module.exports = SyncService;
