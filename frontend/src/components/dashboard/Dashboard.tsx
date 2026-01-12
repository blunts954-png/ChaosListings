'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700">Welcome to your dashboard, {user?.name}!</p>
        <p className="text-gray-700 mt-2">This is where you'll manage your business listings.</p>
      </div>
    </div>
  );
}