'use client';

import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';

export default function DateRangePicker({ onDateChange }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    onDateChange(startDate, endDate);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onDateChange('', '');
  };

  // Quick date range presets
  const setPreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case '7d':
        start.setDate(today.getDate() - 7);
        break;
      case '30d':
        start.setDate(today.getDate() - 30);
        break;
      case '90d':
        start.setDate(today.getDate() - 90);
        break;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        break;
    }

    const formatDate = (d) => d.toISOString().split('T')[0];
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    onDateChange(formatDate(start), formatDate(end));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Date Range:</span>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          <button
            onClick={() => setPreset('7d')}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            7 Days
          </button>
          <button
            onClick={() => setPreset('30d')}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            30 Days
          </button>
          <button
            onClick={() => setPreset('90d')}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            90 Days
          </button>
          <button
            onClick={() => setPreset('ytd')}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            YTD
          </button>
        </div>

        {/* Custom date inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
