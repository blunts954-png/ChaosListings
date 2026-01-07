import React from 'react';
import { Rocket, Loader } from 'lucide-react';

interface ActivateButtonProps {
  onActivate: () => void;
  isLoading: boolean;
}

export function ActivateButton({ onActivate, isLoading }: ActivateButtonProps) {
  return (
    <button
      onClick={onActivate}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          Activating Listings...
        </>
      ) : (
        <>
          <Rocket className="w-5 h-5" />
          Boost My Visibility Now
        </>
      )}
    </button>
  );
}
