'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GoogleAuthFlowProps {
  businessId: string;
  onSuccess?: (data: any) => void;
}

export default function GoogleAuthFlow({ businessId, onSuccess }: GoogleAuthFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get authorization URL
      const response = await fetch(
        `/api/businesses/${businessId}/listings/free/google-auth-url?redirectUri=${encodeURIComponent(window.location.origin + '/auth/google-callback')}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get Google authorization URL');
      }

      const { data } = await response.json();

      // Redirect to Google
      window.location.href = data.authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google');
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
          <span className="text-blue-600 font-bold">G</span>
        </div>
        Google My Business
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Connected to Google My Business</span>
          </div>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Connect your Google My Business account to sync all your locations automatically.
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </>
            ) : (
              'Connect to Google'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
