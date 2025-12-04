'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiPackage, FiTag } from 'react-icons/fi';
import DataTable, { Pagination } from '@/components/DataTable';
import { productsApi } from '@/lib/api';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, statusFilter]);

  const fetchProducts = async (searchTerm = search) => {
    try {
      setLoading(true);
      const data = await productsApi.getAll(pagination.page, pagination.limit, searchTerm, statusFilter);
      setProducts(data.products || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts(search);
  };

  const columns = [
    {
      key: 'title',
      label: 'Product',
      render: (title, row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <FiPackage className="text-gray-400" size={20} />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 line-clamp-1">{title}</p>
            <p className="text-sm text-gray-500">{row.vendor || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'productType',
      label: 'Type',
      render: (type) => (
        <div className="flex items-center gap-2 text-gray-500">
          <FiTag size={14} />
          {type || '-'}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (price) => (
        <div className="flex items-center gap-1">
          <FiDollarSign size={14} className="text-green-500" />
          <span className="font-medium">{price ? parseFloat(price).toFixed(2) : '-'}</span>
        </div>
      ),
    },
    {
      key: 'inventoryQuantity',
      label: 'Inventory',
      render: (qty) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            qty > 10
              ? 'bg-green-100 text-green-700'
              : qty > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {qty} in stock
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
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
      key: 'createdAtShopify',
      label: 'Created',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">View your product catalog</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-900">{pagination.total}</span> products
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
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

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={products} loading={loading} />

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
