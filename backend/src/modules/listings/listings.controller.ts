import { Controller, Get, Post, Param, UseGuards, Query, Body, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { ListingsService } from './listings.service';
import { ManualDirectoriesService } from './services/manual-directories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgencyGuard } from '../auth/guards/agency.guard';
import { GetCurrentUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { FreeListingsService } from '../../integrations/free-listings/free-listings.service';

@ApiTags('listings')
@Controller('businesses/:businessId/listings')
@UseGuards(JwtAuthGuard, AgencyGuard)
@ApiBearerAuth('JWT')
export class ListingsController {
  constructor(
    private listingsService: ListingsService,
    private freeListingsService: FreeListingsService,
    private manualDirectoriesService: ManualDirectoriesService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get listings summary for a business',
    description:
      'Returns optimization score, directory counts, subscription status, and sync status',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Listings summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          businessId: '123e4567-e89b-12d3-a456-426614174000',
          businessName: 'Acme Plumbing',
          optimizationScore: 67,
          rating: 'Good',
          breakdown: {
            score: 67,
            baseScore: 35.0,
            completenessBonus: 20,
            priorityPublisherBonus: 8,
            penalties: 0,
            rating: 'Good',
            metrics: {
              totalDirectories: 15,
              liveDirectories: 8,
              pendingDirectories: 2,
              errorDirectories: 0,
            },
          },
          subscription: {
            id: 'sub_xxx',
            status: 'active',
            planName: 'Listings Starter',
            currentPeriodEnd: '2024-02-15T00:00:00Z',
          },
          syncStatus: {
            yextLocationId: 'loc_123',
            yextSyncStatus: 'synced',
            yextLastSyncedAt: '2024-01-15T10:30:00Z',
            yextSyncError: null,
          },
          onboardingStep: 'activate',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getListingsSummary(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listingsService.getListingsSummary(businessId, user.agencyId);
  }

  @Get('directories')
  @ApiOperation({
    summary: 'Get directories table data',
    description: 'Returns all directories with status, business info, and listing URLs',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Directories table data retrieved',
    schema: {
      example: {
        success: true,
        data: [
          {
            directoryId: 'dir_123',
            directoryName: 'Google Business Profile',
            directorySlug: 'google_business',
            directoryLogo: 'https://google.com/favicon.ico',
            directoryPriority: 100,
            status: 'live',
            businessName: 'Acme Plumbing',
            phone: '+1-555-0123',
            address: '123 Main St, San Francisco, CA, 94105',
            externalListingId: 'gbp_123',
            externalUrl: 'https://g.page/acme-plumbing',
            lastSyncedAt: '2024-01-15T10:30:00Z',
            lastErrorAt: null,
            errorMessage: null,
            retryCount: 0,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async getDirectories(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listingsService.getDirectoriesTable(businessId, user.agencyId);
  }

  @Post('activate')
  @ApiOperation({
    summary: 'Activate Listings for a business',
    description:
      'Creates Stripe subscription, initializes Yext location, and starts initial sync. This is the main "Boost My Visibility" CTA.',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 201,
    description: 'Listings activation initiated',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Listings activation in progress',
          jobId: 'job_123',
          businessId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Listings already activated or profile incomplete' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async activateListings(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listingsService.activateListings(businessId, user.agencyId);
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Trigger manual sync',
    description: 'Manually sync business profile changes to Yext and all publishers',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Sync job enqueued',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Sync job enqueued',
          jobId: 'job_456',
          businessId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Listings not activated' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async triggerSync(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listingsService.triggerSync(businessId, user.agencyId);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh directory statuses',
    description: 'Fetch latest publisher statuses from Yext',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({ status: 200, description: 'Refresh job enqueued' })
  @ApiResponse({ status: 400, description: 'Listings not activated' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  async refreshStatus(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.listingsService.scheduleRefreshStatus(businessId, user.agencyId);
  }

  // ============== FREE LISTINGS API ==============

  @Get('free/google-auth-url')
  @ApiOperation({
    summary: 'Get Google OAuth authorization URL',
    description:
      'Returns URL for user to authorize Google My Business access. Free tier: unlimited locations.',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated',
    schema: {
      example: {
        success: true,
        data: {
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
          businessId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  async getGoogleAuthUrl(
    @Param('businessId') businessId: string,
    @Query('redirectUri') redirectUri: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const authUrl = this.freeListingsService.getGoogleAuthUrl(redirectUri);
    return {
      success: true,
      data: {
        authUrl,
        businessId,
      },
    };
  }

  @Post('free/google-callback')
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description: 'Exchange authorization code for access token',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Token obtained successfully',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'ya29.a0...',
          expiresIn: 3599,
          refreshToken: 'optional',
        },
      },
    },
  })
  async handleGoogleCallback(
    @Param('businessId') businessId: string,
    @Body() body: { code: string; redirectUri: string },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const tokens = await this.freeListingsService.handleGoogleCallback(
      body.code,
      body.redirectUri,
    );
    return {
      success: true,
      data: tokens,
    };
  }

  @Post('free/sync-google')
  @ApiOperation({
    summary: 'Sync Google My Business locations',
    description: 'Pull all locations from Google My Business for this business. Free tier: unlimited.',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Locations synced from Google',
    schema: {
      example: {
        success: true,
        data: {
          source: 'google',
          locationsFound: 3,
          locations: [
            {
              name: 'accounts/1234/locations/5678',
              title: 'Main Location',
              phoneNumber: '555-0123',
            },
          ],
        },
      },
    },
  })
  async syncGoogleLocations(
    @Param('businessId') businessId: string,
    @Body() body: { accessToken: string; accountId: string },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const result = await this.freeListingsService.syncGoogleLocations(
      body.accessToken,
      body.accountId,
      businessId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('free/find-on-yelp')
  @ApiOperation({
    summary: 'Find business on Yelp',
    description: 'Search Yelp for business and get rating, reviews, competitive data. Free tier: 5k calls/day.',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Business found on Yelp',
    schema: {
      example: {
        success: true,
        data: {
          found: true,
          yelpId: 'business_id_123',
          yelpUrl: 'https://www.yelp.com/biz/...',
          rating: 4.5,
          reviewCount: 127,
          phone: '555-0123',
          address: {
            address1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
          },
        },
      },
    },
  })
  async findBusinessOnYelp(
    @Param('businessId') businessId: string,
    @Body() body: { businessName: string; location: string },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const result = await this.freeListingsService.findBusinessOnYelp(
      body.businessName,
      body.location,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('free/competitive-analysis')
  @ApiOperation({
    summary: 'Get competitive intelligence from Yelp',
    description:
      'Analyze competitor businesses in same category/location. Shows ratings, review counts, and strategies.',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Competitive analysis data retrieved',
    schema: {
      example: {
        success: true,
        data: {
          competitorCount: 10,
          avgRating: 4.2,
          competitors: [
            {
              name: 'Competitor Inc',
              rating: 4.5,
              reviewCount: 200,
            },
          ],
        },
      },
    },
  })
  async getCompetitiveAnalysis(
    @Param('businessId') businessId: string,
    @Body() body: { category: string; location: string },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const result = await this.freeListingsService.getCompetitiveIntelligence(
      body.category,
      body.location,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('free/full-sync')
  @ApiOperation({
    summary: 'Full business sync across all free APIs',
    description: 'Comprehensive sync: Google My Business + Yelp + Competitive Analysis. Cost: $0',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Full sync completed',
    schema: {
      example: {
        success: true,
        data: {
          businessName: 'Acme Corp',
          sources: {
            google: { locationsFound: 3 },
            yelp: { found: true, rating: 4.5 },
            competition: { competitorCount: 10, avgRating: 4.2 },
          },
        },
      },
    },
  })
  async fullBusinessSync(
    @Param('businessId') businessId: string,
    @Body()
    body: {
      businessName: string;
      location: string;
      googleAccessToken?: string;
      googleAccountId?: string;
    },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const result = await this.freeListingsService.fullBusinessSync(
      body.businessName,
      body.location,
      body.googleAccessToken,
      body.googleAccountId,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ============== MANUAL DIRECTORY API ==============

  @Post('manual/upload')
  @ApiOperation({
    summary: 'Upload directory listings via CSV',
    description:
      'Upload CSV file with manual directory data (Uber Eats, DoorDash, etc). Format: directory,name,url,phone,hours,description,photoUrls',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'CSV uploaded and processed',
    schema: {
      example: {
        success: true,
        data: {
          created: 5,
          updated: 2,
          failed: 1,
          errors: ['Row 8: Missing required fields'],
        },
      },
    },
  })
  async uploadDirectoryData(
    @Param('businessId') businessId: string,
    @Body() body: { csvData: string },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const result = await this.manualDirectoriesService.uploadDirectoryData(
      businessId,
      body.csvData,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('manual')
  @ApiOperation({
    summary: 'Get all manual directory listings',
    description: 'List all manually uploaded directory listings for a business',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiResponse({
    status: 200,
    description: 'Directory listings retrieved',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            directory: 'Uber Eats',
            name: 'My Restaurant',
            url: 'https://ubereats.com/...',
            phone: '+1-555-0123',
            hours: '9am-9pm',
            description: 'Great food',
            photoUrls: ['https://...'],
            createdAt: '2024-01-09T12:00:00Z',
          },
        ],
      },
    },
  })
  async getDirectoryListings(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const listings = await this.manualDirectoriesService.getDirectoryListings(
      businessId,
    );
    return {
      success: true,
      data: listings,
    };
  }

  @Get('manual/summary')
  @ApiOperation({
    summary: 'Get directory listings summary',
    description: 'Get count of listings per directory',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  async getManualListingsSummary(
    @Param('businessId') businessId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const summary = await this.manualDirectoriesService.getListingsSummary(
      businessId,
    );
    return {
      success: true,
      data: summary,
    };
  }

  @Get('manual/:directoryName')
  @ApiOperation({
    summary: 'Get listings for specific directory',
    description: 'List all listings for a specific directory',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'directoryName', description: 'Directory name (e.g., Uber Eats)' })
  async getListingsByDirectory(
    @Param('businessId') businessId: string,
    @Param('directoryName') directoryName: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const listings =
      await this.manualDirectoriesService.getListingsByDirectory(
        businessId,
        directoryName,
      );
    return {
      success: true,
      data: listings,
    };
  }

  @Get('manual/:listingId/detail')
  @ApiOperation({
    summary: 'Get directory listing details',
    description: 'Get full details of a specific listing',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  async getDirectoryListing(
    @Param('businessId') businessId: string,
    @Param('listingId') listingId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    const listing = await this.manualDirectoriesService.getDirectoryListing(
      businessId,
      listingId,
    );
    return {
      success: true,
      data: listing,
    };
  }

  @Patch('manual/:listingId')
  @ApiOperation({
    summary: 'Update directory listing',
    description: 'Update a manual directory listing',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  async updateDirectoryListing(
    @Param('businessId') businessId: string,
    @Param('listingId') listingId: string,
    @Body()
    body: {
      name?: string;
      url?: string;
      phone?: string;
      hours?: string;
      description?: string;
      photoUrls?: string[];
    },
    @GetCurrentUser() user: CurrentUser,
  ) {
    const updated = await this.manualDirectoriesService.updateListing(
      businessId,
      listingId,
      body,
    );
    return {
      success: true,
      data: updated,
    };
  }

  @Delete('manual/:listingId')
  @ApiOperation({
    summary: 'Delete directory listing',
    description: 'Delete a manual directory listing',
  })
  @ApiParam({ name: 'businessId', description: 'Business UUID' })
  @ApiParam({ name: 'listingId', description: 'Listing ID' })
  async deleteDirectoryListing(
    @Param('businessId') businessId: string,
    @Param('listingId') listingId: string,
    @GetCurrentUser() user: CurrentUser,
  ) {
    await this.manualDirectoriesService.deleteListing(businessId, listingId);
    return {
      success: true,
      message: 'Listing deleted successfully',
    };
  }
}
