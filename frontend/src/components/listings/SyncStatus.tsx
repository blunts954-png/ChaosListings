'use client';

import { useState, useEffect } from 'react';
import { RefreshCwIcon, TrashIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface DirectoryListing {
  id: string;
  directory: string;
  name: string;
  url: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface SyncStatusProps {
  businessId: string;
}

interface DirectorySummary {
  directory: string;
  count: number;
}

export default function SyncStatus({ businessId }: SyncStatusProps) {
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [summary, setSummary] = useState<DirectorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/manual/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load summary');

      const { data } = await response.json();
      setSummary(data.summary || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchListings = async (directory?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = directory
        ? `/api/businesses/${businessId}/listings/manual/${directory}`
        : `/api/businesses/${businessId}/listings/manual`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load listings');

      const { data } = await response.json();
      setListings(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchListings();
  }, [businessId]);

  const handleRefresh = () => {
    fetchSummary();
    fetchListings(selectedDirectory || undefined);
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Delete this listing?')) return;

    try {
      const response = await fetch(
        `/api/businesses/${businessId}/listings/manual/${listingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete listing');

      setListings(listings.filter((l) => l.id !== listingId));
      await fetchSummary();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFilterByDirectory = async (directory: string) => {
    setSelectedDirectory(directory === selectedDirectory ? null : directory);
    if (directory === selectedDirectory) {
      await fetchListings();
    } else {
      await fetchListings(directory);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Synced Directories</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-400"
          title="Refresh"
        >
          <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summary.length === 0 ? (
          <p className="text-gray-500 text-sm col-span-full">No directories synced yet</p>
        ) : (
          summary.map((dir) => (
            <button
              key={dir.directory}
              onClick={() => handleFilterByDirectory(dir.directory)}
              className={`p-4 rounded-lg border-2 transition ${
                selectedDirectory === dir.directory
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-700">{dir.directory}</div>
              <div className="text-2xl font-bold text-blue-600">{dir.count}</div>
              <div className="text-xs text-gray-500 mt-1">listings</div>
            </button>
          ))
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm flex items-start gap-2">
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Listings Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2">Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            {selectedDirectory ? 'No listings in this directory' : 'No listings synced yet'}
          </p>
          {selectedDirectory && (
            <button
              onClick={() => {
                setSelectedDirectory(null);
                fetchListings();
              }}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all listings
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left font-medium">Directory</th>
                <th className="px-4 py-2 text-left font-medium">Business Name</th>
                <th className="px-4 py-2 text-left font-medium">URL</th>
                <th className="px-4 py-2 text-left font-medium">Added</th>
                <th className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                      {listing.directory}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{listing.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {listing.url.substring(0, 40)}...
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-medium"
                      title="Delete"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
