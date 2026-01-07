import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service';

export interface YextLocation {
  id?: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string; // State
    postalCode: string;
    countryCode: string;
  };
  mainPhone?: string;
  emails?: string[];
  websiteUrl?: string;
  categoryIds?: string[];
  description?: string;
  hours?: any;
  logo?: {
    url: string;
  };
  photos?: Array<{
    url: string;
    description?: string;
  }>;
  geocodedCoordinate?: {
    latitude: number;
    longitude: number;
  };
}

export interface YextPublisherStatus {
  publisherId: string;
  publisherName: string;
  status: 'LIVE' | 'PENDING' | 'SUBMITTED' | 'REMOVED' | 'ERROR';
  liveUrl?: string;
  externalId?: string;
  errorMessage?: string;
}

/**
 * Yext API Client
 *
 * Integrates with Yext Listings API for multi-location management
 * API Docs: https://developer.yext.com/docs/api-reference/
 *
 * ASSUMPTION: Using Yext API v2
 */
@Injectable()
export class YextClient {
  private readonly apiKey: string;
  private readonly accountId: string;
  private readonly apiUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('yext.apiKey')!;
    this.accountId = this.configService.get<string>('yext.accountId')!;
    this.apiUrl = this.configService.get<string>('yext.apiUrl')!;

    if (!this.apiKey || !this.accountId) {
      this.logger.warn(
        'Yext API credentials not configured. Listings sync will not work.',
        'YextClient',
      );
    }
  }

  /**
   * Create a new location in Yext
   */
  async createLocation(location: YextLocation): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/accounts/${this.accountId}/entities`,
          {
            meta: {
              id: location.id || this.generateLocationId(location.name),
              entityType: 'location',
            },
            ...this.mapToYextFormat(location),
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            params: {
              api_key: this.apiKey,
              v: '20231201', // API version
            },
          },
        ),
      );

      const yextLocationId = response.data.response.meta.id;

      this.logger.log(
        `Yext location created: ${yextLocationId} for ${location.name}`,
        'YextClient',
      );

      return { id: yextLocationId };
    } catch (error: any) {
      this.logger.error(
        `Failed to create Yext location: ${error.message}`,
        error.stack,
        'YextClient',
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to create Yext location',
        error.response?.status || 500,
      );
    }
  }

  /**
   * Update an existing location in Yext
   */
  async updateLocation(locationId: string, updates: Partial<YextLocation>): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.put(
          `${this.apiUrl}/accounts/${this.accountId}/entities/${locationId}`,
          this.mapToYextFormat(updates),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            params: {
              api_key: this.apiKey,
              v: '20231201',
            },
          },
        ),
      );

      this.logger.log(`Yext location updated: ${locationId}`, 'YextClient');
    } catch (error: any) {
      this.logger.error(
        `Failed to update Yext location ${locationId}: ${error.message}`,
        error.stack,
        'YextClient',
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to update Yext location',
        error.response?.status || 500,
      );
    }
  }

  /**
   * Get publisher statuses for a location
   * Returns the status of the location across all publishers (Google, Yelp, etc.)
   */
  async getPublisherStatuses(locationId: string): Promise<YextPublisherStatus[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/accounts/${this.accountId}/entities/${locationId}/publishersuggestions`,
          {
            params: {
              api_key: this.apiKey,
              v: '20231201',
            },
          },
        ),
      );

      const publishers = response.data.response.publisherSuggestions || [];

      return publishers.map((pub: any) => ({
        publisherId: pub.publisherId,
        publisherName: pub.publisherName,
        status: this.mapYextStatus(pub.status),
        liveUrl: pub.listingUrl,
        externalId: pub.externalId,
        errorMessage: pub.statusDetails,
      }));
    } catch (error: any) {
      this.logger.error(
        `Failed to get publisher statuses for ${locationId}: ${error.message}`,
        error.stack,
        'YextClient',
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to get publisher statuses',
        error.response?.status || 500,
      );
    }
  }

  /**
   * Delete/close a location in Yext
   */
  async deleteLocation(locationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.apiUrl}/accounts/${this.accountId}/entities/${locationId}`,
          {
            params: {
              api_key: this.apiKey,
              v: '20231201',
            },
          },
        ),
      );

      this.logger.log(`Yext location deleted: ${locationId}`, 'YextClient');
    } catch (error: any) {
      this.logger.error(
        `Failed to delete Yext location ${locationId}: ${error.message}`,
        error.stack,
        'YextClient',
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to delete Yext location',
        error.response?.status || 500,
      );
    }
  }

  /**
   * Map our business data format to Yext API format
   */
  private mapToYextFormat(location: Partial<YextLocation>): any {
    const mapped: any = {};

    if (location.name) mapped.name = location.name;

    if (location.address) {
      mapped.address = {
        line1: location.address.line1,
        line2: location.address.line2,
        city: location.address.city,
        region: location.address.region,
        postalCode: location.address.postalCode,
        countryCode: location.address.countryCode || 'US',
      };
    }

    if (location.mainPhone) mapped.mainPhone = location.mainPhone;
    if (location.emails) mapped.emails = location.emails;
    if (location.websiteUrl) mapped.websiteUrl = location.websiteUrl;
    if (location.description) mapped.description = location.description;
    if (location.categoryIds) mapped.categoryIds = location.categoryIds;
    if (location.hours) mapped.hours = location.hours;

    if (location.logo) {
      mapped.logo = { url: location.logo.url };
    }

    if (location.photos) {
      mapped.photos = location.photos.map((photo) => ({
        url: photo.url,
        description: photo.description,
      }));
    }

    if (location.geocodedCoordinate) {
      mapped.geocodedCoordinate = {
        latitude: location.geocodedCoordinate.latitude,
        longitude: location.geocodedCoordinate.longitude,
      };
    }

    return mapped;
  }

  /**
   * Map Yext status to our internal status
   */
  private mapYextStatus(yextStatus: string): YextPublisherStatus['status'] {
    const statusMap: Record<string, YextPublisherStatus['status']> = {
      LIVE: 'LIVE',
      PENDING: 'PENDING',
      SUBMITTED: 'PENDING',
      WAITING_ON_CUSTOMER: 'PENDING',
      UNDER_REVIEW: 'PENDING',
      REMOVED: 'REMOVED',
      ERROR: 'ERROR',
      FAILED: 'ERROR',
    };

    return statusMap[yextStatus] || 'ERROR';
  }

  /**
   * Generate a unique location ID based on business name
   */
  private generateLocationId(businessName: string): string {
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const timestamp = Date.now().toString(36);
    return `${slug}-${timestamp}`;
  }
}
