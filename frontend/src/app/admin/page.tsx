"use client"
import AdminProtectedRoute from '@/components/auth/AdminProtectedRoute';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAuth } from '@/contexts/AuthContext';

function AdminPage() {
    const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100">
         <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">ChaosListings - Admin</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user?.name}</span>
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
      <main>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AdminDashboard />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
    return (
        <AdminProtectedRoute>
            <AdminPage />
        </AdminProtectedRoute>
    )
}
