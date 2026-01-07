import React from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SyncButtonProps {
  onSync: () => void;
  isLoading: boolean;
  lastSyncedAt?: string | null;
}

export function SyncButton({ onSync, isLoading, lastSyncedAt }: SyncButtonProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onSync}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </button>

      {lastSyncedAt && (
        <div className="text-sm text-gray-500">
          Last synced: {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
        </div>
      )}
    </div>
  );
}
