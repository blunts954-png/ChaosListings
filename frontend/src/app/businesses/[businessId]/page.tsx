'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EditBusinessForm from '@/components/businesses/EditBusinessForm';
import AISuggestions from '@/components/businesses/AISuggestions';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function EditBusinessPage() {
    const { logout } = useAuth();
    const params = useParams();
    const businessId = params.businessId as string;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <a href="/" className="text-xl font-bold">ChaosListings</a>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <a href="/businesses" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Businesses
                                </a>
                                <a href="/settings/profile" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Settings
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <Link href="/businesses" className="text-blue-600 hover:text-blue-900">
                            &larr; Back to Businesses
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Edit Business</h1>
                    <EditBusinessForm businessId={businessId} />
                    <AISuggestions businessId={businessId} />
                </div>
            </main>
        </div>
    );
}

export default function Page() {
    return (
        <ProtectedRoute>
            <EditBusinessPage />
        </ProtectedRoute>
    )
}