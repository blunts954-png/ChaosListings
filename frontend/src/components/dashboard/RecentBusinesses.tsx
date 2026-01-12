'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

export function RecentBusinesses() {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses', 'recent'],
    queryFn: async () => {
      const response = await api.get('/businesses?limit=5&sort=-createdAt');
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Businesses</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {businesses && businesses.length > 0 ? (
          <>
            {businesses.map((business: Business) => (
              <Link
                key={business.id}
                href={`/businesses/${business.id}/listings`}
                className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{business.name}</p>
                  {(business.city || business.address) && (
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {business.city && business.state
                        ? `${business.city}, ${business.state}`
                        : business.address}
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
            <div className="px-6 py-4">
              <Link
                href="/businesses"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all businesses →
              </Link>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No businesses yet. Create your first one to get started!</p>
            <Link
              href="/businesses/create"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Business
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
