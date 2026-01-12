'use client';

import { useState } from 'react';
import { StarIcon, MapPinIcon, ExternalLinkIcon } from 'lucide-react';

interface YelpSearchProps {
  businessId: string;
}

interface YelpResult {
  found: boolean;
  yelpId?: string;
  yelpUrl?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  address?: any;
  hours?: any;
}

export default function YelpSearch({ businessId }: YelpSearchProps) {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YelpResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/free/find-on-yelp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            businessName,
            location,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search Yelp');
      }

      const { data } = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search Yelp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
          <span className="text-red-600 font-bold">Y</span>
        </div>
        Yelp Business
      </h2>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Pizza Palace"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !businessName || !location}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search on Yelp'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 pt-6 border-t">
          {result.found ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{businessName}</h3>

                  {result.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {[...Array(Math.floor(result.rating))].map((_, i) => (
                          <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="font-semibold">{result.rating}</span>
                      <span className="text-gray-600 text-sm">
                        ({result.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {result.yelpUrl && (
                  <a
                    href={result.yelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                    View on Yelp
                  </a>
                )}
              </div>

              {result.phone && (
                <div className="text-gray-600">
                  <span className="font-medium">Phone:</span> {result.phone}
                </div>
              )}

              {result.address && (
                <div className="text-gray-600 flex gap-2">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div>{result.address.address1}</div>
                    {result.address.address2 && <div>{result.address.address2}</div>}
                    <div>
                      {result.address.city}, {result.address.state} {result.address.postal_code}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              Business not found on Yelp. You can add it manually or check the spelling.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
