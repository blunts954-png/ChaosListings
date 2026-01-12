import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

type Suggestion = {
  field: string;
  currentValue: string;
  suggestedValue:string;
  reasoning: string;
};

const fieldMapping: { [key: string]: string } = {
  'Business Name': 'name',
  'Website': 'website',
  'Address': 'address',
  'Phone': 'phone',
};

export default function AISuggestions({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    
    try {
      const response = await api.post(`/ai/suggestions/business/${businessId}`);
      setSuggestions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate suggestions.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApplySuggestion = async (field: string, suggestedValue: string) => {
    if (!user?.agencyId) {
      setError('You must be part of an agency to apply suggestions.');
      return;
    }

    const apiField = fieldMapping[field];
    if (!apiField) {
      setError(`Unknown field: ${field}`);
      return;
    }

    setApplying(field);
    setError(null);

    try {
      await api.patch(`/agencies/${user.agencyId}/businesses/${businessId}`, {
        [apiField]: suggestedValue,
      });
      setSuggestions(suggestions.filter(s => s.field !== field));
      // You might want to trigger a refresh of the business data in the parent component here
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to apply suggestion for ${field}.`);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg mt-8">
      <div className="p-6">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-900">AI Listing Optimizer</h3>
                <p className="text-gray-600 mt-1">Generate suggestions to improve your listing's visibility and ranking.</p>
            </div>
            <button
                onClick={handleGenerateSuggestions}
                disabled={loading || applying !== null}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
                {loading ? 'Generating...' : 'Generate Suggestions'}
            </button>
        </div>

        {loading && (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )}

        {error && <div className="mt-4 text-red-600">{error}</div>}

        {suggestions.length > 0 && (
            <div className="mt-6 space-y-6">
                {suggestions.map((suggestion) => (
                    <div key={suggestion.field} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-bold text-lg text-gray-800">{suggestion.field}</h4>
                        <p className="text-sm text-gray-500 italic mt-1 mb-3">{suggestion.reasoning}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm font-semibold text-gray-500">Current</p>
                                <p className="mt-1 text-gray-800 line-through">{suggestion.currentValue}</p>
                            </div>
                             <div className="bg-green-50 p-3 rounded-md border border-green-200">
                                <p className="text-sm font-semibold text-green-700">Suggestion</p>
                                <p className="mt-1 text-green-900">{suggestion.suggestedValue}</p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={() => handleApplySuggestion(suggestion.field, suggestion.suggestedValue)}
                                disabled={applying === suggestion.field || loading}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-green-400"
                            >
                                {applying === suggestion.field ? 'Applying...' : 'Apply Suggestion'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
