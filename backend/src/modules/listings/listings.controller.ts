import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgencyGuard } from '../auth/guards/agency.guard';
import { GetCurrentUser, CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('listings')
@Controller('businesses/:businessId/listings')
@UseGuards(JwtAuthGuard, AgencyGuard)
@ApiBearerAuth('JWT')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

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
}
