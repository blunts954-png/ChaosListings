'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '@/lib/api/listings';

import { OnboardingSteps } from '@/components/listings/OnboardingSteps';
import { OptimizationScore } from '@/components/listings/OptimizationScore';
import { DirectoriesTable } from '@/components/listings/DirectoriesTable';
import { ActivateButton } from '@/components/listings/ActivateButton';
import { SyncButton } from '@/components/listings/SyncButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

/**
 * Listings Page
 *
 * Mirrors GoHighLevel's Reputation → Listings tab UX
 *
 * Features:
 * - Onboarding steps (Scan → Review → Correct & Elevate)
 * - Optimization score display
 * - Directories table with status
 * - Activate/Boost CTA
 * - Manual sync button
 */
export default function ListingsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const queryClient = useQueryClient();

  // Fetch listings summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['listings-summary', businessId],
    queryFn: () => listingsApi.getSummary(businessId),
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch directories table
  const {
    data: directories,
    isLoading: directoriesLoading,
    error: directoriesError,
  } = useQuery({
    queryKey: ['listings-directories', businessId],
    queryFn: () => listingsApi.getDirectories(businessId),
    refetchInterval: 30000,
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: () => listingsApi.activate(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings-summary', businessId] });
      queryClient.invalidateQueries({ queryKey: ['listings-directories', businessId] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => listingsApi.triggerSync(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings-summary', businessId] });
      queryClient.invalidateQueries({ queryKey: ['listings-directories', businessId] });
    },
  });

  if (summaryLoading || directoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (summaryError || directoriesError) {
    return (
      <ErrorMessage
        title="Failed to load listings"
        message={(summaryError as Error)?.message || (directoriesError as Error)?.message}
      />
    );
  }

  const isActivated = !!summary?.subscription;
  const optimizationScore = summary?.optimizationScore || 0;
  const rating = summary?.rating || 'Bad';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Listings for {summary?.businessName}
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your business presence across Google, Yelp, and other major directories
        </p>
      </div>

      {/* Onboarding Steps */}
      <div className="mb-8">
        <OnboardingSteps currentStep={summary?.onboardingStep || 'basic_info'} />
      </div>

      {/* Optimization Score */}
      <div className="mb-8">
        <OptimizationScore
          score={optimizationScore}
          rating={rating}
          breakdown={summary?.breakdown}
        />
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex items-center gap-4">
        {!isActivated ? (
          <ActivateButton
            onActivate={() => activateMutation.mutate()}
            isLoading={activateMutation.isPending}
          />
        ) : (
          <>
            <SyncButton
              onSync={() => syncMutation.mutate()}
              isLoading={syncMutation.isPending}
              lastSyncedAt={summary?.syncStatus?.yextLastSyncedAt}
            />
            <div className="text-sm text-gray-500">
              {summary?.subscription && (
                <>
                  Active plan: <span className="font-medium">{summary.subscription.planName}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Directories Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Directory Listings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Status of your business across {directories?.length || 0} directories
          </p>
        </div>
        <DirectoriesTable directories={directories || []} />
      </div>

      {/* Sync Status Messages */}
      {activateMutation.isSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✓ Listings activation started! This may take a few minutes.
          </p>
        </div>
      )}

      {syncMutation.isSuccess && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            ✓ Sync started! Directory statuses will update shortly.
          </p>
        </div>
      )}

      {(activateMutation.isError || syncMutation.isError) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            ✗ {(activateMutation.error as Error)?.message || (syncMutation.error as Error)?.message}
          </p>
        </div>
      )}
    </div>
  );
}
