import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service';

export interface GoogleLocation {
  name: string;
  title: string;
  phoneNumber?: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    stateCode: string;
    postalCode: string;
    countryCode: string;
  };
  websiteUrl?: string;
  latitude?: number;
  longitude?: number;
  labels?: string[];
  photos?: Array<{
    url: string;
    mediaKey?: string;
  }>;
  openingHours?: {
    periods: Array<{
      openDay: number; // 0=Sunday
      openTime: string; // HH:MM
      closeDay: number;
      closeTime: string;
    }>;
  };
}

export interface GoogleLocationResponse {
  name: string;
  title: string;
  phoneNumber?: string;
  address?: any;
  websiteUrl?: string;
  locations?: any[];
}

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

@Injectable()
export class GoogleBusinessService {
  private logger = new Logger('GoogleBusinessService');
  private readonly googleAuthUrl = 'https://oauth2.googleapis.com/token';
  private readonly googleApiUrl = 'https://mybusiness.googleapis.com/v4';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Generate Google OAuth2 authorization URL for user consent
   * Users click this link to grant access to their Google Business locations
   */
  getAuthorizationUrl(redirectUri: string): string {
    const clientId = this.configService.get('GOOGLE_BUSINESS_CLIENT_ID');
    const scope = [
      'https://www.googleapis.com/auth/business.manage',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent', // Force consent every time for testing
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   * Called after user grants permission
   */
  async getAccessToken(code: string, redirectUri: string): Promise<GoogleAuthTokens> {
    try {
      const clientId = this.configService.get('GOOGLE_BUSINESS_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_BUSINESS_CLIENT_SECRET');

      const response = await firstValueFrom(
        this.httpService.post(this.googleAuthUrl, null, {
          params: {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          },
        }),
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error('Failed to get Google access token', error);
      throw new HttpException(
        'Failed to authenticate with Google',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Refresh expired access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleAuthTokens> {
    try {
      const clientId = this.configService.get('GOOGLE_BUSINESS_CLIENT_ID');
      const clientSecret = this.configService.get('GOOGLE_BUSINESS_CLIENT_SECRET');

      const response = await firstValueFrom(
        this.httpService.post(this.googleAuthUrl, null, {
          params: {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
          },
        }),
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      this.logger.error('Failed to refresh Google access token', error);
      throw new HttpException(
        'Failed to refresh Google token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Get list of Google Business accounts for authenticated user
   */
  async getAccounts(accessToken: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.googleApiUrl}/accounts`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data.accounts || [];
    } catch (error) {
      this.logger.error('Failed to get Google accounts', error);
      throw new HttpException(
        'Failed to fetch Google accounts',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get all locations for a specific Google Business account
   */
  async getLocations(accessToken: string, accountId: string): Promise<GoogleLocationResponse[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.googleApiUrl}/accounts/${accountId}/locations`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            readMask: 'name,title,phoneNumber,address,websiteUrl,labels',
          },
        }),
      );

      return response.data.locations || [];
    } catch (error) {
      this.logger.error(`Failed to get locations for account ${accountId}`, error);
      throw new HttpException(
        'Failed to fetch Google locations',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Create a new Google Business location
   */
  async createLocation(
    accessToken: string,
    accountId: string,
    locationData: GoogleLocation,
  ): Promise<GoogleLocationResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.googleApiUrl}/accounts/${accountId}/locations`,
          {
            title: locationData.title,
            phoneNumber: locationData.phoneNumber,
            address: locationData.address,
            websiteUrl: locationData.websiteUrl,
            labels: locationData.labels,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      this.loggerService.log(
        'Google location created',
        `Location: ${locationData.title}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to create Google location', error);
      throw new HttpException(
        'Failed to create Google location',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update an existing Google Business location
   */
  async updateLocation(
    accessToken: string,
    locationName: string, // format: accounts/{account}/locations/{location}
    locationData: Partial<GoogleLocation>,
  ): Promise<GoogleLocationResponse> {
    try {
      const updateMask = Object.keys(locationData)
        .filter((k) => k !== 'name')
        .join(',');

      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.googleApiUrl}/${locationName}`,
          locationData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              updateMask,
            },
          },
        ),
      );

      this.loggerService.log('Google location updated', locationName);

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update Google location ${locationName}`, error);
      throw new HttpException(
        'Failed to update Google location',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get location insights (view count, direction requests, etc)
   */
  async getLocationInsights(
    accessToken: string,
    locationName: string,
    metricRequests: Array<{
      metric: string; // QUERIES, ACTIONS, DIRECTION_REQUESTS
    }>,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.googleApiUrl}/${locationName}:reportInsights`,
          {
            locationNames: [locationName],
            basicRequest: {
              metricRequests,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get insights for location ${locationName}`,
        error,
      );
      // Don't throw - insights are optional
      return null;
    }
  }

  /**
   * Delete a Google Business location
   */
  async deleteLocation(
    accessToken: string,
    locationName: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.googleApiUrl}/${locationName}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      this.loggerService.log('Google location deleted', locationName);
    } catch (error) {
      this.logger.error(`Failed to delete Google location ${locationName}`, error);
      throw new HttpException(
        'Failed to delete Google location',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
