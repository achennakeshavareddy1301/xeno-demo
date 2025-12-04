'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiDollarSign, FiPackage, FiUser } from 'react-icons/fi';
import DataTable, { Pagination } from '@/components/DataTable';
import DateRangePicker from '@/components/DateRangePicker';
import { ordersApi } from '@/lib/api';

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-red-100 text-red-700',
  voided: 'bg-gray-100 text-gray-600',
  partially_refunded: 'bg-orange-100 text-orange-700',
};

const fulfillmentColors = {
  fulfilled: 'bg-green-100 text-green-700',
  unfulfilled: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-blue-100 text-blue-700',
  null: 'bg-gray-100 text-gray-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll(
        pagination.page,
        pagination.limit,
        filters.status,
        filters.startDate,
        filters.endDate
      );
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (startDate, endDate) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order',
      render: (num, row) => (
        <span className="font-medium text-primary-600">#{num || row.shopifyOrderId}</span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-2">
          <FiUser size={14} className="text-gray-400" />
          <span>
            {customer
              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email
              : '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAtShopify',
      label: 'Date',
      render: (date) => (
        <div className="flex items-center gap-2 text-gray-500">
          <FiCalendar size={14} />
          {date ? new Date(date).toLocaleDateString() : '-'}
        </div>
      ),
    },
    {
      key: 'totalPrice',
      label: 'Total',
      render: (price, row) => (
        <div className="flex items-center gap-1">
          <FiDollarSign size={14} className="text-green-500" />
          <span className="font-medium">{parseFloat(price || 0).toFixed(2)}</span>
          <span className="text-xs text-gray-400">{row.currency}</span>
        </div>
      ),
    },
    {
      key: 'financialStatus',
      label: 'Payment',
      render: (status) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
            statusColors[status] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {status || 'unknown'}
        </span>
      ),
    },
    {
      key: 'fulfillmentStatus',
      label: 'Fulfillment',
      render: (status) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
            fulfillmentColors[status] || fulfillmentColors['null']
          }`}
        >
          {status || 'unfulfilled'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">View and manage your orders</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-900">{pagination.total}</span> orders
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, status: e.target.value }));
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      {/* Date Range */}
      <DateRangePicker onDateChange={handleDateChange} />

      {/* Table */}
      <DataTable columns={columns} data={orders} loading={loading} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      )}
    </div>
  );
}
