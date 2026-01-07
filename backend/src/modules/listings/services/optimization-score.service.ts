import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { LoggerService } from '../../../common/services/logger.service';

export interface OptimizationScoreBreakdown {
  score: number;
  baseScore: number;
  completenessBonus: number;
  priorityPublisherBonus: number;
  penalties: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Bad';
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
}

@Injectable()
export class OptimizationScoreService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Compute optimization score for a business
   *
   * Formula:
   * Base Score = (Live Directories / Total Available Directories) × 70
   *
   * Profile Completeness Bonus (up to +20):
   * - Has business hours: +5
   * - Has category/industry: +3
   * - Has website: +3
   * - Has description (>50 chars): +3
   * - Has 3+ photos: +3
   * - Has logo: +3
   *
   * Priority Publishers Bonus (up to +10):
   * - Google Business live: +5
   * - Yelp live: +3
   * - Facebook live: +2
   *
   * Penalties:
   * - Each directory in 'error' state: -2 points
   * - No activity in 90 days: -10 points (future enhancement)
   *
   * TOTAL = min(100, Base + Completeness + Priority - Penalties)
   */
  async computeOptimizationScore(businessId: string): Promise<number> {
    const breakdown = await this.computeOptimizationScoreBreakdown(businessId);

    // Update cache in database
    await this.prisma.optimizationScore.upsert({
      where: { businessId },
      create: {
        businessId,
        score: breakdown.score,
        baseScore: breakdown.baseScore,
        completenessBonus: breakdown.completenessBonus,
        priorityPublisherBonus: breakdown.priorityPublisherBonus,
        penalties: breakdown.penalties,
        totalDirectories: breakdown.metrics.totalDirectories,
        liveDirectories: breakdown.metrics.liveDirectories,
        pendingDirectories: breakdown.metrics.pendingDirectories,
        errorDirectories: breakdown.metrics.errorDirectories,
        hasHours: breakdown.completeness.hasHours,
        hasCategory: breakdown.completeness.hasCategory,
        hasWebsite: breakdown.completeness.hasWebsite,
        hasDescription: breakdown.completeness.hasDescription,
        hasPhotos: breakdown.completeness.hasPhotos,
        hasLogo: breakdown.completeness.hasLogo,
        googleLive: breakdown.priorityPublishers.googleLive,
        yelpLive: breakdown.priorityPublishers.yelpLive,
        facebookLive: breakdown.priorityPublishers.facebookLive,
        calculatedAt: new Date(),
      },
      update: {
        score: breakdown.score,
        baseScore: breakdown.baseScore,
        completenessBonus: breakdown.completenessBonus,
        priorityPublisherBonus: breakdown.priorityPublisherBonus,
        penalties: breakdown.penalties,
        totalDirectories: breakdown.metrics.totalDirectories,
        liveDirectories: breakdown.metrics.liveDirectories,
        pendingDirectories: breakdown.metrics.pendingDirectories,
        errorDirectories: breakdown.metrics.errorDirectories,
        hasHours: breakdown.completeness.hasHours,
        hasCategory: breakdown.completeness.hasCategory,
        hasWebsite: breakdown.completeness.hasWebsite,
        hasDescription: breakdown.completeness.hasDescription,
        hasPhotos: breakdown.completeness.hasPhotos,
        hasLogo: breakdown.completeness.hasLogo,
        googleLive: breakdown.priorityPublishers.googleLive,
        yelpLive: breakdown.priorityPublishers.yelpLive,
        facebookLive: breakdown.priorityPublishers.facebookLive,
        calculatedAt: new Date(),
      },
    });

    this.logger.log(
      `Optimization score calculated for business ${businessId}: ${breakdown.score} (${breakdown.rating})`,
      'OptimizationScoreService',
    );

    return breakdown.score;
  }

  /**
   * Compute optimization score with full breakdown
   */
  async computeOptimizationScoreBreakdown(
    businessId: string,
  ): Promise<OptimizationScoreBreakdown> {
    // Fetch business profile
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        directoryStatuses: {
          include: {
            directory: true,
          },
        },
      },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // ===== METRICS =====
    const totalDirectories = business.directoryStatuses.length;
    const liveDirectories = business.directoryStatuses.filter(
      (ds) => ds.status === 'live',
    ).length;
    const pendingDirectories = business.directoryStatuses.filter(
      (ds) => ds.status === 'pending',
    ).length;
    const errorDirectories = business.directoryStatuses.filter(
      (ds) => ds.status === 'error',
    ).length;

    // ===== BASE SCORE =====
    // (Live / Total) × 70, or 0 if no directories
    const baseScore =
      totalDirectories > 0 ? (liveDirectories / totalDirectories) * 70 : 0;

    // ===== COMPLETENESS BONUS =====
    const hours = business.hours as any;
    const hasHours = hours && Object.keys(hours).length > 0;

    const hasCategory = !!business.industry || (business.categories as any[]).length > 0;

    const hasWebsite = !!business.website;

    const hasDescription =
      !!business.description && business.description.length > 50;

    const photos = business.photos as any[];
    const hasPhotos = photos && photos.length >= 3;

    const hasLogo = !!business.logoUrl;

    let completenessBonus = 0;
    if (hasHours) completenessBonus += 5;
    if (hasCategory) completenessBonus += 3;
    if (hasWebsite) completenessBonus += 3;
    if (hasDescription) completenessBonus += 3;
    if (hasPhotos) completenessBonus += 3;
    if (hasLogo) completenessBonus += 3;
    // Max: 20

    // ===== PRIORITY PUBLISHERS BONUS =====
    const googleDirectory = business.directoryStatuses.find(
      (ds) => ds.directory.slug === 'google_business',
    );
    const yelpDirectory = business.directoryStatuses.find(
      (ds) => ds.directory.slug === 'yelp',
    );
    const facebookDirectory = business.directoryStatuses.find(
      (ds) => ds.directory.slug === 'facebook',
    );

    const googleLive = googleDirectory?.status === 'live';
    const yelpLive = yelpDirectory?.status === 'live';
    const facebookLive = facebookDirectory?.status === 'live';

    let priorityPublisherBonus = 0;
    if (googleLive) priorityPublisherBonus += 5;
    if (yelpLive) priorityPublisherBonus += 3;
    if (facebookLive) priorityPublisherBonus += 2;
    // Max: 10

    // ===== PENALTIES =====
    let penalties = 0;

    // -2 points per directory in error state
    penalties += errorDirectories * 2;

    // Future: -10 points if no activity in 90 days
    // if (business.yextLastSyncedAt) {
    //   const daysSinceSync = Math.floor(
    //     (Date.now() - business.yextLastSyncedAt.getTime()) / (1000 * 60 * 60 * 24),
    //   );
    //   if (daysSinceSync > 90) {
    //     penalties += 10;
    //   }
    // }

    // ===== TOTAL SCORE =====
    const rawScore = baseScore + completenessBonus + priorityPublisherBonus - penalties;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // ===== RATING =====
    let rating: OptimizationScoreBreakdown['rating'];
    if (score >= 80) rating = 'Excellent';
    else if (score >= 60) rating = 'Good';
    else if (score >= 40) rating = 'Fair';
    else if (score >= 20) rating = 'Poor';
    else rating = 'Bad';

    return {
      score,
      baseScore: Math.round(baseScore * 100) / 100,
      completenessBonus,
      priorityPublisherBonus,
      penalties,
      rating,
      metrics: {
        totalDirectories,
        liveDirectories,
        pendingDirectories,
        errorDirectories,
      },
      completeness: {
        hasHours,
        hasCategory,
        hasWebsite,
        hasDescription,
        hasPhotos,
        hasLogo,
      },
      priorityPublishers: {
        googleLive,
        yelpLive,
        facebookLive,
      },
    };
  }

  /**
   * Get cached optimization score
   */
  async getCachedOptimizationScore(businessId: string): Promise<number | null> {
    const cached = await this.prisma.optimizationScore.findUnique({
      where: { businessId },
    });

    // Cache is valid for 1 hour
    if (cached) {
      const ageInMinutes =
        (Date.now() - cached.calculatedAt.getTime()) / (1000 * 60);
      if (ageInMinutes < 60) {
        return cached.score;
      }
    }

    return null;
  }

  /**
   * Invalidate cached score (call when business or directory status changes)
   */
  async invalidateCache(businessId: string): Promise<void> {
    await this.prisma.optimizationScore.updateMany({
      where: { businessId },
      data: {
        calculatedAt: new Date(0), // Force recalculation
      },
    });
  }

  /**
   * Get optimization score with caching
   */
  async getOptimizationScore(businessId: string): Promise<number> {
    const cached = await this.getCachedOptimizationScore(businessId);
    if (cached !== null) {
      return cached;
    }

    return this.computeOptimizationScore(businessId);
  }

  /**
   * Get full breakdown with caching
   */
  async getOptimizationScoreBreakdown(
    businessId: string,
  ): Promise<OptimizationScoreBreakdown> {
    // Always compute fresh for breakdown requests (used in dashboard)
    return this.computeOptimizationScoreBreakdown(businessId);
  }
}
