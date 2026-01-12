import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../common/services/prisma.service';
import { LoggerService } from '../common/services/logger.service';
import { YextClient, YextLocation } from '../integrations/yext/yext.client';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

interface ActivateListingsJobData {
  businessId: string;
  agencyId: string;
  action: 'activate';
}

interface SyncToYextJobData {
  businessId: string;
  agencyId: string;
  action: 'sync';
}

type ListingsSyncJobData = ActivateListingsJobData | SyncToYextJobData;

/**
 * Listings Sync Worker
 *
 * Handles background jobs for:
 * 1. Activating listings (create Stripe subscription + Yext location)
 * 2. Syncing business profile changes to Yext
 */
@Processor('sync-listings', {
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
})
@Injectable()
export class ListingsSyncWorker extends WorkerHost {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private yextClient: YextClient,
    private configService: ConfigService,
  ) {
    super();

    const stripeKey = this.configService.get<string>('stripe.secretKey');
    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
  }

  async process(job: Job<ListingsSyncJobData>): Promise<any> {
    this.logger.log(
      `Processing listings sync job ${job.id}: ${job.data.action}`,
      'ListingsSyncWorker',
    );

    try {
      if (job.data.action === 'activate') {
        return await this.handleActivate(job.data as ActivateListingsJobData);
      } else if (job.data.action === 'sync') {
        return await this.handleSync(job.data as SyncToYextJobData);
      }
    } catch (error: any) {
      this.logger.error(
        `Job ${job.id} failed: ${error.message}`,
        error.stack,
        'ListingsSyncWorker',
      );

      // Update business sync error
      await this.prisma.business.update({
        where: { id: job.data.businessId },
        data: {
          yextSyncStatus: 'error',
          yextSyncError: error.message,
        },
      });

      throw error; // Rethrow for BullMQ retry logic
    }
  }

  /**
   * Handle "activate-listings" job
   * Steps:
   * 1. Create Stripe subscription
   * 2. Create Yext location
   * 3. Initial sync
   */
  private async handleActivate(data: ActivateListingsJobData) {
    const { businessId, agencyId } = data;

    // Fetch business and agency
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
    });

    if (!business || !agency) {
      throw new Error('Business or agency not found');
    }

    // Step 1: Create Stripe customer (if not exists) and subscription
    let stripeCustomerId = agency.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: agency.email,
        name: agency.name,
        metadata: {
          agencyId: agency.id,
        },
      });

      stripeCustomerId = customer.id;

      await this.prisma.agency.update({
        where: { id: agencyId },
        data: { stripeCustomerId },
      });

      this.logger.log(`Stripe customer created: ${stripeCustomerId}`, 'ListingsSyncWorker');
    }

    // Create subscription
    const priceId = this.configService.get<string>('stripe.listingsPriceId');
    if (!priceId) {
      throw new Error('Stripe Listings price ID not configured');
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 14, // 14-day trial
      metadata: {
        businessId: business.id,
        agencyId: agency.id,
      },
    });

    // Save subscription to DB
    await this.prisma.subscription.create({
      data: {
        businessId: business.id,
        agencyId: agency.id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        planName: 'Listings Starter',
        planTier: 'starter',
        priceToClient: 39.0,
        costToUs: 15.0,
        currency: 'USD',
        billingInterval: 'month',
        status: subscription.status,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(
      `Stripe subscription created: ${subscription.id} for business ${businessId}`,
      'ListingsSyncWorker',
    );

    // Step 2: Create Yext location
    const yextLocation: YextLocation = {
      name: business.name,
      address: {
        line1: business.addressLine1!,
        line2: business.addressLine2 || undefined,
        city: business.city!,
        region: business.state!,
        postalCode: business.postalCode!,
        countryCode: business.country,
      },
      mainPhone: business.phone || undefined,
      emails: business.email ? [business.email] : undefined,
      websiteUrl: business.website || undefined,
      description: business.description || undefined,
      geocodedCoordinate:
        business.latitude && business.longitude
          ? {
              latitude: Number(business.latitude),
              longitude: Number(business.longitude),
            }
          : undefined,
      logo: business.logoUrl ? { url: business.logoUrl } : undefined,
      photos: Array.isArray(business.photos)
        ? (business.photos as any[]).map((p) => ({
            url: p.url,
            description: p.caption,
          }))
        : undefined,
    };

    const yextResponse = await this.yextClient.createLocation(yextLocation);

    // Update business with Yext location ID
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        yextLocationId: yextResponse.id,
        yextSyncStatus: 'synced',
        yextLastSyncedAt: new Date(),
        onboardingStep: 'complete',
      },
    });

    this.logger.log(
      `Listings activated for business ${businessId}, Yext location: ${yextResponse.id}`,
      'ListingsSyncWorker',
    );

    // Step 3: Mark all directory statuses as 'pending'
    await this.prisma.businessDirectoryStatus.updateMany({
      where: { businessId },
      data: { status: 'pending' },
    });

    return {
      subscriptionId: subscription.id,
      yextLocationId: yextResponse.id,
    };
  }

  /**
   * Handle "sync-to-yext" job
   * Syncs business profile changes to Yext
   */
  private async handleSync(data: SyncToYextJobData) {
    const { businessId } = data;

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || !business.yextLocationId) {
      throw new Error('Business or Yext location not found');
    }

    // Build update payload
    const updates: Partial<YextLocation> = {
      name: business.name,
      address: {
        line1: business.addressLine1!,
        line2: business.addressLine2 || undefined,
        city: business.city!,
        region: business.state!,
        postalCode: business.postalCode!,
        countryCode: business.country,
      },
      mainPhone: business.phone || undefined,
      emails: business.email ? [business.email] : undefined,
      websiteUrl: business.website || undefined,
      description: business.description || undefined,
      geocodedCoordinate:
        business.latitude && business.longitude
          ? {
              latitude: Number(business.latitude),
              longitude: Number(business.longitude),
            }
          : undefined,
      logo: business.logoUrl ? { url: business.logoUrl } : undefined,
      photos: Array.isArray(business.photos)
        ? (business.photos as any[]).map((p) => ({
            url: p.url,
            description: p.caption,
          }))
        : undefined,
    };

    // Sync to Yext
    await this.yextClient.updateLocation(business.yextLocationId, updates);

    // Update sync timestamp
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        yextSyncStatus: 'synced',
        yextLastSyncedAt: new Date(),
        yextSyncError: null,
      },
    });

    this.logger.log(
      `Business ${businessId} synced to Yext location ${business.yextLocationId}`,
      'ListingsSyncWorker',
    );

    return { yextLocationId: business.yextLocationId };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`, 'ListingsSyncWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
      'ListingsSyncWorker',
    );
  }
}
