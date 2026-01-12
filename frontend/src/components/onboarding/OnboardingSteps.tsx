"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { businessesApi } from '@/lib/api';
import CreateBusinessForm from '../businesses/CreateBusinessForm';

const steps = [
    { id: 'start', title: 'Welcome to ChaosListings!' },
    { id: 'create-business', title: 'Create Your First Business' },
    { id: 'connect-directory', title: 'Connect to a Directory' },
    { id: 'complete', title: 'Onboarding Complete!' },
];

export default function OnboardingSteps() {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState('start');
    const [businessId, setBusinessId] = useState<string | null>(null);

    const handleBusinessCreated = (business: any) => {
        setBusinessId(business.id);
        setCurrentStep('connect-directory');
    }

    const handleSkip = () => {
        // In a real app, you would mark the onboarding as skipped for this user.
        setCurrentStep('complete');
    }

    if (currentStep === 'complete') {
        return null;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{steps.find(s => s.id === currentStep)?.title}</h2>
            
            {currentStep === 'start' && (
                <div>
                    <p className="mb-4">Let's get you started by creating your first business listing.</p>
                    <button onClick={() => setCurrentStep('create-business')} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Get Started
                    </button>
                </div>
            )}

            {currentStep === 'create-business' && (
                <CreateBusinessForm onSuccess={handleBusinessCreated} />
            )}

            {currentStep === 'connect-directory' && (
                <div>
                    <p className="mb-4">Now, let's connect your business to its first directory, like Google Business Profile.</p>
                    {/* In a real app, this would be a more interactive component */}
                    <button onClick={() => setCurrentStep('complete')} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Connect to Google
                    </button>
                    <button onClick={handleSkip} className="ml-4 text-sm text-gray-600">Skip for now</button>
                </div>
            )}
        </div>
    );
}
