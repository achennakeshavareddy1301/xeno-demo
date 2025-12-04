'use client';

import { useState, useEffect } from 'react';
import {
  FiRefreshCw,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiActivity,
} from 'react-icons/fi';
import { syncApi } from '@/lib/api';

export default function SyncPage() {
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({
    all: false,
    customers: false,
    orders: false,
    products: false,
  });
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    fetchSyncLogs();
  }, []);

  const fetchSyncLogs = async () => {
    try {
      setLoading(true);
      const data = await syncApi.getSyncLogs();
      setSyncLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (type) => {
    setSyncing((prev) => ({ ...prev, [type]: true }));
    setSyncResult(null);

    try {
      let result;
      switch (type) {
        case 'all':
          result = await syncApi.syncAll();
          break;
        case 'customers':
          result = await syncApi.syncCustomers();
          break;
        case 'orders':
          result = await syncApi.syncOrders();
          break;
        case 'products':
          result = await syncApi.syncProducts();
          break;
      }

      setSyncResult({
        success: true,
        message: result.message,
        details: result,
      });

      // Refresh logs
      fetchSyncLogs();
    } catch (error) {
      setSyncResult({
        success: false,
        message: error.message || 'Sync failed',
      });
    } finally {
      setSyncing((prev) => ({ ...prev, [type]: false }));
    }
  };

  const syncButtons = [
    { key: 'all', label: 'Sync All', icon: FiRefreshCw, color: 'primary' },
    { key: 'customers', label: 'Sync Customers', icon: FiUsers, color: 'blue' },
    { key: 'orders', label: 'Sync Orders', icon: FiShoppingBag, color: 'green' },
    { key: 'products', label: 'Sync Products', icon: FiPackage, color: 'purple' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" size={18} />;
      case 'failed':
        return <FiXCircle className="text-red-500" size={18} />;
      case 'started':
        return <FiClock className="text-yellow-500" size={18} />;
      default:
        return <FiActivity className="text-gray-400" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
        <p className="text-gray-500">Sync your Shopify store data to keep it up to date</p>
      </div>

      {/* Sync Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {syncButtons.map((btn) => {
            const Icon = btn.icon;
            const isLoading = syncing[btn.key];
            return (
              <button
                key={btn.key}
                onClick={() => handleSync(btn.key)}
                disabled={isLoading || Object.values(syncing).some((v) => v)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
                  ${
                    btn.color === 'primary'
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : btn.color === 'blue'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : btn.color === 'green'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading ? (
                  <FiRefreshCw className="animate-spin" size={18} />
                ) : (
                  <Icon size={18} />
                )}
                {isLoading ? 'Syncing...' : btn.label}
              </button>
            );
          })}
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              syncResult.success && !syncResult.details?.partial
                ? 'bg-green-50 border border-green-200 text-green-700'
                : syncResult.success && syncResult.details?.partial
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.success && !syncResult.details?.partial ? (
                <FiCheckCircle size={18} />
              ) : syncResult.success && syncResult.details?.partial ? (
                <FiActivity size={18} />
              ) : (
                <FiXCircle size={18} />
              )}
              <span className="font-medium">{syncResult.message}</span>
            </div>
            {syncResult.details && (
              <div className="mt-2 text-sm">
                {syncResult.details.customers !== undefined && (
                  <p>✓ Customers synced: {syncResult.details.customers}</p>
                )}
                {syncResult.details.orders !== undefined && (
                  <p>✓ Orders synced: {syncResult.details.orders}</p>
                )}
                {syncResult.details.products !== undefined && (
                  <p>✓ Products synced: {syncResult.details.products}</p>
                )}
                {syncResult.details.recordsProcessed !== undefined && (
                  <p>Records processed: {syncResult.details.recordsProcessed}</p>
                )}
              </div>
            )}
            {/* Show errors */}
            {syncResult.details?.errors && syncResult.details.errors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <p className="font-medium text-red-600 mb-1">⚠ Some sync operations failed:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {syncResult.details.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Show scope errors with instructions */}
            {syncResult.details?.scopeErrors && syncResult.details.scopeErrors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200 bg-yellow-100 -mx-4 p-4 rounded-b-lg">
                <p className="font-semibold text-yellow-800 mb-2">🔑 Missing Shopify API Permissions</p>
                <p className="text-sm text-yellow-700 mb-2">
                  Your Shopify app needs these scopes enabled:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {syncResult.details.scopeErrors.map((scope) => (
                    <span key={scope} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-mono">
                      {scope}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-yellow-600">
                  Go to Shopify Admin → Apps → Your App → Configuration → Admin API scopes, 
                  enable the required scopes, and reinstall the app.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Logs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h2>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiActivity size={48} className="mx-auto mb-4 opacity-50" />
            <p>No sync logs yet. Start syncing your data!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{log.syncType} Sync</p>
                    <p className="text-sm text-gray-500">
                      {log.recordsProcessed} records processed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium capitalize ${
                      log.status === 'completed'
                        ? 'text-green-600'
                        : log.status === 'failed'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {log.status}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Automatic Sync</h3>
        <p className="text-blue-700 text-sm">
          Your data is automatically synced every 6 hours. You can also set up Shopify webhooks
          for real-time updates. Check the documentation for webhook configuration.
        </p>
      </div>
    </div>
  );
}
