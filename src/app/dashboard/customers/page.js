'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiMail, FiPhone, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import DataTable, { Pagination } from '@/components/DataTable';
import { customersApi } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page]);

  const fetchCustomers = async (searchTerm = search) => {
    try {
      setLoading(true);
      const data = await customersApi.getAll(pagination.page, pagination.limit, searchTerm);
      setCustomers(data.customers || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCustomers(search);
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {(row.firstName?.[0] || row.email?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.firstName || row.lastName
                ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
                : 'Unknown'}
            </p>
            <p className="text-sm text-gray-500">{row.email || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (phone) => (
        <div className="flex items-center gap-2 text-gray-500">
          <FiPhone size={14} />
          {phone || '-'}
        </div>
      ),
    },
    {
      key: 'ordersCount',
      label: 'Orders',
      render: (count) => (
        <div className="flex items-center gap-2">
          <FiShoppingBag size={14} className="text-gray-400" />
          <span className="font-medium">{count}</span>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (spent) => (
        <div className="flex items-center gap-2">
          <FiDollarSign size={14} className="text-green-500" />
          <span className="font-medium text-green-600">${parseFloat(spent || 0).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'acceptsMarketing',
      label: 'Marketing',
      render: (accepts) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            accepts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {accepts ? 'Subscribed' : 'Not subscribed'}
        </span>
      ),
    },
    {
      key: 'createdAtShopify',
      label: 'Joined',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage and view your customer data</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-900">{pagination.total}</span> customers
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <DataTable columns={columns} data={customers} loading={loading} />

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
