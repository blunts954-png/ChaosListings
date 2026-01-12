'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SettingsLayout({ children }: { children: React.ReactNode }) {
    const { logout } = useAuth();
    const pathname = usePathname();

    const navItems = [
        { href: '/settings/profile', label: 'Profile' },
        { href: '/settings/team', label: 'Team' },
        { href: '/settings/billing', label: 'Billing' },
        { href: '/settings/agency', label: 'Agency' },
    ];

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
                                <a href="/businesses" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Businesses
                                </a>
                                <a href="/settings/profile" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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

            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                        <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
                            <nav className="space-y-1">
                                {navItems.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group rounded-md px-3 py-2 flex items-center text-sm font-medium ${pathname === item.href ? 'bg-gray-50 text-indigo-700 hover:bg-white' : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'}`}
                                    >
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </aside>

                        <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <SettingsLayout>
                {children}
            </SettingsLayout>
        </ProtectedRoute>
    )
}