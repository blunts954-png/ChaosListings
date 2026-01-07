import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { PrismaService } from '../../common/services/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { OptimizationScoreService } from './services/optimization-score.service';
import { DirectoriesService } from './services/directories.service';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private optimizationScoreService: OptimizationScoreService,
    private directoriesService: DirectoriesService,
    @InjectQueue('sync-listings') private syncQueue: Queue,
    @InjectQueue('refresh-status') private refreshQueue: Queue,
  ) {}

  /**
   * Get listings summary for a business
   * Returns optimization score, counts, and status
   */
  async getListingsSummary(businessId: string, agencyId: string) {
    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing'],
            },
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Get optimization score
    const scoreBreakdown = await this.optimizationScoreService.getOptimizationScoreBreakdown(
      businessId,
    );

    // Get subscription status
    const subscription = business.subscriptions[0] || null;

    return {
      businessId: business.id,
      businessName: business.name,
      optimizationScore: scoreBreakdown.score,
      rating: scoreBreakdown.rating,
      breakdown: scoreBreakdown,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planName: subscription.planName,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      syncStatus: {
        yextLocationId: business.yextLocationId,
        yextSyncStatus: business.yextSyncStatus,
        yextLastSyncedAt: business.yextLastSyncedAt,
        yextSyncError: business.yextSyncError,
      },
      onboardingStep: business.onboardingStep,
    };
  }

  /**
   * Get directories table data for a business
   * Shows all directories with their status, details, and links
   */
  async getDirectoriesTable(businessId: string, agencyId: string) {
    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Get directory statuses
    const statuses = await this.directoriesService.getBusinessDirectoryStatuses(businessId);

    return statuses.map((status) => ({
      directoryId: status.directory.id,
      directoryName: status.directory.name,
      directorySlug: status.directory.slug,
      directoryLogo: status.directory.logoUrl,
      directoryPriority: status.directory.priority,
      status: status.status,
      businessName: business.name,
      phone: business.phone,
      address: this.formatAddress(business),
      externalListingId: status.externalListingId,
      externalUrl: status.externalUrl,
      lastSyncedAt: status.lastSyncedAt,
      lastErrorAt: status.lastErrorAt,
      errorMessage: status.errorMessage,
      retryCount: status.retryCount,
    }));
  }

  /**
   * Activate Listings for a business
   * This is the main CTA that:
   * 1. Creates Stripe subscription
   * 2. Creates Yext location
   * 3. Enqueues initial sync job
   */
  async activateListings(businessId: string, agencyId: string) {
    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'trialing'],
            },
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if already activated
    if (business.subscriptions.length > 0) {
      throw new BadRequestException('Listings already activated for this business');
    }

    // Validate business profile completeness
    if (!business.name || !business.addressLine1 || !business.city || !business.state) {
      throw new BadRequestException(
        'Business profile incomplete. Please fill in name, address, city, and state.',
      );
    }

    // Initialize directory statuses if not already done
    const existingStatuses = await this.prisma.businessDirectoryStatus.count({
      where: { businessId },
    });

    if (existingStatuses === 0) {
      await this.directoriesService.initializeDirectoryStatuses(businessId);
    }

    // Enqueue job to create Stripe subscription and Yext location
    // The actual Stripe/Yext operations are handled by workers
    const job = await this.syncQueue.add(
      'activate-listings',
      {
        businessId,
        agencyId,
        action: 'activate',
      },
      {
        priority: 1, // High priority
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `Listings activation job enqueued for business ${businessId} (job: ${job.id})`,
      'ListingsService',
    );

    // Update business onboarding step
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        onboardingStep: 'activate',
        yextSyncStatus: 'pending',
      },
    });

    return {
      message: 'Listings activation in progress',
      jobId: job.id,
      businessId,
    };
  }

  /**
   * Trigger manual sync for a business
   * Syncs latest business profile to Yext
   */
  async triggerSync(businessId: string, agencyId: string) {
    // Verify business belongs to agency
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check if Yext location exists
    if (!business.yextLocationId) {
      throw new BadRequestException(
        'Listings not activated yet. Please activate Listings first.',
      );
    }

    // Enqueue sync job
    const job = await this.syncQueue.add(
      'sync-to-yext',
      {
        businessId,
        agencyId,
        action: 'sync',
      },
      {
        priority: 2,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );

    this.logger.log(
      `Manual sync job enqueued for business ${businessId} (job: ${job.id})`,
      'ListingsService',
    );

    // Update sync status
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        yextSyncStatus: 'pending',
      },
    });

    // Invalidate optimization score cache
    await this.optimizationScoreService.invalidateCache(businessId);

    return {
      message: 'Sync job enqueued',
      jobId: job.id,
      businessId,
    };
  }

  /**
   * Schedule refresh status job for a business
   * Fetches latest publisher statuses from Yext
   */
  async scheduleRefreshStatus(businessId: string, agencyId: string) {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        agencyId,
        deletedAt: null,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (!business.yextLocationId) {
      throw new BadRequestException('Listings not activated');
    }

    const job = await this.refreshQueue.add(
      'refresh-status',
      {
        businessId,
        agencyId,
        yextLocationId: business.yextLocationId,
      },
      {
        priority: 5, // Lower priority
        attempts: 2,
      },
    );

    this.logger.log(
      `Refresh status job enqueued for business ${businessId} (job: ${job.id})`,
      'ListingsService',
    );

    return {
      message: 'Refresh status job enqueued',
      jobId: job.id,
    };
  }

  /**
   * Helper: Format address for display
   */
  private formatAddress(business: any): string {
    const parts = [
      business.addressLine1,
      business.addressLine2,
      business.city,
      business.state,
      business.postalCode,
    ].filter(Boolean);

    return parts.join(', ');
  }
}
