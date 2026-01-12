'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

interface ListingStats {
  activeListings: number;
  pendingListings: number;
  errorListings: number;
  averageOptimizationScore: number;
  totalDirectories: number;
}

export function ListingsPerformance() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['listings', 'stats'],
    queryFn: async () => {
      const response = await api.get('/listings/stats');
      return response.data.data || {};
    },
  });

  if (isLoading) {
    return <div className="bg-white rounded-lg shadow border border-gray-200 p-6 h-48 animate-pulse" />;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Listings Performance</h2>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats?.activeListings || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pendingListings || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Errors</p>
          <p className="text-2xl font-bold text-red-600">{stats?.errorListings || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(stats?.averageOptimizationScore || 0)}`}>
            {stats?.averageOptimizationScore || 0}%
          </p>
        </div>
      </div>

      {stats?.averageOptimizationScore && stats.averageOptimizationScore < 50 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>Improve your optimization score.</strong> Complete missing profile information to boost visibility.
          </div>
        </div>
      )}

      {stats?.errorListings > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mt-4">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <strong>{stats.errorListings} listing{stats.errorListings !== 1 ? 's' : ''} have errors.</strong> Review and fix them to ensure proper sync.
          </div>
        </div>
      )}
    </div>
  );
}
