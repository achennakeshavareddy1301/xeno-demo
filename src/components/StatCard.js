'use client';

import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function StatCard({ title, value, icon: Icon, change, changeType, loading }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `$${(val / 1000000).toFixed(2)}M`;
      } else if (val >= 1000) {
        return `$${(val / 1000).toFixed(2)}K`;
      }
      return typeof val === 'number' && title.toLowerCase().includes('revenue')
        ? `$${val.toFixed(2)}`
        : val.toLocaleString();
    }
    return val;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 card-hover">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        {Icon && (
          <div className="p-2 bg-primary-50 rounded-lg">
            <Icon className="text-primary-600" size={20} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {changeType === 'increase' ? (
                <FiTrendingUp className="text-green-500 mr-1" size={16} />
              ) : (
                <FiTrendingDown className="text-red-500 mr-1" size={16} />
              )}
              <span
                className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {change}%
              </span>
              <span className="text-gray-400 text-sm ml-1">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
