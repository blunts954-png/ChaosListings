'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  BarChartIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';

interface ListingStats {
  totalBusinesses: number;
  activeListings: number;
  directoriesSynced: number;
  successRate: number;
}

interface SyncHistory {
  id: string;
  businessId: string;
  businessName: string;
  source: 'google' | 'yelp' | 'manual';
  status: 'success' | 'failed' | 'pending';
  itemsProcessed: number;
  message?: string;
  syncedAt: string;
}

export default function AdminListingsDashboard() {
  const [stats, setStats] = useState<ListingStats>({
    totalBusinesses: 0,
    activeListings: 0,
    directoriesSynced: 0,
    successRate: 0,
  });
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch listings stats
      const statsResponse = await fetch('/api/admin/listings/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (statsResponse.ok) {
        const { data } = await statsResponse.json();
        setStats(data);
      }

      // Fetch sync history
      const historyResponse = await fetch('/api/admin/listings/sync-history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (historyResponse.ok) {
        const { data } = await historyResponse.json();
        setSyncHistory(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Listings Admin</h1>
              <p className="text-gray-600 mt-1">Monitor business listings across all directories</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-400"
              title="Refresh"
            >
              <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Businesses */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Total Businesses</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalBusinesses}</div>
            <p className="text-xs text-gray-500 mt-2">with listings enabled</p>
          </div>

          {/* Active Listings */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Active Listings</h3>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.activeListings}</div>
            <p className="text-xs text-gray-500 mt-2">across all directories</p>
          </div>

          {/* Directories Synced */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Directories Synced</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChartIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.directoriesSynced}</div>
            <p className="text-xs text-gray-500 mt-2">unique directories</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium">Success Rate</h3>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUpIcon className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-gray-500 mt-2">sync operations</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Sync History */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">Recent Sync Activity</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2">Loading sync history...</p>
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No sync activity yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-medium">Business Name</th>
                    <th className="px-6 py-3 text-left font-medium">Source</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Items Processed</th>
                    <th className="px-6 py-3 text-left font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {syncHistory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium">{item.businessName}</td>
                      <td className="px-6 py-3">
                        {item.source === 'google' && (
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            Google
                          </span>
                        )}
                        {item.source === 'yelp' && (
                          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            Yelp
                          </span>
                        )}
                        {item.source === 'manual' && (
                          <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {item.status === 'success' && (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                            <CheckCircleIcon className="w-3 h-3" />
                            Success
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-medium">
                            <AlertCircleIcon className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs font-medium">
                            <RefreshCwIcon className="w-3 h-3 animate-spin" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-600">{item.itemsProcessed}</td>
                      <td className="px-6 py-3 text-gray-600 text-xs">
                        {new Date(item.syncedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Free vs Paid */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
            <h3 className="font-bold text-green-900 mb-3">Free Listings Engine</h3>
            <p className="text-sm text-green-800 mb-3">
              Zero-cost solution for business listings using Google My Business + Yelp APIs.
            </p>
            <ul className="text-xs text-green-800 space-y-1">
              <li>✓ Google My Business: Unlimited locations</li>
              <li>✓ Yelp API: 5,000 calls/day</li>
              <li>✓ Manual Upload: Unlimited directories</li>
              <li>✓ Competitive Analysis: Included</li>
            </ul>
          </div>

          {/* Data Integrity */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3">Data Quality</h3>
            <p className="text-sm text-blue-800 mb-3">
              Ensure your business data stays accurate and up-to-date across all directories.
            </p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Automatic sync every 24 hours</li>
              <li>✓ Error handling & retries</li>
              <li>✓ Duplicate detection</li>
              <li>✓ Audit trail logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
