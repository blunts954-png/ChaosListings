import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/services/prisma.service';
import { LoggerService } from '../common/services/logger.service';
import { YextClient } from '../integrations/yext/yext.client';
import { OptimizationScoreService } from '../modules/listings/services/optimization-score.service';

interface RefreshStatusJobData {
  businessId: string;
  agencyId: string;
  yextLocationId: string;
}

/**
 * Refresh Status Worker
 *
 * Fetches latest publisher statuses from Yext and updates directory statuses
 * Runs daily or on-demand
 */
@Processor('refresh-status', {
  concurrency: 10,
  limiter: {
    max: 20,
    duration: 1000,
  },
})
@Injectable()
export class RefreshStatusWorker extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private yextClient: YextClient,
    private optimizationScoreService: OptimizationScoreService,
  ) {
    super();
  }

  async process(job: Job<RefreshStatusJobData>): Promise<any> {
    const { businessId, yextLocationId } = job.data;

    this.logger.log(
      `Refreshing publisher statuses for business ${businessId}`,
      'RefreshStatusWorker',
    );

    try {
      // Fetch publisher statuses from Yext
      const publisherStatuses = await this.yextClient.getPublisherStatuses(yextLocationId);

      this.logger.log(
        `Fetched ${publisherStatuses.length} publisher statuses from Yext`,
        'RefreshStatusWorker',
      );

      // Map Yext publisher IDs to our directory slugs
      const publisherIdToSlug: Record<string, string> = {
        GOOGLEMYBUSINESS: 'google_business',
        YELP: 'yelp',
        FACEBOOKPAGES: 'facebook',
        BING: 'bing_places',
        APPLEMAPS: 'apple_maps',
        YAHOO: 'yahoo',
        YP: 'yp',
        FOURSQUARE: 'foursquare',
        MAPQUEST: 'mapquest',
        ANGIESLIST: 'angi',
        HOMEADVISOR: 'homeadvisor',
        NEXTDOOR: 'nextdoor',
        BBB: 'bbb',
        SUPERPAGES: 'superpages',
        CITYSEARCH: 'citysearch',
      };

      // Update each directory status
      let updatedCount = 0;
      for (const pubStatus of publisherStatuses) {
        const directorySlug = publisherIdToSlug[pubStatus.publisherId];
        if (!directorySlug) {
          this.logger.warn(
            `Unknown Yext publisher: ${pubStatus.publisherId}, skipping`,
            'RefreshStatusWorker',
          );
          continue;
        }

        const directory = await this.prisma.directory.findUnique({
          where: { slug: directorySlug },
        });

        if (!directory) {
          this.logger.warn(`Directory not found: ${directorySlug}`, 'RefreshStatusWorker');
          continue;
        }

        // Map Yext status to our internal status
        const status = this.mapYextStatusToInternal(pubStatus.status);

        // Update or create directory status
        await this.prisma.businessDirectoryStatus.upsert({
          where: {
            businessId_directoryId: {
              businessId,
              directoryId: directory.id,
            },
          },
          create: {
            businessId,
            directoryId: directory.id,
            status,
            externalListingId: pubStatus.externalId,
            externalUrl: pubStatus.liveUrl,
            errorMessage: pubStatus.errorMessage,
            lastSyncedAt: new Date(),
            lastErrorAt: status === 'error' ? new Date() : null,
          },
          update: {
            status,
            externalListingId: pubStatus.externalId,
            externalUrl: pubStatus.liveUrl,
            errorMessage: pubStatus.errorMessage,
            lastSyncedAt: new Date(),
            lastErrorAt: status === 'error' ? new Date() : null,
          },
        });

        updatedCount++;
      }

      this.logger.log(
        `Updated ${updatedCount} directory statuses for business ${businessId}`,
        'RefreshStatusWorker',
      );

      // Recalculate optimization score
      await this.optimizationScoreService.computeOptimizationScore(businessId);

      return {
        businessId,
        updatedCount,
        totalPublishers: publisherStatuses.length,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to refresh statuses for business ${businessId}: ${error.message}`,
        error.stack,
        'RefreshStatusWorker',
      );

      throw error;
    }
  }

  /**
   * Map Yext publisher status to our internal status
   */
  private mapYextStatusToInternal(yextStatus: string): string {
    const statusMap: Record<string, string> = {
      LIVE: 'live',
      PENDING: 'pending',
      SUBMITTED: 'pending',
      REMOVED: 'inactive',
      ERROR: 'error',
    };

    return statusMap[yextStatus] || 'unavailable';
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Refresh status job ${job.id} completed`, 'RefreshStatusWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Refresh status job ${job.id} failed: ${error.message}`,
      error.stack,
      'RefreshStatusWorker',
    );
  }
}
