const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Analytics API
export const analyticsApi = {
  getOverview: () => fetchApi('/analytics/overview'),
  getOrdersByDate: (startDate, endDate) => {
    let params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchApi(`/analytics/orders-by-date?${params.toString()}`);
  },
  getTopCustomers: (limit = 5) => fetchApi(`/analytics/top-customers?limit=${limit}`),
  getRevenueByStatus: () => fetchApi('/analytics/revenue-by-status'),
  getProductsByStatus: () => fetchApi('/analytics/products-by-status'),
  getFulfillmentStats: () => fetchApi('/analytics/fulfillment-stats'),
  getMonthlyTrends: () => fetchApi('/analytics/monthly-trends'),
};

// Sync API
export const syncApi = {
  syncAll: () => fetchApi('/sync/all', { method: 'POST' }),
  syncCustomers: () => fetchApi('/sync/customers', { method: 'POST' }),
  syncOrders: () => fetchApi('/sync/orders', { method: 'POST' }),
  syncProducts: () => fetchApi('/sync/products', { method: 'POST' }),
  getSyncLogs: () => fetchApi('/sync/logs'),
};

// Customers API
export const customersApi = {
  getAll: (page = 1, limit = 20, search = '') => {
    let params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return fetchApi(`/customers?${params.toString()}`);
  },
  getOne: (id) => fetchApi(`/customers/${id}`),
};

// Orders API
export const ordersApi = {
  getAll: (page = 1, limit = 20, status = '', startDate = '', endDate = '') => {
    let params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchApi(`/orders?${params.toString()}`);
  },
  getOne: (id) => fetchApi(`/orders/${id}`),
};

// Products API
export const productsApi = {
  getAll: (page = 1, limit = 20, search = '', status = '') => {
    let params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return fetchApi(`/products?${params.toString()}`);
  },
  getOne: (id) => fetchApi(`/products/${id}`),
};
