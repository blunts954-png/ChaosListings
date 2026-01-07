import React from 'react';
import { ExternalLink, Clock, CheckCircle, AlertCircle, XCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface Directory {
  directoryId: string;
  directoryName: string;
  directorySlug: string;
  directoryLogo: string;
  directoryPriority: number;
  status: string;
  businessName: string;
  phone: string | null;
  address: string;
  externalListingId: string | null;
  externalUrl: string | null;
  lastSyncedAt: string | null;
  lastErrorAt: string | null;
  errorMessage: string | null;
  retryCount: number;
}

interface DirectoriesTableProps {
  directories: Directory[];
}

export function DirectoriesTable({ directories }: DirectoriesTableProps) {
  if (!directories || directories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No directories found. Activate Listings to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Listing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Business Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {directories.map((directory) => (
            <tr key={directory.directoryId} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {directory.directoryLogo && (
                    <img
                      src={directory.directoryLogo}
                      alt={directory.directoryName}
                      className="w-6 h-6 rounded"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {directory.directoryName}
                    </div>
                    {directory.lastSyncedAt && (
                      <div className="text-xs text-gray-500">
                        Synced {format(new Date(directory.lastSyncedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{directory.businessName}</div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {directory.phone || <span className="text-gray-400">—</span>}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge
                  status={directory.status}
                  errorMessage={directory.errorMessage}
                />
              </td>

              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {directory.address}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {directory.externalUrl ? (
                  <a
                    href={directory.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Listing
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  errorMessage?: string | null;
}

function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  const statusConfig = {
    live: {
      label: 'Live',
      color: 'text-green-700 bg-green-100 border-green-200',
      icon: CheckCircle,
    },
    pending: {
      label: 'Pending',
      color: 'text-blue-700 bg-blue-100 border-blue-200',
      icon: Clock,
    },
    error: {
      label: 'Error',
      color: 'text-red-700 bg-red-100 border-red-200',
      icon: AlertCircle,
    },
    unavailable: {
      label: 'Unavailable',
      color: 'text-gray-700 bg-gray-100 border-gray-200',
      icon: XCircle,
    },
    inactive: {
      label: 'Inactive',
      color: 'text-gray-700 bg-gray-100 border-gray-200',
      icon: XCircle,
    },
    under_review: {
      label: 'Under Review',
      color: 'text-yellow-700 bg-yellow-100 border-yellow-200',
      icon: Loader,
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unavailable;
  const Icon = config.icon;

  return (
    <div className="relative group">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
          config.color,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </div>

      {/* Error tooltip */}
      {errorMessage && (
        <div className="absolute z-10 invisible group-hover:visible w-64 p-2 mt-1 text-xs bg-red-50 border border-red-200 rounded shadow-lg">
          <div className="font-medium text-red-900">Error:</div>
          <div className="text-red-700 mt-1">{errorMessage}</div>
        </div>
      )}
    </div>
  );
}
