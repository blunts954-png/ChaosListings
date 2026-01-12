'use client';

import { useState, useEffect } from 'react';
import { TrendingUpIcon, MapPinIcon, PhoneIcon } from 'lucide-react';

interface CompetitorData {
  name: string;
  rating: number;
  reviewCount: number;
  phone?: string;
  website?: string;
  yelpUrl?: string;
  address?: {
    address1: string;
    city: string;
    state: string;
  };
}

interface CompetitiveAnalysisProps {
  businessId: string;
}

export default function CompetitiveAnalysis({ businessId }: CompetitiveAnalysisProps) {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yourRating, setYourRating] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCompetitors([]);

    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/free/competitive-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            category: businessName, // API expects 'category' parameter
            location,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch competitor data');
      }

      const { data } = await response.json();
      setCompetitors(data.competitors || []);
      setYourRating(data.yourRating);
      setShowAnalysis(true);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze competitors');
    } finally {
      setLoading(false);
    }
  };

  const avgRating =
    competitors.length > 0
      ? (competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length).toFixed(1)
      : null;
  const totalReviews = competitors.reduce((sum, c) => sum + c.reviewCount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUpIcon className="w-5 h-5" />
        Competitive Analysis
      </h2>

      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., My Pizza Shop"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !businessName || !location}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Analyze Competitors'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm mb-4">
          {error}
        </div>
      )}

      {showAnalysis && competitors.length > 0 && (
        <div className="space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div>
              <div className="text-gray-600 text-sm font-medium">Market Avg Rating</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{avgRating}★</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm font-medium">Competitors Found</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{competitors.length}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm font-medium">Total Reviews</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{totalReviews}</div>
            </div>
          </div>

          {/* Your Position */}
          {yourRating && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-900">Your Current Position</h3>
                  <p className="text-sm text-green-700 mt-1">
                    {yourRating > parseFloat(avgRating || '0')
                      ? `📈 Above average by ${(yourRating - parseFloat(avgRating || '0')).toFixed(1)} stars`
                      : yourRating === parseFloat(avgRating || '0')
                        ? '➡️ At market average'
                        : `📉 Below average by ${(parseFloat(avgRating || '0') - yourRating).toFixed(1)} stars`}
                  </p>
                </div>
                <div className="text-3xl font-bold text-green-600">{yourRating}★</div>
              </div>
            </div>
          )}

          {/* Competitors Table */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Nearby Competitors</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {competitors.map((competitor, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{competitor.name}</h4>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-lg">{competitor.rating}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    {competitor.reviewCount} reviews
                  </p>

                  <div className="space-y-1 text-sm text-gray-600">
                    {competitor.address && (
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>
                          {competitor.address.address1}, {competitor.address.city},{' '}
                          {competitor.address.state}
                        </span>
                      </div>
                    )}

                    {competitor.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-3 h-3" />
                        <span>{competitor.phone}</span>
                      </div>
                    )}
                  </div>

                  {competitor.yelpUrl && (
                    <a
                      href={competitor.yelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      View on Yelp →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Insights</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                ✓ Monitor your Yelp reviews regularly to stay competitive
              </li>
              <li>
                ✓ Encourage satisfied customers to leave reviews
              </li>
              <li>
                ✓ Respond to reviews to show customer engagement
              </li>
              <li>
                ✓ Ensure your business information is complete and accurate on all platforms
              </li>
            </ul>
          </div>
        </div>
      )}

      {!showAnalysis && !error && (
        <div className="text-center py-12 text-gray-500">
          <TrendingUpIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Enter your business details and location to analyze your competition</p>
        </div>
      )}
    </div>
  );
}
