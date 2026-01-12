'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

interface AgencyStats {
  name: string;
  memberCount: number;
  businessCount: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  createdAt: string;
}

export function AgencyOverview() {
  const { data: agency, isLoading } = useQuery({
    queryKey: ['agencies', 'current'],
    queryFn: async () => {
      const response = await api.get('/agencies');
      return response.data.data?.[0] || null;
    },
  });

  if (isLoading) {
    return <div className="bg-white rounded-lg shadow border border-gray-200 p-6 h-32 animate-pulse" />;
  }

  if (!agency) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">{agency.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 mr-2" />
            <span className="text-sm opacity-90">Team Members</span>
          </div>
          <p className="text-3xl font-bold">{agency.memberCount || 1}</p>
        </div>
        <div>
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="text-sm opacity-90">Active Businesses</span>
          </div>
          <p className="text-3xl font-bold">{agency.businessCount || 0}</p>
        </div>
        <div>
          <div className="flex items-center mb-2">
            <DollarSign className="w-5 h-5 mr-2" />
            <span className="text-sm opacity-90">Active Subscriptions</span>
          </div>
          <p className="text-3xl font-bold">{agency.activeSubscriptions || 0}</p>
        </div>
      </div>
    </div>
  );
}
