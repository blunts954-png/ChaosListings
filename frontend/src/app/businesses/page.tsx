'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BusinessList from '@/components/businesses/BusinessList';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import Link from 'next/link';

function BusinessesPage() {
    const { user } = useAuth();
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Businesses</h1>
                        <p className="text-gray-400">Manage and sync your business listings across directories</p>
                    </div>
                    <Link
                        href="/businesses/create"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Business</span>
                    </Link>
                </div>

                {/* Business List */}
                <BusinessList />
            </div>
        </div>
    );
}

export default function BusinessesPageWithAuth() {
    return (
        <ProtectedRoute>
            <BusinessesPage />
        </ProtectedRoute>
    );
}