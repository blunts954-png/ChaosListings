import { Injectable, Logger } from '@nestjs/common';
import { GoogleBusinessService } from './google-business.service';
import { YelpBusinessService } from './yelp-business.service';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Free Listings Orchestration Service
 * Coordinates syncing across multiple free APIs
 */
@Injectable()
export class FreeListingsService {
  private logger = new Logger('FreeListingsService');

  constructor(
    private googleBusinessService: GoogleBusinessService,
    private yelpBusinessService: YelpBusinessService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Get Google OAuth URL for user authentication
   */
  getGoogleAuthUrl(redirectUri: string): string {
    return this.googleBusinessService.getAuthorizationUrl(redirectUri);
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string, redirectUri: string) {
    return await this.googleBusinessService.getAccessToken(code, redirectUri);
  }

  /**
   * Sync a business's locations from Google My Business
   * Returns array of locations found on Google
   */
  async syncGoogleLocations(
    accessToken: string,
    accountId: string,
    businessId: string,
  ) {
    try {
      const locations = await this.googleBusinessService.getLocations(
        accessToken,
        accountId,
      );

      this.loggerService.log(
        'Google locations synced',
        `Business: ${businessId}, Count: ${locations.length}`,
      );

      return {
        source: 'google',
        businessId,
        locationsFound: locations.length,
        locations,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to sync Google locations', error);
      throw error;
    }
  }

  /**
   * Search for business on Yelp and retrieve competitive intelligence
   */
  async findBusinessOnYelp(businessName: string, location: string) {
    try {
      const searchResults = await this.yelpBusinessService.searchBusinesses(
        businessName,
        location,
        { limit: 5 },
      );

      if (!searchResults.businesses?.length) {
        return {
          source: 'yelp',
          businessName,
          location,
          found: false,
          message: 'Business not found on Yelp',
        };
      }

      const topBusiness = searchResults.businesses[0];
      const details = await this.yelpBusinessService.getBusinessDetails(
        topBusiness.id,
      );

      const reviews = await this.yelpBusinessService.getBusinessReviews(
        topBusiness.id,
        { limit: 5 },
      );

      this.loggerService.log(
        'Business found on Yelp',
        `${businessName} - Rating: ${details.rating}`,
      );

      return {
        source: 'yelp',
        businessName,
        found: true,
        yelpId: topBusiness.id,
        yelpUrl: topBusiness.url,
        rating: details.rating,
        reviewCount: details.review_count,
        phone: details.phone,
        address: details.location,
        categories: details.categories,
        hours: details.hours,
        recentReviews: reviews.reviews?.slice(0, 5) || [],
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to search Yelp', error);
      return {
        source: 'yelp',
        businessName,
        found: false,
        error: error.message,
      };
    }
  }

  /**
   * Get competitive intelligence from Yelp
   * Shows what similar businesses are doing
   */
  async getCompetitiveIntelligence(businessCategory: string, location: string) {
    try {
      const competitors = await this.yelpBusinessService.searchBusinesses(
        businessCategory,
        location,
        { limit: 10 },
      );

      const analysis = competitors.businesses.map((biz) => ({
        name: biz.name,
        rating: biz.rating,
        reviewCount: biz.review_count,
        phone: biz.phone,
        address: biz.location,
        categories: biz.categories,
        yelpUrl: biz.url,
      }));

      return {
        source: 'yelp_competitive_analysis',
        category: businessCategory,
        location,
        competitorCount: analysis.length,
        avgRating:
          analysis.reduce((sum, c) => sum + c.rating, 0) / analysis.length,
        competitors: analysis,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get competitive intelligence', error);
      throw error;
    }
  }

  /**
   * Full business sync: Google + Yelp data
   * Returns complete picture of business online presence
   */
  async fullBusinessSync(
    businessName: string,
    location: string,
    googleAccessToken?: string,
    googleAccountId?: string,
  ) {
    const result = {
      businessName,
      location,
      sources: {} as any,
      syncedAt: new Date(),
    };

    // Get Google data if tokens provided
    if (googleAccessToken && googleAccountId) {
      try {
        result.sources.google = await this.syncGoogleLocations(
          googleAccessToken,
          googleAccountId,
          businessName,
        );
      } catch (error) {
        result.sources.google = { error: error.message };
      }
    }

    // Get Yelp data (always available if API key configured)
    try {
      result.sources.yelp = await this.findBusinessOnYelp(
        businessName,
        location,
      );
    } catch (error) {
      result.sources.yelp = { error: error.message };
    }

    // Get competitive analysis
    try {
      const category = businessName.split(' ')[0]; // Simple category extraction
      result.sources.competition = await this.getCompetitiveIntelligence(
        category,
        location,
      );
    } catch (error) {
      result.sources.competition = { error: error.message };
    }

    return result;
  }

  /**
   * Refresh Google token when expired
   */
  async refreshGoogleToken(refreshToken: string) {
    return await this.googleBusinessService.refreshAccessToken(refreshToken);
  }
}
