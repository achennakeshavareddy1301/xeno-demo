'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiShoppingBag, FiDollarSign, FiPackage, FiTrendingUp, FiActivity } from 'react-icons/fi';
import StatCard from '@/components/StatCard';
import { RevenueChart, OrdersChart, StatusPieChart, TrendsChart, TopCustomersChart } from '@/components/Charts';
import DateRangePicker from '@/components/DateRangePicker';
import { analyticsApi } from '@/lib/api';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [fulfillmentStats, setFulfillmentStats] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, ordersData, customersData, fulfillmentData, trendsData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getOrdersByDate(dateRange.startDate, dateRange.endDate),
        analyticsApi.getTopCustomers(5),
        analyticsApi.getFulfillmentStats(),
        analyticsApi.getMonthlyTrends(),
      ]);

      setOverview(overviewData);
      setOrdersByDate(ordersData.data || []);
      setTopCustomers(customersData.customers || []);
      setFulfillmentStats(fulfillmentData.data || []);
      setMonthlyTrends(trendsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (startDate, endDate) => {
    setDateRange({ startDate, endDate });
    try {
      const ordersData = await analyticsApi.getOrdersByDate(startDate, endDate);
      setOrdersByDate(ordersData.data || []);
    } catch (error) {
      console.error('Error fetching filtered orders:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your Shopify store performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={overview?.totalCustomers || 0}
          icon={FiUsers}
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={overview?.totalOrders || 0}
          icon={FiShoppingBag}
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={parseFloat(overview?.totalRevenue || 0)}
          icon={FiDollarSign}
          loading={loading}
        />
        <StatCard
          title="Total Products"
          value={overview?.totalProducts || 0}
          icon={FiPackage}
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Recent Orders (30d)"
          value={overview?.recentOrders || 0}
          icon={FiActivity}
          loading={loading}
        />
        <StatCard
          title="Recent Revenue (30d)"
          value={parseFloat(overview?.recentRevenue || 0)}
          icon={FiTrendingUp}
          loading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={parseFloat(overview?.averageOrderValue || 0)}
          icon={FiDollarSign}
          loading={loading}
        />
      </div>

      {/* Date Range Picker */}
      <DateRangePicker onDateChange={handleDateChange} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <RevenueChart data={ordersByDate} loading={loading} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h3>
          <OrdersChart data={ordersByDate} loading={loading} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers by Spend</h3>
          <TopCustomersChart data={topCustomers} loading={loading} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Status</h3>
          <StatusPieChart data={fulfillmentStats} loading={loading} />
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <TrendsChart data={monthlyTrends} loading={loading} />
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {index + 1}
                        </div>
                        <span className="ml-3 font-medium text-gray-900">
                          {customer.firstName || customer.lastName
                            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                            : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{customer.email || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{customer.ordersCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      ${parseFloat(customer.totalSpent).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
