import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepsProps {
  currentStep: string;
}

const steps = [
  {
    id: 'basic_info',
    name: 'Scan Your Business',
    description: 'We analyze your business profile',
  },
  {
    id: 'scan',
    name: 'Review Your Listings',
    description: 'See where your business appears',
  },
  {
    id: 'review',
    name: 'Correct and Elevate',
    description: 'Boost visibility across the web',
  },
  {
    id: 'activate',
    name: 'Complete',
    description: 'Listings are live',
  },
];

export function OnboardingSteps({ currentStep }: OnboardingStepsProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                {/* Icon */}
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors',
                    isCompleted || isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" fill="currentColor" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500',
                    )}
                  >
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 -mt-6 transition-colors',
                    index < currentIndex ? 'bg-blue-600' : 'bg-gray-300',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
