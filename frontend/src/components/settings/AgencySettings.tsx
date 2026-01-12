'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ErrorMessage from '../ui/ErrorMessage';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Agency {
    id: string;
    name: string;
    slug: string;
}

interface ApiKey {
    id: string;
    key: string; // The key is only returned on creation
    createdAt: string;
    lastUsedAt: string | null;
}

export default function AgencySettings() {
    const { user } = useAuth();
    const [agency, setAgency] = useState<Agency | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [agencyName, setAgencyName] = useState('');

    useEffect(() => {
        if (user && user.agencyId) {
            setLoading(true);
            Promise.all([
                api.get(`/agencies/${user.agencyId}`),
                api.get(`/agencies/${user.agencyId}/api-keys`)
            ]).then(([agencyRes, keysRes]) => {
                setAgency(agencyRes.data);
                setAgencyName(agencyRes.data.name);
                setApiKeys(keysRes.data);
            }).catch(err => {
                setError(err.response?.data?.message || 'Failed to load agency settings.');
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleUpdateAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.agencyId) return;
         setError(null);
        try {
            const response = await api.patch(`/agencies/${user.agencyId}`, { name: agencyName });
            setAgency(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update agency.');
        }
    };
    
    const handleCreateApiKey = async () => {
        if (!user || !user.agencyId) return;
        setError(null);
        setNewKey(null);
        try {
            const response = await api.post(`/agencies/${user.agencyId}/api-keys`);
            setApiKeys([...apiKeys, response.data.metadata]);
            setNewKey(response.data.key);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create API key.');
        }
    };
    
    const handleDeleteApiKey = async (keyId: string) => {
        if (!user || !user.agencyId) return;
        try {
            await api.delete(`/agencies/${user.agencyId}/api-keys/${keyId}`);
            setApiKeys(apiKeys.filter(k => k.id !== keyId));
        } catch (err: any) {
             setError(err.response?.data?.message || 'Failed to delete API key.');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!user?.agencyId || !agency) {
        return <p>You are not part of an agency.</p>
    }

    return (
        <div className="space-y-6">
            {error && <ErrorMessage message={error}/>}

            <div className="bg-white shadow sm:rounded-lg">
                 <form onSubmit={handleUpdateAgency}>
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Agency Details</h3>
                        <div className="mt-5">
                            <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700">Agency Name</label>
                            <input
                                type="text"
                                name="agencyName"
                                id="agencyName"
                                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                            />
                        </div>
                    </div>
                     <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                        <button type="submit" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700">
                            Save
                        </button>
                    </div>
                </form>
            </div>


            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">API Keys</h3>
                        <button onClick={handleCreateApiKey} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Create New Key
                        </button>
                    </div>

                    {newKey && (
                        <div className="mt-4 p-4 bg-green-100 rounded-md">
                            <p className="font-semibold">New API Key Created:</p>
                            <p className="font-mono bg-gray-200 p-2 rounded my-2 break-all">{newKey}</p>
                            <p className="text-sm text-red-600">This key will not be shown again. Please store it securely.</p>
                            <button onClick={() => setNewKey(null)} className="mt-2 text-sm text-gray-600">Dismiss</button>
                        </div>
                    )}
                    
                    <ul className="mt-5 divide-y divide-gray-200">
                        {apiKeys.map(key => (
                            <li key={key.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-mono text-sm">**** **** **** {key.id.slice(-4)}</p>
                                    <p className="text-sm text-gray-500">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500">Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                                </div>
                                <button onClick={() => handleDeleteApiKey(key.id)} className="text-red-600 hover:text-red-900">Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}