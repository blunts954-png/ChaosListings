'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import ErrorMessage from '../ui/ErrorMessage';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Subscription {
    id: string;
    status: string;
    plan: {
        name: string;
        price: number;
        currency: string;
    };
    current_period_end: number;
}

interface Invoice {
    id: string;
    created: number;
    total: number;
    invoice_pdf: string;
    status: string;
}

export default function BillingManagement() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.agencyId) {
            setLoading(true);
            Promise.all([
                api.get(`/agencies/${user.agencyId}/subscriptions`),
                api.get(`/agencies/${user.agencyId}/subscriptions/invoices`)
            ]).then(([subRes, invRes]) => {
                setSubscription(subRes.data[0] || null);
                setInvoices(invRes.data);
            }).catch(err => {
                setError(err.response?.data?.message || 'Failed to load billing information.');
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);
    
    const handleManageSubscription = async () => {
        if (!user || !user.agencyId) return;
        try {
            const { url } = await api.post(`/agencies/${user.agencyId}/subscriptions/billing-portal`, {
                returnUrl: window.location.href
            });
            window.location.href = url;
        } catch (err: any) {
             setError(err.response?.data?.message || 'Failed to create billing portal session.');
        }
    }

    if (loading) return <LoadingSpinner />;
     if (!user?.agencyId) {
        return <p>You are not part of an agency.</p>
    }

    return (
        <div className="space-y-6">
            {error && <ErrorMessage message={error}/>}

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription</h3>
                    {subscription ? (
                        <div className="mt-5">
                            <p>Plan: {subscription.plan.name} (${subscription.plan.price / 100} / month)</p>
                            <p>Status: {subscription.status}</p>
                            <p>Renews on: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
                             <button
                                onClick={handleManageSubscription}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Manage Subscription
                            </button>
                        </div>
                    ) : (
                         <div className="mt-5">
                            <p>No active subscription.</p>
                             <button
                                onClick={handleManageSubscription}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Choose a Plan
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Invoices</h3>
                    <ul className="mt-5 divide-y divide-gray-200">
                        {invoices.length > 0 ? invoices.map(invoice => (
                            <li key={invoice.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p>Date: {new Date(invoice.created * 1000).toLocaleDateString()}</p>
                                    <p>Amount: ${(invoice.total / 100).toFixed(2)}</p>
                                    <p>Status: {invoice.status}</p>
                                </div>
                                <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                    View PDF
                                </a>
                            </li>
                        )) : (
                            <p className="mt-2">No invoices found.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}