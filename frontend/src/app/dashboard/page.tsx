'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AgencyOverview } from '@/components/dashboard/AgencyOverview';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentBusinesses } from '@/components/dashboard/RecentBusinesses';
import { ListingsPerformance } from '@/components/dashboard/ListingsPerformance';
import { Building2, BarChart3, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const [businessesRes, subscriptionsRes, listingsRes] = await Promise.all([
          api.get('/businesses?limit=1'),
          api.get('/subscriptions?limit=1'),
          api.get('/listings/stats'),
        ]);
        return {
          businesses: businessesRes.data.meta?.total || 0,
          subscriptions: subscriptionsRes.data.meta?.total || 0,
          listings: listingsRes.data.data || {},
        };
      } catch (error) {
        return { businesses: 0, subscriptions: 0, listings: {} };
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                ChaosListings
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/businesses"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Businesses
                </Link>
                <Link
                  href="/settings/profile"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your listings engine today.
          </p>
        </div>

        {/* Agency Overview */}
        <div className="mb-8">
          <AgencyOverview />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Businesses"
            value={stats?.businesses || 0}
            description="Active businesses under management"
            icon={Building2}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Active Subscriptions"
            value={stats?.subscriptions || 0}
            description="Paid subscriptions generating revenue"
            icon={BarChart3}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Active Listings"
            value={stats?.listings?.activeListings || 0}
            description="Listings published to directories"
            icon={Zap}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Businesses */}
            <RecentBusinesses />

            {/* Listings Performance */}
            <ListingsPerformance />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Help & Resources */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Help & Resources</h3>
              <div className="space-y-3">
                <Link
                  href="https://docs.chaoslistings.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-700"
                >
                  📚 Documentation
                </Link>
                <Link
                  href="mailto:support@chaoslistings.com"
                  className="block text-sm text-blue-600 hover:text-blue-700"
                >
                  💬 Support
                </Link>
                <Link
                  href="https://status.chaoslistings.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-700"
                >
                  🟢 System Status
                </Link>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 Pro Tip</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Each business can be synced to up to 15+ directories automatically. Start by creating your first business and activating listings.
              </p>
            </div>

            {/* Upcoming Features */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Coming Soon</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Analytics & Reporting
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Review Management
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Bulk Operations
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
