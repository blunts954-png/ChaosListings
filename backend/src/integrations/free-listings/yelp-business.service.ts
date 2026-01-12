import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service';

export interface YelpBusinessSearch {
  id: string;
  name: string;
  alias: string;
  rating: number;
  review_count: number;
  categories: Array<{
    alias: string;
    title: string;
  }>;
  phone: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image_url: string;
  url: string;
  yelp_business_id?: string;
}

export interface YelpBusinessDetail extends YelpBusinessSearch {
  hours?: Array<{
    open: Array<{
      day: number; // 0=Mon
      start: string; // HHMM
      end: string;
      is_overnight: boolean;
    }>;
    hours_type: string;
    is_open_now: boolean;
  }>;
  photos?: string[];
  transactions?: string[];
  attributes?: Record<string, any>;
}

export interface YelpSearchResponse {
  businesses: YelpBusinessSearch[];
  total: number;
  region: any;
}

@Injectable()
export class YelpBusinessService {
  private logger = new Logger('YelpBusinessService');
  private readonly yelpApiUrl = 'https://api.yelp.com/v3';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Search for businesses on Yelp
   * Free tier: 5,000 calls/day
   * Useful for finding competitor listings and market research
   */
  async searchBusinesses(
    searchTerm: string,
    location: string,
    options?: {
      limit?: number;
      offset?: number;
      radius?: number;
      categories?: string[];
    },
  ): Promise<YelpSearchResponse> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const params = {
        term: searchTerm,
        location,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        radius: options?.radius || 40000, // 40km default
      };

      if (options?.categories?.length) {
        params['categories'] = options.categories.join(',');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/businesses/search`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params,
        }),
      );

      this.loggerService.log(
        'Yelp search completed',
        `Found ${response.data.businesses?.length || 0} businesses`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Yelp search failed', error);
      throw new HttpException(
        'Failed to search Yelp businesses',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get detailed information about a specific business on Yelp
   */
  async getBusinessDetails(businessId: string): Promise<YelpBusinessDetail> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/businesses/${businessId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Yelp business ${businessId}`, error);
      throw new HttpException(
        'Failed to fetch Yelp business details',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get reviews for a business (read-only)
   * Good for market research and understanding customer sentiment
   */
  async getBusinessReviews(
    businessId: string,
    options?: {
      limit?: number;
      offset?: number;
      sort_by?: 'newest' | 'useful' | 'cool' | 'funny';
    },
  ): Promise<any> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const params = {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        sort_by: options?.sort_by || 'newest',
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/businesses/${businessId}/reviews`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get reviews for Yelp business ${businessId}`,
        error,
      );
      throw new HttpException(
        'Failed to fetch Yelp reviews',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Autocomplete suggestions for business searches
   * Helps with finding businesses quickly
   */
  async autoComplete(
    text: string,
    latitude: number,
    longitude: number,
  ): Promise<any> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/autocomplete`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params: {
            text,
            latitude,
            longitude,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Yelp autocomplete failed', error);
      throw new HttpException(
        'Failed to autocomplete Yelp search',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Phone search - find business by phone number
   * Useful for matching businesses across directories
   */
  async searchByPhone(phoneNumber: string): Promise<YelpSearchResponse> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/businesses/search/phone`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params: {
            phone: phoneNumber,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Yelp phone search failed', error);
      // Phone search might fail - not critical
      return { businesses: [], total: 0, region: null };
    }
  }

  /**
   * Transaction search - find businesses by transaction type
   * Examples: 'pickup', 'delivery', 'restaurant_reservation'
   */
  async searchByTransaction(
    transactionType: string,
    location: string,
    options?: {
      latitude?: number;
      longitude?: number;
      limit?: number;
    },
  ): Promise<YelpSearchResponse> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const params = {
        transaction_type: transactionType,
        location,
        limit: options?.limit || 20,
      };

      if (options?.latitude && options?.longitude) {
        params['latitude'] = options.latitude;
        params['longitude'] = options.longitude;
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/businesses/search`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params,
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Yelp transaction search failed', error);
      throw new HttpException(
        'Failed to search Yelp by transaction',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get event information for a business
   */
  async getBusinessEvents(businessId: string): Promise<any> {
    try {
      const apiKey = this.configService.get('YELP_API_KEY');
      if (!apiKey) {
        throw new Error('YELP_API_KEY not configured');
      }

      const response = await firstValueFrom(
        this.httpService.get(`${this.yelpApiUrl}/events`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params: {
            business_id: businessId,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get events for Yelp business ${businessId}`, error);
      // Events are optional
      return null;
    }
  }
}
