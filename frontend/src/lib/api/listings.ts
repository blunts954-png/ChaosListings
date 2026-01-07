import { apiClient } from './client';

export interface ListingsSummary {
  businessId: string;
  businessName: string;
  optimizationScore: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Bad';
  breakdown: {
    score: number;
    baseScore: number;
    completenessBonus: number;
    priorityPublisherBonus: number;
    penalties: number;
    rating: string;
    metrics: {
      totalDirectories: number;
      liveDirectories: number;
      pendingDirectories: number;
      errorDirectories: number;
    };
    completeness: {
      hasHours: boolean;
      hasCategory: boolean;
      hasWebsite: boolean;
      hasDescription: boolean;
      hasPhotos: boolean;
      hasLogo: boolean;
    };
    priorityPublishers: {
      googleLive: boolean;
      yelpLive: boolean;
      facebookLive: boolean;
    };
  };
  subscription: {
    id: string;
    status: string;
    planName: string;
    currentPeriodEnd: string;
  } | null;
  syncStatus: {
    yextLocationId: string | null;
    yextSyncStatus: string;
    yextLastSyncedAt: string | null;
    yextSyncError: string | null;
  };
  onboardingStep: string;
}

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

/**
 * Listings API client
 */
export const listingsApi = {
  /**
   * Get listings summary for a business
   */
  async getSummary(businessId: string): Promise<ListingsSummary> {
    const response = await apiClient.get(`/businesses/${businessId}/listings/summary`);
    return response.data.data;
  },

  /**
   * Get directories table data
   */
  async getDirectories(businessId: string): Promise<Directory[]> {
    const response = await apiClient.get(`/businesses/${businessId}/listings/directories`);
    return response.data.data;
  },

  /**
   * Activate Listings for a business
   */
  async activate(businessId: string): Promise<void> {
    const response = await apiClient.post(`/businesses/${businessId}/listings/activate`);
    return response.data.data;
  },

  /**
   * Trigger manual sync
   */
  async triggerSync(businessId: string): Promise<void> {
    const response = await apiClient.post(`/businesses/${businessId}/listings/sync`);
    return response.data.data;
  },

  /**
   * Refresh directory statuses
   */
  async refreshStatus(businessId: string): Promise<void> {
    const response = await apiClient.post(`/businesses/${businessId}/listings/refresh`);
    return response.data.data;
  },
};
