const cron = require('node-cron');
const prisma = require('../lib/prisma');
const SyncService = require('../services/sync');

// Schedule sync for all active tenants
const scheduleSyncJobs = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Starting scheduled sync for all tenants...');
    
    try {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
      });

      for (const tenant of tenants) {
        try {
          console.log(`Syncing tenant: ${tenant.name}`);
          const syncService = new SyncService(tenant);
          await syncService.syncAll();
          console.log(`Completed sync for tenant: ${tenant.name}`);
        } catch (error) {
          console.error(`Error syncing tenant ${tenant.name}:`, error.message);
        }
      }

      console.log('Scheduled sync completed for all tenants');
    } catch (error) {
      console.error('Scheduled sync error:', error);
    }
  });

  console.log('Sync scheduler initialized - running every 6 hours');
};

module.exports = { scheduleSyncJobs };
